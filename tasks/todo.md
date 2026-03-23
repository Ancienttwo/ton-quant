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

## Workstream 5: Support Command Stabilization
- [ ] Finish and verify current support-command work:
  - `price`, `pools`, `trending`
  - `init`, `balance`, `swap`
  - `history`, `research`
- [ ] Keep `research` positioned as lightweight market summary, not quant research
- [ ] Keep `swap --execute` out of scope until quant core is stable

## Workstream 6: Demo & Polish
- [ ] Terminal output visual polish (Retro-Futuristic design system)
- [ ] Demo video script outline
- [ ] Demo video production (Remotion or asciinema)
- [ ] Final submission

## Verification
- [x] `bun typecheck`
- [ ] `bun lint` (quant-backend excluded from tsconfig, has standalone lint)
- [x] `bun test` — 135 tests, 0 failures
- [x] `bun run src/index.ts --help` — Phase 1 command groups visible
- [ ] Docs and task files describe the same roadmap and command surface
