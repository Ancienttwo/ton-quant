# Contract: Wallet Factor Publish Platform

## Goal

Turn local TonQuant factor artifacts into signed, reviewable, payout-capable platform publications with real TON wallet payout support and no custodial signing.

## Deliverables

- Shared publish-platform schemas and helpers in `packages/core`
- `apps/platform-api` with SQLite-backed publication, review, ledger, and settlement state
- CLI publish/payout/status commands that keep the standard JSON envelope
- Minimal web signer page for TonConnect signing sessions
- Regression coverage for publish, review, payout, and settlement behavior

## Non-Goals

- No traditional account system
- No agent-held or custodial private keys
- No jetton settlement
- No end-user billing product
- No full creator dashboard

## Acceptance Criteria

- `factor publish-prepare` emits a deterministic canonical manifest and signable intent payload.
- Platform nonce/signing-session state is single-use and expiry-bound.
- Signed publish submission verifies signer address, domain, network, nonce, and expiry before creating a publication.
- Publications move through `pending_review -> active/rejected` with persisted rejection reasons.
- Only the owning wallet address can submit updates or change payout address.
- Payout-address changes affect only future ledger entries.
- Settlement batches group pending TON ledger entries by payout address, preserve retryability, and keep submission references.
- CLI commands return `{ status: "ok", data }` or `{ status: "error", error, code }`.

## Verification Commands

- `bun run typecheck`
- `bun run lint`
- `HOME=/tmp/tonquant-home-platform bun run test`
- targeted platform/core/CLI tests for publish and settlement flows
