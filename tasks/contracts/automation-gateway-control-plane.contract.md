# Contract: Automation Gateway Control Plane

## Goal

Add a local-first automation control plane that schedules, executes, and recovers background jobs for TonQuant without introducing a multi-agent runtime.

## Deliverables

- Shared automation schemas and service API in `packages/core`
- CLI automation runtime and typed handler registry in `apps/cli/src/automation`
- Operator commands for `automation schedule|list|status|pause|resume|remove|run-now`
- Foreground `tonquant daemon` with singleton ownership and due-job execution
- Immutable automation run artifacts under `~/.tonquant/quant/automation-runs/`
- Regression coverage for scheduling, execution, recovery, and daemon locking

## Non-Goals

- No agent session management
- No model/provider orchestration
- No connector/notification layer
- No distributed or multi-host workers
- No full cron-expression parser

## Acceptance Criteria

- Automation job specs are persisted under `~/.tonquant/automation/jobs/<jobId>/spec.json`.
- Mutable runtime state is persisted separately in `state.json`, with per-job history in `history.jsonl`.
- Actor metadata is explicit and constrained to `manual | daemon | api | agent`.
- Supported automation kinds are:
  - `autoresearch.track.run`
  - `factor.alert.evaluate`
  - `publish.submission.check`
- `automation run-now` and daemon-triggered execution use the same typed handler path.
- Each run writes immutable artifacts under `~/.tonquant/quant/automation-runs/<runId>/` before projected state is finalized.
- The daemon enforces singleton ownership via `~/.tonquant/automation/daemon.lock`.
- Expired leases and persisted run results can be reconciled on daemon startup.
- CLI commands preserve the standard `{ status: "ok", data }` and `{ status: "error", error, code }` envelope.

## Verification Commands

- `bun typecheck`
- `bun lint`
- `bun test --max-concurrency 1 --path-ignore-patterns '_ref/**'`
- `bun run apps/cli/src/index.ts automation --help`
- `bun run apps/cli/src/index.ts daemon --help`
