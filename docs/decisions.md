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
