import type WebSocket from 'ws';
import type { Stroke, ServerMessage } from './types.js';

export interface Board {
  boardId: string;
  strokes: Stroke[];
  users: Map<string, WebSocket>;
}

export class BoardManager {
  private boards = new Map<string, Board>();

  getOrCreateBoard(boardId: string): Board {
    let board = this.boards.get(boardId);
    if (!board) {
      board = { boardId, strokes: [], users: new Map() };
      this.boards.set(boardId, board);
    }
    return board;
  }

  getBoard(boardId: string): Board | undefined {
    return this.boards.get(boardId);
  }

  joinBoard(boardId: string, userId: string, ws: WebSocket): Stroke[] {
    const board = this.getOrCreateBoard(boardId);
    board.users.set(userId, ws);
    return board.strokes;
  }

  leaveBoard(boardId: string, userId: string): void {
    const board = this.boards.get(boardId);
    if (!board) return;
    board.users.delete(userId);
  }

  addStroke(boardId: string, stroke: Stroke): void {
    const board = this.boards.get(boardId);
    if (!board) return;
    board.strokes.push(stroke);
  }

  getStrokes(boardId: string): Stroke[] {
    return this.boards.get(boardId)?.strokes ?? [];
  }

  broadcast(boardId: string, message: ServerMessage, excludeUserId?: string): void {
    const board = this.boards.get(boardId);
    if (!board) return;
    const data = JSON.stringify(message);
    for (const [userId, ws] of board.users) {
      if (userId !== excludeUserId && ws.readyState === ws.OPEN) {
        ws.send(data);
      }
    }
  }

  sendTo(ws: WebSocket, message: ServerMessage): void {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  getBoardCount(): number {
    return this.boards.size;
  }

  getUserCount(boardId: string): number {
    return this.boards.get(boardId)?.users.size ?? 0;
  }
}
