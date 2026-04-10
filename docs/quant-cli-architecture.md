# TonQuant Quant CLI Architecture

## Purpose

This document is the runtime architecture reference for the TonQuant quant CLI.

The quant CLI is the multi-market research core of the product.
TON is the first strong execution, wallet, and factor-marketplace surface built around it, not the limit of the research runtime.

It explains how quant commands move through:

- Commander command entrypoints
- typed quant APIs
- runner and transport
- backend execution
- durable artifacts and track state
- core registry and event-log services

This document is intentionally narrower than `docs/architecture.md`.
`docs/architecture.md` stays at the product and system-overview level.

## Scope

In scope:

- `apps/cli` quant command surface
- `apps/cli/src/automation/*` control-plane runtime
- `apps/cli/src/quant/*` runtime boundary
- `apps/quant-backend` transport target
- `packages/core` stateful services used by quant and marketplace flows
- filesystem state under `~/.tonquant/`
- `--json` and human output contracts

Out of scope:

- web app architecture
- strategy math details
- remote registry API design
- production Python backend internals

## System Map

```text
+----------------------------------------------------------------------------------+
|                                  TonQuant CLI                                    |
+----------------------------------------------------------------------------------+
|                                                                                  |
|  Surface A: TON Support Commands                                                 |
|  price | pools | trending | init | balance | swap | history | research           |
|                                                                                  |
|  Surface B: Quant Commands                                                       |
|  data | factor | backtest | preset | autoresearch                                |
|                                                                                  |
|  Surface C: Factor Marketplace Commands                                          |
|  factor publish|discover|subscribe|top|compose|alert|report|skill-export         |
|                                                                                  |
|  Surface D: Automation Control Plane                                             |
|  automation schedule|list|status|pause|resume|remove|run-now | daemon            |
|                                                                                  |
+-----------------------------------+----------------------------------------------+
                                    |
                                    v
+----------------------------------------------------------------------------------+
|                               CLI Contract Layer                                 |
+----------------------------------------------------------------------------------+
| Commander command tree                                                           |
| Global flags: --json --testnet --config                                          |
| handleCommand()                                                                  |
|   -> success envelope: { status: "ok", data }                                    |
|   -> error envelope:   { status: "error", error, code }                          |
| Human mode delegates to chalk/table formatters                                   |
+--------------------------+-----------------------------------+-------------------+
                           |                                   |
                           v                                   v
+--------------------------------------------+   +--------------------------------+
|   Quant + Automation Boundary (`apps/cli`) |   |    Core Services (`packages`)  |
+--------------------------------------------+   +--------------------------------+
| types/          stable Zod contracts       |   | stonfi / tonapi / wallet       |
| automation/     scheduler runtime          |   | automation / registry / alerts |
| api/            typed entrypoints          |   | reports / compose / skill-exp. |
| runner/         process + artifacts        |   | event-log / file-store         |
| market/         multi-market instruments   |   | config + crypto + units        |
| autoresearch/   durable track lifecycle    |   |                                |
| orchestrator.ts data->factor->backtest     |   |                                |
+--------------------+-----------------------+   +---------------+----------------+
                     |                                           |
                     v                                           v
+--------------------------------------------+   +--------------------------------+
|      Quant Backend Transport Boundary      |   |         Local State Plane       |
+--------------------------------------------+   +--------------------------------+
| JSON-over-stdio                            |   | ~/.tonquant/config.json         |
| request on stdin                           |   | ~/.tonquant/automation/...      |
| typed result on stdout                     |   | ~/.tonquant/quant/...           |
| logs on stderr                             |   | ~/.tonquant/registry/...        |
+--------------------+-----------------------+   | ~/.tonquant/events.jsonl        |
                     |                           | ~/.tonquant/subscriptions.json  |
                     |                           +--------------------------------+
                     v
+----------------------------------------------------------------------------------+
|                     Current Backend: `apps/quant-backend`                         |
+----------------------------------------------------------------------------------+
| `bun run apps/quant-backend/src/cli.ts <subcommand...>`                          |
| routes: data fetch|list|info, factor list|compute, backtest run, preset list|show|
+----------------------------------------------------------------------------------+
```

## Repo Shape

```text
ton/
├── apps/
│   ├── cli/
│   │   └── src/
│   │       ├── index.ts                 # Commander entrypoint
│   │       ├── cli/                     # Command definitions
│   │       ├── automation/              # Control-plane runtime + handlers
│   │       ├── quant/
│   │       │   ├── api/                 # Typed quant APIs
│   │       │   ├── runner/              # Backend resolution, spawn, artifacts
│   │       │   ├── types/               # Zod request/result contracts
│   │       │   ├── autoresearch/        # Track persistence + review loop
│   │       │   ├── market/              # Instrument/provider mapping
│   │       │   └── orchestrator.ts      # Chained research flow
│   │       ├── types/cli.ts             # CLI envelope schema
│   │       └── utils/                   # output + human formatters
│   ├── quant-backend/
│   │   └── src/
│   │       ├── cli.ts                   # JSON-over-stdio backend entrypoint
│   │       ├── handlers/                # data/factor/backtest/preset handlers
│   │       └── market/                  # dataset generation + instruments
│   └── web/                             # separate surface, not in scope here
├── packages/
│   └── core/
│       └── src/
│           ├── services/                # automation, registry, alerts, reports...
│           ├── types/                   # config, automation, registry, event-log...
│           └── utils/                   # file-store, crypto, units
└── docs/
    ├── architecture.md                  # high-level system overview
    └── quant-cli-architecture.md        # this document
```

## Command Surfaces

TonQuant intentionally has four execution surfaces.

The first is TON-specific.
The second is designed to stay market-agnostic.
The third is where TON-first factor trading and distribution live today.
The fourth is the automation control plane for scheduled and manual background jobs.

### 1. Support commands

These are fast, direct CLI flows for TON live lookups and wallet utilities.

```text
User
  -> Commander command
  -> core service wrapper
  -> STON.fi / TonAPI / TON SDK
  -> Zod validation
  -> output formatter
  -> JSON envelope or human text
```

This path is optimized for:

- low latency
- simple side effects
- small result shapes
- human terminal usage

It is not the right place for artifact-heavy quant workflows.

### 2. Quant commands

These are runner-backed workflows with typed contracts and durable artifacts.
This is the reusable research plane that should survive any later repo split or execution-market expansion.

```text
User or Agent
  -> Commander quant subcommand
  -> quant api request parse
  -> create run context
  -> write request.json
  -> run backend over stdio
  -> parse stdout with Zod-backed result schema
  -> write result.json + run.log
  -> return typed result through CLI envelope
```

This path is optimized for:

- reproducibility
- durable run records
- typed agent consumption
- backend isolation
- eventual backend replacement

### 3. Marketplace and durable state commands

These flows use `packages/core` services and mutate local state under event-log protection.
Today this state plane is TON-first because factor publication, subscription, alerts, and live reporting are anchored there.

```text
User or Agent
  -> Commander marketplace command
  -> core service
  -> mutateWithEvent()
  -> atomic file writes + rollback snapshots
  -> append events.jsonl entry
  -> JSON envelope or human formatter
```

This path is optimized for:

- local-first registry behavior
- auditable changes
- recoverable mutations
- future remote sync without changing the CLI contract first

### 4. Automation control-plane commands

These flows schedule and execute background jobs through a dedicated automation state plane.

```text
Operator / Agent / Daemon
  -> Commander automation command or daemon loop
  -> automation runtime handler registry
  -> packages/core automation service
  -> job spec/state/history + lease claim/recovery
  -> typed domain handler
  -> immutable automation run artifacts
  -> audit event append
```

This path is optimized for:

- durable background work
- schedule and lease ownership
- recovery after interruption
- shared execution semantics between `run-now` and daemon-triggered runs

## Quant Boundary

`apps/cli/src/quant/` is the stable runtime seam for Phase 1.
It should be treated as the market-agnostic research kernel.

### `types/`

Owns stable request and result contracts for:

- data fetch/list/info
- factor list/compute
- signal list/evaluate
- backtest run
- preset list/show
- autoresearch lifecycle
- shared run metadata and artifact references

Rules:

- external payloads enter through schema validation
- result shapes stay stable even if backend implementation changes
- artifact references are part of the public result contract

### `api/`

Owns typed entrypoints such as:

- `runDataFetch`
- `runFactorCompute`
- `runBacktest`
- `runPresetShow`
- `initAutoresearchTrack`
- `runAutoresearchTrack`
- `promoteAutoresearchCandidate`

Role:

- parse public requests
- normalize run context
- call the runner or local lifecycle service
- return typed domain results to the CLI layer

The CLI layer should stay thin. Command files map flags to typed requests and hand off.

### `runner/`

Owns transport and artifact concerns:

- backend command resolution
- process spawning
- timeout handling
- stdout and stderr collection
- `request.json`, `result.json`, `run.log` persistence
- artifact discovery and merge

This separation matters because backend replacement should not leak into command definitions.

### `market/`

Owns symbol and instrument normalization:

- asset class
- market region
- venue
- provider
- display symbol
- provider symbol mapping
- trading calendar metadata

This keeps dataset and factor logic from hardcoding TON-only assumptions into every flow.
TON adapters belong here as one provider family, not as the definition of the whole model.

### `autoresearch/`

Owns durable research-track lifecycle:

- track initialization
- baseline persistence
- state persistence
- candidate generation
- promote and reject review loop
- history append
- artifact aggregation

This is intentionally not a thin wrapper over the backend runner. Tracks have longer-lived state than one-off runs.

### `orchestrator.ts`

Owns chained workflows such as:

```text
data fetch -> factor compute -> backtest run -> report
```

It is a composition layer, not a new transport layer.

## Quant Run Flow

### Standard quant run

```text
CLI command
  -> quant/api/*
  -> createRunContext(domain)
       -> runId
       -> artifactDir
  -> write artifactDir/request.json
  -> runQuantCli(subcommand, payload)
       -> resolveQuantCli()
       -> spawn backend
       -> send JSON payload on stdin
       -> collect stdout/stderr
  -> parse stdout JSON
  -> merge declared artifacts + discovered artifacts
  -> write artifactDir/result.json
  -> write artifactDir/run.log
  -> return typed result
```

### Failure path

```text
backend spawn failure
or timeout
or non-zero exit
or invalid stdout JSON
  -> write run.log with stderr/error text
  -> write result.json with failed status
  -> throw typed CLI-visible error
```

The important decision is that failed runs still leave a durable trail.

## Backend Resolution

The runner resolves the quant backend in descending priority:

```text
1. TONQUANT_QUANT_CLI
2. TONQUANT_QUANT_PYTHON_PROJECT
3. ./quant-python
4. ./apps/quant-backend/src/cli.ts
5. ./quant-backend/cli.ts
6. fail with QUANT_BACKEND_NOT_CONFIGURED
```

This means the current repository already ships a working Bun-based backend target, even though the long-term architecture leaves room for a Python backend later.

## Current Backend Contract

`apps/quant-backend/src/cli.ts` is the current transport target.

Contract:

- parent process passes subcommand via argv
- parent process passes JSON request via stdin
- backend writes result JSON to stdout
- backend writes diagnostics to stderr
- exit code drives runner success or failure

Current implemented routes:

- `data fetch`
- `data list`
- `data info`
- `factor list`
- `factor compute`
- `backtest run`
- `preset list`
- `preset show`

This backend is intentionally boring. It exists to stabilize the contract surface before heavier quant execution is introduced.

## Autoresearch Lifecycle

Autoresearch is not just "another run." It is a durable review loop.

```text
autoresearch init
  -> validate baseline request
  -> create track directory
  -> write baseline.json
  -> write state.json
  -> append history.jsonl
  -> append event-log entry

autoresearch run
  -> load baseline + state + candidates
  -> run orchestrator iteration(s)
  -> materialize candidate files
  -> update state counters and timestamps
  -> append history.jsonl
  -> append event-log entry

autoresearch promote|reject
  -> load track + candidate
  -> mutate baseline/state/candidate review status
  -> append history.jsonl
  -> append event-log entry
```

State model:

```text
track
  -> baseline.json      # current accepted baseline
  -> state.json         # counters, last run, status
  -> history.jsonl      # append-only lifecycle log
  -> candidates/*.json  # reviewable outputs from iterations
```

This design keeps one-off execution artifacts separate from long-lived track ownership.
The same track model should work whether the underlying data came from TON, equities, or another supported market.

## Core Services and State Plane

`packages/core` owns the local-first stateful services that should not be absorbed into the quant runner.

### Registry plane

Files:

- `~/.tonquant/registry/factors.json`
- `~/.tonquant/registry/factors/<id>/entry.json`
- `~/.tonquant/subscriptions.json`

Responsibilities:

- publish factor metadata
- discover and list factors
- subscribe and unsubscribe
- leaderboard reads
- private and public factor entry storage

### Event-log plane

File:

- `~/.tonquant/events.jsonl`

Responsibilities:

- append-only audit trail
- mutation lock ownership
- file snapshot and rollback boundary
- query and read APIs for timeline inspection

### Why this is separate from quant runner

The quant runner is for execution transport and run artifacts.
The core state plane is for durable product state and auditable mutations.
Merging them would blur two different failure domains:

- run failure
- state mutation failure

TonQuant is cleaner because those domains are separate.

This separation also makes repo extraction easier:

- the research runtime can be published as a cleaner open-source CLI core
- TON-specific registry and execution behavior can remain as adapters or companion packages

## Filesystem Layout

### Global root

```text
~/.tonquant/
├── config.json
├── events.jsonl
├── subscriptions.json
├── registry/
│   ├── factors.json
│   └── factors/
│       └── <factorId>/entry.json
└── quant/
    ├── data-fetch/<runId>/
    ├── factors/<runId>/
    ├── backtests/<runId>/
    ├── presets/<runId>/
    ├── signals/<runId>/
    ├── autoresearch/<trackId>/
    │   ├── baseline.json
    │   ├── state.json
    │   ├── history.jsonl
    │   └── candidates/<candidateId>.json
    └── autoresearch-runs/<runId>/
```

### Single-run artifact directory

```text
~/.tonquant/quant/<domain>/<runId>/
  request.json
  result.json
  run.log
  <domain-specific artifacts>
```

Directory ownership rules:

- runner owns run directories
- autoresearch service owns track directories
- core services own registry and event files

That ownership split keeps rollback and inspection straightforward.

## Output and Error Contract

### Success

```text
{ status: "ok", data }
```

### Error

```text
{ status: "error", error, code }
```

### Human mode

Human mode is not the public machine contract.
It is a presentation layer over the same typed result objects.

This means:

- agent consumers should use `--json`
- formatter churn should not affect API-level stability
- service errors must be translated into stable CLI error codes

## Extension Seams

The architecture deliberately preserves a few seams.

### Backend seam

The transport contract is JSON-over-stdio, not Bun-specific logic.
That allows:

- Python quant engines
- remote wrappers behind a local CLI bridge
- higher-cost research runtimes

without rewriting Commander command files.

### Registry seam

Registry is local-first today.
The CLI contract can stay stable while the storage backend evolves to:

- remote API sync
- signed factor publication
- marketplace billing metadata

### Scheduling seam

Alerts and autoresearch now execute through a standalone automation control plane.
Scheduling sits beside the current domain state, not inside command handlers:

- job intent/state/history live under `~/.tonquant/automation/`
- immutable run artifacts live under `~/.tonquant/quant/automation-runs/`
- domain truth stays in autoresearch track state, alert definitions, and platform state
- agents are callers, not the scheduler itself

## Explicit Non-Goals

This architecture is not trying to:

- force support commands through the quant runner
- turn every state mutation into a backend subprocess
- make the web app the source of truth
- commit to Python before the transport contract needs it
- hide durable state behind opaque caches
- equate the research core with TON-only market assumptions

## Operational Risks

```text
+--------------------------------+--------------------------------------+------------------+
| Risk                           | Why it matters                       | Current posture  |
+--------------------------------+--------------------------------------+------------------+
| Backend drift                  | CLI and backend contracts diverge    | typed API + docs |
| Artifact drift                 | runs become non-reproducible         | runner owns dirs |
| State/run boundary blur        | rollback becomes unsafe              | split ownership  |
| Formatter drift                | agents consume unstable text         | --json envelope  |
| Marketplace mutation failures  | local registry corruption            | event-log guard  |
| Scheduler/control-plane drift  | daemon path diverges from run-now    | shared runtime   |
+--------------------------------+--------------------------------------+------------------+
```

## Recommended Reading Order

For product context:

1. `docs/architecture.md`
2. `docs/PRD.md`

For runtime work:

1. `apps/cli/src/index.ts`
2. `apps/cli/src/quant/api/*`
3. `apps/cli/src/quant/runner/*`
4. `apps/cli/src/quant/autoresearch/service.ts`
5. `apps/quant-backend/src/cli.ts`
6. `packages/core/src/services/registry.ts`
7. `packages/core/src/services/event-log.ts`

## Bottom Line

TonQuant quant CLI is built around one sharp boundary:

```text
typed CLI contract
  -> typed quant API
  -> boring runner transport
  -> replaceable backend
  -> durable artifacts and state
```

That boundary is the point.
The product can evolve above it and the backend can evolve below it, without letting the command surface turn back into ad hoc scripts.
