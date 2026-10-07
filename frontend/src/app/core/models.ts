export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  children?: FileNode[];
}

export type MessageRole = 'user' | 'assistant';

/** One step the agent took (tool call) — shown as a timeline inside an assistant turn. */
export interface AgentStep {
  id: string;
  tool: string;
  summary: string;
  status: 'running' | 'done' | 'error';
  output?: string;
}

export interface ProposedChange {
  id: string;
  path: string;
  before: string;
  after: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  steps: AgentStep[];
  changes: ProposedChange[];
  streaming?: boolean;
  error?: string;
}

export type AgentEvent =
  | { type: 'token'; text: string }
  | { type: 'tool_call'; id: string; tool: string; summary: string }
  | { type: 'tool_result'; id: string; output: string; ok: boolean }
  | { type: 'change'; change: ProposedChange }
  | { type: 'error'; message: string }
  | { type: 'done' };

export type SpecKind = 'requirements' | 'design' | 'tasks';

export interface SpecDoc {
  kind: SpecKind;
  content: string;
  approved: boolean;
}

export type Provider = 'ollama' | 'openai' | 'anthropic';

export interface LlmSettings {
  provider: Provider;
  baseUrl: string;
  model: string;
  apiKey: string;
}
