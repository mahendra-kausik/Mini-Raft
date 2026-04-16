import { useCallback, useState } from 'react';
import type { Stroke, ServerMessage } from '../types';
import { useWebSocket } from './useWebSocket';
import { logStroke } from '../utils/logger';

interface UseBoardOptions {
  boardId: string;
  userId: string;
}

export function useBoard({ boardId, userId }: UseBoardOptions) {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [users, setUsers] = useState<string[]>([]);

  const handleMessage = useCallback((message: ServerMessage) => {
    switch (message.type) {
      case 'join_ack':
        setStrokes(message.strokes);
        break;
      case 'stroke_broadcast':
        setStrokes((prev) => [...prev, message.stroke]);
        break;
      case 'user_joined':
        setUsers((prev) => [...prev, message.userId]);
        break;
      case 'user_left':
        setUsers((prev) => prev.filter((id) => id !== message.userId));
        break;
      case 'error':
        console.error(`[Board] Error: ${message.message}`);
        break;
    }
  }, []);

  const { status, send } = useWebSocket({ boardId, userId, onMessage: handleMessage });

  const addStroke = useCallback(
    (stroke: Stroke) => {
      logStroke(stroke);
      // Optimistic: add locally immediately
      setStrokes((prev) => [...prev, stroke]);
      send({ type: 'stroke', stroke });
    },
    [send],
  );

  return { strokes, users, status, addStroke };
}
