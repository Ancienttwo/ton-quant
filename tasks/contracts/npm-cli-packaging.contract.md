# Contract: npm CLI Packaging

## Goal

Make `tonquant` publishable and installable as a real npm CLI package, with packaged quant-command support, without requiring users to clone the monorepo or configure a backend manually.

The required UX is zero-config direct execution: after install, OpenClaw or any other agent can run `tonquant` directly and the bundled quant backend is available automatically.

## Deliverables

- A publishable `apps/cli` package whose `bin` points to bundled runtime artifacts
- Packaged quant backend runtime artifacts included in the published CLI package
- Backend resolution that works from an installed package, not only from a monorepo checkout
- Release verification through `npm pack` and a clean install smoke test
- Updated install/release documentation describing the Bun runtime requirement

## Non-Goals

- Do not publish `@tonquant/core` as a separate package in this phase.
- Do not publish `@tonquant/quant-backend` as a separate package in this phase.
- Do not add Node.js runtime compatibility.
- Do not build platform-specific standalone executables.
- Do not change CLI product behavior outside packaging/runtime resolution.

## Acceptance Criteria

- `npm pack` from `apps/cli` produces a tarball whose installed `tonquant` binary works outside the repo checkout.
- The published package no longer depends on `workspace:*` semantics at runtime.
- A packaged quant command can locate and invoke the bundled backend without requiring `TONQUANT_QUANT_CLI`.
- An agent can invoke installed `tonquant` directly and reach the bundled backend without extra bootstrap steps.
- Root verification remains green:
  - `bun run typecheck`
  - `bun run lint`
  - `bun run test`

## Verification Commands

- `bun run typecheck`
- `bun run lint`
- `bun run test`
- `bun run --filter tonquant build`
- `npm pack` in `apps/cli`
- clean temp install smoke of the tarball with `tonquant --help`, one quant command, and one agent-style direct invocation check
