import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_CONFIG } from '../config';
import { FileNode } from '../models';
import { MOCK_FILES, MOCK_TREE } from '../mock/mock-data';

/** File access for the open project. Talks to /api/projects/{id}/files or uses in-memory sample files. */
@Injectable({ providedIn: 'root' })
export class WorkspaceService {
  private readonly http = inject(HttpClient);
  private readonly base = `${API_CONFIG.baseUrl}/projects/${API_CONFIG.projectId}/files`;
  private readonly mockFiles: Record<string, string> = { ...MOCK_FILES };

  async getTree(): Promise<FileNode[]> {
    if (API_CONFIG.mock) return structuredClone(MOCK_TREE);
    return firstValueFrom(this.http.get<FileNode[]>(`${this.base}/tree`));
  }

  async readFile(path: string): Promise<string> {
    if (API_CONFIG.mock) return this.mockFiles[path] ?? '';
    const res = await firstValueFrom(this.http.get<{ content: string }>(this.base, { params: { path } }));
    return res.content;
  }

  async writeFile(path: string, content: string): Promise<void> {
    if (API_CONFIG.mock) {
      this.mockFiles[path] = content;
      return;
    }
    await firstValueFrom(this.http.put<void>(this.base, { content }, { params: { path } }));
  }
}
