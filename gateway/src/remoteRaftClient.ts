import type { Stroke } from './types.js';
import type { RaftClient } from './raftClient.js';

const RPC_TIMEOUT = 3000;

export class RemoteRaftClient implements RaftClient {
  private currentLeader: string | null = null;

  constructor(private peers: string[]) {}

  async submitStroke(stroke: Stroke): Promise<boolean> {
    // Try the known leader first, then all peers
    const targets = this.currentLeader
      ? [this.currentLeader, ...this.peers.filter((p) => p !== this.currentLeader)]
      : [...this.peers];

    for (const peer of targets) {
      try {
        const result = await this.post<{ success: boolean; leaderHint?: string }>(
          `${peer}/client-write`,
          { stroke },
        );

        if (result.success) {
          this.currentLeader = peer;
          return true;
        }

        if (result.leaderHint) {
          // leaderHint is a replicaId — find the matching peer URL
          const hintPeer = this.peers.find((p) => p.includes(result.leaderHint!));
          if (hintPeer) {
            this.currentLeader = hintPeer;
            // Retry on the hinted leader
            const retry = await this.post<{ success: boolean; leaderHint?: string }>(
              `${hintPeer}/client-write`,
              { stroke },
            );
            if (retry.success) return true;
          }
        }
      } catch {
        // Peer unreachable, try next
      }
    }

    return false;
  }

  async getStrokes(boardId: string): Promise<Stroke[]> {
    // Try leader first, then any available replica
    const targets = this.currentLeader
      ? [this.currentLeader, ...this.peers.filter((p) => p !== this.currentLeader)]
      : [...this.peers];

    for (const peer of targets) {
      try {
        const result = await this.get<{ boardId: string; strokes: Stroke[] }>(
          `${peer}/board-state?boardId=${encodeURIComponent(boardId)}`,
        );
        return result.strokes;
      } catch {
        // Peer unreachable, try next
      }
    }

    return [];
  }

  private async post<T>(url: string, body: unknown): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), RPC_TIMEOUT);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async get<T>(url: string): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), RPC_TIMEOUT);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}
