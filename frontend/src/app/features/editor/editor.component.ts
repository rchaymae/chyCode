/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, effect, inject, signal, viewChild,
} from '@angular/core';
import { WorkspaceStore } from '../../core/state/workspace.store';
import { ChatStore } from '../../core/state/chat.store';
import { MONACO_THEME, languageFor, loadMonaco } from '../../core/monaco-loader';

@Component({
  selector: 'chy-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss',
})
export class EditorComponent {
  protected readonly store = inject(WorkspaceStore);
  private readonly chat = inject(ChatStore);
  private readonly destroyRef = inject(DestroyRef);

  private readonly editorHost = viewChild.required<ElementRef<HTMLElement>>('editorHost');
  private readonly diffHost = viewChild.required<ElementRef<HTMLElement>>('diffHost');

  protected readonly ready = signal(false);
  protected readonly loadError = signal<string | null>(null);

  private monaco: any;
  private editor: any;
  private diffEditor: any;
  private readonly models = new Map<string, any>();
  private diffModels: any[] = [];

  constructor() {
    afterNextRender(() => void this.init());
    this.destroyRef.onDestroy(() => {
      this.editor?.dispose();
      this.diffEditor?.dispose();
      this.models.forEach(m => m.dispose());
      this.diffModels.forEach(m => m.dispose());
    });

    // Show the active file in the editor and keep model text in sync with the store.
    effect(() => {
      if (!this.ready()) return;
      const path = this.store.activePath();
      const text = this.store.activeContent();
      if (!path) { this.editor.setModel(null); return; }

      let model = this.models.get(path);
      if (!model) {
        model = this.monaco.editor.createModel(text, languageFor(path), this.monaco.Uri.parse(`file:///${path}`));
        model.onDidChangeContent(() => this.store.edit(path, model.getValue()));
        this.models.set(path, model);
      } else if (model.getValue() !== text) {
        model.setValue(text);
      }
      if (this.editor.getModel() !== model) this.editor.setModel(model);
    });

    // Show / hide the diff editor when a change is being reviewed.
    effect(() => {
      if (!this.ready()) return;
      const change = this.store.reviewing();
      this.diffModels.forEach(m => m.dispose());
      this.diffModels = [];
      if (!change) { this.diffEditor.setModel(null); return; }

      const lang = languageFor(change.path);
      const original = this.monaco.editor.createModel(change.before, lang);
      const modified = this.monaco.editor.createModel(change.after, lang);
      this.diffModels = [original, modified];
      this.diffEditor.setModel({ original, modified });
    });
  }

  private async init(): Promise<void> {
    try {
      this.monaco = await loadMonaco();
    } catch (e) {
      this.loadError.set((e as Error).message);
      return;
    }
    const options = {
      theme: MONACO_THEME,
      automaticLayout: true,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 13,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      padding: { top: 12 },
    };
    this.editor = this.monaco.editor.create(this.editorHost().nativeElement, { ...options, model: null });
    this.diffEditor = this.monaco.editor.createDiffEditor(this.diffHost().nativeElement, {
      ...options, renderSideBySide: true, readOnly: true,
    });

    this.editor.addCommand(this.monaco.KeyMod.CtrlCmd | this.monaco.KeyCode.KeyS, () => {
      const path = this.store.activePath();
      if (path) void this.store.save(path);
    });
    this.ready.set(true);
  }

  protected name(path: string): string {
    return path.split('/').pop() ?? path;
  }

  protected accept(): void {
    const change = this.store.reviewing();
    if (change) void this.chat.accept(change);
  }

  protected reject(): void {
    const change = this.store.reviewing();
    if (change) this.chat.reject(change);
  }
}
