# TonQuant — Tech Stack

| Layer | Technology | Status | Rationale |
|-------|-----------|--------|-----------|
| Runtime | Bun | Current | Native TypeScript execution without a build step |
| Language | TypeScript (strict) | Current | Typed contracts for CLI and quant surfaces |
| CLI | Commander | Current | Existing command tree and future quant subcommands |
| Validation | Zod ^3.24 | Current | Runtime validation + inferred TS types |
| Support services | native `fetch()` + TON SDK | Current | Thin wrappers over STON.fi, TonAPI, and wallet SDK |
| Quant boundary | `src/quant/{types,api,runner}` | Current | Comp-agent-compatible contract layer for Phase 1 |
| Quant artifact storage | `~/.tonquant/quant/` | Current | Durable run/request/result/log ownership |
| Quant backend transport | JSON-over-stdio runner | Current | Stable interface regardless of backend implementation |
| Quant execution backend | Python CLI or equivalent | Planned Phase 1 | Keeps heavy quant execution isolated from TS orchestration |
| Terminal UI | chalk, cli-table3 | Current | Human-readable support-command output |
| Lint/Format | Biome | Current | Fast repo-wide formatting and linting |
| Testing | `bun:test` | Current | Native tests for TS contracts and CLI behavior |

## Planned Quant Runtime Notes

- The runner already assumes a backend resolved through:
  - `TONQUANT_QUANT_CLI`
  - `TONQUANT_QUANT_PYTHON_PROJECT`
  - local `quant-python/` fallback
- The first backend implementation is intentionally deferred.
- The TypeScript contract is landing first so datasets, artifacts, and command semantics stop drifting.
