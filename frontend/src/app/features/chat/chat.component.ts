import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, signal, viewChild } from '@angular/core';
import { ChatStore } from '../../core/state/chat.store';
import { WorkspaceStore } from '../../core/state/workspace.store';
import { ProposedChange } from '../../core/models';

interface Block { code: boolean; text: string; }

const SUGGESTIONS = [
  'Add a complete(id) method to TodoService',
  'Explain what main.ts does',
  'Write a README for this project',
];

@Component({
  selector: 'chy-chat',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent {
  protected readonly chat = inject(ChatStore);
  protected readonly workspace = inject(WorkspaceStore);
  protected readonly suggestions = SUGGESTIONS;
  protected readonly draft = signal('');

  private readonly scroller = viewChild.required<ElementRef<HTMLElement>>('scroller');

  constructor() {
    effect(() => {
      this.chat.messages();
      setTimeout(() => {
        const el = this.scroller().nativeElement;
        el.scrollTop = el.scrollHeight;
      });
    });
  }

  protected send(text = this.draft()): void {
    if (!text.trim()) return;
    void this.chat.send(text);
    this.draft.set('');
  }

  protected onKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  protected blocks(text: string): Block[] {
    return text
      .split(/```[a-zA-Z0-9]*\n?/)
      .map((part, i) => ({ code: i % 2 === 1, text: part }))
      .filter(b => b.text.trim().length > 0);
  }

  protected review(change: ProposedChange): void {
    this.workspace.review(change);
  }
}
