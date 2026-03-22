# TonQuant — Architecture Decision Records

## ADR-001: Bun direct execution (no build step)

**Decision**: Use `#!/usr/bin/env bun` shebang, no build for development.
**Context**: Hackathon 3-day timeline. Bun natively runs TypeScript.
**Consequence**: `bun link` for global install. `build` script exists for future npm distribution.

## ADR-002: STON.fi over DeDust

**Decision**: Use STON.fi as sole DEX data source.
**Context**: STON.fi is TON's largest DEX with public API. DeDust has limited API docs.
**Consequence**: Single DEX dependency. Multi-DEX aggregation is out of scope (PRD section 13).

## ADR-003: Zod 3.24 over Zod 4

**Decision**: Use `zod@^3.24` instead of `zod@^4`.
**Context**: Zod 4 is newer but ecosystem type compatibility uncertain. Migration trivial.
**Consequence**: Stable ecosystem support. Can upgrade to v4 later with minimal changes.

## ADR-004: raw fetch() for HTTP APIs

**Decision**: Use native `fetch()` + Zod validation instead of HTTP client libraries.
**Context**: STON.fi has no official SDK. TonAPI is REST. Minimal dependencies preferred.
**Consequence**: Full control over response parsing. @ton/ton SDK only for tx signing (P1).

## ADR-005: Config file encryption

**Decision**: File permissions `0o600` + basic AES-256-GCM for mnemonic storage.
**Context**: Hackathon scope. Production would use system keychain.
**Consequence**: Baseline security. Config at `~/.tonquant/config.json`.

## ADR-006: Two-stage roadmap

**Decision**: Keep current TON DeFi commands as Phase 0 support tooling and move the product center to a Phase 1 quant-first CLI.
**Context**: The repo started as a lightweight market/wallet CLI, but the product goal is agent-driven quant research rather than another DEX info tool.
**Consequence**: Existing commands remain in scope, but new architecture and roadmap decisions optimize for `data -> factor -> backtest -> autoresearch`.

## ADR-007: comp-agent-compatible quant boundary

**Decision**: Rebuild the `comp-agent` quant boundary shape inside TonQuant instead of copying only algorithms or only CLI affordances.
**Context**: The valuable parts of `comp-agent` are the schemas, runner, typed APIs, and artifact/state ownership, not just the underlying math.
**Consequence**: TonQuant adds `src/quant/{types,api,runner}` as the Phase 1 contract surface.

## ADR-008: Quant artifacts and autoresearch state are source of truth

**Decision**: Quant runs write durable artifacts and state under `~/.tonquant/quant/`.
**Context**: Backtest and autoresearch workflows need reproducibility, inspection, and recovery semantics that direct support commands do not need.
**Consequence**: Single runs write `request.json`, `result.json`, and `run.log`; autoresearch tracks get dedicated baseline/state/history/candidate files.

## ADR-009: Keep support commands outside the quant runner

**Decision**: Do not force `price`, `balance`, `swap`, `history`, or lightweight `research` through the quant runner.
**Context**: These commands are fast live lookups or wallet utilities with different UX and data-shape needs from quant execution.
**Consequence**: TonQuant intentionally supports two execution surfaces: direct service-based support commands and runner-based quant workflows.
