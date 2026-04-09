# OpenAlice Borrow Review for TonQuant

Date: 2026-04-09

Reference baseline:

- Repo: `https://github.com/TraderAlice/OpenAlice`
- Local mirror: `/Users/ancienttwo/Projects/ton/_ref/OpenAlice`
- Branch: `master`
- Commit: `f44c87886f566f7e607cc7cfae180ab239d284f2`

## Executive Summary

`OpenAlice` is not a model for TonQuant's product surface. It is a model for TonQuant's control plane.

Its strongest ideas are not broker breadth or chat UI. The high-value pieces are:

1. A clean split between domain logic and AI tool exposure.
2. Durable append-only state for long-running agent workflows.
3. A scheduler and notification loop that turns one-shot commands into persistent research operations.
4. A workstation-style frontend where pages are backed by explicit API modules instead of static demo state.

For TonQuant, the right borrowing posture is:

- borrow orchestration and state patterns aggressively for the CLI and quant loop
- borrow frontend architecture patterns selectively to evolve `apps/web` from demo to workbench
- avoid borrowing multi-broker trading abstractions, UTA semantics, and chat-first UX as the primary product shape

## TonQuant Current Baseline

TonQuant already has meaningful product skeletons that make this comparison actionable rather than speculative:

- Quant CLI surface exists: `data`, `factor`, `backtest`, `preset`, `autoresearch`
- Marketplace primitives exist: registry, leaderboard, composition, alerts, reports, skill export
- Local-first storage already exists under `~/.tonquant/` and `~/.tonquant/quant/`
- Web already has a factor marketplace demo in `apps/web`, including leaderboard, factor detail, and backtest viewer

The main weakness today is not missing commands. It is missing long-lived workflow infrastructure:

- `autoresearch` is still mostly a single-run wrapper, not a durable track manager
- registry and composition state are file-based but not evented or auditable
- the web app is presentation-first, not operations-first
- agent-facing capabilities are exposed as command groups and services, but not yet through a distinct tool bridge layer

## Capability Review

### 1. Agent orchestration and tool bridge

| Capability | What OpenAlice solves | TonQuant current state | Rating | Target | Borrow mode |
|---|---|---|---|---|---|
| `ToolCenter` unified registry | Registers domain capabilities once and exports them to providers and MCP without provider-specific reach-through | TonQuant has service exports and CLI command registration, but no dedicated agent tool registry boundary | High | CLI | Needs adaptation |
| `AgentCenter` + provider router | Keeps AI provider switching separate from domain logic and tool definitions | TonQuant is agent-native at the CLI contract level, but not yet structured as provider-agnostic agent orchestration | Medium | CLI | Needs adaptation |
| Connector center | Separates delivery channel logic from agent execution | TonQuant does not yet have multi-channel delivery needs | Low | CLI | Not recommended now |
| Session store / compaction | Gives long-running agent contexts durable session semantics | TonQuant has quant artifacts, but not conversational or iterative research session state | Medium | Both | Needs adaptation |

Why this matters for TonQuant:

- TonQuant's differentiator is not "has commands," it is "can be consumed by agents predictably."
- A tool bridge layer would let TonQuant expose registry, backtest, alerts, and autoresearch as reusable agent capabilities without binding that contract to Commander handlers.

Minimum TonQuant cut:

- Add a thin `packages/core` or `apps/cli` agent-tool registry that wraps existing services and quant APIs.
- Keep CLI command handlers as one consumer of that layer, not the owner of business semantics.

### 2. Trading boundary and durable execution state

| Capability | What OpenAlice solves | TonQuant current state | Rating | Target | Borrow mode |
|---|---|---|---|---|---|
| UTA boundary | Forces AI and UI to touch one business entity instead of raw broker APIs | TonQuant has no direct multi-broker trading core and should not invent one now | Low | CLI | Not recommended |
| Trading-as-Git | Turns staged intent, approval, execution, and history into inspectable state transitions | TonQuant has artifacts for quant runs, but not a generalized staged workflow for promotion, validation, or deployment of factors | Medium | CLI | Directly reuse the idea, not the trading model |
| Guard pipeline | Runs pre-execution checks before irreversible actions | TonQuant has alerts and backtest validation, but no reusable pre-publish or pre-promote guard stage | High | CLI | Needs adaptation |
| Snapshot / equity curve model | Treats periodic state capture as a first-class primitive | TonQuant has backtest result artifacts, but not periodic snapshots for autoresearch or live factor monitoring | Medium | Both | Needs adaptation |

What is worth borrowing:

- the concept of explicit state transitions before promotion or execution
- reusable guards before `factor publish`, `factor promote`, or future alert-triggered actions
- snapshotting for long-lived tracks, not for brokerage accounts

What is not worth borrowing:

- broker abstraction stack
- UTA naming and account lifecycle machinery
- push/sync semantics tied to live order routing

### 3. Research, market data, and archive surfaces

| Capability | What OpenAlice solves | TonQuant current state | Rating | Target | Borrow mode |
|---|---|---|---|---|---|
| Market-data domain as its own module | Keeps structured data acquisition separate from agent, UI, and execution concerns | TonQuant already has a quant data path and support-command query services, but the split is still partially product-shape driven rather than domain-driven | High | CLI | Directly reuse the idea |
| Analysis domain behind tools | Keeps indicators and research calculations accessible through stable tool surfaces | TonQuant has quant factor compute and core services already, but not a separate tool-facing exposure layer | High | CLI | Directly reuse the idea |
| News archive tools | Adds longitudinal research memory instead of live-only querying | TonQuant PRD mentions research loops but does not yet have durable market-news context | Medium | CLI | Needs adaptation |
| Browser-assisted research | Lets the agent collect evidence from the live web using a browser subsystem | TonQuant currently relies on CLI/data artifacts and does not need browser-native research to ship Phase 1/2 | Low | Both | Not recommended now |

Borrowable pattern:

- domain module first, tool exposure second, UI/API third

This is a stronger pattern than TonQuant's current split between support-command services and quant runner code, because it clarifies which layer owns semantics versus transport.

### 4. Background automation and persistent jobs

| Capability | What OpenAlice solves | TonQuant current state | Rating | Target | Borrow mode |
|---|---|---|---|---|---|
| Cron engine that writes events, not side effects | Makes scheduled work inspectable and replayable instead of burying behavior inside timers | TonQuant alerts are file-based and autoresearch tracks are not yet persistent scheduled jobs | High | CLI | Directly reuse the idea |
| Cron listener as separate executor | Decouples "when something should fire" from "how the agent handles it" | TonQuant has no equivalent decoupling yet | High | CLI | Directly reuse the idea |
| Heartbeat job | Gives the agent a periodic monitoring loop with dedup and active-hour logic | TonQuant's alerting and track status would benefit from the same pattern | High | CLI | Needs adaptation |
| Event-driven notifications | Lets background jobs deliver updates through explicit channels | TonQuant does not yet need multi-channel delivery, but does need durable status reporting | Medium | Both | Needs adaptation |

This is the most valuable area for TonQuant.

The immediate product gap is not another factor command. It is that `autoresearch` does not yet behave like an always-on research system. OpenAlice's cron-plus-event-log split is the best reference for fixing that.

Minimum TonQuant cut:

- scheduled `autoresearch track run`
- scheduled `factor alert evaluate`
- append-only event stream for track runs, candidate promotion decisions, and alert fires

### 5. Web workstation architecture

| Capability | What OpenAlice solves | TonQuant current state | Rating | Target | Borrow mode |
|---|---|---|---|---|---|
| `ui/src/api/*` layer | Gives each page an explicit transport boundary instead of wiring components directly to mock state | TonQuant web still runs on local mock factor data and presentation components | High | Frontend | Directly reuse the idea |
| `pages/ + hooks/ + components/` split | Produces an operations UI with page-level responsibilities and reusable state hooks | TonQuant web is component-demo oriented, not page or workflow oriented | High | Frontend | Directly reuse the idea |
| Events page backed by SSE + paginated log | Makes background behavior visible and debuggable | TonQuant has no web-facing operational history yet | High | Frontend | Needs adaptation |
| Config-driven forms from backend metadata | Lets UI evolve with backend schemas rather than hard-coded forms | TonQuant has limited need today, but this becomes valuable once alerts, tracks, and factor publish forms grow | Medium | Frontend | Needs adaptation |
| Chat-first root page | Makes conversation the center of the product | TonQuant's product thesis is factor marketplace and quant loop, not chat | Low | Frontend | Not recommended |

TonQuant should not copy the OpenAlice UI surface.

It should copy the architectural move from:

- static showcase

to:

- page-based workbench with explicit API clients, real data, and operational visibility

## Recommended Borrow List

### Now

These are the best near-term borrow targets because they strengthen the quant CLI and agent contract without dragging TonQuant into a different product category.

1. Append-only event log for quant operations
   - Why: TonQuant currently persists artifacts, but not a unified operational history.
   - Maps to: `packages/core` or `apps/cli` plus quant runner/orchestrator.
   - Minimum cut: record `autoresearch.run`, `autoresearch.candidate`, `factor.publish`, `factor.alert.fire`, `backtest.run`.

2. Cron engine separated from job execution
   - Why: enables durable alert checks and recurring research without hiding logic in timers.
   - Maps to: `apps/cli` background runtime plus core scheduling state.
   - Minimum cut: schedule track reruns and alert evaluations; write events first, execute second.

3. Guard pipeline for irreversible factor workflows
   - Why: factor publishing, candidate promotion, and future live actions should pass reusable validation steps.
   - Maps to: `packages/core/src/services/` around registry/report/autoresearch flows.
   - Minimum cut: backtest freshness, schema validity, asset coverage, duplicate/conflict checks.

4. Tool bridge layer between domain services and agent consumers
   - Why: protects TonQuant from coupling its agent contract to Commander.
   - Maps to: `packages/core` plus `apps/cli`.
   - Minimum cut: expose registry discovery, factor backtest, compose, alert list/set, and autoresearch status as stable tool definitions.

5. Durable autoresearch tracks instead of thin single-run commands
   - Why: this is where TonQuant most obviously under-shoots its own PRD.
   - Maps to: quant runner/orchestrator storage plus CLI commands.
   - Minimum cut: `init`, `run`, `status`, `list` backed by state files and event history, not placeholder responses.

### Later

These are strong borrow targets once CLI/state groundwork exists.

1. Workbench-style web architecture
   - Minimum cut: add `apps/web/src/api`, `pages`, and `hooks` layers before adding more UI surface.

2. Events and track-monitoring pages
   - Minimum cut: web page for quant event log, track history, and alert history.

3. Snapshot-style monitoring for research tracks
   - Minimum cut: periodic score/equity/candidate summaries for tracks, displayed in charts and history views.

4. Backend-declared form metadata for track, alert, and publish flows
   - Minimum cut: schema-backed config descriptors rather than hard-coded frontend forms.

### Never / Not Yet

These are mismatched with TonQuant's current product direction or too expensive for the return.

1. Multi-broker UTA framework
   - Wrong product center for TonQuant today.

2. Trading-as-Git as a full execution metaphor
   - Useful as inspiration for staged factor workflows, but not worth porting literally.

3. Chat-first application shell
   - TonQuant should center discovery, verification, composition, and monitoring instead.

4. Browser subsystem as a core research dependency
   - Too much operational weight for the current stage; only revisit if web-native evidence collection becomes product-critical.

## Suggested TonQuant Roadmap Based on This Review

### Near term

- Build an append-only quant event log.
- Make `autoresearch` a durable track system instead of a thin wrapper.
- Add guard stages around factor publication and promotion.
- Introduce an agent tool bridge over existing services and quant APIs.

### Mid term

- Move `apps/web` from mocked marketplace demo to real workbench.
- Add event log and track monitoring pages before adding more marketing-style UI.
- Back the web app with explicit API clients and real registry/track state.

### Long term

- Consider notifications, scheduled delivery, and richer operator surfaces only after the quant loop is durable.
- Revisit broader workstation patterns only if TonQuant expands from factor marketplace into an operations platform.

## Why Not Copy OpenAlice More Literally

Three mismatches matter:

1. OpenAlice is a local autonomous trading workstation.
   TonQuant is a CLI-first factor marketplace and quant research system.

2. OpenAlice optimizes around broker execution safety.
   TonQuant should optimize around factor validity, research reproducibility, and agent consumption.

3. OpenAlice's frontend is an operator console.
   TonQuant's frontend should become a quant workbench, not a generic agent chat shell.

The right outcome is not "OpenAlice for TON." The right outcome is "TonQuant with OpenAlice-grade workflow rigor."
