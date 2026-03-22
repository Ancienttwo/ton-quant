# Contract: TonQuant Quant-First Replan

## Goal

Align the repo around a quant-first product direction without disturbing in-progress support-command work.

## Deliverables

- Repo-local active plan under `plans/`
- Updated `tasks/todo.md` and `tasks/research.md`
- Refreshed core docs:
  - `docs/PRD.md`
  - `docs/architecture.md`
  - `docs/brief.md`
  - `docs/tech-stack.md`
  - `docs/decisions.md`
  - `docs/PROGRESS.md`
- New `src/quant/` boundary with:
  - `types/`
  - `runner/`
  - `api/`
- Phase 1 CLI command groups registered as stubs

## Non-Goals

- Do not rewrite current DeFi command outputs into quant artifact semantics.
- Do not implement the Python quant backend in this pass.
- Do not merge or revert unrelated in-progress CLI/test edits.

## Acceptance Criteria

- The active repo-local plan supersedes the user-level draft.
- The docs clearly state:
  - Phase 0 support commands
  - Phase 1 quant command groups
  - `src/quant/` ownership boundaries
  - artifact and autoresearch state layout
- `src/quant/` compiles and exports the documented contracts.
- `tonquant --help` exposes the new command groups.

## Verification Commands

- `bun typecheck`
- `bun lint`
- `bun test`
- `bun run src/index.ts --help`
