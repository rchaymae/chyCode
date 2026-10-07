import { Injectable, computed, inject, signal } from '@angular/core';
import { WorkspaceService } from '../api/workspace.service';
import { FileNode, ProposedChange } from '../models';

/** Everything the editor, explorer and chat share about the open project. */
@Injectable({ providedIn: 'root' })
export class WorkspaceStore {
  private readonly api = inject(WorkspaceService);

  readonly tree = signal<FileNode[]>([]);
  readonly tabs = signal<string[]>([]);
  readonly activePath = signal<string | null>(null);
  readonly contents = signal<Record<string, string>>({});
  readonly dirty = signal<ReadonlySet<string>>(new Set());
  /** The change currently being reviewed in the diff editor (null = normal editor). */
  readonly reviewing = signal<ProposedChange | null>(null);
  readonly error = signal<string | null>(null);

  readonly activeContent = computed(() => {
    const path = this.activePath();
    return path ? (this.contents()[path] ?? '') : '';
  });

  async loadTree(): Promise<void> {
    try {
      this.tree.set(await this.api.getTree());
    } catch {
      this.error.set('Could not load the project files. Is the backend running?');
    }
  }

  async open(path: string): Promise<void> {
    this.reviewing.set(null);
    if (!(path in this.contents())) {
      try {
        const text = await this.api.readFile(path);
        this.contents.update(c => ({ ...c, [path]: text }));
      } catch {
        this.error.set(`Could not open ${path}.`);
        return;
      }
    }
    this.tabs.update(t => (t.includes(path) ? t : [...t, path]));
    this.activePath.set(path);
  }

  close(path: string): void {
    const remaining = this.tabs().filter(p => p !== path);
    this.tabs.set(remaining);
    if (this.activePath() === path) this.activePath.set(remaining.at(-1) ?? null);
  }

  edit(path: string, text: string): void {
    if (this.contents()[path] === text) return;
    this.contents.update(c => ({ ...c, [path]: text }));
    this.dirty.update(d => new Set(d).add(path));
  }

  async save(path: string): Promise<void> {
    try {
      await this.api.writeFile(path, this.contents()[path] ?? '');
      this.dirty.update(d => { const n = new Set(d); n.delete(path); return n; });
    } catch {
      this.error.set(`Could not save ${path}.`);
    }
  }

  review(change: ProposedChange): void {
    this.reviewing.set(change);
  }

  closeReview(): void {
    this.reviewing.set(null);
  }

  /** Writes the agent's version of the file and opens it. */
  async applyChange(change: ProposedChange): Promise<void> {
    await this.api.writeFile(change.path, change.after);
    this.contents.update(c => ({ ...c, [change.path]: change.after }));
    this.dirty.update(d => { const n = new Set(d); n.delete(change.path); return n; });
    this.reviewing.set(null);
    await this.loadTree();
    await this.open(change.path);
  }
}
