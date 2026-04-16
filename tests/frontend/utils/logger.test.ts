import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logStroke, logConnection, logDisconnection } from '../../../frontend/src/utils/logger';
import type { Stroke } from '../../../frontend/src/types';

describe('logger', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockStroke: Stroke = {
    id: 'test-id',
    boardId: 'room-abc',
    userId: 'user-xyz',
    color: '#E74C3C',
    width: 3,
    points: [[120, 45], [200, 150], [402, 310]],
    timestamp: 1700000000000,
  };

  describe('logStroke', () => {
    it('logs stroke with correct format', () => {
      logStroke(mockStroke);
      expect(console.log).toHaveBeenCalledTimes(1);
      const logMsg = (console.log as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(logMsg).toContain('STROKE');
      expect(logMsg).toContain('board=room-abc');
      expect(logMsg).toContain('user=user-xyz');
      expect(logMsg).toContain('color=#E74C3C');
      expect(logMsg).toContain('points=3');
      expect(logMsg).toContain('from=(120,45)');
      expect(logMsg).toContain('to=(402,310)');
    });
  });

  describe('logConnection', () => {
    it('logs connection with board and user', () => {
      logConnection('room-abc', 'user-xyz');
      const logMsg = (console.log as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(logMsg).toContain('CONNECTED');
      expect(logMsg).toContain('board=room-abc');
      expect(logMsg).toContain('user=user-xyz');
    });
  });

  describe('logDisconnection', () => {
    it('logs disconnection with board and user', () => {
      logDisconnection('room-abc', 'user-xyz');
      const logMsg = (console.log as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(logMsg).toContain('DISCONNECTED');
      expect(logMsg).toContain('board=room-abc');
      expect(logMsg).toContain('user=user-xyz');
    });
  });
});
