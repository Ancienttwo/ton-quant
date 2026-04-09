# Plan: OpenBB Provider Phase 2

> **Slug**: openbb-provider-phase2
> **Status**: Completed
> **Approved By**: User chat approval on 2026-04-09

## Summary

Land `openbb` as the second real provider for quant `data fetch|info|list`, but only through an explicit external API boundary and only for HK/CN equities in this phase.

This phase also corrects the current false contract:

- `openbb` is already exposed in provider enums, canonical market defaults, and HK/CN presets
- backend data handling still treats non-`yfinance` providers as synthetic/provider-stubbed
- `bond/cn` currently defaults to `openbb` even though no live bond provider exists

The result should be boring and honest:

- zero-config defaults remain runnable
- `openbb` becomes a real opt-in provider instead of a placeholder name
- unsupported or unconfigured `openbb` flows fail explicitly instead of falling back to synthetic data

## Building

Add an `openbb` historical-data adapter behind the quant backend `data` boundary using an OpenBB-compatible HTTP API endpoint. The CLI keeps resolving canonical `InstrumentRef` values, the backend maps those into OpenBB request symbols, fetches historical bars, validates the response, and persists the existing normalized dataset document shape.

At the same time, tighten the canonical market contract so default provider selection no longer points to a non-zero-config provider. HK/CN equities should remain runnable out of the box, while `openbb` is available as an explicit override for users who have configured an OpenBB endpoint.

## Not Building

- Do not vendor Python OpenBB or OpenTypeBB into this repo.
- Do not add factor/backtest/autoresearch live-provider execution in this phase.
- Do not support `openbb` for TON crypto.
- Do not support `openbb` for `bond/cn` in this phase.
- Do not add OpenBB news, quotes, screening, or fundamentals.
- Do not redesign the normalized dataset schema or artifact layout again.
- Do not fix unrelated root-repo lint/typecheck debt.

## Scope Mode

**shape** — add a second real provider while holding the normalized dataset contract fixed and correcting provider defaults that currently overclaim support.

## Options Considered

### Option A: Contract correction only

- Summary: remove `openbb` from defaults/presets for now and reject it everywhere until a transport exists.
- Effort: small
- Pros:
  - closes the current honesty gap fastest
  - no new external dependency surface
- Cons:
  - does not deliver a second provider
  - leaves the existing `openbb` enum surface as dead weight

### Option B: Explicit `openbb-api` adapter plus honest defaults

- Summary: add an OpenBB-compatible HTTP adapter for HK/CN equities, make `openbb` opt-in, and move zero-config defaults back to runnable providers.
- Effort: medium
- Pros:
  - turns the existing `openbb` contract into a real provider path
  - avoids embedding a new runtime into the Bun monorepo
- Cons:
  - requires external API configuration
  - introduces one more transport and failure mode to test

### Option C: Embed OpenBB/OpenTypeBB in-process

- Summary: vendor Python OpenBB or a TypeScript port directly into TonQuant.
- Effort: large
- Pros:
  - no separate service boundary once fully built
  - maximum future control
- Cons:
  - new runtime and package-management burden
  - violates the project's boring-technology preference for this phase

## Recommendation

Choose **Option B**.

The current codebase already advertises `openbb`, so doing nothing but cleanup is too small. At the same time, embedding OpenBB in-process is the wrong trade: it adds a new runtime, a large dependency surface, and long-term maintenance debt before we have even stabilized the second provider seam.

The deformed version of Option B is the right one: `openbb` is real, but only through an external API boundary, only for HK/CN equities, and only as an explicit provider choice. Defaults and presets that must work without extra setup should not depend on it.

## Data Flow

```text
CLI command/API
  -> request-market normalization
  -> canonical InstrumentRef
  -> quant backend data handler
  -> openbb transport (HTTP)
  -> normalized dataset document
  -> provider-aware cache file
  -> data info/list consumers
```

## Key Decisions

- Integrate `openbb` through an external HTTP boundary, not an in-process Python or TypeScript port.
  Reason: the official OpenBB surface is already an API-serving Python stack; the Bun repo should consume it, not absorb it.

- Make `openbb` opt-in instead of the default provider for zero-config markets.
  Reason: unlike `yfinance`, `openbb` depends on an external service and possibly credentials, so it should not be the implicit path for runnable defaults.

- Limit Phase 2 live support to `equity/hk` and `equity/cn`.
  Reason: these are the existing gaps that motivated the second provider, and they already have canonical market definitions and presets.

- Remove false `openbb` defaults where no live support exists yet.
  Reason: `bond/cn` cannot keep defaulting to `openbb` if this phase does not implement bond transport.

- Preserve the normalized dataset document as the only storage contract.
  Reason: provider transport remains replaceable only if cache and downstream quant logic stay provider-agnostic.

- Fail explicitly on missing OpenBB configuration or provider-side no-data responses.
  Reason: synthetic fallback would again lie about provider coverage and poison the cache.

## Work Units

1. Add a repo-local OpenBB transport contract:
   endpoint URL, optional auth/credential header config, and stable CLI/backend error codes for misconfiguration.
2. Add backend historical OHLCV transport for `openbb` using an OpenBB-compatible HTTP API.
3. Normalize canonical HK/CN equity instruments into OpenBB request symbols and validate provider responses with Zod.
4. Route `data fetch|info|list` through the `openbb` adapter when `provider === "openbb"`, with no synthetic fallback.
5. Tighten provider compatibility and market defaults so:
   `openbb` is allowed only for `equity/hk` and `equity/cn` in this phase,
   HK/CN zero-config defaults stay runnable,
   `bond/cn` no longer defaults to unsupported live `openbb`.
6. Update presets so out-of-the-box demo presets use runnable defaults while any `openbb`-specific presets are explicit.
7. Add regression coverage for configured success, unconfigured failure, unsupported market/provider rejection, cache identity, and preset validity.

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| OpenBB endpoint setup becomes implicit tribal knowledge | High | make endpoint/auth config explicit in schema, docs, and error messages |
| `openbb` keeps meaning "maybe synthetic" somewhere in the stack | High | remove fallback behavior and tighten provider compatibility rules |
| Default HK/CN flows become environment-dependent | High | move defaults/presets that must run everywhere back to zero-config providers |
| OpenBB response shapes vary by server/provider configuration | Medium | validate all external responses with Zod and normalize once in the backend |
| Bond market contract remains overstated | Medium | explicitly exclude `bond/cn` from Phase 2 and change defaults accordingly |

## Dependencies

- an OpenBB-compatible HTTP API endpoint reachable from the quant backend
- provider configuration schema for endpoint/auth settings
- outbound network access from the quant backend process
- no in-repo Python runtime or OpenBB vendoring

## Verification Targets

- `bunx tsc -p apps/cli/tsconfig.json --noEmit`
- `bunx tsc -p apps/quant-backend/tsconfig.json --noEmit`
- targeted `data` + preset + request-market tests for `openbb`
- targeted Biome check on touched provider files
- `bash /Users/ancienttwo/.agents/skills/check/scripts/run-tests.sh`

## Confidence Check

- Problem understood: yes — the next provider phase must make `openbb` real without making default market flows depend on external setup.
- Simplest approach: yes — an explicit API-backed adapter is cheaper and safer than embedding OpenBB into the monorepo.
- Unknowns resolved or deferred: mostly — exact endpoint/auth shape depends on the chosen OpenBB-compatible server, but the transport boundary, scope, and failure contract are fixed.
