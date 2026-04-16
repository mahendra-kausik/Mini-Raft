import type { Stroke } from '../types';

function timestamp(): string {
  return new Date().toISOString();
}

export function logStroke(stroke: Stroke): void {
  const first = stroke.points[0];
  const last = stroke.points[stroke.points.length - 1];
  console.log(
    `[${timestamp()}] STROKE board=${stroke.boardId} user=${stroke.userId} color=${stroke.color} points=${stroke.points.length} from=(${first[0]},${first[1]}) to=(${last[0]},${last[1]})`,
  );
}

export function logConnection(boardId: string, userId: string): void {
  console.log(
    `[${timestamp()}] CONNECTED board=${boardId} user=${userId}`,
  );
}

export function logDisconnection(boardId: string, userId: string): void {
  console.log(
    `[${timestamp()}] DISCONNECTED board=${boardId} user=${userId}`,
  );
}
