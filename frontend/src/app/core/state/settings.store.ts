import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_CONFIG } from '../config';
import { LlmSettings, Provider } from '../models';

const KEY = 'chycode.llm';

export const PROVIDER_DEFAULTS: Record<Provider, { label: string; baseUrl: string; model: string; needsKey: boolean }> = {
  ollama: { label: 'Ollama (local)', baseUrl: 'http://localhost:11434', model: 'llama3.1', needsKey: false },
  openai: { label: 'OpenAI', baseUrl: 'https://api.openai.com', model: 'gpt-4o', needsKey: true },
  anthropic: { label: 'Anthropic', baseUrl: 'https://api.anthropic.com', model: 'claude-sonnet-4-5', needsKey: true },
};

@Injectable({ providedIn: 'root' })
export class SettingsStore {
  private readonly http = inject(HttpClient);

  readonly llm = signal<LlmSettings>(this.load());

  async save(value: LlmSettings): Promise<void> {
    this.llm.set(value);
    try {
      // The API key is kept in the browser only in mock mode; with the backend it is stored encrypted server-side.
      localStorage.setItem(KEY, JSON.stringify(API_CONFIG.mock ? value : { ...value, apiKey: '' }));
    } catch { /* storage unavailable */ }
    if (!API_CONFIG.mock) {
      await firstValueFrom(this.http.put<void>(`${API_CONFIG.baseUrl}/llm-settings`, value));
    }
  }

  private load(): LlmSettings {
    const d = PROVIDER_DEFAULTS.ollama;
    const fallback: LlmSettings = { provider: 'ollama', baseUrl: d.baseUrl, model: d.model, apiKey: '' };
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
    } catch {
      return fallback;
    }
  }
}
