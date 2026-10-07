import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { API_CONFIG } from '../core/config';
import { ChatStore } from '../core/state/chat.store';
import { SettingsStore } from '../core/state/settings.store';
import { FileExplorerComponent } from '../features/file-explorer/file-explorer.component';
import { EditorComponent } from '../features/editor/editor.component';
import { ChatComponent } from '../features/chat/chat.component';
import { SpecsComponent } from '../features/specs/specs.component';
import { TerminalComponent } from '../features/terminal/terminal.component';

type AgentTab = 'chat' | 'specs';

@Component({
  selector: 'chy-ide-shell',
  imports: [RouterLink, FileExplorerComponent, EditorComponent, ChatComponent, SpecsComponent, TerminalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ide-shell.component.html',
  styleUrl: './ide-shell.component.scss',
})
export class IdeShellComponent {
  private readonly chat = inject(ChatStore);
  protected readonly settings = inject(SettingsStore);
  protected readonly mock = API_CONFIG.mock;

  protected readonly showExplorer = signal(true);
  protected readonly showTerminal = signal(false);
  protected readonly tab = signal<AgentTab>('chat');

  protected askAgent(prompt: string): void {
    this.tab.set('chat');
    void this.chat.send(prompt);
  }
}
