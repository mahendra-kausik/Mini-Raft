import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDrawing } from '../../../frontend/src/hooks/useDrawing';

function createPointerEvent(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
): React.PointerEvent<HTMLCanvasElement> {
  return {
    clientX,
    clientY,
    pointerId: 1,
    currentTarget: canvas,
  } as unknown as React.PointerEvent<HTMLCanvasElement>;
}

describe('useDrawing', () => {
  function setup() {
    const onStrokeComplete = vi.fn();
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    // Mock getBoundingClientRect to match canvas dimensions
    canvas.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 1920,
      height: 1080,
      right: 1920,
      bottom: 1080,
      x: 0,
      y: 0,
      toJSON: () => {},
    });
    canvas.setPointerCapture = vi.fn();
    // Mock getContext
    canvas.getContext = vi.fn().mockReturnValue({
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      strokeStyle: '',
      lineWidth: 0,
      lineCap: '',
      lineJoin: '',
    });

    const hook = renderHook(() =>
      useDrawing({
        boardId: 'test-board',
        userId: 'test-user',
        color: '#E74C3C',
        onStrokeComplete,
      }),
    );

    return { hook, canvas, onStrokeComplete };
  }

  it('starts not drawing', () => {
    const { hook } = setup();
    expect(hook.result.current.isDrawing).toBe(false);
  });

  it('sets isDrawing to true on pointer down', () => {
    const { hook, canvas } = setup();
    act(() => {
      hook.result.current.handlePointerDown(createPointerEvent(canvas, 100, 100));
    });
    expect(hook.result.current.isDrawing).toBe(true);
  });

  it('calls onStrokeComplete on pointer up after drawing', () => {
    const { hook, canvas, onStrokeComplete } = setup();

    act(() => {
      hook.result.current.handlePointerDown(createPointerEvent(canvas, 100, 100));
    });
    act(() => {
      hook.result.current.handlePointerMove(createPointerEvent(canvas, 150, 150));
    });
    act(() => {
      hook.result.current.handlePointerUp();
    });

    expect(onStrokeComplete).toHaveBeenCalledTimes(1);
    const stroke = onStrokeComplete.mock.calls[0][0];
    expect(stroke.boardId).toBe('test-board');
    expect(stroke.userId).toBe('test-user');
    expect(stroke.color).toBe('#E74C3C');
    expect(stroke.points.length).toBeGreaterThanOrEqual(2);
  });

  it('does not fire stroke for single point (no movement)', () => {
    const { hook, canvas, onStrokeComplete } = setup();

    act(() => {
      hook.result.current.handlePointerDown(createPointerEvent(canvas, 100, 100));
    });
    act(() => {
      hook.result.current.handlePointerUp();
    });

    expect(onStrokeComplete).not.toHaveBeenCalled();
  });
});
