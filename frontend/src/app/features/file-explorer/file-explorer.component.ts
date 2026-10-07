import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { WorkspaceStore } from '../../core/state/workspace.store';
import { FileNode } from '../../core/models';

interface Row { node: FileNode; depth: number; }

@Component({
  selector: 'chy-file-explorer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './file-explorer.component.html',
  styleUrl: './file-explorer.component.scss',
})
export class FileExplorerComponent implements OnInit {
  protected readonly store = inject(WorkspaceStore);
  private readonly expanded = signal<ReadonlySet<string>>(new Set(['src']));

  protected readonly rows = computed<Row[]>(() => {
    const out: Row[] = [];
    const walk = (nodes: FileNode[], depth: number) => {
      for (const node of [...nodes].sort(byKind)) {
        out.push({ node, depth });
        if (node.type === 'dir' && this.expanded().has(node.path)) walk(node.children ?? [], depth + 1);
      }
    };
    walk(this.store.tree(), 0);
    return out;
  });

  ngOnInit(): void {
    void this.store.loadTree();
  }

  protected isOpen(path: string): boolean {
    return this.expanded().has(path);
  }

  protected activate(row: Row): void {
    if (row.node.type === 'file') {
      void this.store.open(row.node.path);
      return;
    }
    this.expanded.update(set => {
      const next = new Set(set);
      if (!next.delete(row.node.path)) next.add(row.node.path);
      return next;
    });
  }
}

function byKind(a: FileNode, b: FileNode): number {
  if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
  return a.name.localeCompare(b.name);
}
