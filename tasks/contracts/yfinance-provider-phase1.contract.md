# Contract: YFinance Provider Phase 1

## Goal

Integrate `yfinance` as the first real quant market-data provider for `data fetch|info|list` while preserving the normalized dataset contract used by the rest of quant.

## Deliverables

- Backend-side Yahoo transport for historical OHLCV fetches
- Canonical Yahoo symbol normalization from `InstrumentRef`
- Provider-aware normalized dataset persistence for live `yfinance` fetches
- Accurate `data info` and `data list` behavior over cached `yfinance` datasets
- Regression tests for US, HK, and CN symbol formatting plus provider failure handling

## Non-Goals

- Do not add a second real provider.
- Do not thread live-provider transport into factor/backtest/autoresearch in this pass.
- Do not claim universal HK/CN coverage; only supported Yahoo symbols are in scope.
- Do not fix unrelated root-repo verification debt.

## Acceptance Criteria

- `tonquant data fetch --provider yfinance` writes normalized datasets backed by real Yahoo data.
- Cached dataset identity remains unique across `assetClass + marketRegion + venue + provider + symbol`.
- `tonquant data info` returns provider-accurate cached metadata for `yfinance` datasets.
- Unsupported Yahoo symbols fail explicitly without synthetic fallback.
- Existing synthetic workflows continue to function.

## Verification Commands

- `bunx tsc -p apps/cli/tsconfig.json --noEmit`
- `bunx tsc -p apps/quant-backend/tsconfig.json --noEmit`
- `bun test apps/cli/tests/quant/backend/data.test.ts apps/cli/tests/quant/orchestrator.test.ts`
- targeted Biome check on touched provider integration files
