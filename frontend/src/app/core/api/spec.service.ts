import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_CONFIG } from '../config';
import { SpecDoc, SpecKind } from '../models';
import { MOCK_SPECS } from '../mock/mock-data';

@Injectable({ providedIn: 'root' })
export class SpecService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_CONFIG.baseUrl}/projects/${API_CONFIG.projectId}/specs`;
  private readonly mockSpecs: SpecDoc[] = structuredClone(MOCK_SPECS);

  async getAll(): Promise<SpecDoc[]> {
    if (API_CONFIG.mock) return structuredClone(this.mockSpecs);
    return firstValueFrom(this.http.get<SpecDoc[]>(this.base));
  }

  async save(kind: SpecKind, content: string): Promise<void> {
    if (API_CONFIG.mock) {
      const doc = this.mockSpecs.find(s => s.kind === kind);
      if (doc) { doc.content = content; doc.approved = false; }
      return;
    }
    await firstValueFrom(this.http.put<void>(`${this.base}/${kind}`, { content }));
  }

  async approve(kind: SpecKind): Promise<void> {
    if (API_CONFIG.mock) {
      const doc = this.mockSpecs.find(s => s.kind === kind);
      if (doc) doc.approved = true;
      return;
    }
    await firstValueFrom(this.http.post<void>(`${this.base}/${kind}/approve`, {}));
  }
}
