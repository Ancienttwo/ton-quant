# Plan: YFinance Provider Phase 1

> **Slug**: yfinance-provider-phase1
> **Status**: Active
> **Approved By**: User chat approval on 2026-04-09

## Summary

Integrate a real `yfinance` provider for quant `data fetch|info|list` without changing the downstream dataset contract used by factor, backtest, and autoresearch.

This phase proves the provider seam end-to-end for:

- US equities
- Hong Kong equities
- A-shares where Yahoo Finance exposes the symbol

## Building

Add a provider adapter behind the quant backend data boundary. CLI market selection continues to resolve canonical `InstrumentRef` values, the backend translates those into Yahoo-format symbols, fetches real historical bars and metadata from `yfinance`, then persists the existing normalized dataset document shape. `data list` and `data info` continue to operate on cached normalized datasets, not on raw provider responses.

## Not Building

- Do not change factor, backtest, or autoresearch execution semantics in this phase.
- Do not add a second real provider in the same pass.
- Do not support crypto through `yfinance` in this phase.
- Do not promise full HK/CN coverage beyond symbols Yahoo Finance actually serves.
- Do not fix unrelated full-repo lint/typecheck debt.
- Do not change the quant artifact directory layout again.

## Scope Mode

**shape** — extend the current quant boundary with one real provider while holding the normalized dataset contract fixed.

## Chosen Approach

Implement `yfinance` only at the backend data surface and keep the persisted dataset schema as the sole contract across the rest of quant.

This is the simplest approach that proves the real-provider seam without forcing another cache or orchestration rewrite. It also uses the post-review repair we just landed: provider-aware instrument ids, dataset filenames, and cache lookup.

## Options Considered

### Option A: Minimal adapter at `data fetch` only

- Summary: fetch live `yfinance` bars in `handleDataFetch`, keep all other commands reading normalized datasets.
- Effort: medium
- Pros:
  - smallest real-provider slice
  - protects downstream code from provider-specific shape drift
- Cons:
  - `data info` still depends on cache or preview fallback
  - less direct provider metadata surface

### Option B: Full `data fetch|info|list` integration with normalized cache

- Summary: add `yfinance` transport plus cache-aware `data info` and `data list` behavior around normalized datasets.
- Effort: medium
- Pros:
  - covers the user-facing Phase 1 command surface completely
  - validates symbol normalization, cache identity, and output formatting together
- Cons:
  - slightly more moving pieces than fetch-only
  - requires careful error shaping and regression coverage

### Option C: Thread provider transport through factor/backtest/autoresearch immediately

- Summary: make the whole quant stack provider-live in one pass.
- Effort: large
- Pros:
  - faster path to full real-data research
  - fewer interim states
- Cons:
  - too much surface area for the first live-provider integration
  - makes transport bugs look like strategy bugs

## Recommendation

Choose **Option B**.

It is still bounded to `data fetch|info|list`, but it exercises the actual problems that matter: Yahoo symbol normalization, provider-specific dataset persistence, cache reuse, and user-visible output. Anything smaller risks proving only the HTTP call and not the storage boundary we need for the rest of quant.

## Key Decisions

- Keep normalized dataset documents as the only persistence contract.
  Reason: provider transport should be replaceable without rewriting factor/backtest/autoresearch.

- Normalize Yahoo symbols in one place from `InstrumentRef` for equities only.
  Reason: HK (`####.HK`) and CN (`######.SS` / `######.SZ`) rules must not leak into multiple handlers.

- Gate real-provider behavior by `provider === "yfinance"`.
  Reason: avoids destabilizing existing synthetic and stub flows while Phase 1 is landing.

- Reject `crypto + yfinance` during market resolution.
  Reason: slash-form TON pairs do not define a stable Yahoo ticker contract, so silent guessing would lie about provider coverage.

- Treat unsupported or missing Yahoo symbols as structured fetch failures, not silent synthetic fallbacks.
  Reason: silent fallback would lie about provider coverage and poison the cache.

- Fix the formatter signal in this phase if it touches `data fetch` output.
  Reason: once live mixed-market results exist, wrong bar-count reporting becomes user-visible noise.

## Work Units

1. Add backend `yfinance` transport and response normalization for OHLCV bars.
2. Add Yahoo symbol normalization from canonical instruments for US/HK/CN equities.
3. Route `data fetch` to live transport when provider is `yfinance`, preserving normalized cache writes.
4. Make `data info` surface cached provider-aware datasets accurately and fall back to provider-aware preview semantics.
5. Keep `data list` purely cache-based but ensure summaries reflect real provider identity.
6. Add regression tests for US/HK/CN symbol normalization, explicit `crypto + yfinance` rejection, real-provider cache writes, unsupported-symbol failures, and output metadata.

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Yahoo symbol coverage is partial for HK/CN | High | Treat support as per-symbol, test concrete tickers, fail explicitly when absent |
| Upstream shape/rate-limit variability | High | Wrap transport errors in structured backend errors and keep cache contract isolated |
| Provider/live fetch leaks into downstream quant semantics | Medium | Keep all live transport inside `data` handlers only |
| Mixed-market human output reports misleading bar counts | Medium | Correct formatter assumptions while landing provider-backed fetch output |

## Dependencies

- `yfinance` runtime dependency for backend transport
- outbound network access from the quant backend process
- no API key dependency for Phase 1

## Verification Targets

- `bunx tsc -p apps/cli/tsconfig.json --noEmit`
- `bunx tsc -p apps/quant-backend/tsconfig.json --noEmit`
- `bun test apps/cli/tests/quant/backend/data.test.ts apps/cli/tests/quant/orchestrator.test.ts`
- targeted new backend/provider tests for Yahoo normalization and failure envelopes
- targeted Biome check on touched provider integration files

## Confidence Check

- Problem understood: yes — land one real provider at the data boundary without destabilizing the normalized quant contract.
- Simplest approach: yes — `data fetch|info|list` is the smallest complete live-provider surface worth integrating.
- Unknowns resolved or deferred: mostly — Yahoo per-symbol coverage remains an implementation-time runtime fact, but it is explicitly constrained and not hidden.
