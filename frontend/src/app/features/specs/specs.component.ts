import { ChangeDetectionStrategy, Component, OnInit, computed, inject, output, signal } from '@angular/core';
import { SpecService } from '../../core/api/spec.service';
import { SpecDoc, SpecKind } from '../../core/models';

interface Task { title: string; done: boolean; }

const LABELS: Record<SpecKind, string> = { requirements: 'Requirements', design: 'Design', tasks: 'Tasks' };

@Component({
  selector: 'chy-specs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './specs.component.html',
  styleUrl: './specs.component.scss',
})
export class SpecsComponent implements OnInit {
  private readonly api = inject(SpecService);

  /** Asks the shell to send a prompt to the agent. */
  readonly askAgent = output<string>();

  protected readonly docs = signal<SpecDoc[]>([]);
  protected readonly kind = signal<SpecKind>('requirements');
  protected readonly draft = signal('');
  protected readonly saving = signal(false);
  protected readonly labels = LABELS;
  protected readonly kinds: SpecKind[] = ['requirements', 'design', 'tasks'];

  protected readonly current = computed(() => this.docs().find(d => d.kind === this.kind()));

  protected readonly tasks = computed<Task[]>(() =>
    this.draft()
      .split('\n')
      .map(l => /^\s*-\s\[( |x)\]\s(.+)$/i.exec(l))
      .filter((m): m is RegExpExecArray => !!m)
      .map(m => ({ done: m[1].toLowerCase() === 'x', title: m[2] })),
  );

  async ngOnInit(): Promise<void> {
    this.docs.set(await this.api.getAll());
    this.draft.set(this.current()?.content ?? '');
  }

  protected select(kind: SpecKind): void {
    this.kind.set(kind);
    this.draft.set(this.current()?.content ?? '');
  }

  protected async save(): Promise<void> {
    this.saving.set(true);
    await this.api.save(this.kind(), this.draft());
    this.docs.set(await this.api.getAll());
    this.saving.set(false);
  }

  protected async approve(): Promise<void> {
    await this.save();
    await this.api.approve(this.kind());
    this.docs.set(await this.api.getAll());
  }

  protected draftWithAgent(): void {
    this.askAgent.emit(`Draft the ${this.kind()} spec for this project and save it as .chycode/specs/${this.kind()}.md`);
  }

  protected runTask(task: Task): void {
    this.askAgent.emit(`Implement this task from the spec: ${task.title}`);
  }
}
