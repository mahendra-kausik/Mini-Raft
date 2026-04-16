import type { LogEntry } from './types.js';

export class RaftLog {
  private entries: LogEntry[] = [];

  append(entry: LogEntry): void {
    this.entries.push(entry);
  }

  getEntry(index: number): LogEntry | undefined {
    if (index < 1) return undefined;
    return this.entries[index - 1];
  }

  getLastIndex(): number {
    return this.entries.length;
  }

  getLastTerm(): number {
    if (this.entries.length === 0) return 0;
    return this.entries[this.entries.length - 1].term;
  }

  getEntriesFrom(startIndex: number): LogEntry[] {
    if (startIndex < 1) startIndex = 1;
    return this.entries.slice(startIndex - 1);
  }

  truncateFrom(index: number): void {
    if (index < 1 || index > this.entries.length) return;
    this.entries.length = index - 1;
  }

  getLength(): number {
    return this.entries.length;
  }
}
