import { Injectable } from '@angular/core';
import { API_CONFIG } from '../config';
import { AgentEvent } from '../models';
import { MOCK_FILES } from '../mock/mock-data';

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

/**
 * Streams the agent's work for one user message.
 * Backend contract: POST /api/projects/{id}/chat/stream  ->  text/event-stream,
 * each `data:` line is one JSON AgentEvent (see models.ts).
 */
@Injectable({ providedIn: 'root' })
export class ChatService {
  async stream(message: string, onEvent: (e: AgentEvent) => void, signal?: AbortSignal): Promise<void> {
    if (API_CONFIG.mock) return this.mockStream(message, onEvent, signal);
    return this.sseStream(message, onEvent, signal);
  }

  private async sseStream(message: string, onEvent: (e: AgentEvent) => void, signal?: AbortSignal): Promise<void> {
    const res = await fetch(`${API_CONFIG.baseUrl}/projects/${API_CONFIG.projectId}/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify({ message }),
      signal,
    });
    if (!res.ok || !res.body) throw new Error(`Chat request failed (${res.status})`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split('\n\n');
      buffer = frames.pop() ?? '';
      for (const frame of frames) {
        const data = frame
          .split('\n')
          .filter(l => l.startsWith('data:'))
          .map(l => l.slice(5).trim())
          .join('');
        if (data) onEvent(JSON.parse(data) as AgentEvent);
      }
    }
  }

  /** Fake agent so the UI can be explored without the backend. */
  private async mockStream(message: string, onEvent: (e: AgentEvent) => void, signal?: AbortSignal): Promise<void> {
    const guard = () => { if (signal?.aborted) throw new DOMException('Aborted', 'AbortError'); };
    const say = async (text: string) => {
      for (const word of text.split(/(\s+)/)) { guard(); onEvent({ type: 'token', text: word }); await sleep(18); }
    };

    await say('Let me look at the current service first. ');
    onEvent({ type: 'tool_call', id: 's1', tool: 'read_file', summary: 'Read src/todo.service.ts' });
    await sleep(500); guard();
    onEvent({ type: 'tool_result', id: 's1', ok: true, output: '24 lines' });

    onEvent({ type: 'tool_call', id: 's2', tool: 'write_file', summary: 'Edit src/todo.service.ts' });
    await sleep(600); guard();

    const before = MOCK_FILES['src/todo.service.ts'];
    const after = before.replace(
      '  list(): Todo[] {',
      `  complete(id: number): void {
    const todo = this.items.find(t => t.id === id);
    if (todo) todo.done = true;
  }

  list(): Todo[] {`,
    );
    onEvent({ type: 'change', change: { id: 'c1', path: 'src/todo.service.ts', before, after, status: 'pending' } });
    onEvent({ type: 'tool_result', id: 's2', ok: true, output: 'Waiting for your review' });

    await say(`I added a complete(id) method to TodoService for "${message.slice(0, 60)}". Review the change and accept it to apply it.`);
    onEvent({ type: 'done' });
  }
}
