# Contract: QuantCLI Multi-Market Layering

## Goal

Move TonQuant from a TON-only quant boundary to a layered multi-market boundary that supports crypto, US equities, Hong Kong equities, and A-shares without breaking existing TON workflows.

## Deliverables

- Shared quant schemas for:
  - `AssetClass`
  - `MarketRegion`
  - `VenueCode`
  - `ProviderCode`
  - `InstrumentRef`
- CLI-side market resolver and provider selection
- Normalized backend dataset document model with market metadata
- Quant command flag support for market selection
- HK and CN preset coverage in addition to TON and US equity presets
- Targeted regression coverage for backend handlers and orchestrator flow

## Non-Goals

- Do not add live broker execution, accounts, or order routing.
- Do not add real HK/CN/bond market-data providers beyond the mock backend surface.
- Do not replace existing support-command architecture with the quant market resolver.
- Do not fix unrelated `packages/core` or `apps/web` verification debt in this pass.

## Acceptance Criteria

- Quant requests no longer depend on a single global `market` code.
- CLI commands can select `crypto|equity|bond` plus `ton|us|hk|cn`.
- Backend dataset artifacts include instrument, provider, interval, and annualization metadata.
- Factor and backtest handlers use normalized dataset metadata for annualization.
- HK and A-share flows resolve correctly through `data info` and preset surfaces.
- Existing TON default workflows continue to run without mandatory new flags.

## Verification Commands

- `bunx tsc -p apps/cli/tsconfig.json --noEmit`
- `bunx tsc -p apps/quant-backend/tsconfig.json --noEmit`
- `bun test apps/cli/tests/quant/backend/data.test.ts apps/cli/tests/quant/backend/factor.test.ts apps/cli/tests/quant/backend/preset.test.ts apps/cli/tests/quant/orchestrator.test.ts`
