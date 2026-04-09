# Plan: QuantCLI Multi-Market Layering

> **Slug**: quantcli-multi-market-layering
> **Status**: Active
> **Approved By**: User chat approval on 2026-04-09

## Summary

Replace the single TON-only `market` abstraction with a layered market model that supports:

- crypto on TON
- US equities
- Hong Kong equities
- A-shares

This phase explicitly includes HK and CN equities, not just schema placeholders. Bonds remain schema-valid but provider-stubbed and out of active delivery scope.

## Decisions

- Split market identity into `assetClass`, `marketRegion`, `venue`, and `provider`.
- Introduce `InstrumentRef` as the canonical internal identity for research flows.
- Keep CLI inputs minimally disruptive: continue accepting `--symbols` while adding market-selection flags.
- Treat dataset normalization as the seam between symbol resolution and factor/backtest/autoresearch.
- Keep execution abstractions reserved only as schema seams; do not add broker integrations in this pass.
- Support `crypto + us equity + hk equity + cn equity` end-to-end in the mock backend.

## Implementation Workstreams

### 1. Shared market model

- Replace `MarketCode = "ton"` with typed enums for:
  - `AssetClass`
  - `MarketRegion`
  - `VenueCode`
  - `ProviderCode`
- Add canonical `InstrumentRef` and execution seam types.

### 2. CLI-side resolution

- Add a market resolver under `src/quant/market/`.
- Resolve `symbols` into `instruments` before backend invocation.
- Add `--asset-class`, `--market-region`, `--venue`, and `--provider` to quant CLI commands.

### 3. Backend dataset normalization

- Normalize generated datasets around instrument metadata, calendar, provider, and annualization basis.
- Preserve 24/7 behavior for crypto and trading-day behavior for equities.
- Allow cached dataset introspection through the normalized document shape.

### 4. Product surface

- Keep old TON flows working without additional flags.
- Add real HK and CN preset coverage alongside US equity and TON presets.
- Ensure factor/backtest/autoresearch consume normalized datasets instead of raw vendor symbols.

### 5. Verification

- Add resolver and backend coverage for HK/CN identity mapping.
- Re-run targeted orchestrator and backend tests.
- Pass `apps/cli` and `apps/quant-backend` strict typechecks independently.

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Flat market enums collapse incompatible semantics | High | Keep instrument identity split across asset, region, venue, provider |
| Mixed crypto/equity datasets distort annualization | High | Store trading calendar and annualization basis on dataset documents |
| CLI flag expansion breaks old TON workflows | Medium | Keep TON defaults for legacy symbol-only flows |
| Root repo verification is obscured by unrelated failures | Medium | Track targeted checks separately and note repo-level pre-existing blockers |

## Verification Targets

- `bunx tsc -p apps/cli/tsconfig.json --noEmit`
- `bunx tsc -p apps/quant-backend/tsconfig.json --noEmit`
- `bun test apps/cli/tests/quant/backend/data.test.ts apps/cli/tests/quant/backend/factor.test.ts apps/cli/tests/quant/backend/preset.test.ts apps/cli/tests/quant/orchestrator.test.ts`
- `bun typecheck` with any remaining failures called out explicitly if outside this workstream
- `bun lint` with any remaining failures called out explicitly if outside this workstream
