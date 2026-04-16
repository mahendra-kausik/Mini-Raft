import { describe, it, expect, beforeEach } from 'vitest';
import { LocalRaftClient } from '../../gateway/src/raftClient.js';
import { BoardManager } from '../../gateway/src/boardManager.js';
import type { Stroke } from '../../gateway/src/types.js';

function makeStroke(overrides: Partial<Stroke> = {}): Stroke {
  return {
    id: 'stroke-1',
    boardId: 'board-1',
    userId: 'user-1',
    color: '#E74C3C',
    width: 3,
    points: [[0, 0], [10, 10]],
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('LocalRaftClient', () => {
  let bm: BoardManager;
  let client: LocalRaftClient;

  beforeEach(() => {
    bm = new BoardManager();
    bm.getOrCreateBoard('board-1');
    client = new LocalRaftClient(bm);
  });

  it('submitStroke stores the stroke and returns true', async () => {
    const stroke = makeStroke();
    const result = await client.submitStroke(stroke);
    expect(result).toBe(true);
    expect(bm.getStrokes('board-1')).toEqual([stroke]);
  });

  it('getStrokes returns strokes for a board', async () => {
    const stroke = makeStroke();
    await client.submitStroke(stroke);
    const strokes = await client.getStrokes('board-1');
    expect(strokes).toEqual([stroke]);
  });

  it('getStrokes returns empty array for empty board', async () => {
    const strokes = await client.getStrokes('board-1');
    expect(strokes).toEqual([]);
  });

  it('handles multiple strokes on the same board', async () => {
    const s1 = makeStroke({ id: 's1' });
    const s2 = makeStroke({ id: 's2', userId: 'user-2' });
    await client.submitStroke(s1);
    await client.submitStroke(s2);
    const strokes = await client.getStrokes('board-1');
    expect(strokes).toHaveLength(2);
  });
});
