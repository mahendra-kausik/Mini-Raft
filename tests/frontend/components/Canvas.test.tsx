import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Canvas } from '../../../frontend/src/components/Canvas';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../frontend/src/constants';

// Mock useDrawing to avoid pointer event complexity in unit tests
vi.mock('../../../frontend/src/hooks/useDrawing', () => ({
  useDrawing: () => ({
    isDrawing: false,
    handlePointerDown: () => {},
    handlePointerMove: () => {},
    handlePointerUp: () => {},
  }),
}));

describe('Canvas', () => {
  it('renders a canvas element with correct dimensions', () => {
    render(
      <Canvas
        boardId="test-board"
        userId="test-user"
        color="#E74C3C"
        strokes={[]}
        onStrokeComplete={() => {}}
      />,
    );
    const canvas = screen.getByTestId('drawing-canvas') as HTMLCanvasElement;
    expect(canvas).toBeInTheDocument();
    expect(canvas.width).toBe(CANVAS_WIDTH);
    expect(canvas.height).toBe(CANVAS_HEIGHT);
  });

  it('has crosshair cursor style', () => {
    render(
      <Canvas
        boardId="test-board"
        userId="test-user"
        color="#E74C3C"
        strokes={[]}
        onStrokeComplete={() => {}}
      />,
    );
    const canvas = screen.getByTestId('drawing-canvas');
    expect(canvas.style.cursor).toBe('crosshair');
  });
});
