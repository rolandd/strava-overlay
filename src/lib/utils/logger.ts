export interface LogEntry {
  id: string;
  timestamp: string;
  timeMs: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  tag: string;
  message: string;
  data?: unknown;
}

const MAX_LOGS = 200;
const STORAGE_KEY = 'ride_overlay_debug_logs';

class DebugLogger {
  private logs: LogEntry[] = [];
  private listeners: Set<(logs: LogEntry[]) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) {
          this.logs = JSON.parse(stored);
        }
      } catch {
        // Ignore storage errors
      }
    }
  }

  log(
    tag: string,
    message: string,
    data?: unknown,
    level: 'info' | 'warn' | 'error' | 'debug' = 'info'
  ) {
    const entry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
      timeMs: Date.now(),
      level,
      tag,
      message,
      data
    };

    this.logs.unshift(entry);
    if (this.logs.length > MAX_LOGS) {
      this.logs.pop();
    }

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs.slice(0, 50)));
      } catch {
        // Ignore storage limits
      }
    }

    const prefix = `[${entry.tag}]`;
    if (level === 'error') {
      console.error(prefix, message, data !== undefined ? data : '');
    } else if (level === 'warn') {
      console.warn(prefix, message, data !== undefined ? data : '');
    } else {
      console.log(prefix, message, data !== undefined ? data : '');
    }

    this.notify();
  }

  info(tag: string, message: string, data?: unknown) {
    this.log(tag, message, data, 'info');
  }

  warn(tag: string, message: string, data?: unknown) {
    this.log(tag, message, data, 'warn');
  }

  error(tag: string, message: string, data?: unknown) {
    this.log(tag, message, data, 'error');
  }

  debug(tag: string, message: string, data?: unknown) {
    this.log(tag, message, data, 'debug');
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clear() {
    this.logs = [];
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(STORAGE_KEY);
    }
    this.notify();
  }

  subscribe(listener: (logs: LogEntry[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.getLogs());
    return () => {
      this.listeners.delete(listener);
    };
  }

  exportText(): string {
    return this.logs
      .slice()
      .reverse()
      .map(
        (l) =>
          `${l.timestamp} [${l.level.toUpperCase()}] [${l.tag}] ${l.message} ${l.data ? JSON.stringify(l.data) : ''}`
      )
      .join('\n');
  }

  private notify() {
    const current = this.getLogs();
    this.listeners.forEach((l) => l(current));
  }
}

export const logger = new DebugLogger();
