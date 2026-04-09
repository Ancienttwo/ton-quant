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

## OpenAlice Borrow Review

Reference baseline:

- Repo: `https://github.com/TraderAlice/OpenAlice`
- Local mirror: `/Users/ancienttwo/Projects/ton/_ref/OpenAlice`
- Branch: `master`
- Commit: `f44c87886f566f7e607cc7cfae180ab239d284f2`

Compressed conclusions:

- Highest-value borrow for TonQuant is not broker support or chat UI. It is workflow rigor: tool bridge, append-only event log, cron/listener split, heartbeat-style monitoring, and page-based workbench architecture.
- TonQuant already has the product skeleton that matters: quant commands, factor registry, composition, alerts, reports, skill export, and a web marketplace demo. The main gap is durable long-running state, not missing commands.
- `OpenAlice`'s `ToolCenter` pattern is a strong reference for separating domain capability exposure from provider and CLI transport. TonQuant should expose existing registry/backtest/autoresearch capabilities through a stable agent-tool layer rather than letting Commander own that contract.
- `OpenAlice`'s event log plus cron engine is the strongest CLI-side borrowing target. TonQuant should treat scheduled autoresearch and alert evaluation as evented jobs with durable history, not ad hoc command reruns.
- `OpenAlice`'s guard pipeline is worth adapting for factor publish/promote flows. Borrow the idea of reusable pre-execution checks, not the trading-specific UTA machinery.
- `OpenAlice`'s frontend is useful as an architectural reference, not as a product template. TonQuant should borrow `api/ + pages/ + hooks/ + components/` separation and an events/monitoring surface, while avoiding a chat-first shell.

Now shortlist:

1. Add an append-only quant event log for backtests, autoresearch runs, alerts, publish/promote actions.
2. Add a cron engine plus listener split for recurring autoresearch and alert checks.
3. Add guard stages around factor publish/promote and other irreversible workflow transitions.
4. Add a thin agent-tool bridge over existing quant and registry services.
5. Replace placeholder `autoresearch init|status|list` behavior with durable track state.

Later shortlist:

1. Refactor `apps/web` into a workbench architecture with explicit API clients.
2. Add pages for event history, track monitoring, and alert history.
3. Add snapshot-style track monitoring visuals once background runs are durable.

Not recommended now:

1. Multi-broker UTA/trading account framework.
2. Trading-as-git as a literal execution metaphor.
3. Chat-first application shell.
4. Browser-native research as a core dependency.

## Post-Review Repair Notes (2026-04-09)

- Multi-market identity is not just `displaySymbol`; cache and persisted dataset boundaries must carry `assetClass + marketRegion + venue + provider`.
- Provider-aware request parsing must normalize supplied `instruments` as well as raw `symbols`, otherwise persisted baselines can silently downgrade back to synthetic behavior.
- Caller-controlled artifact ids such as `runId` and `trackId` need filesystem-safe validation before any `join(...)` into `quant/` paths.

## YFinance Coverage Notes (verified 2026-04-09)

- Yahoo Finance currently serves US equities, common HK tickers, and at least some A-shares.
- Verified live symbol pages:
  - `0700.HK`
  - `9988.HK`
  - `600519.SS`
  - `601318.SS`
  - `000001.SZ`
- Working symbol conventions to encode in provider normalization:
  - HKEX: `####.HK`
  - SSE: `######.SS`
  - SZSE: `######.SZ`
- Planning assumption for Phase 1: `yfinance` is acceptable as a free first provider for US/HK/CN where Yahoo exposes the symbol, but support must remain per-symbol rather than market-wide guaranteed.
