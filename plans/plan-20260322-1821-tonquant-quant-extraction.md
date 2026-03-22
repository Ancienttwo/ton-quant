# Plan: TonQuant Quant-First Replan

> **Slug**: tonquant-quant-extraction
> **Status**: Active
> **Supersedes**: user-level draft at `~/.claude/plans/optimized-painting-whisper.md`

## Summary

TonQuant becomes a two-stage product:

- **Phase 0** keeps the current lightweight TON DeFi CLI as support tooling for wallet lookup, market inspection, and demo flows.
- **Phase 1** becomes the main product: a quant-first CLI that compatibly rebuilds the `comp-agent` quant boundary for TON.

The compatibility target is architectural, not a blind code transplant. TonQuant will preserve the same high-value seams:

- typed request/result schemas
- a runner boundary for invoking the quant backend
- artifact and run-log ownership
- durable autoresearch track state

## Decisions

- Keep current DeFi commands outside the quant runner. They stay direct CLI/service flows.
- Do not add `src/services/queries.ts` as a unifying abstraction for everything.
- Introduce `src/quant/` as the stable Phase 1 boundary with `types/`, `runner/`, and `api/`.
- Standardize quant state under `~/.tonquant/quant/`.
- Treat `data fetch` as the precursor to factor, backtest, and autoresearch.

## Implementation Workstreams

### 1. Repo workflow reset

- Create this repo-local active plan and matching task contract.
- Replace scaffold-era `tasks/todo.md` with quant-first milestones.
- Refresh `tasks/research.md` with extraction notes from `comp-agent`.

### 2. Quant boundary scaffolding

- Add `src/quant/types/` for:
  - shared run metadata
  - data-fetch
  - factor
  - signal
  - backtest
  - preset
  - autoresearch
- Add `src/quant/runner/` for:
  - CLI resolution
  - subprocess execution
  - artifact directory creation
  - request/result/run.log persistence
- Add `src/quant/api/` for stable TypeScript entrypoints:
  - `runDataFetch`, `runDataList`, `runDataInfo`
  - `runFactorList`, `runFactorCompute`
  - `runSignalList`, `runSignalEvaluate`
  - `runBacktest`
  - `runPresetList`, `runPresetShow`
  - autoresearch init/run/status/list/promote/reject

### 3. CLI contract alignment

- Keep current support commands:
  - `price`, `pools`, `trending`, `init`, `balance`, `swap`, `history`, `research`
- Add Phase 1 command groups as explicit stubs and help-surface contracts:
  - `data fetch|list|info`
  - `factor list|compute`
  - `backtest run`
  - `preset list|show`
  - `autoresearch init|run|status|list`

### 4. Documentation rewrite

- Rewrite PRD, architecture, brief, tech stack, and ADRs around the two-stage roadmap.
- Document quant artifact and state layouts as source of truth.
- Update progress only after the repo-local plan and doc refresh land.

## Target Interfaces

### Quant storage

Single runs:

```text
~/.tonquant/quant/<domain>/<runId>/
  request.json
  result.json
  run.log
  <domain artifacts>
```

Autoresearch track state:

```text
~/.tonquant/quant/autoresearch/<trackId>/
  baseline.json
  state.json
  history.jsonl
  candidates/
    <candidateId>.json
```

Autoresearch executions:

```text
~/.tonquant/quant/autoresearch-runs/<runId>/
  request.json
  result.json
  run.log
  <run artifacts>
```

### Public command groups

- `tonquant data fetch|list|info`
- `tonquant factor list|compute`
- `tonquant backtest run`
- `tonquant preset list|show`
- `tonquant autoresearch init|run|status|list`

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| TonQuant keeps drifting toward demo-only DeFi tooling | High | Make quant commands and `src/quant/` the documented Phase 1 center |
| `comp-agent` extraction is reduced to copying algorithms only | High | Preserve runner/schema/artifact/state boundaries first |
| Backend implementation shape is still open | Medium | Document optional Python backend now, keep TS boundary stable |
| Existing CLI refactors conflict with replan work | Medium | Keep current support commands isolated from new quant files |

## Verification

- `plans/` contains the active repo-local plan for this workstream.
- `tasks/todo.md` reflects this plan instead of scaffold-era tasks.
- `src/quant/` exists with compile-time types, runner, and API entrypoints.
- CLI help exposes the Phase 1 command groups.
- Docs consistently describe the same two-stage roadmap and quant boundary.
