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
- [ ] Add focused tests for quant runner and artifact helpers

## Workstream 3: TON Quant Data Foundation
- [ ] Define dataset file format for TON OHLCV and liquidity-derived series
- [ ] Implement `tonquant data fetch`
- [ ] Implement `tonquant data list`
- [ ] Implement `tonquant data info`
- [ ] Verify quant artifacts land under `~/.tonquant/quant/`

## Workstream 4: Quant Execution Surface
- [ ] Implement `factor list / compute`
- [ ] Implement `backtest run`
- [ ] Implement `preset list / show`
- [ ] Implement `autoresearch init / run / status / list`
- [ ] Keep current support commands available without quant-runner coupling

## Workstream 5: Support Command Stabilization
- [ ] Finish and verify current support-command work:
  - `price`, `pools`, `trending`
  - `init`, `balance`, `swap`
  - `history`, `research`
- [ ] Keep `research` positioned as lightweight market summary, not quant research
- [ ] Keep `swap --execute` out of scope until quant core is stable

## Verification
- [ ] `bun typecheck`
- [ ] `bun lint`
- [ ] `bun test`
- [ ] `bun run src/index.ts --help`
- [ ] Docs and task files describe the same roadmap and command surface
