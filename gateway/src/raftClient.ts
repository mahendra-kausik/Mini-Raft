import type { Stroke } from './types.js';
import type { BoardManager } from './boardManager.js';

export interface RaftClient {
  submitStroke(stroke: Stroke): Promise<boolean>;
  getStrokes(boardId: string): Promise<Stroke[]>;
}

export class LocalRaftClient implements RaftClient {
  constructor(private boardManager: BoardManager) {}

  async submitStroke(stroke: Stroke): Promise<boolean> {
    this.boardManager.addStroke(stroke.boardId, stroke);
    return true;
  }

  async getStrokes(boardId: string): Promise<Stroke[]> {
    return this.boardManager.getStrokes(boardId);
  }
}
