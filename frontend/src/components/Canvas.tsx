import { useEffect, useRef } from 'react';
import type { Stroke } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, BRUSH_WIDTH } from '../constants';
import { useDrawing } from '../hooks/useDrawing';

interface CanvasProps {
  boardId: string;
  userId: string;
  color: string;
  strokes: Stroke[];
  onStrokeComplete: (stroke: Stroke) => void;
}

function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  if (stroke.points.length < 2) return;
  ctx.beginPath();
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.width || BRUSH_WIDTH;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.moveTo(stroke.points[0][0], stroke.points[0][1]);
  for (let i = 1; i < stroke.points.length; i++) {
    ctx.lineTo(stroke.points[i][0], stroke.points[i][1]);
  }
  ctx.stroke();
}

export function Canvas({ boardId, userId, color, strokes, onStrokeComplete }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastDrawnCountRef = useRef(0);

  const { handlePointerDown, handlePointerMove, handlePointerUp } = useDrawing({
    boardId,
    userId,
    color,
    onStrokeComplete,
  });

  // Full redraw when strokes change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Only do a full redraw if strokes were removed (e.g., on join_ack replacing all)
    if (strokes.length < lastDrawnCountRef.current) {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      for (const stroke of strokes) {
        drawStroke(ctx, stroke);
      }
      lastDrawnCountRef.current = strokes.length;
      return;
    }

    // Incremental: draw only new strokes
    for (let i = lastDrawnCountRef.current; i < strokes.length; i++) {
      drawStroke(ctx, strokes[i]);
    }
    lastDrawnCountRef.current = strokes.length;
  }, [strokes]);

  return (
    <canvas
      ref={canvasRef}
      data-testid="drawing-canvas"
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      style={{
        width: '100%',
        maxWidth: `${CANVAS_WIDTH}px`,
        aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}`,
        border: '1px solid #ccc',
        cursor: 'crosshair',
        touchAction: 'none',
        display: 'block',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  );
}
