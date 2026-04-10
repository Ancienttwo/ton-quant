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
- Phase 1 contract correction: treat `yfinance` as equities-only. Do not infer Yahoo crypto support from slash-form TON pairs such as `TON/USDT`; explicit ticker mapping is required before crypto can be supported safely.
- Planning assumption for Phase 1: `yfinance` is acceptable as a free first provider for US/HK/CN equities where Yahoo exposes the symbol, but support must remain per-symbol rather than market-wide guaranteed.

## Provider Boundary Notes (2026-04-09)

- `quant/api/autoresearch.ts` currently calls lifecycle services directly instead of using the shared `invokeQuantCli` transport boundary used by `data`, `factor`, and `backtest`.
- Provider compatibility is enforced in both the CLI market resolver and the backend market resolver, while autoresearch baseline construction separately derives provider defaults and instruments.
- The next structural risk is not missing provider coverage; it is semantic drift between entrypoints that all claim to accept the same `assetClass + marketRegion + venue + provider` contract.
- Implementation outcome: autoresearch API now writes request/result/log artifacts under `quant/autoresearch-runs/<runId>/` while preserving durable track state under `quant/autoresearch/<trackId>/`.
- Implementation outcome: provider compatibility is now enforced as an explicit contract module in both CLI and backend market layers, and autoresearch baseline reload revalidates persisted provider selections through the same canonical instrument path.

## OpenBB Phase 2 Notes (2026-04-09)

- TonQuant already exposes `openbb` as a provider enum value, a default provider for `equity/hk`, `equity/cn`, and `bond/cn`, and as the provider on HK/CN presets.
- Current backend data handling only has a live transport for `yfinance`; non-`yfinance` providers still resolve to synthetic/provider-stubbed datasets.
- That means `openbb` is currently a false contract at the storage boundary: the provider name is real, but the `data fetch|info|list` behavior behind it is not.
- `bond/cn` is the sharpest example of the problem because it defaults to `openbb` even though there is no live bond provider transport or preset demand yet.
- OpenBB's practical integration surface is an external API/service boundary, not an in-repo Bun-native library. TonQuant should consume that boundary instead of absorbing a Python runtime or vendoring a large TypeScript port.
- The right Phase 2 posture is:
  - make `openbb` a real opt-in provider for HK/CN equities
  - keep zero-config defaults runnable without OpenBB setup
  - fail explicitly on missing OpenBB configuration or unsupported market combinations
- Implementation outcome:
  - `openbb` now has a real backend historical-data adapter for `equity/hk` and `equity/cn`
  - configuration contract is environment-based:
    - `TONQUANT_OPENBB_API_URL` required
    - `TONQUANT_OPENBB_API_USERNAME` + `TONQUANT_OPENBB_API_PASSWORD` optional basic auth pair
    - `TONQUANT_OPENBB_CREDENTIALS_JSON` optional passthrough for `X-OpenBB-Credentials`
    - `TONQUANT_OPENBB_SOURCE_PROVIDER` optional passthrough for the upstream OpenBB provider query
  - API failures now preserve stable service codes such as `QUANT_OPENBB_CONFIG_MISSING`, `QUANT_OPENBB_CONFIG_INVALID`, `QUANT_OPENBB_HTTP_ERROR`, `QUANT_OPENBB_NO_DATA`, and `QUANT_OPENBB_INTERVAL_UNSUPPORTED`
  - `openbb` is explicitly limited to daily (`1d`) bars in this phase; intraday support is rejected rather than guessed
  - HK/CN zero-config defaults and presets now point back to `yfinance`, while `bond/cn` defaults back to `synthetic`
  - backend-coded errors now cross the CLI boundary through a dedicated structured stderr marker instead of regex-scraping human log lines
  - OpenBB HTTP error details are whitespace-compacted before being surfaced, so remote response text cannot inject extra log lines into the coded-error path
  - credential-bearing OpenBB requests are refused over non-HTTPS transport unless the target is loopback (`localhost`, `127.0.0.1`, `::1`)

## Repo Baseline Cleanup Notes (verified 2026-04-09)

- Full root verification is now blocked by a small fixed set of pre-existing failures rather than broad unknown repo drift.
- `bun typecheck` currently fails only in `packages/core/tests/services/skill-export.test.ts`:
  - one `number | undefined` to `number | bigint` mismatch in a `toBeGreaterThanOrEqual(...)` assertion path
  - multiple `'skill' is possibly 'undefined'` strict-null errors after indexing `skills[0]`
- `bun lint` currently fails in these verified `apps/web` files:
  - `src/App.tsx` — import ordering
  - `src/components/BacktestViewer.tsx` — import ordering and hook dependency correctness
  - `src/components/FactorDetailModal.tsx` — import ordering, non-semantic click targets, missing button types
  - `src/components/Leaderboard.tsx` — import ordering, missing button types, sortable header semantics
  - `src/components/MarketplaceSection.tsx` — import ordering
  - `src/components/TerminalDemo.tsx` — hook dependency correctness
- The right cleanup posture is narrow:
  - restore full `bun typecheck`
  - restore full `bun lint`
  - avoid turning the cleanup into frontend redesign or unrelated refactoring
- Implementation outcome:
  - `packages/core/tests/services/skill-export.test.ts` is now strict-null-safe without weakening production contracts
  - the known `apps/web` blocker set is lint-clean after import ordering, hook dependency, and semantic button fixes
  - modal backdrop closing now uses a dedicated backdrop button rather than an interactive static container
  - root verification is green again through the repo-defined scripts:
    - `bun run typecheck`
    - `bun run lint`
    - `bun run test`
- Important repo detail:
  - bare `bun test` from the repo root bypasses the package-script `_ref/**` ignore pattern and will sweep the OpenAlice mirror into the run
  - the authoritative root verification command for this repo is `bun run test`, not raw `bun test`

## npm Packaging Notes (researched 2026-04-09)

- Current packaging blockers are structural, not code-quality blockers:
  - `apps/cli/package.json` publishes `bin` from source and depends on `@tonquant/core` via `workspace:*`
  - quant backend discovery is monorepo-relative today, so a global npm install will not find the backend
- Official npm package metadata docs confirm the publish surface is controlled by `name`, `version`, `bin`, `files`, and optional bundled dependency fields.
- Official Bun bundler docs confirm Bun-target bundles are the right fit for shipping JS artifacts that still require Bun at runtime.
- Official Bun executable docs confirm compiled standalone executables are target-platform specific, which makes them a poor primary vehicle for a cross-platform npm package.
- Packaging recommendation:
  - publish one `tonquant` package first
  - bundle CLI and backend into package-local artifacts
  - keep Bun as an explicit runtime requirement
  - preserve the current agent contract where OpenClaw or another agent can run `tonquant` directly after install
  - defer multi-package publishing and native executables to later phases

## npm Packaging Implementation Notes (verified 2026-04-09)

- `apps/cli` now builds two Bun-targeted artifacts into `dist/`:
  - `dist/index.js`
  - `dist/quant-backend.js`
- The publish surface now points `bin.tonquant` at `./dist/index.js` and limits package files to the bundled runtime artifacts plus package README.
- Source-only dependencies, including `@tonquant/core`, now stay out of runtime `dependencies`; the installed package no longer requires npm to understand workspace runtime edges.
- Quant backend resolution now uses an explicit search order:
  - `TONQUANT_QUANT_CLI`
  - `TONQUANT_QUANT_PYTHON_PROJECT`
  - packaged `quant-backend.js` adjacent to the installed CLI entrypoint
  - source-monorepo fallbacks for local development
- Packaging verification now has a scripted smoke path:
  - build artifacts
  - `npm pack --ignore-scripts` with a temp npm cache
  - inspect packed `package.json`
  - clean temp install of the tarball
  - run `tonquant --help`, `tonquant price --help`, and `tonquant data list --json`
  - run direct `tonquant ...` invocation from an arbitrary cwd with `node_modules/.bin` on `PATH`
- Sandbox verification note:
  - raw `bun run test` in this Codex sandbox still inherits an unwritable real home directory, so repo-wide test verification here must set `HOME` to a temp directory before running the root script

## Wallet Publish Platform Notes (researched 2026-04-09)

- The current factor marketplace is still local-only:
  - local factor metadata lives in `packages/core/src/types/factor-registry.ts`
  - local factor state mutations live in `packages/core/src/services/registry.ts`
  - audit semantics already exist in `packages/core/src/services/event-log.ts`
- The right reuse boundary is not "extend local `factor publish` until it becomes a platform".
  - local registry should remain the publish-preparation source
  - platform publication needs its own state source for nonce, ownership, review, ledger, and settlement
- Existing TON capability already covers the hard cryptographic prerequisites:
  - `@ton/crypto` and `@ton/ton` are present in `packages/core`
  - `packages/core/src/services/wallet.ts` already derives wallet addresses via `WalletContractV5R1`
- TonConnect `signData` is a viable off-chain publish-signing primitive.
  - official SDK docs expose `signData`
  - official protocol docs define the backend-verifiable signature payload for text, binary, and cell data
  - the DApp must explicitly set signer address and network to avoid wallet-side ambiguity
- Structural correction to the original plan:
  - a happy-path agent publisher flow requires a signer surface
  - the repo has no current TonConnect-capable surface, so a minimal signer page must ship in the same phase
- Settlement correction to the original plan:
  - v1 should support native TON only
  - batch submission should keep a submission reference / message hash first and reconcile chain transaction status asynchronously rather than assuming synchronous `txHash` availability
- Review correction to the original plan:
  - `pending_review` is only a real state if the same phase ships an explicit approve/reject path with persisted reasons
