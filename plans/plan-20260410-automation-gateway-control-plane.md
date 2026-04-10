# Plan: Automation Gateway Control Plane

> **Slug**: automation-gateway-control-plane
> **Status**: Completed
> **Approved By**: User chat approval on 2026-04-10

## Summary

Add a narrow automation control plane for TonQuant that manages background jobs and callers without turning the system into a multi-agent gateway.

This phase adds four explicit surfaces:

- shared automation schemas and state services in `packages/core`
- CLI-side runtime and handler registry in `apps/cli/src/automation`
- operator-facing `tonquant automation ...` and `tonquant daemon`
- immutable automation run artifacts under `~/.tonquant/quant/automation-runs/`

## Building

Build the smallest honest background execution plane:

1. persist automation job intent separately from existing domain state
2. schedule and claim jobs through a dedicated automation service
3. dispatch into typed handlers for autoresearch, alerts, and publish checks
4. write immutable run artifacts before projecting job state
5. run a singleton foreground daemon for due jobs and recovery

## Not Building

- multi-agent session orchestration
- model/provider routing
- connector or notification fanout
- distributed multi-daemon execution
- full cron syntax

## Scope Mode

**shape** — keep domain truth in existing autoresearch, alert, and platform state while adding one separate automation control plane beside it.

## Chosen Approach

Use an `Automation Gateway` instead of an `Agent Gateway`.

The gateway owns schedule validation, lease claim/recovery, execution-key dedup, artifact creation, reconciliation, and dispatch into typed handlers.
Agents are represented only as actor metadata on requests and events.

## Key Decisions

- Event log stays audit-only.
  Reason: jobs need explicit mutable runtime state; `events.jsonl` is not the job queue or the source of truth.

- Automation state lives under `~/.tonquant/automation/jobs/<jobId>/`.
  Reason: scheduler/runtime projection should remain distinct from registry, alerts, and autoresearch state.

- Run artifacts are immutable.
  Reason: recovery and auditability are simpler when result records are append-only and state is a projection.

- `run-now` and daemon execution share the same typed handler path.
  Reason: operator-triggered and scheduled runs must not diverge in behavior.

- v1 supports `every` and `at` schedules only.
  Reason: current product needs do not justify full cron complexity.

- v1 daemon execution is serial.
  Reason: correctness, recovery, and observability matter more than throughput in the first cut.

## Work Units

1. Add shared automation actor, schedule, job, run-record, and state schemas in `packages/core/src/types/automation.ts`.
2. Add automation store, daemon lock, lease handling, reconciliation, and handler registry in `packages/core/src/services/automation.ts`.
3. Extend alerts with structured evaluation outcomes for automation-triggered runs.
4. Add CLI automation runtime, platform-check handler, and human formatter support in `apps/cli/src/automation/*` and `apps/cli/src/utils/format-automation.ts`.
5. Add `automation schedule|list|status|pause|resume|remove|run-now` and `daemon` commands in `apps/cli/src/cli/automation.ts`.
6. Add regression coverage for schedule lifecycle, singleton daemon ownership, due-job execution, run-now parity, and recovery behavior.

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Automation state leaks into domain truth | High | keep job state separate from autoresearch, alerts, and platform state |
| Daemon double-runs due jobs | High | singleton daemon lock plus per-job lease ownership and execution keys |
| Recovery misses partially completed runs | High | persist immutable run records and reconcile newer artifacts on startup |
| Command and daemon paths drift | Medium | route both through the same runtime handler registry |
| Control plane turns into an agent runtime | Medium | keep agents as actor metadata only and omit session/provider abstractions |

## Dependencies

- existing `event-log` audit semantics in `packages/core`
- existing autoresearch lifecycle ownership in `apps/cli/src/quant/autoresearch`
- existing quant artifact helpers in `apps/cli/src/quant/runner`
- existing publish platform client in `apps/cli/src/cli/factor-platform.ts`

## Verification Targets

- `bun typecheck`
- `bun lint`
- `bun test --max-concurrency 1 --path-ignore-patterns '_ref/**'`
- `bun run apps/cli/src/index.ts automation --help`
- `bun run apps/cli/src/index.ts daemon --help`

## Confidence Check

- Problem understood: yes — TonQuant needed a task control plane, not an agent operating system.
- Simplest approach: yes — one local automation service plus one CLI runtime layer keeps the implementation narrow.
- Unknowns resolved or deferred: yes — notifications, distributed execution, and richer cron syntax are intentionally deferred.
