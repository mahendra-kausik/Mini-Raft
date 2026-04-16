import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DefaultTimerManager } from '../../replica/src/electionTimer.js';

describe('DefaultTimerManager', () => {
  let tm: DefaultTimerManager;

  beforeEach(() => {
    vi.useFakeTimers();
    tm = new DefaultTimerManager();
  });

  afterEach(() => {
    tm.stopElectionTimer();
    tm.stopHeartbeat();
    vi.useRealTimers();
  });

  describe('election timer', () => {
    it('fires callback after timeout in [500, 800] range', () => {
      const cb = vi.fn();
      tm.startElectionTimer(cb);

      // Should not fire before 500ms
      vi.advanceTimersByTime(499);
      expect(cb).not.toHaveBeenCalled();

      // Should fire by 800ms
      vi.advanceTimersByTime(301);
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it('reset cancels old timer and starts new one', () => {
      const cb = vi.fn();
      tm.startElectionTimer(cb);

      vi.advanceTimersByTime(400);
      tm.resetElectionTimer();

      // Old timer at ~500-800 should not fire
      vi.advanceTimersByTime(400);

      // New timer hasn't fired yet either (reset at t=400, new timeout 500-800 from then)
      // But by t=400+800=1200 from reset, it should fire
      vi.advanceTimersByTime(400);
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it('stop prevents callback from firing', () => {
      const cb = vi.fn();
      tm.startElectionTimer(cb);
      tm.stopElectionTimer();

      vi.advanceTimersByTime(1000);
      expect(cb).not.toHaveBeenCalled();
    });
  });

  describe('heartbeat', () => {
    it('fires callback every 150ms', () => {
      const cb = vi.fn();
      tm.startHeartbeat(cb);

      vi.advanceTimersByTime(150);
      expect(cb).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(150);
      expect(cb).toHaveBeenCalledTimes(2);

      vi.advanceTimersByTime(150);
      expect(cb).toHaveBeenCalledTimes(3);
    });

    it('stop prevents further callbacks', () => {
      const cb = vi.fn();
      tm.startHeartbeat(cb);

      vi.advanceTimersByTime(150);
      expect(cb).toHaveBeenCalledTimes(1);

      tm.stopHeartbeat();
      vi.advanceTimersByTime(300);
      expect(cb).toHaveBeenCalledTimes(1);
    });
  });
});
