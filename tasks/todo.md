# TonQuant — Active TODO

## Workstream 1: Repo-Local Replan
- [x] Create a repo-local active plan under `plans/`
- [x] Create a matching execution contract under `tasks/contracts/`
- [x] Replace scaffold-era TODOs with quant-first milestones

## Workstream 2: Quant Boundary Scaffolding
- [x] Add `src/quant/types/` for shared run metadata and domain schemas
- [x] Add `src/quant/runner/` for CLI resolution, spawning, and artifact ownership
- [x] Add `src/quant/api/` for stable TypeScript entrypoints
- [x] Register Phase 1 CLI command groups as explicit stubs
- [x] Add focused tests for quant runner and artifact helpers

## Workstream 3: TON Quant Data Foundation
- [x] Define dataset file format for TON OHLCV and liquidity-derived series
- [x] Implement `tonquant data fetch`
- [x] Implement `tonquant data list`
- [x] Implement `tonquant data info`
- [x] Verify quant artifacts land under `~/.tonquant/quant/`

## Workstream 4: Quant Execution Surface
- [x] Implement `factor list / compute`
- [x] Implement `backtest run`
- [x] Implement `preset list / show`
- [x] Implement `autoresearch init / run / status / list`
- [x] Keep current support commands available without quant-runner coupling

## Workstream 4.5: Factor Marketplace (Phase 2)
- [x] Factor registry types (`packages/core/src/types/factor-registry.ts`)
- [x] Registry service (`packages/core/src/services/registry.ts`)
- [x] CLI factor commands (`apps/cli/src/cli/factor.ts` + factor-*.ts)
- [x] Factor Leaderboard (`factor top`)
- [x] One-Click Backtest (`factor backtest`)
- [x] Factor Composition (`factor compose`)
- [x] Factor Alerts (`factor alert`)
- [x] Social Proof (`factor report`)
- [x] Seed content — 10+ built-in starter factors
- [x] OpenClaw skill packaging (`factor skill-export`)
- [x] Phase 2 stabilization — fix TS errors, add registry service tests (229 tests, 0 failures)

## Workstream 4.6: Local Audit Event Log
- [x] Add global append-only event log service in `packages/core/src/services/event-log.ts`
- [x] Add shared file persistence helpers for atomic JSON writes and rollback snapshots
- [x] Wire factor publish / subscribe / unsubscribe through state+event transaction boundaries
- [x] Wire factor alert set / remove through state+event transaction boundaries
- [x] Wire factor report submit through state+event transaction boundaries
- [x] Wire factor compose save / delete through state+event transaction boundaries
- [x] Export event log types and service API from `packages/core/src/index.ts`
- [x] Add service and CLI regression tests for event append, filtering, rollback, lock timeout, and JSON error codes

## Workstream 5: Support Command Stabilization
- [x] Finish and verify current support-command work:
  - `price`, `pools`, `trending` — stable (command + test + formatter)
  - `init` — stable (command + 8 tests covering validation, crypto, config)
  - `balance`, `swap` — stable (swap --execute deferred by design)
  - `history`, `research` — stable (command + test + formatter)
- [x] Keep `research` positioned as lightweight market summary, not quant research
- [x] Keep `swap --execute` out of scope until quant core is stable
- [x] Lint clean (cli + core: 0 errors via Biome)

## Workstream 6: Demo & Polish
- [x] Terminal output visual polish (format.ts unified with format-helpers.ts header/divider)
- [x] Demo video script outline (demo/script.md — 5 scenes, Phase 2 narrative)
- [x] Demo video production (demo/recording.cast — asciinema, 656 frames)
- [ ] Final submission

## Verification
- [x] `bun typecheck` (core + cli: 0 errors; quant-backend: excluded)
- [x] `bun lint` (cli + core: 0 errors; web: pre-existing a11y issues, out of scope)
- [x] `bun test` — 235 tests, 0 failures
- [x] Event-log regression suite — 98 targeted tests, 0 failures
- [x] Scoped Biome check on touched event-log files
- [ ] Full `bun typecheck` currently blocked by pre-existing `packages/core/tests/services/skill-export.test.ts` errors
- [ ] Full `bun lint` currently blocked by pre-existing `apps/web` import ordering, a11y, and React hook diagnostics
- [x] `bun run apps/cli/src/index.ts --help` — Phase 1+2 command groups visible
- [x] Docs and task files describe the same roadmap and command surface
