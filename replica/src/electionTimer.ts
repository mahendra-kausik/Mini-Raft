import type { TimerManager } from './types.js';

const ELECTION_TIMEOUT_MIN = 500;
const ELECTION_TIMEOUT_MAX = 800;
const HEARTBEAT_INTERVAL = 150;

export class DefaultTimerManager implements TimerManager {
  private electionTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private electionCallback: (() => void) | null = null;

  private randomTimeout(): number {
    return ELECTION_TIMEOUT_MIN + Math.floor(Math.random() * (ELECTION_TIMEOUT_MAX - ELECTION_TIMEOUT_MIN + 1));
  }

  startElectionTimer(callback: () => void): void {
    this.electionCallback = callback;
    this.resetElectionTimer();
  }

  resetElectionTimer(): void {
    if (this.electionTimer !== null) {
      clearTimeout(this.electionTimer);
    }
    if (this.electionCallback) {
      const timeout = this.randomTimeout();
      this.electionTimer = setTimeout(() => {
        this.electionCallback?.();
      }, timeout);
    }
  }

  stopElectionTimer(): void {
    if (this.electionTimer !== null) {
      clearTimeout(this.electionTimer);
      this.electionTimer = null;
    }
  }

  startHeartbeat(callback: () => void): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(callback, HEARTBEAT_INTERVAL);
  }

  stopHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}
