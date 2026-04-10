# Plan: Market-First Public Data Foundation

> **Slug**: market-first-public-data-foundation
> **Status**: Reviewed
> **Branch**: codex/market-first-research-cli

## Summary

Reposition TonQuant's research entrypoint around deep, public, market-first data instead of TON pool snapshots.

This phase fixes the current false contract:

- `price BTC` looks like a global market query but actually resolves against TON DEX symbols
- support commands treat STON pool data as the default truth source for generic crypto symbols
- quant is already multi-market in structure, but the user-facing quick path still nudges research toward shallow TON liquidity

The new contract should be explicit and boring:

- generic crypto research uses high-liquidity public market providers first
- TON pool data remains available, but only through explicitly TON-scoped commands
- public quote and candle data do not require user API keys
- symbol resolution stops pretending that a bare token symbol is globally unique
- the new market front door helps users resolve ambiguity and evaluate trust, instead of only rejecting bad input

## Building

Build the minimum honest market-first research foundation:

1. add a public market-data provider layer for normalized quotes and OHLCV
2. add first real crypto providers for deep public markets:
   - Binance public market data
   - Hyperliquid public market data
3. add canonical instrument resolution for support-style market lookups so generic crypto symbols are market-aware instead of TON-symbol-first
4. introduce a market-first command surface for generic research entrypoints
5. keep TON pool, swap, and wallet flows available, but make them explicitly TON-scoped instead of the default answer for generic symbols

## Not Building

- no user API import for this phase
- no private account, balances, fills, or order execution against Binance or Hyperliquid
- no smart multi-provider consensus engine or VWAP aggregation layer yet
- no order book or trade-stream ingestion yet
- no rebuild of the quant runner transport
- no removal of TON wallet, pool, or swap commands
- no full rewrite of `research` into a cross-market report in this phase
- no order book or trade-depth ingestion in this phase

## Scope Mode

**shape** — fix the product's top-level research truth source with the smallest change that stops generic crypto lookups from flowing through shallow TON pool data.

## Options Considered

### Option A: Patch `price` only

- Summary: keep the current support surface and only special-case symbol ambiguity for `price`.
- Effort: small
- Pros:
  - minimal code churn
  - fastest way to stop `BTC -> random TON jetton`
- Cons:
  - leaves no honest market-first foundation for future research commands
  - keeps STON-centric architecture in the user-facing path

### Option B: Add a public-data foundation and narrow the old TON defaults

- Summary: add normalized public quote/OHLCV providers, move generic crypto research onto them, and make TON-specific flows explicit.
- Effort: medium
- Pros:
  - solves the correctness issue at the contract level
  - creates a reusable base for later factor, research, and backtest expansion
  - keeps private API auth out of the initial research path
- Cons:
  - adds a second support-side data architecture alongside existing TON services
  - requires clear command semantics to avoid a half-migrated UX

### Option C: Rewrite all support commands onto the quant runner

- Summary: collapse support commands into one runner-backed multi-market architecture immediately.
- Effort: large
- Pros:
  - one long-term execution model
  - no parallel support-vs-quant semantics
- Cons:
  - too much structural change for the immediate correctness problem
  - high blast radius across wallet and TON utility flows that are not broken

## Recommendation

Choose **Option B**.

Option A is too local: it fixes one symptom while leaving the product's default research posture pointed at shallow TON DEX data. Option C spends an innovation token on a larger rewrite before the market-first contract has even been validated. Option B is the smallest honest shift: build a reusable public-data foundation, move generic crypto lookups onto it, and leave TON-native commands available where TON-native semantics still make sense.

## Data Flow

```text
User / Agent
  -> market-aware command input
  -> canonical instrument resolution
  -> provider-specific symbol mapping
  -> public market data adapter
  -> normalized quote / candle schema
  -> CLI JSON envelope or human formatter
```

```text
Generic crypto lookup
  -> Binance public OR Hyperliquid public
  -> normalized instrument snapshot

TON-native liquidity lookup
  -> explicit TON-scoped command
  -> STON.fi / TON APIs
  -> pool / wallet / swap semantics
```

## Key Decisions

- Bare symbols must stop resolving through TON DEX assets by default.
  Reason: generic symbols like `BTC` and `ETH` are not globally unique, and TON jetton symbol collisions are guaranteed.

- Public research data should not require user credentials in v1.
  Reason: quote and historical market data are read-only surfaces and should be usable out of the box.

- Binance and Hyperliquid are the first public crypto providers.
  Reason: they offer deeper markets than TON DEX pools and give two independent public data sources without requiring private account setup.

- Non-TON public crypto markets should extend the existing quant market model instead of introducing a parallel support-market identity.
  Reason: symbol normalization, provider compatibility, and canonical instrument identity already exist in quant; duplicating them in support would create two drifting market contracts.

- Extending the shared market model means updating both CLI-side and quant-backend-side market contracts in the same phase.
  Reason: today both layers hard-code crypto as TON-only, so a support-only shim would recreate the split-brain architecture this plan is trying to remove.

- Generic crypto lookups must use one deterministic default provider and always return provenance.
  Reason: investment research needs stable, traceable quote semantics; silent cross-provider fallback would create unreviewable drift.

- The first migration should ship through a new explicit market-first command path while the old `price` command becomes a clearly labeled TON-scoped legacy path.
  Reason: that fixes correctness without silently breaking existing TON-oriented users in the same step.

- Market-first quote/search/compare/history outputs should use new normalized schemas instead of mutating the existing TON `PriceData` contract.
  Reason: legacy TON price data encodes token-contract semantics such as address and decimals, while the new market-first surface needs quote provenance, observed time, and staleness semantics.

- The new generic market front door should live under an explicit `market` command namespace.
  Reason: a dedicated namespace makes the boundary between market-truth research commands and TON-native wallet/pool/swap flows obvious in help text, errors, and habit formation.

- The market-first front door should help users recover from ambiguity instead of only failing fast.
  Reason: rejecting `BTC` collisions is correct, but a research shell becomes much more useful when it can immediately suggest valid market instruments.

- The first market surface should include explicit trust signals in default output.
  Reason: provider name, observed time, age, and symbol mapping are part of the meaning of a quote, not optional debugging details.

- TON commands remain, but their semantics become explicit.
  Reason: TON wallet, pool, and swap flows are still useful, but they should no longer masquerade as the general crypto research path.

- Normalized quote and candle contracts should live above provider adapters.
  Reason: later research, ranking, and factor flows should consume one typed shape, not provider-specific payloads.

- `research` stays out of scope for the first migration.
  Reason: it currently bakes in TON-specific pool/liquidity semantics, so forcing it into the first phase would mix structural and behavioral changes.

## Work Units

1. Extend the existing quant market identity model for non-TON public crypto markets across both CLI and quant-backend shared contracts instead of creating a parallel support-market contract layer.
2. Add a provider capability layer for public crypto market data, including explicit provider codes, venue codes, market compatibility rules, and non-TON crypto defaults where appropriate.
3. Implement Binance public quote/candle transport with provider-specific symbol normalization, stable error mapping, and normalized provenance fields.
4. Implement Hyperliquid public quote/candle transport with provider-specific symbol normalization, stable error mapping, and normalized provenance fields.
5. Add a market resolver that reuses the widened shared instrument identity and rejects ambiguous generic crypto input unless the market or provider is explicit.
6. Introduce a new explicit `market` command path for generic quotes and history without requiring user API keys.
7. Define one deterministic default public provider for generic crypto lookups; return provider/venue/symbol provenance in every result and require explicit `--provider` for overrides instead of silent fallback.
8. Add `market search` or equivalent disambiguation support so ambiguous symbols can return actionable candidate instruments instead of only hard failures.
9. Add `market compare` so users can inspect the same canonical symbol across Binance and Hyperliquid with explicit delta/spread and provenance.
10. Keep `price` as a clearly labeled TON-scoped legacy command in this phase, with help and error messaging that points generic crypto users to the new market-first command path.
11. Add request-keyed caching for the new public-data path using at least provider, venue, canonical symbol, and interval; keep it separate from the existing STON asset/pool caches.
12. Introduce dedicated market-first quote/search/compare/history schemas and make human and JSON output display trust metadata by default for market quotes and comparisons: provider, venue, provider symbol, observed-at, and age/staleness.
13. Narrow existing TON support commands so pool/liquidity/swap behavior stays TON-explicit instead of being implied by generic symbols.
14. Add full migration-seam regression coverage for explicit market resolution, provider success/failure, symbol ambiguity rejection, search suggestions, compare output, trust metadata, normalized output contracts, legacy/new command help text, request-keyed cache behavior, and shared contract/provider-compatibility regressions across both CLI and quant-backend paths.

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Generic command semantics become confusing during migration | High | make TON-vs-market-first command boundaries explicit in help text and errors |
| Provider payloads drift or differ in subtle ways | High | validate all external data through provider-local Zod schemas and normalize once |
| One public provider rate-limits or degrades | Medium | keep providers independent and let commands fail clearly instead of silently falling back |
| Instrument identity becomes duplicated between support and quant paths | High | extend and reuse the existing quant market concepts instead of inventing a second identity model |
| Silent provider switching makes quote results non-deterministic | High | require one default truth source, include provenance in output, and fail clearly when that source is unavailable |
| New provider caching returns stale or cross-provider data | High | use request-keyed cache entries for public quote/history data and keep them isolated from STON caches |
| Compare/search features sprawl into a full research product rewrite | Medium | limit them to quote trust, symbol recovery, and source comparison; keep `research` and depth flows out of scope |
| Scope expands from quote/history into full cross-market research in one step | Medium | keep `research`, order books, and private account surfaces explicitly out of scope |

## Dependencies

- public HTTP access to Binance market data
- public HTTP or WebSocket access to Hyperliquid market data
- existing quant market identity types and provider compatibility concepts, extended for non-TON public crypto venues
- existing quant-backend market identity modules, extended in lockstep with CLI-side market contracts
- CLI output envelope patterns already in `apps/cli/src/utils/output.ts`

## Verification Targets

- `bun run typecheck`
- `bun run lint`
- targeted support command tests for market-first quotes/history
- targeted provider adapter tests with mocked external responses
- targeted quant market resolver tests if shared identity logic is reused
- `bun run test`

## Confidence Check

- Problem understood: yes — the broken promise is not just symbol ambiguity, it is that the product's default research path uses the wrong class of market data.
- Simplest approach: yes — add one public-data foundation and narrow TON defaults instead of rewriting the whole CLI.
- Unknowns resolved or deferred: mostly — exact Binance/Hyperliquid endpoint selection is still implementation work, but the contract, shared-model expansion, schema split, command namespace, and migration boundary are now explicit.
