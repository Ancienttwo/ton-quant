import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { Address, internal, SendMode } from "@ton/core";
import { mnemonicToWalletKey } from "@ton/crypto";
import { TonClient, WalletContractV5R1 } from "@ton/ton";
import {
  appendEvent,
  buildPreparedPlatformAction,
  buildSigningSession,
  CommissionEventInputSchema,
  CommissionLedgerEntrySchema,
  createNonce,
  createPublicationId,
  createSessionId,
  createSettlementBatchId,
  normalizeTonAddress,
  PayoutChangeResultSchema,
  PlatformPublishError,
  PreparedPlatformActionSchema,
  type PublicationRecord,
  PublicationRecordSchema,
  type PublicationStatusResponse,
  PublicationStatusResponseSchema,
  type PublishManifest,
  PublishManifestSchema,
  type SettlementBatch,
  SettlementBatchSchema,
  SigningSessionSchema,
  TonConnectSignDataResultSchema,
  verifyTonConnectIntentSignature,
} from "@tonquant/core";
import { z } from "zod";

const DEFAULT_SESSION_TTL_MS = 10 * 60 * 1000;

const ReviewDecisionSchema = z
  .object({
    decision: z.enum(["approve", "reject"]),
    rejectionReason: z.string().min(1).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.decision === "reject" && !value.rejectionReason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rejectionReason"],
        message: "Rejection reason is required when rejecting a publication.",
      });
    }
  });

const SessionCompletionSchema = z.object({
  sessionId: z.string().min(1),
  publicKeyHex: z.string().regex(/^[0-9a-fA-F]{64}$/u),
  signedResult: TonConnectSignDataResultSchema,
});

const SigningSessionRequestSchema = z.object({
  action: z.enum(["publish_factor", "update_factor", "set_payout_address"]),
  factorSlug: z.string().min(1),
  factorVersion: z.string().min(1).optional(),
  publisherAddress: z.string().min(1),
  payoutAddress: z.string().min(1),
  network: z.enum(["mainnet", "testnet"]).default("mainnet"),
  audience: z.string().url(),
  manifest: z.unknown().optional(),
  signerOrigin: z.string().url().optional(),
});

interface SeriesRow {
  factor_slug: string;
  owner_address: string;
  payout_address: string;
  current_active_version: string | null;
  created_at: string;
  updated_at: string;
}

interface FactorVersionRow {
  factor_slug: string;
  factor_version: string;
  publisher_address: string;
  status: "pending_review" | "active" | "rejected" | "superseded";
  publication_id: string;
}

interface ServerOptions {
  dbPath?: string;
  publicBaseUrl?: string;
  signerOrigin?: string;
  sessionTtlMs?: number;
  internalToken?: string;
}

interface ApiSuccess<T> {
  status: "ok";
  data: T;
}

interface ApiError {
  status: "error";
  error: string;
  code: string;
}

function ok<T>(data: T, init?: ResponseInit): Response {
  const payload: ApiSuccess<T> = { status: "ok", data };
  return json(payload, init);
}

function err(error: string, code: string, status = 400, init?: ResponseInit): Response {
  const payload: ApiError = { status: "error", error, code };
  return json(payload, { ...init, status });
}

function json(value: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(value, null, 2), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init?.headers ?? {}),
    },
  });
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new PlatformPublishError("Request body must be valid JSON.", "PLATFORM_INVALID_JSON");
  }
}

function resolveDbPath(providedPath?: string): string {
  const path =
    providedPath ??
    process.env.TONQUANT_PLATFORM_DB_PATH ??
    join(process.env.HOME ?? "/tmp", ".tonquant", "platform", "platform.sqlite");
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  return path;
}

function parseManifest(value: unknown): PublishManifest | undefined {
  if (!value) return undefined;
  return PublishManifestSchema.parse(value);
}

function insertAuditEvent(event: Parameters<typeof appendEvent>[0]): void {
  appendEvent(event);
}

function responseStatusForCode(code: string): number {
  if (code.includes("NOT_FOUND")) return 404;
  if (code.includes("UNAUTHORIZED")) return 401;
  if (code.includes("MISMATCH") || code.includes("REJECTED")) return 403;
  if (code.includes("EXPIRED")) return 410;
  if (code.includes("DUPLICATE")) return 409;
  if (code.includes("CONFIG_MISSING")) return 503;
  return 400;
}

function normalizeOrigin(value: string): string {
  return new URL(value).origin;
}

class PlatformStore {
  readonly db: Database;
  readonly publicBaseUrl: string;
  readonly signerOrigin: string;
  readonly sessionTtlMs: number;
  readonly internalToken: string | null;

  constructor(options: ServerOptions = {}) {
    this.db = new Database(resolveDbPath(options.dbPath));
    this.publicBaseUrl =
      options.publicBaseUrl ??
      process.env.TONQUANT_PLATFORM_PUBLIC_BASE_URL ??
      "http://localhost:3001";
    this.signerOrigin =
      options.signerOrigin ?? process.env.TONQUANT_PLATFORM_SIGNER_ORIGIN ?? this.publicBaseUrl;
    this.sessionTtlMs = options.sessionTtlMs ?? DEFAULT_SESSION_TTL_MS;
    this.internalToken =
      options.internalToken ?? process.env.TONQUANT_PLATFORM_INTERNAL_TOKEN ?? null;
    this.init();
  }

  close(): void {
    this.db.close();
  }

  private init(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS publisher_identities (
        publisher_address TEXT PRIMARY KEY,
        chain TEXT NOT NULL,
        network TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS factor_series (
        factor_slug TEXT PRIMARY KEY,
        owner_address TEXT NOT NULL,
        payout_address TEXT NOT NULL,
        current_active_version TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS signing_sessions (
        session_id TEXT PRIMARY KEY,
        action TEXT NOT NULL,
        factor_slug TEXT NOT NULL,
        factor_version TEXT,
        publisher_address TEXT NOT NULL,
        payout_address TEXT NOT NULL,
        network TEXT NOT NULL,
        audience TEXT NOT NULL,
        nonce TEXT NOT NULL UNIQUE,
        intent_json TEXT NOT NULL,
        intent_text TEXT NOT NULL,
        manifest_json TEXT,
        manifest_sha256 TEXT,
        status TEXT NOT NULL,
        sign_url TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        completed_at TEXT,
        publication_id TEXT
      );

      CREATE TABLE IF NOT EXISTS publications (
        publication_id TEXT PRIMARY KEY,
        action TEXT NOT NULL,
        factor_slug TEXT NOT NULL,
        factor_version TEXT NOT NULL,
        publisher_address TEXT NOT NULL,
        payout_address TEXT NOT NULL,
        manifest_json TEXT NOT NULL,
        manifest_sha256 TEXT NOT NULL,
        intent_json TEXT NOT NULL,
        status TEXT NOT NULL,
        rejection_reason TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        signed_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS factor_versions (
        factor_slug TEXT NOT NULL,
        factor_version TEXT NOT NULL,
        publisher_address TEXT NOT NULL,
        manifest_json TEXT NOT NULL,
        manifest_sha256 TEXT NOT NULL,
        status TEXT NOT NULL,
        rejection_reason TEXT,
        publication_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        activated_at TEXT,
        PRIMARY KEY (factor_slug, factor_version)
      );

      CREATE TABLE IF NOT EXISTS ledger_entries (
        entry_id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL UNIQUE,
        factor_slug TEXT NOT NULL,
        factor_version TEXT NOT NULL,
        publisher_address TEXT NOT NULL,
        payout_address TEXT NOT NULL,
        asset TEXT NOT NULL,
        amount_nano TEXT NOT NULL,
        status TEXT NOT NULL,
        source_ref TEXT NOT NULL,
        batch_id TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS settlement_batches (
        batch_id TEXT PRIMARY KEY,
        payout_address TEXT NOT NULL,
        asset TEXT NOT NULL,
        total_amount_nano TEXT NOT NULL,
        entry_ids_json TEXT NOT NULL,
        status TEXT NOT NULL,
        submission_ref TEXT,
        tx_hash TEXT,
        started_at TEXT NOT NULL,
        finished_at TEXT,
        failure_reason TEXT
      );
    `);
  }

  private inTransaction<T>(work: () => T): T {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const result = work();
      this.db.exec("COMMIT");
      return result;
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  private ensurePublisherIdentity(publisherAddress: string, network: "mainnet" | "testnet"): void {
    const now = new Date().toISOString();
    const normalized = normalizeTonAddress(publisherAddress);
    this.db
      .query(
        `INSERT OR IGNORE INTO publisher_identities (publisher_address, chain, network, created_at)
         VALUES (?, 'ton', ?, ?)`,
      )
      .run(normalized, network, now);
  }

  private parseSigningSession(
    row: Record<string, unknown> | null,
  ): ReturnType<typeof SigningSessionSchema.parse> {
    if (!row) {
      throw new PlatformPublishError(
        "Signing session not found.",
        "PLATFORM_SIGNING_SESSION_NOT_FOUND",
      );
    }
    return SigningSessionSchema.parse({
      sessionId: row.session_id,
      action: row.action,
      factorSlug: row.factor_slug,
      factorVersion: row.factor_version ?? undefined,
      publisherAddress: row.publisher_address,
      payoutAddress: row.payout_address,
      network: row.network,
      audience: row.audience,
      nonce: row.nonce,
      intent: JSON.parse(String(row.intent_json)),
      intentText: row.intent_text,
      manifest: row.manifest_json ? JSON.parse(String(row.manifest_json)) : undefined,
      manifestSha256: row.manifest_sha256 ?? undefined,
      status: row.status,
      signUrl: row.sign_url,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      completedAt: row.completed_at ?? undefined,
      publicationId: row.publication_id ?? undefined,
    });
  }

  private parsePublication(row: Record<string, unknown> | null): PublicationRecord {
    if (!row) {
      throw new PlatformPublishError("Publication not found.", "PLATFORM_PUBLICATION_NOT_FOUND");
    }
    return PublicationRecordSchema.parse({
      publicationId: row.publication_id,
      action: row.action,
      factorSlug: row.factor_slug,
      factorVersion: row.factor_version,
      publisherAddress: row.publisher_address,
      payoutAddress: row.payout_address,
      manifest: JSON.parse(String(row.manifest_json)),
      manifestSha256: row.manifest_sha256,
      intent: JSON.parse(String(row.intent_json)),
      status: row.status,
      rejectionReason: row.rejection_reason ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      signedAt: row.signed_at,
    });
  }

  private getSeries(slug: string): SeriesRow | null {
    return this.db
      .query(
        `SELECT factor_slug, owner_address, payout_address, current_active_version, created_at, updated_at
           FROM factor_series WHERE factor_slug = ?`,
      )
      .get(slug) as SeriesRow | null;
  }

  private getFactorVersion(slug: string, version: string): FactorVersionRow | null {
    return this.db
      .query(
        `SELECT factor_slug, factor_version, publisher_address, status, publication_id
           FROM factor_versions
           WHERE factor_slug = ? AND factor_version = ?`,
      )
      .get(slug, version) as FactorVersionRow | null;
  }

  getAllowedCorsOrigin(origin: string | null, internalRoute: boolean): string | null {
    if (!origin || internalRoute) {
      return null;
    }

    const allowed = new Set([
      normalizeOrigin(this.publicBaseUrl),
      normalizeOrigin(this.signerOrigin),
    ]);
    return allowed.has(origin) ? origin : null;
  }

  assertInternalAuthorized(request: Request): void {
    if (!this.internalToken) {
      throw new PlatformPublishError(
        "Internal API token is not configured.",
        "PLATFORM_INTERNAL_AUTH_CONFIG_MISSING",
      );
    }

    const authorization = request.headers.get("authorization");
    const bearer = authorization?.startsWith("Bearer ")
      ? authorization.slice("Bearer ".length)
      : null;
    const token = request.headers.get("x-tonquant-internal-token") ?? bearer;
    if (token !== this.internalToken) {
      throw new PlatformPublishError(
        "Internal API authorization required.",
        "PLATFORM_INTERNAL_UNAUTHORIZED",
      );
    }
  }

  private updateSessionCompletion(sessionId: string, publicationId?: string): void {
    const now = new Date().toISOString();
    this.db
      .query(
        `UPDATE signing_sessions
         SET status = 'completed', completed_at = ?, publication_id = COALESCE(?, publication_id)
         WHERE session_id = ?`,
      )
      .run(now, publicationId ?? null, sessionId);
  }

  createSigningSession(input: unknown) {
    const parsed = SigningSessionRequestSchema.parse(input);
    const manifest = parseManifest(parsed.manifest);
    const factorSlug = manifest?.factorSlug ?? parsed.factorSlug;
    const factorVersion = manifest?.factorVersion ?? parsed.factorVersion;
    const prepared = buildPreparedPlatformAction(
      PreparedPlatformActionSchema.parse({
        action: parsed.action,
        factorSlug,
        factorVersion,
        publisherAddress: normalizeTonAddress(parsed.publisherAddress),
        payoutAddress: normalizeTonAddress(parsed.payoutAddress),
        network: parsed.network,
        audience: parsed.audience,
        manifest,
      }),
    );
    const issuedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + this.sessionTtlMs).toISOString();
    const sessionId = createSessionId();
    const nonce = createNonce();
    const signOrigin = parsed.signerOrigin ?? normalizeOrigin(parsed.audience) ?? this.signerOrigin;
    const signUrl = `${signOrigin.replace(/\/$/u, "")}/sign?session=${encodeURIComponent(sessionId)}`;
    const session = buildSigningSession({
      prepared,
      nonce,
      sessionId,
      issuedAt,
      expiresAt,
      signUrl,
    });

    this.inTransaction(() => {
      this.ensurePublisherIdentity(session.publisherAddress, session.network);
      this.db
        .query(
          `INSERT INTO signing_sessions (
            session_id, action, factor_slug, factor_version, publisher_address, payout_address,
            network, audience, nonce, intent_json, intent_text, manifest_json, manifest_sha256,
            status, sign_url, expires_at, created_at, completed_at, publication_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)`,
        )
        .run(
          session.sessionId,
          session.action,
          session.factorSlug,
          session.factorVersion ?? null,
          session.publisherAddress,
          session.payoutAddress,
          session.network,
          session.audience,
          session.nonce,
          JSON.stringify(session.intent),
          session.intentText,
          session.manifest ? JSON.stringify(session.manifest) : null,
          session.manifestSha256 ?? null,
          session.status,
          session.signUrl,
          session.expiresAt,
          session.createdAt,
        );
      insertAuditEvent({
        type: "factor.platform.session.create",
        entity: { kind: "factor", id: session.factorSlug },
        result: "success",
        summary: `Created ${session.action} signing session for ${session.factorSlug}.`,
        payload: {
          sessionId: session.sessionId,
          publisherAddress: session.publisherAddress,
        },
      });
    });

    return session;
  }

  getSigningSession(sessionId: string) {
    const row = this.db
      .query(`SELECT * FROM signing_sessions WHERE session_id = ?`)
      .get(sessionId) as Record<string, unknown> | null;
    const session = this.parseSigningSession(row);
    if (session.status === "pending" && new Date(session.expiresAt).getTime() < Date.now()) {
      this.db
        .query(`UPDATE signing_sessions SET status = 'expired' WHERE session_id = ?`)
        .run(sessionId);
      return { ...session, status: "expired" as const };
    }
    return session;
  }

  completePublishSession(input: { slug?: string; body: unknown }): PublicationRecord {
    const parsed = SessionCompletionSchema.parse(input.body);
    const session = this.getSigningSession(parsed.sessionId);
    if (session.status !== "pending") {
      throw new PlatformPublishError(
        "Signing session is not pending.",
        "PLATFORM_SIGNING_SESSION_NOT_PENDING",
      );
    }
    if (session.action !== "publish_factor" && session.action !== "update_factor") {
      throw new PlatformPublishError(
        "Signing session action does not match publication submission.",
        "PLATFORM_SIGNING_SESSION_ACTION_MISMATCH",
      );
    }
    if (input.slug && input.slug !== session.factorSlug) {
      throw new PlatformPublishError(
        "Signing session factor slug does not match request path.",
        "PLATFORM_FACTOR_SLUG_MISMATCH",
      );
    }
    if (!session.manifest || !session.manifestSha256 || !session.factorVersion) {
      throw new PlatformPublishError(
        "Publication session is missing manifest state.",
        "PLATFORM_MANIFEST_REQUIRED",
      );
    }

    verifyTonConnectIntentSignature({
      intent: session.intent,
      signedResult: parsed.signedResult,
      publicKeyHex: parsed.publicKeyHex,
      expectedText: session.intentText,
    });

    const existingSeries = this.getSeries(session.factorSlug);
    const existingVersion = this.getFactorVersion(session.factorSlug, session.factorVersion);
    if (session.action === "publish_factor" && existingSeries) {
      throw new PlatformPublishError(
        "Factor slug already exists on the platform. Use update instead.",
        "PLATFORM_FACTOR_SLUG_DUPLICATE",
      );
    }
    if (session.action === "update_factor" && !existingSeries) {
      throw new PlatformPublishError(
        "Cannot update a factor that does not exist on the platform.",
        "PLATFORM_FACTOR_SERIES_NOT_FOUND",
      );
    }
    if (existingSeries && existingSeries.owner_address !== session.publisherAddress) {
      throw new PlatformPublishError(
        "Only the owning wallet can publish updates for this factor.",
        "PLATFORM_OWNER_MISMATCH",
      );
    }
    if (existingVersion && existingVersion.status !== "rejected") {
      throw new PlatformPublishError(
        "Factor version already has a live or pending publication.",
        "PLATFORM_FACTOR_VERSION_DUPLICATE",
      );
    }

    const publicationId = createPublicationId();
    const signedAt = new Date(parsed.signedResult.timestamp * 1000).toISOString();
    const publication = PublicationRecordSchema.parse({
      publicationId,
      action: session.action,
      factorSlug: session.factorSlug,
      factorVersion: session.factorVersion,
      publisherAddress: session.publisherAddress,
      payoutAddress: session.payoutAddress,
      manifest: session.manifest,
      manifestSha256: session.manifestSha256,
      intent: session.intent,
      status: "pending_review",
      createdAt: signedAt,
      updatedAt: signedAt,
      signedAt,
    });

    this.inTransaction(() => {
      this.db
        .query(
          `INSERT INTO publications (
            publication_id, action, factor_slug, factor_version, publisher_address, payout_address,
            manifest_json, manifest_sha256, intent_json, status, rejection_reason,
            created_at, updated_at, signed_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)`,
        )
        .run(
          publication.publicationId,
          publication.action,
          publication.factorSlug,
          publication.factorVersion,
          publication.publisherAddress,
          publication.payoutAddress,
          JSON.stringify(publication.manifest),
          publication.manifestSha256,
          JSON.stringify(publication.intent),
          publication.status,
          publication.createdAt,
          publication.updatedAt,
          publication.signedAt,
        );

      if (existingVersion?.status === "rejected") {
        this.db
          .query(
            `UPDATE factor_versions
             SET publisher_address = ?, manifest_json = ?, manifest_sha256 = ?, status = 'pending_review',
                 rejection_reason = NULL, publication_id = ?, created_at = ?, updated_at = ?, activated_at = NULL
             WHERE factor_slug = ? AND factor_version = ?`,
          )
          .run(
            publication.publisherAddress,
            JSON.stringify(publication.manifest),
            publication.manifestSha256,
            publication.publicationId,
            publication.createdAt,
            publication.updatedAt,
            publication.factorSlug,
            publication.factorVersion,
          );
      } else {
        this.db
          .query(
            `INSERT INTO factor_versions (
              factor_slug, factor_version, publisher_address, manifest_json, manifest_sha256,
              status, rejection_reason, publication_id, created_at, updated_at, activated_at
            ) VALUES (?, ?, ?, ?, ?, 'pending_review', NULL, ?, ?, ?, NULL)`,
          )
          .run(
            publication.factorSlug,
            publication.factorVersion,
            publication.publisherAddress,
            JSON.stringify(publication.manifest),
            publication.manifestSha256,
            publication.publicationId,
            publication.createdAt,
            publication.updatedAt,
          );
      }

      this.updateSessionCompletion(session.sessionId, publication.publicationId);
      insertAuditEvent({
        type: "factor.platform.publish.submit",
        entity: { kind: "factor", id: publication.factorSlug },
        result: "success",
        summary: `Submitted ${publication.factorSlug}@${publication.factorVersion} for review.`,
        payload: {
          publicationId: publication.publicationId,
          publisherAddress: publication.publisherAddress,
        },
      });
    });

    return publication;
  }

  completePayoutChange(input: { slug: string; body: unknown }) {
    const parsed = SessionCompletionSchema.parse(input.body);
    const session = this.getSigningSession(parsed.sessionId);
    if (session.status !== "pending") {
      throw new PlatformPublishError(
        "Signing session is not pending.",
        "PLATFORM_SIGNING_SESSION_NOT_PENDING",
      );
    }
    if (session.action !== "set_payout_address") {
      throw new PlatformPublishError(
        "Signing session action does not match payout change.",
        "PLATFORM_SIGNING_SESSION_ACTION_MISMATCH",
      );
    }
    if (session.factorSlug !== input.slug) {
      throw new PlatformPublishError(
        "Signing session factor slug does not match request path.",
        "PLATFORM_FACTOR_SLUG_MISMATCH",
      );
    }

    verifyTonConnectIntentSignature({
      intent: session.intent,
      signedResult: parsed.signedResult,
      publicKeyHex: parsed.publicKeyHex,
      expectedText: session.intentText,
    });

    const existingSeries = this.getSeries(session.factorSlug);
    if (!existingSeries) {
      throw new PlatformPublishError(
        "Factor series not found.",
        "PLATFORM_FACTOR_SERIES_NOT_FOUND",
      );
    }
    if (existingSeries.owner_address !== session.publisherAddress) {
      throw new PlatformPublishError(
        "Only the owning wallet can change payout address.",
        "PLATFORM_OWNER_MISMATCH",
      );
    }

    const changedAt = new Date(parsed.signedResult.timestamp * 1000).toISOString();
    const result = PayoutChangeResultSchema.parse({
      factorSlug: session.factorSlug,
      publisherAddress: session.publisherAddress,
      payoutAddress: session.payoutAddress,
      changedAt,
    });

    this.inTransaction(() => {
      this.db
        .query(`UPDATE factor_series SET payout_address = ?, updated_at = ? WHERE factor_slug = ?`)
        .run(result.payoutAddress, changedAt, result.factorSlug);
      this.updateSessionCompletion(session.sessionId);
      insertAuditEvent({
        type: "factor.platform.payout.set",
        entity: { kind: "factor", id: result.factorSlug },
        result: "success",
        summary: `Updated payout address for ${result.factorSlug}.`,
        payload: {
          payoutAddress: result.payoutAddress,
        },
      });
    });

    return result;
  }

  reviewPublication(publicationId: string, input: unknown): PublicationRecord {
    const parsed = ReviewDecisionSchema.parse(input);
    const row = this.db
      .query(`SELECT * FROM publications WHERE publication_id = ?`)
      .get(publicationId) as Record<string, unknown> | null;
    const publication = this.parsePublication(row);

    if (publication.status !== "pending_review") {
      throw new PlatformPublishError(
        "Publication is not pending review.",
        "PLATFORM_PUBLICATION_NOT_PENDING_REVIEW",
      );
    }

    const now = new Date().toISOString();
    const nextStatus = parsed.decision === "approve" ? "active" : "rejected";
    const existingSeries = this.getSeries(publication.factorSlug);

    const updated = PublicationRecordSchema.parse({
      ...publication,
      status: nextStatus,
      rejectionReason: parsed.decision === "reject" ? parsed.rejectionReason : undefined,
      updatedAt: now,
    });

    this.inTransaction(() => {
      if (parsed.decision === "approve") {
        this.db
          .query(
            `UPDATE factor_versions
             SET status = 'superseded', updated_at = ?
             WHERE factor_slug = ? AND status = 'active'`,
          )
          .run(now, publication.factorSlug);
        this.db
          .query(
            `UPDATE publications
             SET status = 'superseded', updated_at = ?
             WHERE factor_slug = ? AND status = 'active'`,
          )
          .run(now, publication.factorSlug);
      }

      this.db
        .query(
          `UPDATE publications
           SET status = ?, rejection_reason = ?, updated_at = ?
           WHERE publication_id = ?`,
        )
        .run(
          updated.status,
          updated.rejectionReason ?? null,
          updated.updatedAt,
          updated.publicationId,
        );

      this.db
        .query(
          `UPDATE factor_versions
           SET status = ?, rejection_reason = ?, updated_at = ?, activated_at = ?
           WHERE factor_slug = ? AND factor_version = ?`,
        )
        .run(
          updated.status,
          updated.rejectionReason ?? null,
          updated.updatedAt,
          parsed.decision === "approve" ? now : null,
          updated.factorSlug,
          updated.factorVersion,
        );

      if (parsed.decision === "approve") {
        if (!existingSeries) {
          this.db
            .query(
              `INSERT INTO factor_series (
                factor_slug, owner_address, payout_address, current_active_version, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?)`,
            )
            .run(
              updated.factorSlug,
              updated.publisherAddress,
              updated.payoutAddress,
              updated.factorVersion,
              now,
              now,
            );
        } else {
          this.db
            .query(
              `UPDATE factor_series
               SET current_active_version = ?, updated_at = ?
               WHERE factor_slug = ?`,
            )
            .run(updated.factorVersion, now, updated.factorSlug);
        }
      }

      insertAuditEvent({
        type:
          parsed.decision === "approve"
            ? "factor.platform.review.approve"
            : "factor.platform.review.reject",
        entity: { kind: "factor", id: updated.factorSlug },
        result: "success",
        summary:
          parsed.decision === "approve"
            ? `Approved ${updated.factorSlug}@${updated.factorVersion}.`
            : `Rejected ${updated.factorSlug}@${updated.factorVersion}.`,
        payload: {
          publicationId: updated.publicationId,
          rejectionReason: updated.rejectionReason,
        },
      });
    });

    return updated;
  }

  getPublicationStatus(publicationId: string): PublicationStatusResponse {
    const row = this.db
      .query(`SELECT * FROM publications WHERE publication_id = ?`)
      .get(publicationId) as Record<string, unknown> | null;
    const publication = this.parsePublication(row);
    const activeVersionRow = this.db
      .query(
        `SELECT factor_slug, factor_version, manifest_sha256, activated_at
         FROM factor_versions WHERE factor_slug = ? AND status = 'active'`,
      )
      .get(publication.factorSlug) as {
      factor_slug: string;
      factor_version: string;
      manifest_sha256: string;
      activated_at: string | null;
    } | null;

    return PublicationStatusResponseSchema.parse({
      publication,
      activeVersion: activeVersionRow
        ? {
            factorSlug: activeVersionRow.factor_slug,
            factorVersion: activeVersionRow.factor_version,
            manifestSha256: activeVersionRow.manifest_sha256,
            activatedAt: activeVersionRow.activated_at ?? publication.updatedAt,
          }
        : undefined,
    });
  }

  recordCommissionEvent(input: unknown) {
    const parsed = CommissionEventInputSchema.parse(input);
    const version = this.db
      .query(
        `SELECT factor_slug, factor_version, publisher_address
         FROM factor_versions
         WHERE factor_slug = ? AND factor_version = ? AND status = 'active'`,
      )
      .get(parsed.factorSlug, parsed.factorVersion) as {
      factor_slug: string;
      factor_version: string;
      publisher_address: string;
    } | null;

    if (!version) {
      throw new PlatformPublishError(
        "Commission events require an active factor version.",
        "PLATFORM_ACTIVE_VERSION_REQUIRED",
      );
    }

    const series = this.getSeries(parsed.factorSlug);
    if (!series) {
      throw new PlatformPublishError(
        "Factor series not found.",
        "PLATFORM_FACTOR_SERIES_NOT_FOUND",
      );
    }

    const now = new Date().toISOString();
    const entry = CommissionLedgerEntrySchema.parse({
      entryId: `led_${createNonce()}`,
      eventId: parsed.eventId,
      factorSlug: parsed.factorSlug,
      factorVersion: parsed.factorVersion,
      publisherAddress: version.publisher_address,
      payoutAddress: series.payout_address,
      asset: "TON",
      amountNano: parsed.amountNano,
      status: "pending",
      sourceRef: parsed.sourceRef,
      createdAt: now,
    });

    this.inTransaction(() => {
      this.db
        .query(
          `INSERT INTO ledger_entries (
            entry_id, event_id, factor_slug, factor_version, publisher_address, payout_address,
            asset, amount_nano, status, source_ref, batch_id, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)`,
        )
        .run(
          entry.entryId,
          entry.eventId,
          entry.factorSlug,
          entry.factorVersion,
          entry.publisherAddress,
          entry.payoutAddress,
          entry.asset,
          entry.amountNano,
          entry.status,
          entry.sourceRef,
          entry.createdAt,
        );
      insertAuditEvent({
        type: "factor.platform.commission.record",
        entity: { kind: "factor", id: entry.factorSlug },
        result: "success",
        summary: `Recorded commission event ${entry.eventId} for ${entry.factorSlug}.`,
        payload: {
          amountNano: entry.amountNano,
          payoutAddress: entry.payoutAddress,
        },
      });
    });

    return entry;
  }

  private claimSettlementBatches(): SettlementBatch[] {
    return this.inTransaction(() => {
      const pendingRows = this.db
        .query(
          `SELECT entry_id, payout_address, amount_nano
           FROM ledger_entries
           WHERE status = 'pending' AND asset = 'TON'
           ORDER BY created_at ASC`,
        )
        .all() as Array<{ entry_id: string; payout_address: string; amount_nano: string }>;

      const grouped = new Map<string, Array<{ entry_id: string; amount_nano: string }>>();
      for (const row of pendingRows) {
        const current = grouped.get(row.payout_address) ?? [];
        current.push({ entry_id: row.entry_id, amount_nano: row.amount_nano });
        grouped.set(row.payout_address, current);
      }

      const batches: SettlementBatch[] = [];
      for (const [payoutAddress, entries] of grouped.entries()) {
        const now = new Date().toISOString();
        const totalAmountNano = entries
          .reduce((sum, entry) => sum + BigInt(entry.amount_nano), 0n)
          .toString();
        const batch = SettlementBatchSchema.parse({
          batchId: createSettlementBatchId(),
          payoutAddress,
          asset: "TON",
          totalAmountNano,
          entryIds: entries.map((entry) => entry.entry_id),
          status: "queued",
          startedAt: now,
        });

        this.db
          .query(
            `INSERT INTO settlement_batches (
              batch_id, payout_address, asset, total_amount_nano, entry_ids_json, status,
              submission_ref, tx_hash, started_at, finished_at, failure_reason
            ) VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, ?, NULL, NULL)`,
          )
          .run(
            batch.batchId,
            batch.payoutAddress,
            batch.asset,
            batch.totalAmountNano,
            JSON.stringify(batch.entryIds),
            batch.status,
            batch.startedAt,
          );
        this.db
          .query(
            `UPDATE ledger_entries SET status = 'queued', batch_id = ? WHERE entry_id IN (${entries.map(() => "?").join(",")})`,
          )
          .run(batch.batchId, ...entries.map((entry) => entry.entry_id));
        batches.push(batch);
      }

      return batches;
    });
  }

  private async submitSettlementTransfer(
    batch: SettlementBatch,
  ): Promise<{ submissionRef: string }> {
    const endpoint = process.env.TONQUANT_PLATFORM_TON_RPC_URL;
    const mnemonic = process.env.TONQUANT_PLATFORM_SETTLEMENT_MNEMONIC;
    if (!endpoint || !mnemonic) {
      throw new PlatformPublishError(
        "Settlement requires TONQUANT_PLATFORM_TON_RPC_URL and TONQUANT_PLATFORM_SETTLEMENT_MNEMONIC.",
        "PLATFORM_SETTLEMENT_CONFIG_MISSING",
      );
    }

    const client = new TonClient({ endpoint });
    const keyPair = await mnemonicToWalletKey(mnemonic.trim().split(/\s+/u));
    const wallet = WalletContractV5R1.create({ workchain: 0, publicKey: keyPair.publicKey });
    const opened = client.open(wallet);
    const seqno = await opened.getSeqno();

    const transfer = await wallet.createTransfer({
      seqno,
      secretKey: keyPair.secretKey,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      messages: [
        internal({
          to: Address.parse(batch.payoutAddress),
          value: BigInt(batch.totalAmountNano),
          bounce: false,
        }),
      ],
    });

    await opened.send(transfer);
    return { submissionRef: transfer.hash().toString("hex") };
  }

  async runSettlements(): Promise<SettlementBatch[]> {
    const claimedBatches = this.claimSettlementBatches();
    const results: SettlementBatch[] = [];
    for (const batch of claimedBatches) {
      try {
        const submission = await this.submitSettlementTransfer(batch);
        const finishedAt = new Date().toISOString();
        this.inTransaction(() => {
          this.db
            .query(
              `UPDATE settlement_batches
               SET status = 'submitted', submission_ref = ?, finished_at = ?
               WHERE batch_id = ?`,
            )
            .run(submission.submissionRef, finishedAt, batch.batchId);
          this.db
            .query(`UPDATE ledger_entries SET status = 'submitted' WHERE batch_id = ?`)
            .run(batch.batchId);
          insertAuditEvent({
            type: "factor.platform.settlement.submit",
            entity: { kind: "factor", id: batch.payoutAddress },
            result: "success",
            summary: `Submitted settlement batch ${batch.batchId}.`,
            payload: {
              payoutAddress: batch.payoutAddress,
              totalAmountNano: batch.totalAmountNano,
              submissionRef: submission.submissionRef,
            },
          });
        });
        results.push({
          ...batch,
          status: "submitted",
          submissionRef: submission.submissionRef,
          finishedAt,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const finishedAt = new Date().toISOString();
        this.inTransaction(() => {
          this.db
            .query(
              `UPDATE settlement_batches
               SET status = 'failed', failure_reason = ?, finished_at = ?
               WHERE batch_id = ?`,
            )
            .run(message, finishedAt, batch.batchId);
          this.db
            .query(
              `UPDATE ledger_entries SET status = 'pending', batch_id = NULL WHERE batch_id = ?`,
            )
            .run(batch.batchId);
          insertAuditEvent({
            type: "factor.platform.settlement.fail",
            entity: { kind: "factor", id: batch.payoutAddress },
            result: "failure",
            summary: `Settlement batch ${batch.batchId} failed.`,
            payload: {
              failureReason: message,
            },
          });
        });
        results.push({
          ...batch,
          status: "failed",
          failureReason: message,
          finishedAt,
        });
      }
    }

    return results;
  }

  getSettlement(batchId: string): SettlementBatch {
    const row = this.db
      .query(
        `SELECT batch_id, payout_address, asset, total_amount_nano, entry_ids_json, status,
                submission_ref, tx_hash, started_at, finished_at, failure_reason
         FROM settlement_batches WHERE batch_id = ?`,
      )
      .get(batchId) as Record<string, unknown> | null;

    if (!row) {
      throw new PlatformPublishError(
        "Settlement batch not found.",
        "PLATFORM_SETTLEMENT_NOT_FOUND",
      );
    }

    return SettlementBatchSchema.parse({
      batchId: row.batch_id,
      payoutAddress: row.payout_address,
      asset: row.asset,
      totalAmountNano: row.total_amount_nano,
      entryIds: JSON.parse(String(row.entry_ids_json)),
      status: row.status,
      submissionRef: row.submission_ref ?? undefined,
      txHash: row.tx_hash ?? undefined,
      startedAt: row.started_at,
      finishedAt: row.finished_at ?? undefined,
      failureReason: row.failure_reason ?? undefined,
    });
  }
}

export function createPlatformApiServer(options: ServerOptions = {}) {
  const store = new PlatformStore(options);

  const fetch = async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const internalRoute = pathname.startsWith("/v1/internal/");
    const allowedOrigin = store.getAllowedCorsOrigin(request.headers.get("origin"), internalRoute);
    const responseHeaders = {
      ...(allowedOrigin
        ? {
            "access-control-allow-origin": allowedOrigin,
            "access-control-allow-methods": "GET,POST,OPTIONS",
            "access-control-allow-headers": "content-type",
            vary: "origin",
          }
        : {}),
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: allowedOrigin ? 204 : 403,
        headers: responseHeaders,
      });
    }

    try {
      if (request.method === "POST" && pathname === "/v1/wallet/nonce") {
        return ok(store.createSigningSession(await readJson(request)), {
          headers: responseHeaders,
        });
      }

      if (request.method === "GET" && pathname.startsWith("/v1/signing-sessions/")) {
        return ok(store.getSigningSession(pathname.split("/").at(-1) ?? ""), {
          headers: responseHeaders,
        });
      }

      if (request.method === "POST" && pathname === "/v1/factors/publish") {
        return ok(store.completePublishSession({ body: await readJson(request) }), {
          headers: responseHeaders,
        });
      }

      if (
        request.method === "POST" &&
        pathname.includes("/v1/factors/") &&
        pathname.endsWith("/update")
      ) {
        const slug = pathname.split("/")[3];
        return ok(
          store.completePublishSession({ slug: slug ?? "", body: await readJson(request) }),
          {
            headers: responseHeaders,
          },
        );
      }

      if (
        request.method === "POST" &&
        pathname.includes("/v1/factors/") &&
        pathname.endsWith("/payout-address")
      ) {
        const slug = pathname.split("/")[3];
        return ok(store.completePayoutChange({ slug: slug ?? "", body: await readJson(request) }), {
          headers: responseHeaders,
        });
      }

      if (request.method === "GET" && pathname.startsWith("/v1/publications/")) {
        return ok(store.getPublicationStatus(pathname.split("/").at(-1) ?? ""), {
          headers: responseHeaders,
        });
      }

      if (
        request.method === "POST" &&
        pathname.startsWith("/v1/internal/publications/") &&
        pathname.endsWith("/review")
      ) {
        store.assertInternalAuthorized(request);
        const publicationId = pathname.split("/")[4];
        return ok(store.reviewPublication(publicationId ?? "", await readJson(request)), {
          headers: responseHeaders,
        });
      }

      if (request.method === "POST" && pathname === "/v1/internal/commission-events") {
        store.assertInternalAuthorized(request);
        return ok(store.recordCommissionEvent(await readJson(request)), {
          headers: responseHeaders,
        });
      }

      if (request.method === "POST" && pathname === "/v1/internal/settlements/run") {
        store.assertInternalAuthorized(request);
        return ok(await store.runSettlements(), { headers: responseHeaders });
      }

      if (request.method === "GET" && pathname.startsWith("/v1/internal/settlements/")) {
        store.assertInternalAuthorized(request);
        return ok(store.getSettlement(pathname.split("/").at(-1) ?? ""), {
          headers: responseHeaders,
        });
      }

      return err("Route not found.", "PLATFORM_ROUTE_NOT_FOUND", 404, { headers: responseHeaders });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return err(
          error.issues[0]?.message ?? "Validation failed.",
          "PLATFORM_VALIDATION_ERROR",
          400,
          { headers: responseHeaders },
        );
      }
      if (error instanceof PlatformPublishError) {
        return err(error.message, error.code, responseStatusForCode(error.code), {
          headers: responseHeaders,
        });
      }
      const message = error instanceof Error ? error.message : String(error);
      return err(message, "PLATFORM_UNKNOWN_ERROR", 500, { headers: responseHeaders });
    }
  };

  return {
    fetch,
    close: () => store.close(),
    store,
  };
}
