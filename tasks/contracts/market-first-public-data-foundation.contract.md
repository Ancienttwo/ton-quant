# Contract: Market-First Public Data Foundation

## Goal

Make generic crypto research start from trustworthy public market data instead of TON DEX symbol matches, while keeping TON-native wallet/pool/swap flows available under explicit TON semantics.

## Deliverables

- Shared non-TON crypto market contract expanded across CLI and quant-backend resolution layers
- Public market data providers for Binance and Hyperliquid quotes/candles with Zod-validated payloads
- Dedicated market-first schemas for quote, search, compare, and candles output with trust metadata
- Explicit `market` CLI namespace for market-first quote/search/compare/candles commands
- Legacy `price` command retained as TON-scoped behavior with clear guidance toward the new `market` path
- Request-keyed cache isolation for provider/venue/symbol/interval-scoped public data
- Regression tests covering the migration seam across CLI, core services, and shared market contract behavior

## Non-Goals

- Do not migrate `research` to market-first semantics in this phase.
- Do not add private API auth, balances, fills, or order execution for Binance or Hyperliquid.
- Do not add order book, trades, or depth-aware snapshots in this phase.
- Do not rewrite support commands onto the quant runner transport.
- Do not remove TON wallet, pool, swap, or trending flows.

## Acceptance Criteria

- Bare generic symbols such as `BTC` no longer resolve through TON asset symbols by default.
- `tonquant market ...` commands return deterministic provider-backed data with provenance and no silent fallback.
- Shared market contract changes apply consistently in both CLI and quant-backend resolution code.
- Legacy `tonquant price <symbol>` remains honest about TON scope and does not masquerade as the generic market-truth path.
- Provider payload errors, unsupported combinations, ambiguity, and cache identity all fail with stable structured errors.

## Verification Commands

- `bunx tsc -p apps/cli/tsconfig.json --noEmit`
- `bunx tsc -p apps/quant-backend/tsconfig.json --noEmit`
- `bunx tsc -p packages/core/tsconfig.json --noEmit`
- targeted core, CLI, and quant-backend market/provider tests
- `bun run lint`
- `bun run test`
