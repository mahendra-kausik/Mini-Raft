import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Suppress console.log from logger
vi.spyOn(console, 'log').mockImplementation(() => {});

// Mock WebSocket class
class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static OPEN = 1;
  static CONNECTING = 0;
  static CLOSING = 2;
  static CLOSED = 3;

  url: string;
  readyState = 0;
  onopen: ((ev: Event) => void) | null = null;
  onclose: ((ev: CloseEvent) => void) | null = null;
  onmessage: ((ev: MessageEvent) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;
  send = vi.fn();
  close = vi.fn();

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
  }

  simulateOpen() {
    this.readyState = 1;
    this.onopen?.(new Event('open'));
  }

  simulateMessage(data: unknown) {
    this.onmessage?.(new MessageEvent('message', { data: JSON.stringify(data) }));
  }

  simulateClose() {
    this.readyState = 3;
    this.onclose?.(new CloseEvent('close'));
  }
}

// Must replace global WebSocket before module evaluation
Object.defineProperty(globalThis, 'WebSocket', {
  value: MockWebSocket,
  writable: true,
  configurable: true,
});

import { useWebSocket } from '../../../frontend/src/hooks/useWebSocket';

beforeEach(() => {
  MockWebSocket.instances = [];
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useWebSocket', () => {
  it('connects to WebSocket with correct URL', async () => {
    const { result } = renderHook(() =>
      useWebSocket({ boardId: 'abc', userId: 'user1', onMessage: () => {} }),
    );

    // Wait for the useEffect to run
    await vi.advanceTimersByTimeAsync(0);

    expect(MockWebSocket.instances.length).toBeGreaterThanOrEqual(1);
    expect(MockWebSocket.instances[0].url).toContain('boardId=abc');
    expect(MockWebSocket.instances[0].url).toContain('userId=user1');
  });

  it('sets status to connected on open', async () => {
    const { result } = renderHook(() =>
      useWebSocket({ boardId: 'abc', userId: 'user1', onMessage: () => {} }),
    );
    await vi.advanceTimersByTimeAsync(0);

    act(() => {
      MockWebSocket.instances[0].simulateOpen();
    });
    expect(result.current.status).toBe('connected');
  });

  it('sends join message on connection', async () => {
    renderHook(() =>
      useWebSocket({ boardId: 'abc', userId: 'user1', onMessage: () => {} }),
    );
    await vi.advanceTimersByTimeAsync(0);

    act(() => {
      MockWebSocket.instances[0].simulateOpen();
    });
    expect(MockWebSocket.instances[0].send).toHaveBeenCalledWith(
      JSON.stringify({ type: 'join', boardId: 'abc', userId: 'user1' }),
    );
  });

  it('calls onMessage when a message is received', async () => {
    const onMessage = vi.fn();
    renderHook(() =>
      useWebSocket({ boardId: 'abc', userId: 'user1', onMessage }),
    );
    await vi.advanceTimersByTimeAsync(0);

    act(() => {
      MockWebSocket.instances[0].simulateOpen();
    });
    act(() => {
      MockWebSocket.instances[0].simulateMessage({ type: 'join_ack', boardId: 'abc', strokes: [] });
    });
    expect(onMessage).toHaveBeenCalledWith({ type: 'join_ack', boardId: 'abc', strokes: [] });
  });

  it('sends messages via the send function', async () => {
    const { result } = renderHook(() =>
      useWebSocket({ boardId: 'abc', userId: 'user1', onMessage: () => {} }),
    );
    await vi.advanceTimersByTimeAsync(0);

    act(() => {
      MockWebSocket.instances[0].simulateOpen();
    });
    MockWebSocket.instances[0].send.mockClear();

    act(() => {
      result.current.send({ type: 'join', boardId: 'abc', userId: 'user1' });
    });
    expect(MockWebSocket.instances[0].send).toHaveBeenCalledTimes(1);
  });

  it('attempts reconnection on close with backoff', async () => {
    renderHook(() =>
      useWebSocket({ boardId: 'abc', userId: 'user1', onMessage: () => {} }),
    );
    await vi.advanceTimersByTimeAsync(0);

    const firstWs = MockWebSocket.instances[0];
    act(() => {
      firstWs.simulateOpen();
    });
    const countBefore = MockWebSocket.instances.length;
    act(() => {
      firstWs.simulateClose();
    });

    expect(MockWebSocket.instances.length).toBe(countBefore);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(MockWebSocket.instances.length).toBe(countBefore + 1);
  });
});
