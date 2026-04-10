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
- [x] Quant CLI runtime architecture deep-dive (`docs/quant-cli-architecture.md`)
- [x] Final submission

## Workstream 7: Durable Autoresearch Track Core
- [x] Add CLI-side autoresearch lifecycle service with baseline/state/history/candidate persistence
- [x] Replace `autoresearch init|status|list` placeholders with real track-backed behavior
- [x] Refactor `autoresearch run` to execute against persisted tracks and emit durable candidates
- [x] Add `autoresearch promote|reject` review loop commands
- [x] Append autoresearch lifecycle events to the global audit log
- [x] Upgrade autoresearch formatter to track-aware human output
- [x] Add autoresearch lifecycle and formatter regression tests

## Workstream 8: Quant Multi-Market Layering
- [x] Replace TON-only market typing with `assetClass`, `marketRegion`, `venue`, `provider`, and `InstrumentRef`
- [x] Add CLI-side market resolution for crypto, US equities, Hong Kong equities, and A-shares
- [x] Normalize backend datasets with instrument/provider/calendar metadata and market-specific annualization
- [x] Expose market-selection flags on `data`, `factor`, `backtest`, and `autoresearch init`
- [x] Add HK and CN equity presets alongside TON and US equity presets
- [x] Add targeted backend and orchestrator regression coverage for HK/CN flows
- [x] Repair post-review hard stops:
  - provider-aware instrument identity and dataset cache filenames
  - provider persistence across dataset write/read boundaries
  - filesystem-safe validation for caller-controlled `runId` artifact paths

## Workstream 9: YFinance Provider Phase 1
- [x] Add repo-local plan under `plans/plan-20260409-2300-yfinance-provider-phase1.md`
- [x] Add execution contract under `tasks/contracts/yfinance-provider-phase1.contract.md`
- [x] Add backend `yfinance` transport for historical OHLCV
- [x] Normalize Yahoo symbols from canonical instruments for US/HK/CN equities
- [x] Integrate `yfinance` into `data fetch`
- [x] Keep `data info` and `data list` accurate for provider-backed cached datasets
- [x] Add regression coverage for supported-symbol fetches and unsupported-symbol failures
- [x] Fix human bar-count reporting if touched by provider-backed mixed-market fetch output
- [x] Cut Phase 1 to equities-only by rejecting `crypto + yfinance` during market resolution

## Workstream 10: Provider Boundary Unification
- [x] Add repo-local plan under `plans/plan-20260409-2345-provider-boundary-unification.md`
- [x] Add execution contract under `tasks/contracts/provider-boundary-unification.contract.md`
- [x] Route `quant/api/autoresearch` through the shared quant transport boundary
- [x] Centralize provider compatibility for supported market/provider combinations
- [x] Apply the shared provider contract to CLI resolution, backend resolution, autoresearch baselines, and presets
- [x] Add parity regressions for supported and unsupported combinations across API and backend surfaces

## Workstream 11: OpenBB Provider Phase 2
- [x] Add repo-local plan under `plans/plan-20260409-2359-openbb-provider-phase2.md`
- [x] Add execution contract under `tasks/contracts/openbb-provider-phase2.contract.md`
- [x] Add OpenBB endpoint/auth configuration contract with stable error codes
- [x] Add backend `openbb` historical-data transport for HK/CN equities
- [x] Remove synthetic fallback from supported `provider=openbb` data flows
- [x] Tighten canonical provider compatibility and defaults so unsupported `openbb` markets stop overclaiming support
- [x] Align HK/CN presets with runnable default-provider behavior
- [x] Add regression coverage for configured success, unconfigured failure, unsupported combinations, and cache identity

## Workstream 12: Repo Baseline Cleanup
- [x] Add repo-local plan under `plans/plan-20260409-1541-repo-baseline-cleanup.md`
- [x] Add execution contract under `tasks/contracts/repo-baseline-cleanup.contract.md`
- [x] Fix strict-null `packages/core/tests/services/skill-export.test.ts` errors that currently block full `bun typecheck`
- [x] Fix `apps/web` import-order diagnostics in the known blocker files
- [x] Fix `apps/web` hook-dependency diagnostics in `BacktestViewer.tsx` and `TerminalDemo.tsx`
- [x] Fix `apps/web` accessibility and button semantics diagnostics in `FactorDetailModal.tsx` and `Leaderboard.tsx`
- [x] Re-run full `bun typecheck`
- [x] Re-run full `bun lint`
- [x] Re-run full `bun run test`

## Verification — Workstream 13
- [x] `bun typecheck` (core + cli: 0 errors; quant-backend: excluded)
- [x] `bun lint` (cli + core: 0 errors; web: pre-existing a11y issues, out of scope)
- [x] `bun test` — 235 tests, 0 failures
- [x] Event-log regression suite — 98 targeted tests, 0 failures
- [x] Scoped Biome check on touched event-log files
- [x] Full `bun typecheck`
- [x] Full `bun lint`
- [x] `bun run apps/cli/src/index.ts --help` — Phase 1+2 command groups visible
- [x] `bun test --max-concurrency 1 apps/cli/tests/quant/autoresearch/lifecycle.test.ts apps/cli/tests/utils/format.test.ts apps/cli/tests/quant/orchestrator.test.ts`
- [x] `bun run apps/cli/src/index.ts autoresearch --help` — durable lifecycle subcommands visible
- [x] Targeted Biome check on autoresearch lifecycle, CLI, formatter, and tests
- [x] Targeted TS check on new autoresearch files (full app check still blocked by pre-existing quant-backend and backend-test issues)
- [x] Docs and task files describe the same roadmap and command surface
- [x] `bunx tsc -p apps/cli/tsconfig.json --noEmit`
- [x] `bunx tsc -p apps/quant-backend/tsconfig.json --noEmit`
- [x] `bun test apps/cli/tests/quant/api/request-market.test.ts apps/cli/tests/quant/api/data-fetch.test.ts apps/cli/tests/quant/api/autoresearch.test.ts apps/cli/tests/quant/autoresearch/lifecycle.test.ts apps/cli/tests/quant/backend/data.test.ts apps/cli/tests/quant/backend/openbb.test.ts apps/cli/tests/quant/backend/preset.test.ts`
- [x] Targeted Biome check on touched OpenBB provider files
- [x] `bash /Users/ancienttwo/.agents/skills/check/scripts/run-tests.sh` — 306 pass / 0 fail
- [x] `bun test apps/cli/tests/quant/backend/data.test.ts apps/cli/tests/quant/backend/factor.test.ts apps/cli/tests/quant/backend/preset.test.ts apps/cli/tests/quant/orchestrator.test.ts`
- [x] `bun test apps/cli/tests/quant/backend/data.test.ts apps/cli/tests/quant/backend/factor.test.ts apps/cli/tests/quant/backend/preset.test.ts apps/cli/tests/quant/orchestrator.test.ts apps/cli/tests/quant/runner/artifact-manager.test.ts`
- [x] Targeted Biome check on multi-market quant files
- [x] Targeted Biome check on touched multi-market repair files
- [x] Full `bun run test`

## Workstream 13: Market-First Public Data Foundation
- [x] Add repo-local plan under `plans/plan-20260410-1448-market-first-public-data-foundation.md`
- [x] Add execution contract under `tasks/contracts/market-first-public-data-foundation.contract.md`
- [x] Expand the shared crypto market contract across CLI and quant-backend for non-TON public markets
- [x] Add Binance and Hyperliquid public quote/candle providers with Zod-validated payloads
- [x] Add dedicated market-first schemas and formatters with trust metadata
- [x] Add explicit `market` CLI namespace for quote/search/compare/candles
- [x] Keep `price` as a TON-scoped legacy path with clear migration guidance
- [x] Add request-keyed cache isolation for public market data
- [x] Add migration-seam regression coverage across core, CLI, and quant-backend

## Verification
- [x] `bun test packages/core/tests/services/market.test.ts packages/core/tests/services/queries.test.ts apps/cli/tests/quant/api/request-market.test.ts apps/cli/tests/quant/backend/data.test.ts`
- [x] `bun run apps/cli/src/index.ts market quote BTC --json`
- [x] `bun run apps/cli/src/index.ts market search BTC --json`
- [x] `bun run apps/cli/src/index.ts market compare BTC --json`
- [x] `bun run apps/cli/src/index.ts market candles BTC --provider hyperliquid --interval 1d --limit 2 --json`
- [x] `bun run apps/cli/src/index.ts price BTC --json`
- [x] `bun run typecheck`
- [x] `bun run lint`
- [x] `bun run test`
