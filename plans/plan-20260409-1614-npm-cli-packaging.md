# Plan: npm CLI Packaging

> **Slug**: npm-cli-packaging
> **Status**: Completed
> **Approved By**: User chat approval on 2026-04-09

## Summary

Publish `tonquant` as a real npm-installable CLI package without requiring users to clone the monorepo or manually wire a local quant backend.

The install contract is explicit: after `npm install -g tonquant`, an agent such as OpenClaw can invoke `tonquant` directly and both support commands and quant commands should work without extra backend setup.

The current repo is operational but not distributable:

- [apps/cli/package.json](/Users/ancienttwo/Projects/ton/apps/cli/package.json) still points `bin` at source TypeScript and depends on `@tonquant/core` via `workspace:*`
- [apps/cli/src/quant/runner/resolve-cli.ts](/Users/ancienttwo/Projects/ton/apps/cli/src/quant/runner/resolve-cli.ts) resolves the backend from monorepo-relative paths or user env vars, which fails for a normal global install
- [apps/quant-backend/package.json](/Users/ancienttwo/Projects/ton/apps/quant-backend/package.json) is private and not packaged as a runtime artifact

This phase makes npm distribution honest by shipping one installable CLI package that includes its own bundled runtime pieces, including the quant backend, and has a reproducible release verification path.

## Step 0: Scope Challenge

### What already exists

- CLI command surface and runtime entrypoint already exist in [apps/cli/src/index.ts](/Users/ancienttwo/Projects/ton/apps/cli/src/index.ts)
- local backend invocation and quant transport boundary already exist in [apps/cli/src/quant/api/shared.ts](/Users/ancienttwo/Projects/ton/apps/cli/src/quant/api/shared.ts)
- backend command entrypoint already exists in [apps/quant-backend/src/cli.ts](/Users/ancienttwo/Projects/ton/apps/quant-backend/src/cli.ts)
- Bun bundling is already partially present through `apps/cli`'s `build` script
- root repo verification is already green, so packaging is now the actual next blocker rather than code quality noise

### Minimum change set

The minimum complete change is:

1. Build publishable `dist/` artifacts for the CLI and bundled backend.
2. Remove `workspace:*` from the published runtime path.
3. Resolve the bundled backend from the installed package location before falling back to user overrides.
4. Add an npm-pack verification flow using `npm pack` and a clean temp install.

Anything beyond that is deferable.

### Complexity check

This work will touch more than 8 files, but it does **not** require more than 2 new runtime modules if kept disciplined. That is acceptable for packaging work, but it is also a smell: do not solve this by splitting the monorepo into multiple publishable packages in the same phase.

### Search check

- **[Layer 1]** npm package metadata should be driven by published `package.json` fields such as `name`, `version`, `bin`, `files`, and optional `bundleDependencies`, per npm package docs.
- **[Layer 1]** Bun can bundle TypeScript entrypoints for the Bun runtime and can also compile single-file executables, per Bun bundler docs.
- **[EUREKA]** Bun's single-file executable support is attractive, but it is the wrong primitive for npm distribution here because compiled executables are platform-target specific. The packaging problem is cross-platform npm installability, not standalone binary distribution. Ship Bun-targeted bundled JS for npm; defer native executables to a later release channel if needed.

### TODO cross-reference

No existing deferred TODO blocks this plan. This plan should become its own workstream because it is the first distribution-focused phase after repo baseline cleanup.

### Completeness check

Do the complete version for this lake:

- do not publish a half-working package that only supports support commands
- do not ask users or agents to set `TONQUANT_QUANT_CLI` manually after `npm install -g tonquant`
- do not defer `npm pack` smoke verification to "later"

## Recommendation

Ship a **single npm package** for `tonquant` that:

- keeps Bun as the declared runtime requirement
- bundles CLI and quant backend into package-local `dist/` artifacts
- resolves the packaged backend relative to the installed CLI location
- treats `@tonquant/core` as build-time source, not an external runtime workspace dependency in the published package
- preserves the current agent UX where OpenClaw or another agent can execute `tonquant` directly with no separate backend bootstrap step

Do **not** split `@tonquant/core` and `@tonquant/quant-backend` into separately published packages in this phase.

That split is a reversible later optimization. Right now it adds release choreography, semver coordination, and install-time failure modes without increasing user value.

## Options Considered

### Option A: Publish `tonquant` only, but keep current monorepo-relative runtime assumptions

- Summary: push the current CLI package to npm with minimal metadata edits.
- Pros:
  - smallest immediate diff
- Cons:
  - installed quant commands will fail outside the repo
  - agents lose the current "directly run `tonquant`" contract
  - workspace dependency resolution is still broken for external consumers
  - this is a fake release

### Option B: Single published CLI package with bundled backend and bundled core

- Summary: build and ship one npm package containing Bun-targeted CLI and backend artifacts plus package-local resolution.
- Pros:
  - minimal user and agent install story
  - one version, one release train, one smoke test
  - smallest honest solution
- Cons:
  - requires packaging work in both CLI and backend build paths
  - package contents must be curated explicitly

### Option C: Publish multiple packages (`tonquant`, `@tonquant/core`, maybe `@tonquant/quant-backend`)

- Summary: turn the monorepo into a proper multi-package registry distribution.
- Pros:
  - long-term modular release surface
  - more reuse if external consumers want `core`
- Cons:
  - overbuilt for the current goal
  - higher versioning and dependency coordination cost
  - unnecessary second system before first installable package exists

## Chosen Direction

Choose **Option B**.

## Architecture Review

### System shape

```text
npm install -g tonquant
        |
        v
  installed package
  tonquant/
    package.json
    dist/
      cli.js
      quant-backend.js
      <bundled assets if needed>
        |
        +--> bin "tonquant" -> dist/cli.js
        |
        +--> quant API runner resolves dist/quant-backend.js
        |
        +--> OpenClaw / other agent executes `tonquant` directly
```

### Data flow

```text
user shell / agent shell
  -> tonquant (npm bin)
  -> dist/cli.js
  -> command parsing
  -> support command direct flow
     OR
  -> quant API entrypoint
  -> resolve packaged backend path
  -> bun run dist/quant-backend.js
  -> stdout/stderr artifact contract
  -> CLI formatter / --json envelope
```

### Opinionated recommendations

1. Keep one published package.
   Reason: minimal diff and boring release mechanics beat modular purity here.

2. Keep Bun as an explicit runtime dependency, not a hidden transitive assumption.
   Reason: the codebase already uses Bun entrypoints, Bun test, and Bun-target bundling; forcing Node compatibility in the packaging phase is a scope explosion.

3. Resolve backend from package-local paths before `process.cwd()`.
   Reason: package installs must work from any current directory; cwd-relative backend discovery is a repo-only assumption.

### Failure scenarios

- Installed user runs `tonquant data fetch` from `~/Downloads`: backend lookup fails if resolution is still cwd-relative. The plan must fix this explicitly.
- Published tarball omits backend artifact: support commands pass, quant commands fail at runtime. The plan needs tarball-content verification.
- Bundled CLI still references `workspace:*` or source `.ts` files: install succeeds but executable fails. The plan needs publish-manifest inspection.

## Code Quality Review

### Boundaries to preserve

- Keep packaging-specific logic in CLI packaging/build files and runner resolution.
- Do not rewrite quant API or backend handler contracts.
- Prefer one explicit packaging helper over ad hoc path logic repeated across commands.

### DRY / structure guidance

- Introduce a single packaged-backend locator helper instead of adding new path heuristics in multiple files.
- Keep published package metadata derived from one source of truth where possible; avoid duplicating version strings and bin targets across scripts.

### ASCII diagram comments to add in code

- [apps/cli/src/quant/runner/resolve-cli.ts](/Users/ancienttwo/Projects/ton/apps/cli/src/quant/runner/resolve-cli.ts)
  Add a short ASCII search-order comment showing: explicit env -> Python project -> packaged backend -> repo backend.
- Packaging/build helper file if added
  Add a short artifact-layout diagram for what lands in `dist/`.

## Test Review

### Test diagram

```text
NEW PACKAGING SURFACE

1. npm bin path
   tonquant -> dist/cli.js
   outcomes:
   - executable exists
   - help command runs

2. packaged support command
   tonquant --help / price / pools
   outcomes:
   - direct CLI still works after packaging

3. packaged quant command
   tonquant data list
   outcomes:
   - packaged backend is found
   - backend process launches
   - structured result still flows back
   - no manual backend env configuration is required

4. env override precedence
   TONQUANT_QUANT_CLI overrides packaged backend path
   outcomes:
   - explicit override still wins

5. tarball integrity
   npm pack -> clean temp install
   outcomes:
   - published files are sufficient
   - no workspace path leakage
```

### Required tests

- Unit test for backend resolution precedence including packaged-backend path
- Packaging-manifest test or scripted assertion that published `package.json` points `bin` to `dist`
- `npm pack` smoke test in a temporary directory:
  - install tarball
  - run `tonquant --help`
  - run one support command
  - run one quant command that exercises packaged backend discovery
- Regression test ensuring `TONQUANT_QUANT_CLI` still overrides packaged path

### Failure modes matrix

| Codepath | Realistic failure | Test? | Error handling? | Silent? |
|----------|-------------------|-------|-----------------|---------|
| npm bin launch | `bin` points to missing source file | must add | shell failure only | no |
| packaged backend resolution | package lacks backend artifact | must add | yes, `QUANT_BACKEND_NOT_CONFIGURED` or explicit packaged-backend error | no |
| workspace dependency leakage | installed package cannot resolve `@tonquant/core` | must add | install/runtime failure only | no |
| temp install smoke | tarball missing required files | must add | script failure | no |

No silent-failure path should remain after this phase.

## Performance Review

- Packaging adds negligible runtime cost if backend lookup remains constant-time and path resolution is done once per invocation.
- Bundled Bun-target artifacts may slightly improve startup time versus raw source execution.
- Avoid multi-stage runtime indirection such as spawning a wrapper that then resolves another wrapper; keep CLI -> backend direct.

## Implementation Work Units

1. Add a dedicated packaging plan/contract workstream in repo-local task files.
2. Change CLI publish metadata:
   - `bin` points to bundled `dist/cli.js`
   - `files` includes only publishable artifacts and docs
   - add explicit publish-time verification scripts
3. Build CLI and quant backend into publishable Bun-target artifacts under `apps/cli/dist/`.
4. Update backend resolution to prefer package-local bundled backend before repo-relative fallback.
5. Remove published runtime dependence on monorepo `workspace:*` semantics.
6. Add release verification:
   - manifest sanity check
   - `npm pack`
   - clean temp install
   - command smoke tests
7. Document install/runtime contract:
   - Bun required
   - packaged quant backend included
   - external provider endpoints remain optional external dependencies

## What already exists

- Existing CLI bin name and command registration are correct and should be reused.
- Existing quant runner/backend artifact contract is correct and should be reused.
- Existing backend entrypoint is correct and should be reused.
- Existing repo baseline verification is green and should be reused in release gates.
- Existing `build` script is only a starting point; it is not yet a release pipeline.

## NOT in scope

- Publishing `@tonquant/core` as a standalone npm package
  Rationale: useful later, but not required to make `tonquant` installable now.
- Publishing `@tonquant/quant-backend` as its own npm package
  Rationale: adds release coordination without improving the first user install story.
- Building platform-specific standalone Bun executables
  Rationale: that is a separate binary-distribution channel, not npm packaging.
- Forcing Node.js compatibility for the CLI runtime
  Rationale: that is a different product decision with far larger blast radius.
- Publishing the web app
  Rationale: unrelated to CLI package distribution.

## Verification Targets

- `bun run typecheck`
- `bun run lint`
- `bun run test`
- packaging-specific smoke:
  - `bun run --filter tonquant build`
  - `npm pack` from `apps/cli`
  - clean temp install of the tarball
  - `tonquant --help`
  - one support command smoke
  - one quant command smoke
  - one agent-style direct invocation smoke from a clean temp install

## Sources

- npm package metadata and publish fields: [npm package.json docs](https://docs.npmjs.com/cli/v11/configuring-npm/package-json)
- npm bundled dependencies / package tarball behavior: [npm package.json docs](https://docs.npmjs.com/cli/v8/configuring-npm/package-json)
- Bun bundler and Bun-target builds: [Bun bundler docs](https://bun.sh/docs/bundler)
- Bun single-file executable tradeoffs: [Bun executable docs](https://bun.sh/docs/bundler/executables)
- Bun package executable behavior: [bunx docs](https://bun.sh/docs/cli/bunx)

## Completion Summary

- Step 0: Scope Challenge — scope reduced to single-package npm distribution
- Architecture Review: 3 issues found, all resolved by choosing bundled single-package distribution
- Code Quality Review: 2 issues found, both resolved by centralizing packaged-backend resolution and avoiding package splits
- Test Review: diagram produced, 5 coverage requirements identified
- Performance Review: 0 material issues found
- NOT in scope: written
- What already exists: written
- TODOS.md updates: 0 deferred items proposed beyond the new workstream itself
- Failure modes: 0 critical silent-failure gaps accepted
- Lake Score: 4/4 recommendations chose the complete option
