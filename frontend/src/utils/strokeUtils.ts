import type { Stroke } from '../types';

export function generateId(): string {
  return crypto.randomUUID();
}

export function generateBoardCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function getUserId(): string {
  let userId = sessionStorage.getItem('userId');
  if (!userId) {
    userId = generateId();
    sessionStorage.setItem('userId', userId);
  }
  return userId;
}

export function createStroke(
  boardId: string,
  userId: string,
  color: string,
  width: number,
  points: [number, number][],
): Stroke {
  return {
    id: generateId(),
    boardId,
    userId,
    color,
    width,
    points,
    timestamp: Date.now(),
  };
}

export function serializeStroke(stroke: Stroke): string {
  return JSON.stringify({ type: 'stroke', stroke });
}
