/* eslint-disable @typescript-eslint/no-explicit-any */
let monacoPromise: Promise<any> | null = null;

/**
 * Loads Monaco from /assets/monaco (copied from node_modules by angular.json) using its AMD loader.
 * This avoids bundler/worker configuration and any version coupling with Angular.
 */
export function loadMonaco(): Promise<any> {
  if (monacoPromise) return monacoPromise;
  monacoPromise = new Promise((resolve, reject) => {
    const w = window as any;
    if (w.monaco) return resolve(w.monaco);

    const script = document.createElement('script');
    script.src = 'assets/monaco/vs/loader.js';
    script.onerror = () => reject(new Error('Could not load the code editor.'));
    script.onload = () => {
      w.require.config({ paths: { vs: 'assets/monaco/vs' } });
      w.require(['vs/editor/editor.main'], () => {
        defineTheme(w.monaco);
        resolve(w.monaco);
      }, reject);
    };
    document.body.appendChild(script);
  });
  return monacoPromise;
}

export const MONACO_THEME = 'chy-night';

function defineTheme(monaco: any): void {
  monaco.editor.defineTheme(MONACO_THEME, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '646b88', fontStyle: 'italic' },
      { token: 'keyword', foreground: '8fa8ff' },
      { token: 'string', foreground: '62d6b0' },
      { token: 'number', foreground: 'f2c46d' },
      { token: 'type', foreground: 'c3b5ff' },
    ],
    colors: {
      'editor.background': '#0f1220',
      'editor.foreground': '#e7e9f4',
      'editor.lineHighlightBackground': '#151a2b',
      'editorLineNumber.foreground': '#464d6b',
      'editorLineNumber.activeForeground': '#9aa1be',
      'editor.selectionBackground': '#2c3a73',
      'editorCursor.foreground': '#8fa8ff',
      'editorWidget.background': '#1c2237',
      'diffEditor.insertedTextBackground': '#62d6b01f',
      'diffEditor.removedTextBackground': '#ff8a8a1f',
    },
  });
}

const LANGUAGES: Record<string, string> = {
  ts: 'typescript', js: 'javascript', json: 'json', md: 'markdown', java: 'java',
  html: 'html', css: 'css', scss: 'scss', yml: 'yaml', yaml: 'yaml', sql: 'sql', xml: 'xml', sh: 'shell',
};

export function languageFor(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  return LANGUAGES[ext] ?? 'plaintext';
}
