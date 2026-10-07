import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LlmSettings, Provider } from '../../core/models';
import { PROVIDER_DEFAULTS, SettingsStore } from '../../core/state/settings.store';

@Component({
  selector: 'chy-settings',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  private readonly store = inject(SettingsStore);

  protected readonly providers = Object.entries(PROVIDER_DEFAULTS).map(([id, p]) => ({ id: id as Provider, label: p.label }));
  protected readonly draft = signal<LlmSettings>({ ...this.store.llm() });
  protected readonly saved = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly needsKey = computed(() => PROVIDER_DEFAULTS[this.draft().provider].needsKey);

  protected setProvider(provider: Provider): void {
    const d = PROVIDER_DEFAULTS[provider];
    this.draft.update(s => ({ ...s, provider, baseUrl: d.baseUrl, model: d.model }));
    this.saved.set(false);
  }

  protected set<K extends keyof LlmSettings>(key: K, value: LlmSettings[K]): void {
    this.draft.update(s => ({ ...s, [key]: value }));
    this.saved.set(false);
  }

  protected async save(): Promise<void> {
    this.error.set(null);
    try {
      await this.store.save(this.draft());
      this.saved.set(true);
    } catch {
      this.error.set('Could not save the settings. Check that the backend is running.');
    }
  }
}
