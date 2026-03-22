# TonQuant — Architecture

## Product Split

TonQuant now has two parallel but intentionally separate surfaces:

- **Support-command surface**: direct TON DeFi and wallet commands
- **Quant surface**: typed quant workflows with runner, artifacts, and durable state

This split is deliberate. The support commands remain thin CLI/service flows. The quant surface gets its own boundary so backtesting and autoresearch do not inherit ad hoc shapes from live market queries.

## Layer Map

```text
┌────────────────────────────────────────────────────────────────────┐
│ CLI Layer                                                         │
│ Support commands: price, pools, trending, init, balance, swap     │
│ Quant commands: data, factor, backtest, preset, autoresearch      │
├────────────────────────────────────────────────────────────────────┤
│ Support Services                                                  │
│ stonfi.ts | tonapi.ts | wallet.ts | config                        │
├────────────────────────────────────────────────────────────────────┤
│ Quant Boundary (`src/quant/`)                                     │
│ types/  -> stable request/result schemas                          │
│ api/    -> typed TS entrypoints                                   │
│ runner/ -> CLI resolution, spawning, artifact ownership           │
├────────────────────────────────────────────────────────────────────┤
│ Optional Quant Backend                                            │
│ planned Python or other backend, invoked via JSON-over-stdio      │
├────────────────────────────────────────────────────────────────────┤
│ Local Durable State                                               │
│ ~/.tonquant/config.json                                           │
│ ~/.tonquant/quant/<domain>/<runId>/...                            │
│ ~/.tonquant/quant/autoresearch/<trackId>/...                      │
├────────────────────────────────────────────────────────────────────┤
│ External Systems                                                  │
│ STON.fi HTTP | TonAPI HTTP | TON SDK | future quant backend       │
└────────────────────────────────────────────────────────────────────┘
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
Agent / future CLI implementation
  -> src/quant/api/*
  -> request schema parse
  -> invokeQuantCli()
  -> create artifact dir + write request.json
  -> runQuantCli()
  -> optional backend via stdio JSON
  -> parse typed stdout
  -> write result.json + run.log
  -> return typed result
```

Key ownership rules:

- `src/quant/types/` owns quant request/result contracts
- `src/quant/runner/` owns transport/runtime concerns
- `src/quant/api/` owns typed entrypoints and domain routing
- support commands do not become wrappers over the quant runner by default

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

## Key Decisions

See [decisions.md](/Users/ancienttwo/Projects/ton/docs/decisions.md) for the ADRs behind this split.
