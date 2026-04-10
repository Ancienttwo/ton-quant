# Plan: Repo Baseline Cleanup

> **Slug**: repo-baseline-cleanup
> **Status**: Completed
> **Approved By**: User chat approval on 2026-04-09

## Summary

Restore the repo to a credible full-validation baseline by clearing the remaining pre-existing `bun typecheck` and `bun lint` blockers without expanding product scope.

The concrete failures are now verified:

- full `bun typecheck` is blocked by strict-null errors in `packages/core/tests/services/skill-export.test.ts`
- full `bun lint` is blocked by import ordering, hook dependency, and accessibility diagnostics in a small fixed set of `apps/web` files

The goal of this phase is boring correctness: the whole repo should typecheck and lint again, and the cleanup should not smuggle in feature work, provider work, or UI redesign.

## Building

Make the smallest coherent repo-wide fixes needed to get these root commands green again:

- `bun typecheck`
- `bun lint`

That means:

- repairing the strict-null test assumptions in `packages/core/tests/services/skill-export.test.ts`
- fixing the known `apps/web` Biome diagnostics in:
  - `src/App.tsx`
  - `src/components/BacktestViewer.tsx`
  - `src/components/FactorDetailModal.tsx`
  - `src/components/Leaderboard.tsx`
  - `src/components/MarketplaceSection.tsx`
  - `src/components/TerminalDemo.tsx`
- re-running full-repo verification until the baseline is honestly green again

## Not Building

- Do not add new quant, provider, factor, or autoresearch features.
- Do not redesign the web UI.
- Do not broaden the lint pass into unrelated style churn outside the current blocker set unless fixing one diagnostic reveals a directly adjacent required change.
- Do not refactor production code just because the cleanup touches it.
- Do not change the CLI/API contract for any shipped command.

## Scope Mode

**cut** — remove the minimum blocker set required to restore trustworthy full-repo validation, and stop there.

## Options Considered

### Option A: Keep shipping with documented repo-level blockers

- Summary: leave the current pre-existing typecheck/lint failures in place and continue using only targeted verification for new work.
- Effort: none
- Pros:
  - zero immediate engineering time
  - no chance of web cleanup churn
- Cons:
  - root verification remains untrustworthy
  - every new change has to explain away baseline failures
  - CI and review quality stay artificially noisy

### Option B: Focused baseline cleanup

- Summary: fix only the currently verified root blockers in `packages/core` and `apps/web`, then re-run full validation.
- Effort: small to medium
- Pros:
  - restores trustworthy repo-wide signals
  - keeps scope contained to already-known failures
  - removes repeated reviewer overhead on every subsequent task
- Cons:
  - touches both test code and UI code
  - may reveal a second layer of hidden diagnostics once the first layer is fixed

### Option C: Roll cleanup into a broader web/quality refactor

- Summary: use the blocker cleanup as an excuse to modernize the web app and tighten wider code quality rules.
- Effort: large
- Pros:
  - could improve long-term frontend quality more aggressively
  - might clear future lint debt proactively
- Cons:
  - violates the immediate goal
  - raises risk, diff size, and review cost for no direct baseline benefit

## Recommendation

Choose **Option B**.

The repo does not need a design project or a quality crusade here. It needs honest top-level verification. The right move is to fix the exact blockers that already exist, rerun the root commands, and stop once the baseline is green.

## Work Units

1. Fix `packages/core/tests/services/skill-export.test.ts` so strict null checks are satisfied without weakening the runtime contract.
2. Apply safe import-order cleanup in the known `apps/web` files.
3. Fix React hook dependency diagnostics in `BacktestViewer.tsx` and `TerminalDemo.tsx` with semantically correct dependencies rather than suppression.
4. Fix `FactorDetailModal.tsx` and `Leaderboard.tsx` accessibility diagnostics by using semantic buttons, explicit button types, and keyboard-safe interactions.
5. Re-run:
   - `bun typecheck`
   - `bun lint`
   - `bun test`
6. If new diagnostics appear only because the first blocker layer is gone, fix that newly exposed layer only when it is directly on the path to green root verification.

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| A test-only fix hides a real production nullability problem | Medium | keep the fix local to test assumptions unless production code is actually wrong |
| Mechanical web lint fixes accidentally change interaction behavior | Medium | prefer semantic equivalents and re-verify affected UI logic after each fix cluster |
| Clearing the first diagnostics reveals more root blockers | Medium | treat them as part of the same baseline only if they are newly exposed by this cleanup |
| Cleanup scope expands into subjective frontend refactoring | High | hold scope to existing diagnostics and avoid aesthetic or architectural churn |

## Dependencies

- existing repo commands:
  - `bun typecheck`
  - `bun lint`
  - `bun test`
- current Biome and TypeScript rules as already configured in the repo
- no new libraries, providers, or runtime services

## Verification Targets

- `bun typecheck`
- `bun lint`
- `bun test`
- targeted re-checks on touched files while iterating, if needed

## Confidence Check

- Problem understood: yes — the remaining blocker set is small, concrete, and already verified.
- Simplest approach: yes — fix only the known failing files and rerun full validation.
- Unknowns resolved or deferred: mostly — the only open question is whether clearing the first layer exposes additional baseline diagnostics, which this plan explicitly handles.
