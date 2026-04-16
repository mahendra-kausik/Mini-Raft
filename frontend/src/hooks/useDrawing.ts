import { useCallback, useRef, useState } from 'react';
import type { Stroke } from '../types';
import { BRUSH_WIDTH, CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';
import { createStroke } from '../utils/strokeUtils';

interface UseDrawingOptions {
  boardId: string;
  userId: string;
  color: string;
  onStrokeComplete: (stroke: Stroke) => void;
}

export function useDrawing({ boardId, userId, color, onStrokeComplete }: UseDrawingOptions) {
  const [isDrawing, setIsDrawing] = useState(false);
  const pointsRef = useRef<[number, number][]>([]);
  const colorRef = useRef(color);
  colorRef.current = color;

  const getCanvasPoint = useCallback(
    (canvas: HTMLCanvasElement, clientX: number, clientY: number): [number, number] => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      return [
        Math.round((clientX - rect.left) * scaleX),
        Math.round((clientY - rect.top) * scaleY),
      ];
    },
    [],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = e.currentTarget;
      canvas.setPointerCapture(e.pointerId);
      setIsDrawing(true);
      const point = getCanvasPoint(canvas, e.clientX, e.clientY);
      pointsRef.current = [point];
    },
    [getCanvasPoint],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;
      const point = getCanvasPoint(e.currentTarget, e.clientX, e.clientY);
      pointsRef.current.push(point);

      // Draw the latest segment immediately for responsiveness
      const ctx = e.currentTarget.getContext('2d');
      if (ctx && pointsRef.current.length >= 2) {
        const pts = pointsRef.current;
        const prev = pts[pts.length - 2];
        const curr = pts[pts.length - 1];
        ctx.beginPath();
        ctx.strokeStyle = colorRef.current;
        ctx.lineWidth = BRUSH_WIDTH;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(prev[0], prev[1]);
        ctx.lineTo(curr[0], curr[1]);
        ctx.stroke();
      }
    },
    [isDrawing, getCanvasPoint],
  );

  const handlePointerUp = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const points = pointsRef.current;
    if (points.length >= 2) {
      const stroke = createStroke(boardId, userId, colorRef.current, BRUSH_WIDTH, points);
      onStrokeComplete(stroke);
    }
    pointsRef.current = [];
  }, [isDrawing, boardId, userId, onStrokeComplete]);

  return {
    isDrawing,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}
