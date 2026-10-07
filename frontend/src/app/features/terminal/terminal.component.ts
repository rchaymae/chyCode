import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, inject, viewChild } from '@angular/core';
import { API_CONFIG } from '../../core/config';

@Component({
  selector: 'chy-terminal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="host" #host></div>`,
  styles: [`
    :host { display: block; background: var(--ink-0); border-top: 1px solid var(--line); min-height: 0; }
    .host { height: 100%; padding: 6px 10px; }
  `],
})
export class TerminalComponent {
  private readonly host = viewChild.required<ElementRef<HTMLElement>>('host');
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => void this.start());
  }

  private async start(): Promise<void> {
    const [{ Terminal }, { FitAddon }] = await Promise.all([import('@xterm/xterm'), import('@xterm/addon-fit')]);

    const term = new Terminal({
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12.5,
      cursorBlink: true,
      theme: { background: '#0f1220', foreground: '#e7e9f4', cursor: '#8fa8ff', selectionBackground: '#2c3a73' },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(this.host().nativeElement);
    fit.fit();

    const observer = new ResizeObserver(() => fit.fit());
    observer.observe(this.host().nativeElement);

    let socket: WebSocket | undefined;
    if (API_CONFIG.mock) {
      this.mockShell(term);
    } else {
      const scheme = location.protocol === 'https:' ? 'wss' : 'ws';
      socket = new WebSocket(`${scheme}://${location.host}${API_CONFIG.baseUrl}/ws/terminal/${API_CONFIG.projectId}`);
      socket.onmessage = e => term.write(String(e.data));
      socket.onclose = () => term.writeln('\r\n[terminal closed]');
      term.onData(d => socket?.readyState === WebSocket.OPEN && socket.send(d));
    }

    this.destroyRef.onDestroy(() => {
      observer.disconnect();
      socket?.close();
      term.dispose();
    });
  }

  /** Tiny local shell used when running without the backend. */
  private mockShell(term: import('@xterm/xterm').Terminal): void {
    const prompt = () => term.write('\r\n\x1b[38;5;111m$\x1b[0m ');
    let line = '';
    term.writeln('chyCode sandbox (sample mode). Type "help".');
    term.write('\x1b[38;5;111m$\x1b[0m ');

    term.onData(d => {
      if (d === '\r') {
        const cmd = line.trim();
        line = '';
        if (cmd === 'help') term.write('\r\nCommands: help, ls, clear');
        else if (cmd === 'ls') term.write('\r\nsrc  package.json  README.md');
        else if (cmd === 'clear') term.clear();
        else if (cmd) term.write(`\r\ncommand not found in sample mode: ${cmd}`);
        prompt();
      } else if (d === '\u007f') {
        if (line.length) { line = line.slice(0, -1); term.write('\b \b'); }
      } else if (d >= ' ') {
        line += d;
        term.write(d);
      }
    });
  }
}
