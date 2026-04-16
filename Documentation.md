# Mini-RAFT — Distributed Real-Time Drawing Board

## Overview

A distributed real-time collaborative drawing board backed by a Mini-RAFT consensus protocol. The system consists of a WebSocket gateway, three replica nodes implementing RAFT-lite consensus, and a browser-based drawing canvas.

---

## Frontend Client — Drawing Board with WebSocket

### What it does

A React-based collaborative drawing board where users can create or join boards via a unique 6-character code, draw freehand strokes with 5 selectable colors, and connect to the gateway over WebSocket for real-time synchronization.

### How it works

- **Tech stack**: Vite + React 18 + TypeScript, React Router v6, Vitest + Testing Library
- **Canvas**: Fixed 1920x1080 logical pixel canvas, CSS-scaled to fit viewport. Strokes are drawn as polylines sampled at pointer event rate (~60fps).
- **Stroke format**: Each completed stroke (mousedown→mouseup) is captured as an array of `[x, y]` points with metadata (board ID, user ID, color, brush width, timestamp, UUID).
- **WebSocket**: One connection per user per board. URL format: `ws://gateway:8080/ws?boardId=<code>&userId=<uuid>`. Auto-reconnects with exponential backoff (1s → 30s max).
- **Optimistic drawing**: Local strokes render immediately on canvas and are sent to the server simultaneously. Remote strokes arrive via `stroke_broadcast` messages.
- **Board state**: On join, the server sends a `join_ack` with all existing strokes, which are replayed on the canvas.
- **User identity**: `userId` is stored in `sessionStorage` (persists across refresh, unique per tab).

### URL Routes

| Route | Description |
|-------|-------------|
| `/` | Home page — create a new board or enter a board code to join |
| `/board/:boardId` | Drawing board — canvas, toolbar, WebSocket connection |

### WebSocket Message Protocol

| Direction | Type | Purpose |
|-----------|------|---------|
| Client→Server | `join` | Join a board |
| Client→Server | `stroke` | Submit completed stroke |
| Server→Client | `join_ack` | Confirm join + full board state |
| Server→Client | `stroke_broadcast` | New stroke from another user |
| Server→Client | `user_joined` / `user_left` | Presence updates |
| Server→Client | `error` | Error message |

### Console Logging

Strokes are logged to the browser console in this format:
```
[timestamp] STROKE board=room-abc user=user-xyz color=#E74C3C points=47 from=(120,45) to=(402,310)
```

Connection and disconnection events are also logged.

### Configuration

- **WS URL**: Set `VITE_WS_URL` environment variable (default: `ws://localhost:8080/ws`)
- **Colors**: Red (#E74C3C), Blue (#3498DB), Green (#2ECC71), Orange (#F39C12), Purple (#9B59B6)
- **Brush width**: 3px
- **Canvas size**: 1920x1080 logical pixels

### Running

```bash
cd frontend
npm install
npm run dev    # Development server at http://localhost:5173
npm test       # Run all tests
npm run build  # Production build
```

---

## WebSocket Gateway Server

### What it does

A Node.js + TypeScript WebSocket gateway that accepts client connections, manages in-memory board state, tracks connected users per board, and broadcasts strokes between clients in real time. Boards are created lazily on first join and persist strokes in memory for reconnecting users.

### How it works

- **Tech stack**: Node.js, TypeScript, `ws` library, Vitest
- **WebSocket endpoint**: `ws://localhost:8080/ws?boardId=<code>&userId=<uuid>`
- **Board management**: Boards are stored in a `Map<string, Board>` keyed by board ID. Each board holds an array of strokes and a map of connected users (userId → WebSocket).
- **Connection lifecycle**: On connect, `boardId` and `userId` are extracted from query params. On `join` message, the user is registered and receives a `join_ack` with all existing strokes. On disconnect, a `user_left` message is broadcast to remaining users.
- **Stroke relay**: Incoming strokes are stored in the board's stroke array and broadcast to all other users on the board (not echoed to the sender, since the frontend uses optimistic rendering).
- **RAFT integration**: A `RaftClient` interface abstracts stroke storage. `LocalRaftClient` stores in-memory (no Docker). `RemoteRaftClient` forwards to the RAFT leader via HTTP when `RAFT_PEERS` env var is set. The gateway auto-detects which client to use.

### Broadcasting Rules

| Message | Recipients |
|---------|-----------|
| `join_ack` | Only the joining user |
| `user_joined` | All on board EXCEPT the joiner |
| `stroke_broadcast` | All on board EXCEPT the stroke author |
| `user_left` | All remaining users on board |
| `error` | Only the offending client |

### Architecture

```
gateway/
├── src/
│   ├── index.ts            # HTTP server + WS server on port 8080
│   ├── types.ts             # Shared message protocol types
│   ├── boardManager.ts      # Board state, user registry, broadcast helper
│   ├── messageHandler.ts    # JSON parse, dispatch to board manager
│   ├── wsServer.ts          # WebSocket server setup, connection lifecycle
│   ├── raftClient.ts        # RaftClient interface + LocalRaftClient
│   └── remoteRaftClient.ts  # RemoteRaftClient for RAFT cluster integration
```

### Configuration

- **Port**: Set `PORT` environment variable (default: `8080`)
- **RAFT_PEERS**: Comma-separated replica URLs (e.g., `http://replica1:3001,http://replica2:3002,http://replica3:3003`). When set, gateway forwards strokes to RAFT leader instead of storing locally.

### Running

```bash
cd gateway
npm install
npm run dev    # Development server on port 8080
npm test       # Run all tests (34 tests across 5 suites)
npm run build  # TypeScript compilation
```

---

## RAFT Replica Cluster

### What it does

Three replica nodes implementing a simplified Mini-RAFT consensus protocol. Replicas maintain a shared append-only stroke log, elect a leader, replicate entries, and commit only on majority acknowledgment. The gateway forwards incoming drawing strokes to the active leader, and only committed strokes are broadcast to clients.

### How it works

- **Tech stack**: Node.js, TypeScript, Express, Vitest
- **Consensus**: Mini-RAFT with leader election, log replication, and majority-based commit
- **Node states**: Follower, Candidate, Leader
- **Heartbeat interval**: 150ms from leader to all followers
- **Election timeout**: Randomized 500-800ms; if a follower misses heartbeats, it becomes a candidate
- **Majority**: 2 of 3 nodes (cluster tolerates 1 failure)
- **Log entries**: Each entry contains an index, term, and stroke. Entries are committed only when replicated to a majority.
- **Board state**: Derived from committed log entries. Each replica maintains an in-memory `Map<boardId, Stroke[]>` for fast reads.
- **Catch-up**: Restarted nodes use `/sync-log` to fetch missing committed entries from the leader.

### RAFT State Machine

Each replica maintains:
- `currentTerm` — monotonically increasing term number
- `votedFor` — candidate voted for in current term (at most one per term)
- `state` — follower | candidate | leader
- `leaderId` — known leader for client redirection
- `log` — append-only array of `LogEntry` (index, term, stroke)
- `commitIndex` — highest committed log index
- `lastApplied` — highest log index applied to board state
- `nextIndex` / `matchIndex` — leader-only, per-follower replication tracking

### Election Rules

1. Follower times out (500-800ms randomized) → becomes candidate
2. Candidate increments term, votes for self, sends `RequestVote` to peers
3. Node becomes leader only on receiving majority votes (2 of 3)
4. Higher term always wins — any node seeing a higher term steps down to follower
5. A node votes at most once per term
6. Vote granted only if candidate's log is at least as up-to-date as voter's

### Replica API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/request-vote` | RequestVote RPC |
| POST | `/append-entries` | AppendEntries RPC (log replication) |
| POST | `/heartbeat` | Leader heartbeat |
| POST | `/sync-log` | Follower catch-up after restart |
| POST | `/client-write` | Gateway submits stroke to leader |
| GET | `/health` | Health check |
| GET | `/status` | Replica state (term, leader, log length, etc.) |
| GET | `/board-state?boardId=X` | Committed strokes for a board |

### Architecture

```
replica/
├── src/
│   ├── index.ts            # Express server, env config, wiring
│   ├── types.ts            # RAFT types, RPC payloads, interfaces
│   ├── raftNode.ts         # Core RAFT state machine
│   ├── raftLog.ts          # Append-only log data structure
│   ├── electionTimer.ts    # Randomized election timeout + heartbeat scheduler
│   ├── rpcClient.ts        # HTTP client for peer RPCs
│   ├── rpcHandlers.ts      # Express route handlers for all endpoints
│   └── logger.ts           # Structured JSON logger
```

### Configuration

- **REPLICA_ID**: Unique replica identifier (e.g., `replica1`)
- **PORT**: HTTP port (default: `3001`)
- **PEERS**: Comma-separated peer URLs (e.g., `http://replica2:3002,http://replica3:3003`)

### Running

```bash
cd replica
npm install
npm run dev    # Development server with watch mode
npm test       # Run all tests (75 tests across 6 suites including integration)
npm run build  # TypeScript compilation
```

---

## Docker Setup

### What it does

Docker Compose orchestrates the full system: 1 gateway + 3 RAFT replicas on a shared bridge network. Each replica runs from the same image with different environment variables.

### Services

| Service | Port | Description |
|---------|------|-------------|
| `gateway` | 8080 | WebSocket gateway (exposed to host) |
| `replica1` | 3001 | RAFT replica node 1 |
| `replica2` | 3002 | RAFT replica node 2 |
| `replica3` | 3003 | RAFT replica node 3 |

### Running

```bash
# Start everything
docker compose up --build

# Start in background
docker compose up --build -d

# View logs
docker compose logs -f

# Stop
docker compose down

# Restart a single replica (simulates crash/recovery)
docker compose restart replica1

# Kill leader to test failover
docker compose stop replica1
```

### Testing Failover

```bash
# 1. Start cluster
docker compose up --build -d

# 2. Check who is leader
curl http://localhost:3001/status
curl http://localhost:3002/status
curl http://localhost:3003/status

# 3. Kill the leader (e.g., replica1)
docker compose stop replica1

# 4. Wait ~1s for election, check new leader
curl http://localhost:3002/status

# 5. Restart crashed replica (catches up via /sync-log)
docker compose start replica1

# 6. Verify it caught up
curl http://localhost:3001/status

# Automated failover test
./scripts/test-failover.sh
```
