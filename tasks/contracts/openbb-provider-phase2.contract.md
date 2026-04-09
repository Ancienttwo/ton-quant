# Contract: OpenBB Provider Phase 2

## Goal

Make `openbb` a real historical-data provider for HK/CN equities at the quant `data fetch|info|list` boundary without making zero-config defaults depend on an external service.

## Deliverables

- OpenBB-compatible HTTP transport for historical OHLCV behind the quant backend
- Explicit configuration contract for the OpenBB endpoint and auth/credential passthrough
- Provider compatibility tightened so `openbb` is only accepted for the markets supported in this phase
- Honest market defaults and presets that no longer point at unsupported live `openbb` paths
- Regression tests for configured success, unconfigured failure, unsupported combinations, and cache behavior

## Non-Goals

- Do not vendor Python OpenBB or OpenTypeBB into this repo.
- Do not add live-provider factor/backtest/autoresearch execution.
- Do not support TON crypto through `openbb`.
- Do not support `bond/cn` through `openbb` in this phase.
- Do not redesign the normalized dataset schema.

## Acceptance Criteria

- `provider=openbb` no longer routes to synthetic/provider-stubbed data for the markets supported in this phase.
- Missing or invalid OpenBB configuration fails with a stable structured error instead of synthetic fallback.
- `openbb` is rejected explicitly for unsupported market combinations in both CLI and backend resolution.
- HK/CN zero-config default flows remain runnable without requiring an OpenBB endpoint.
- Presets and canonical defaults describe the same real provider behavior.

## Verification Commands

- `bunx tsc -p apps/cli/tsconfig.json --noEmit`
- `bunx tsc -p apps/quant-backend/tsconfig.json --noEmit`
- targeted quant data, preset, and market-resolution tests for `openbb`
- `bash /Users/ancienttwo/.agents/skills/check/scripts/run-tests.sh`
