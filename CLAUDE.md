# Mini-RAFT Project — AI Agent Instructions

## Workflow Rules

### 1. Feature-by-Feature Development
- Work on ONE feature at a time. Never implement multiple features in a single pass.
- Each feature must be fully complete (code, tests, docs) before moving to the next.
- A feature is the smallest shippable unit of work (e.g., "leader election", "heartbeat RPC", "WebSocket gateway connections").
- Do NOT scaffold the entire project at once. Build incrementally.

### 2. Pre-Commit Checklist (ALL required before every commit)

Before ANY commit, the following three things MUST be done:

#### a) Tests
- Every feature MUST have corresponding test files.
- Tests go in a `tests/` directory mirroring the source structure.
- Tests must be runnable via a single command (e.g., `npm test` or `go test ./...`).
- Tests must pass locally before committing.
- CI must be configured to run tests (GitHub Actions in `.github/workflows/ci.yml`).

#### b) Documentation
- ALL documentation goes in a single file: `Documentation.md` at the project root.
- Each feature gets its own subheading under the appropriate section.
- Format:
  ```
  ## Feature Name
  - What it does
  - How it works
  - API endpoints (if any)
  - Configuration (if any)
  ```
- Update `Documentation.md` BEFORE committing — never after.

#### c) Changelog
- Maintain a `CHANGELOG.md` at the project root.
- After each commit, add an entry describing what was done.
- Format:
  ```
  ## [YYYY-MM-DD] - Feature Name
  ### Added
  - What was added
  ### Changed
  - What was changed (if applicable)
  ### Fixed
  - What was fixed (if applicable)
  ```
- Entries are in reverse chronological order (newest first).

### 3. Commit Convention
- Each commit corresponds to exactly ONE feature.
- Commit message format: `feat: <short description of feature>`
- For fixes within a feature: `fix: <short description>`
- For test-only changes: `test: <short description>`
- For doc-only changes: `docs: <short description>`

### 4. CI Requirements
- GitHub Actions workflow in `.github/workflows/ci.yml`.
- CI must run all tests on every push and PR.
- CI must pass before a feature is considered done.

## Commit Sequence (for every feature)
1. Write the feature code
2. Write tests for the feature
3. Verify tests pass
4. Update `Documentation.md` with the feature's subheading
5. Commit the feature (code + tests + docs)
6. Update `CHANGELOG.md` with what was done in that commit
7. Commit the changelog update

## Project Structure
```
Mini_Raft/
├── CLAUDE.md              # These instructions
├── CHANGELOG.md           # Changelog (reverse chronological)
├── Documentation.md       # All documentation (single file)
├── docker-compose.yml     # Docker orchestration
├── gateway/               # Gateway service
├── replica/               # Shared replica code (mounted into replica1-3)
├── replica1/              # Replica 1 bind-mount folder
├── replica2/              # Replica 2 bind-mount folder
├── replica3/              # Replica 3 bind-mount folder
├── frontend/              # Browser canvas frontend
├── tests/                 # All test files
└── .github/
    └── workflows/
        └── ci.yml         # CI pipeline
```
