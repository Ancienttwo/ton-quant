# TonQuant — Architecture

## Read This First

This file is the high-level system overview.

For the quant CLI runtime architecture, read:

- [Quant CLI Architecture](./quant-cli-architecture.md)

## Product Split

TonQuant now has two parallel but intentionally separate surfaces:

- **Support-command surface**: direct TON DeFi and wallet commands
- **Quant surface**: typed multi-market research workflows with runner, artifacts, and durable state

This split is deliberate. The support commands remain thin CLI/service flows around TON usage. The quant surface is the reusable research core, so backtesting and autoresearch do not inherit ad hoc shapes from live market queries or TON-specific execution concerns.

## Layer Map

```text
+----------------------------------------------------------------------------------+
|                                   CLI Layer                                      |
| support commands | quant commands | factor marketplace commands                  |
+-----------------------------------+----------------------------------------------+
                                    |
                                    v
+-----------------------------------+----------------------------------------------+
|                             Execution Surfaces                                   |
+-----------------------------------+----------------------------------------------+
| Support path                      | Quant path                                   |
| CLI -> core service -> API/SDK    | CLI -> quant api -> runner -> backend        |
+-----------------------------------+----------------------------------------------+
                                    |
                                    v
+-----------------------------------+----------------------------------------------+
|                               State Plane                                        |
+-----------------------------------+----------------------------------------------+
| ~/.tonquant/config.json                                                       |
| ~/.tonquant/quant/<domain>/<runId>/...                                        |
| ~/.tonquant/quant/autoresearch/<trackId>/...                                  |
| ~/.tonquant/registry/...                                                      |
| ~/.tonquant/events.jsonl                                                      |
+-----------------------------------+----------------------------------------------+
                                    |
                                    v
+----------------------------------------------------------------------------------+
|                               External Systems                                   |
| STON.fi HTTP | TonAPI HTTP | TON SDK | current quant backend | future backends  |
+----------------------------------------------------------------------------------+
```

## Support Command Flow

```text
User/Agent
  -> CLI command
  -> service wrapper
  -> external API / SDK
  -> Zod validation
  -> output.ts
  -> JSON envelope or human output
```

This path is intentionally simple and remains the right fit for:

- price lookups
- pool inspection
- wallet balance
- swap simulation
- lightweight market summary

## Quant Flow

```text
Agent / CLI
  -> src/quant/api/*
  -> request schema parse
  -> invokeQuantCli()
  -> create artifact dir + write request.json
  -> runQuantCli()
  -> backend via stdio JSON
  -> parse typed stdout
  -> write result.json + run.log
  -> return typed result
```

This quant path is the market-agnostic research runtime.
TON is the first strong execution and marketplace surface layered around it, not the only target market.

Current backend target:

- `apps/quant-backend/src/cli.ts` via `bun run`

Future backend targets remain allowed through the same transport boundary:

- Python CLI via `TONQUANT_QUANT_PYTHON_PROJECT`
- explicit override via `TONQUANT_QUANT_CLI`

Key ownership rules:

- `src/quant/types/` owns quant request/result contracts
- `src/quant/runner/` owns transport/runtime concerns
- `src/quant/api/` owns typed entrypoints and domain routing
- support commands do not become wrappers over the quant runner by default
- `packages/core/src/services/` owns registry, alerts, reports, and event-log state transitions

## Artifact And State Layout

Single-run artifacts:

```text
~/.tonquant/quant/<domain>/<runId>/
  request.json
  result.json
  run.log
  <domain artifacts>
```

Autoresearch state:

```text
~/.tonquant/quant/autoresearch/<trackId>/
  baseline.json
  state.json
  history.jsonl
  candidates/
    <candidateId>.json
```

Autoresearch run artifacts:

```text
~/.tonquant/quant/autoresearch-runs/<runId>/
  request.json
  result.json
  run.log
```

## Why Quant Is Isolated

- Quant workflows need stable contracts across data fetch, factor, backtest, and autoresearch.
- These workflows produce durable files and long-lived state, not just a one-shot CLI response.
- Live support commands optimize for immediacy and human readability; quant workflows optimize for reproducibility and agent orchestration.
- Marketplace mutations need auditability and rollback boundaries, which live in `packages/core` rather than inside the quant runner.

## Key Decisions

See [decisions.md](/Users/ancienttwo/Projects/ton/docs/decisions.md) for the ADRs behind this split.
