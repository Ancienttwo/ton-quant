# Contract: Repo Baseline Cleanup

## Goal

Restore trustworthy full-repo verification by removing the current pre-existing `bun typecheck` and `bun lint` blockers with the smallest coherent set of code changes.

## Deliverables

- A strict-null-safe `packages/core/tests/services/skill-export.test.ts`
- A lint-clean `apps/web` blocker set covering import ordering, hook dependencies, and accessibility diagnostics
- Full root verification evidence for:
  - `bun typecheck`
  - `bun lint`
  - `bun test`

## Non-Goals

- Do not add any new product functionality.
- Do not redesign `apps/web`.
- Do not change quant/provider behavior.
- Do not broaden cleanup into unrelated refactors beyond what is required to get the root commands green.

## Acceptance Criteria

- `bun typecheck` passes from the repo root.
- `bun lint` passes from the repo root.
- `bun test` still passes from the repo root after the cleanup.
- The fixes remain local to the verified blocker areas unless new directly adjacent diagnostics are exposed during the cleanup.

## Verification Commands

- `bun typecheck`
- `bun lint`
- `bun test`
