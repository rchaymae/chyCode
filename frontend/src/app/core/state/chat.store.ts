import { Injectable, inject, signal } from '@angular/core';
import { ChatService } from '../api/chat.service';
import { AgentEvent, ChatMessage, ProposedChange } from '../models';
import { WorkspaceStore } from './workspace.store';

let counter = 0;
const uid = () => `m${Date.now()}-${counter++}`;

@Injectable({ providedIn: 'root' })
export class ChatStore {
  private readonly chat = inject(ChatService);
  private readonly workspace = inject(WorkspaceStore);

  readonly messages = signal<ChatMessage[]>([]);
  readonly busy = signal(false);
  private abort?: AbortController;

  async send(text: string): Promise<void> {
    const prompt = text.trim();
    if (!prompt || this.busy()) return;

    const assistantId = uid();
    this.messages.update(m => [
      ...m,
      { id: uid(), role: 'user', text: prompt, steps: [], changes: [] },
      { id: assistantId, role: 'assistant', text: '', steps: [], changes: [], streaming: true },
    ]);
    this.busy.set(true);
    this.abort = new AbortController();

    try {
      await this.chat.stream(prompt, e => this.apply(assistantId, e), this.abort.signal);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        this.patch(assistantId, m => ({ ...m, error: (err as Error).message || 'The agent stopped unexpectedly.' }));
      }
    } finally {
      this.patch(assistantId, m => ({ ...m, streaming: false }));
      this.busy.set(false);
    }
  }

  stop(): void {
    this.abort?.abort();
  }

  async accept(change: ProposedChange): Promise<void> {
    await this.workspace.applyChange(change);
    this.setChangeStatus(change.id, 'accepted');
  }

  reject(change: ProposedChange): void {
    this.setChangeStatus(change.id, 'rejected');
    if (this.workspace.reviewing()?.id === change.id) this.workspace.closeReview();
  }

  private setChangeStatus(changeId: string, status: ProposedChange['status']): void {
    this.messages.update(list =>
      list.map(m => ({
        ...m,
        changes: m.changes.map(c => (c.id === changeId ? { ...c, status } : c)),
      })),
    );
  }

  private apply(id: string, e: AgentEvent): void {
    switch (e.type) {
      case 'token':
        this.patch(id, m => ({ ...m, text: m.text + e.text }));
        break;
      case 'tool_call':
        this.patch(id, m => ({
          ...m,
          steps: [...m.steps, { id: e.id, tool: e.tool, summary: e.summary, status: 'running' }],
        }));
        break;
      case 'tool_result':
        this.patch(id, m => ({
          ...m,
          steps: m.steps.map(s => (s.id === e.id ? { ...s, status: e.ok ? 'done' : 'error', output: e.output } : s)),
        }));
        break;
      case 'change':
        this.patch(id, m => ({ ...m, changes: [...m.changes, e.change] }));
        break;
      case 'error':
        this.patch(id, m => ({ ...m, error: e.message }));
        break;
      case 'done':
        break;
    }
  }

  private patch(id: string, fn: (m: ChatMessage) => ChatMessage): void {
    this.messages.update(list => list.map(m => (m.id === id ? fn(m) : m)));
  }
}
