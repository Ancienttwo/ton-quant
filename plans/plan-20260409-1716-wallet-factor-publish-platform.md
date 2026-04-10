# Plan: Wallet Factor Publish Platform

> **Slug**: wallet-factor-publish-platform
> **Status**: Approved
> **Approved By**: User chat approval on 2026-04-09

## Summary

Add a same-repo minimal factor publish platform that turns local TonQuant research artifacts into signed, reviewable, payout-capable platform publications without changing the existing local registry semantics.

This phase adds four explicit surfaces:

- shared publish-platform contracts in `packages/core`
- a new `apps/platform-api` Bun + SQLite service
- new CLI commands for publish preparation, submit/status, and payout updates
- a minimal web signer page that lets a user complete TonConnect signing from a browser wallet session

## Building

Build the smallest honest platform loop:

1. local factor/backtest artifacts are normalized into a canonical publish manifest
2. the platform issues a nonce and short-lived signing session
3. the user signs a publish intent with a TON wallet through a web signer page
4. the platform verifies the signature, persists a publication in `pending_review`, and records audit events
5. internal review moves the publication to `active` or `rejected`
6. internal commission events land in an immutable ledger
7. settlement batches submit native TON payouts and keep retryable batch state

## Not Building

- email/username accounts
- custodial wallet flows
- agent-held signing keys
- jetton settlement
- end-user checkout/subscription product
- full creator dashboard
- public marketplace browsing UI beyond a minimal signer page

## Scope Mode

**shape** — preserve the current quant/runtime and local registry boundaries while adding a separate platform publication layer.

## Chosen Approach

Keep local factor publishing local-first and add a new platform-specific contract instead of mutating the existing registry service into a multi-user platform. Platform state lives in SQLite behind `apps/platform-api`; the CLI remains the preparation/orchestration layer; the signer page is the minimum additional surface needed to make TonConnect signing real.

## Key Decisions

- Wallet raw address is the only ownership identity.
  Reason: profile overlays are optional, but ownership and authorization must remain stable and chain-native.

- Platform publication is a separate flow from local registry publish.
  Reason: the existing registry is local JSON state; review, nonce, payout, and settlement need a platform state source.

- TonConnect `signData` is the signing primitive, with explicit network, signer address, domain, nonce, and expiry.
  Reason: it gives a documented off-chain signature format the backend can verify while keeping user keys outside the agent.

- Review is mandatory in v1.
  Reason: signed submission is not sufficient spam control and the product explicitly wants `pending_review -> active/rejected`.

- Settlement is native TON only in v1, grouped by payout address.
  Reason: it delivers real wallet payout without taking on jetton-specific complexity or false multi-asset claims.

- Ledger entries are immutable and payout-address changes are forward-only.
  Reason: payout history and retry semantics become tractable only if historical accounting does not rewrite in place.

## Work Units

1. Add shared schemas, canonicalization helpers, and signature verification helpers for publish intents, signer sessions, publications, payout changes, ledger entries, and settlement batches.
2. Add `apps/platform-api` with SQLite-backed nonce, signing-session, publication, review, ledger, and settlement endpoints.
3. Add CLI commands for `factor publish-prepare`, `factor publish-status`, `factor payout-set`, and platform-facing submit/session orchestration.
4. Add a minimal web signer page that consumes a signing session, invokes TonConnect `signData`, and posts the signed payload back to the platform.
5. Add regression coverage for deterministic manifest generation, signature/nonce validation, owner checks, review transitions, payout-forward-only behavior, settlement grouping, and CLI JSON envelopes.

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| TonConnect signing flow is absent from current repo | High | add the minimal signer page in the same phase so the happy path is real |
| Settlement retries duplicate or lose ledger entries | High | freeze batch membership, keep immutable ledger states, and record submission references per batch |
| Address formatting drifts between CLI, web, and API | High | store raw addresses only and centralize normalization in shared schemas/helpers |
| Review path stalls with no operator surface | Medium | add explicit internal approve/reject API and CLI-verifiable publication status |
| Platform work bleeds into the quant runtime | Medium | keep all new contracts in a dedicated publish-platform layer above the research boundary |

## Dependencies

- `@ton/crypto`, `@ton/ton`, and `@ton/core` already present in `packages/core`
- Bun runtime and `bun:sqlite`
- existing `ServiceError`, CLI output envelope, and append-only event log patterns
- existing `apps/web` React/Vite app as the host for the signer page

## Verification Targets

- `bun run typecheck`
- `bun run lint`
- `HOME=/tmp/tonquant-home-platform bun run test`
- targeted platform API + core + CLI publish-flow tests
- targeted web build verification for the signer page

## Confidence Check

- Problem understood: yes — the missing product surface is platform publication, not another quant runtime.
- Simplest approach: yes — one new service, one minimal signer page, and one shared contract layer is the smallest honest loop.
- Unknowns resolved or deferred: yes — TonConnect verification and TON message-hash tracking are known; jettons, checkout, and dashboards stay out of scope.
