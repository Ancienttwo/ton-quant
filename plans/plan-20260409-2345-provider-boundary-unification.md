# Plan: Provider Boundary Unification

> **Slug**: provider-boundary-unification
> **Status**: Completed
> **Approved By**: User chat approval on 2026-04-09

## Summary

Unify TonQuant's provider and market-selection contract across CLI API entrypoints, durable autoresearch state, presets, and backend handlers so every quant surface resolves instruments the same way and uses the same transport boundary.

This phase closes the structural gap left after `yfinance` Phase 1:

- `quant/api/autoresearch.ts` currently bypasses the shared runner/transport boundary used by `data`, `factor`, and `backtest`
- provider compatibility rules are duplicated across CLI resolver, backend resolver, and autoresearch baseline construction

## Building

Bring autoresearch onto the same quant API surface as the rest of the stack and centralize market/provider compatibility into one reusable contract. The goal is not another provider; it is making existing provider selection semantics boring, consistent, and testable before the next provider or live-data expansion.

## Not Building

- Do not add a second live provider in this phase.
- Do not widen `yfinance` back to crypto.
- Do not change factor/backtest strategy semantics.
- Do not redesign the artifact layout that was just stabilized.
- Do not fix unrelated root-repo lint/typecheck debt.

## Scope Mode

**shape** — hold the current quant feature set, remove structural inconsistency, and prepare the next provider phase.

## Chosen Approach

Keep the existing CLI/backend split, but force every quant API entrypoint to go through the same request normalization and artifacted transport pattern unless there is a deliberate documented exception. At the same time, extract provider compatibility into a shared rule set that both CLI and backend resolution consume, so the contract is enforced once and mirrored everywhere.

## Key Decisions

- Route autoresearch API calls through the quant transport boundary.
  Reason: `data`, `factor`, and `backtest` already validate, artifact, and fail consistently through `invokeQuantCli`; autoresearch should not be a separate execution model.

- Centralize provider compatibility alongside market resolution.
  Reason: support and rejection rules such as `crypto + yfinance` must not drift between CLI, backend, presets, and durable baseline reloads.

- Preserve canonical `InstrumentRef` as the only cross-boundary identity.
  Reason: downstream cache and dataset behavior already depend on provider-aware canonical instrument identity.

- Keep the backend as the source of runtime provider execution.
  Reason: the CLI should normalize and validate requests, but transport-side provider behavior still belongs behind the backend boundary.

- Require parity tests across API, backend, and preset surfaces.
  Reason: this phase is specifically about semantic consistency, so coverage must prove the same combination resolves or fails identically everywhere.

## Work Units

1. Move `quant/api/autoresearch.ts` onto the shared transport boundary used by other quant API modules.
2. Define a shared provider compatibility contract for `assetClass + marketRegion + venue + provider`.
3. Make CLI resolution, autoresearch baseline creation/loading, and backend resolution all consume that same contract.
4. Verify preset definitions still resolve to valid canonical instruments under the unified contract.
5. Add regression coverage that proves the same provider combinations succeed/fail consistently across API, backend, and autoresearch flows.

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Autoresearch transport unification breaks durable track flows | High | Preserve current file layout and lifecycle semantics, change only the invocation boundary |
| Shared provider rules become too generic and mask market nuance | Medium | Keep the contract limited to current supported markets/providers only |
| Presets or persisted baselines drift from the unified contract | Medium | Add load-time and preset regression tests for canonical instrument validity |

## Dependencies

- existing quant runner and `invokeQuantCli` boundary
- current autoresearch lifecycle service and durable track files
- current market/provider resolver logic in both CLI and backend

## Verification Targets

- `bunx tsc -p apps/cli/tsconfig.json --noEmit`
- `bunx tsc -p apps/quant-backend/tsconfig.json --noEmit`
- targeted autoresearch API + lifecycle tests
- targeted backend/provider compatibility tests
- `bash /Users/ancienttwo/.agents/skills/check/scripts/run-tests.sh`

## Confidence Check

- Problem understood: yes — the next risk is structural inconsistency, not missing raw provider coverage.
- Simplest approach: yes — unify one transport boundary and one compatibility contract before expanding features again.
- Unknowns resolved or deferred: mostly — exact helper placement is an implementation detail, but the required behavior and test contract are fixed.
