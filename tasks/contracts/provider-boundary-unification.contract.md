# Contract: Provider Boundary Unification

## Goal

Make TonQuant's provider-selection behavior consistent across quant API modules, autoresearch lifecycle flows, presets, and backend handlers before the next provider phase.

## Deliverables

- Autoresearch API routed through the shared quant transport boundary
- Shared provider compatibility contract for supported market/provider combinations
- Consistent canonical instrument resolution across CLI, backend, and autoresearch baseline flows
- Regression tests covering success and rejection parity across API and backend surfaces

## Non-Goals

- Do not add a new provider.
- Do not restore `crypto + yfinance`.
- Do not change quant artifact directory layout.
- Do not alter factor/backtest strategy logic.

## Acceptance Criteria

- `quant/api/autoresearch` no longer bypasses the shared quant transport boundary.
- The same market/provider combination resolves or fails the same way in CLI API requests, backend handlers, autoresearch baselines, and presets.
- Existing supported flows (`stonfi` TON crypto, `yfinance` US equities, current HK/CN preset markets) continue to function.
- Unsupported combinations fail explicitly with stable errors rather than drifting by entrypoint.

## Verification Commands

- `bunx tsc -p apps/cli/tsconfig.json --noEmit`
- `bunx tsc -p apps/quant-backend/tsconfig.json --noEmit`
- targeted autoresearch, API, and backend quant tests
- `bash /Users/ancienttwo/.agents/skills/check/scripts/run-tests.sh`
