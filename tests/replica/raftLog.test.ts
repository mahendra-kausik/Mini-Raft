import { describe, it, expect, beforeEach } from 'vitest';
import { RaftLog } from '../../replica/src/raftLog.js';
import type { LogEntry, Stroke } from '../../replica/src/types.js';

function makeStroke(id = 's1'): Stroke {
  return { id, boardId: 'b1', userId: 'u1', color: '#f00', width: 3, points: [[0, 0]], timestamp: 1 };
}

function makeEntry(index: number, term: number): LogEntry {
  return { index, term, stroke: makeStroke(`s${index}`) };
}

describe('RaftLog', () => {
  let log: RaftLog;

  beforeEach(() => {
    log = new RaftLog();
  });

  it('starts empty', () => {
    expect(log.getLength()).toBe(0);
    expect(log.getLastIndex()).toBe(0);
    expect(log.getLastTerm()).toBe(0);
  });

  it('appends entries and tracks length', () => {
    log.append(makeEntry(1, 1));
    expect(log.getLength()).toBe(1);
    expect(log.getLastIndex()).toBe(1);
    expect(log.getLastTerm()).toBe(1);

    log.append(makeEntry(2, 1));
    expect(log.getLength()).toBe(2);
    expect(log.getLastIndex()).toBe(2);
  });

  it('retrieves entry by 1-based index', () => {
    log.append(makeEntry(1, 1));
    log.append(makeEntry(2, 2));

    expect(log.getEntry(1)?.term).toBe(1);
    expect(log.getEntry(2)?.term).toBe(2);
  });

  it('returns undefined for out-of-bounds index', () => {
    expect(log.getEntry(0)).toBeUndefined();
    expect(log.getEntry(1)).toBeUndefined();
    log.append(makeEntry(1, 1));
    expect(log.getEntry(2)).toBeUndefined();
  });

  it('getEntriesFrom returns entries from a given index', () => {
    log.append(makeEntry(1, 1));
    log.append(makeEntry(2, 1));
    log.append(makeEntry(3, 2));

    const from2 = log.getEntriesFrom(2);
    expect(from2).toHaveLength(2);
    expect(from2[0].index).toBe(2);
    expect(from2[1].index).toBe(3);
  });

  it('getEntriesFrom with index 1 returns all', () => {
    log.append(makeEntry(1, 1));
    log.append(makeEntry(2, 1));
    expect(log.getEntriesFrom(1)).toHaveLength(2);
  });

  it('getEntriesFrom beyond log returns empty', () => {
    log.append(makeEntry(1, 1));
    expect(log.getEntriesFrom(5)).toEqual([]);
  });

  it('truncateFrom removes entries from index onward', () => {
    log.append(makeEntry(1, 1));
    log.append(makeEntry(2, 1));
    log.append(makeEntry(3, 2));

    log.truncateFrom(2);
    expect(log.getLength()).toBe(1);
    expect(log.getLastIndex()).toBe(1);
    expect(log.getEntry(2)).toBeUndefined();
  });

  it('truncateFrom(1) clears the entire log', () => {
    log.append(makeEntry(1, 1));
    log.append(makeEntry(2, 1));
    log.truncateFrom(1);
    expect(log.getLength()).toBe(0);
  });

  it('truncateFrom beyond log is a no-op', () => {
    log.append(makeEntry(1, 1));
    log.truncateFrom(5);
    expect(log.getLength()).toBe(1);
  });

  it('tracks last term correctly after truncation', () => {
    log.append(makeEntry(1, 1));
    log.append(makeEntry(2, 2));
    log.append(makeEntry(3, 3));
    log.truncateFrom(3);
    expect(log.getLastTerm()).toBe(2);
  });
});
