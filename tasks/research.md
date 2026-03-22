# TonQuant — Research Notes

## Current Support-Command Data Sources

### STON.fi API (v1)

Base URL: `https://api.ston.fi/v1/`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/assets` | GET | Asset catalog with price fields |
| `/v1/pools` | GET | Pool catalog and reserves |
| `/v1/swap/simulate` | POST | Swap simulation |

Notes:
- Public endpoints, no auth required
- Good fit for Phase 0 support commands
- Not sufficient by itself as a complete quant dataset contract

### TonAPI (v2)

Base URL: `https://tonapi.io/v2/`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v2/accounts/{addr}` | GET | TON balance |
| `/v2/accounts/{addr}/jettons` | GET | Jetton balances |
| `/v2/accounts/{addr}/events` | GET | Transaction history |

Notes:
- Useful for wallet history and potentially deriving activity series
- Not a substitute for canonical OHLCV datasets

## comp-agent Quant Extraction Notes

Reference implementation inspected from `packages/quant` and `docs/quant-architecture.md`.

### Boundary to preserve

- `types/`: stable request/result schemas per quant domain
- `runner/`: quant CLI resolution, subprocess execution, artifact persistence, timeout/error handling
- `api/`: TypeScript entrypoints that validate requests before invoking the backend
- filesystem artifacts as the durable source of truth

### High-value APIs to mirror

- `runDataFetch`
- `runFactorList`
- `runFactorCompute`
- `runBacktest`
- `runSignalList`
- `runSignalEvaluate`
- `runPresetList`
- `runPresetShow`
- `initAutoresearchTrack`
- `runAutoresearchTrack`
- `getAutoresearchTrack`
- `listAutoresearchTracks`
- `promoteAutoresearchCandidate`
- `rejectAutoresearchCandidate`

### Schema families to mirror

- shared run metadata (`runId`, `status`, `summary`, `artifacts`)
- data-fetch request/result
- factor descriptors and compute request/result
- signal descriptors and evaluation request/result
- backtest request/result
- preset summary/detail
- autoresearch baseline, state, candidate, run summary, track summary, list/result

### Runner behavior to mirror

- create artifact dir before execution
- write `request.json` before invoking backend
- capture `stderr` into `run.log`
- parse typed `stdout` into `result.json`
- persist failure envelopes even when backend execution fails

### Artifact and state conventions to mirror

Single runs:

```text
quant/<domain>/<runId>/
  request.json
  result.json
  run.log
  <domain artifacts>
```

Autoresearch track state:

```text
quant/autoresearch/<trackId>/
  baseline.json
  state.json
  history.jsonl
  candidates/<candidateId>.json
```

Autoresearch execution artifacts:

```text
quant/autoresearch-runs/<runId>/
  request.json
  result.json
  run.log
```

## TON-Specific Gaps To Solve

- Define how TON OHLCV datasets are built and cached
- Decide how pool/liquidity series join price series for DEX-specific factors
- Normalize symbol/address resolution for datasets vs. live support commands
- Decide whether the first backend is:
  - a TypeScript placeholder
  - a Python CLI compatible with the new runner
- Determine testnet support posture for quant datasets
