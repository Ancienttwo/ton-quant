import { z } from "zod";
import { FactorRegistryEntrySchema } from "./factor-registry.js";

export const RawTonAddressSchema = z
  .string()
  .regex(/^-?\d+:[0-9a-fA-F]{64}$/u, "TON address must use raw workchain:hash format");
export type RawTonAddress = z.infer<typeof RawTonAddressSchema>;

export const TonNetworkSchema = z.enum(["mainnet", "testnet"]);
export type TonNetwork = z.infer<typeof TonNetworkSchema>;

export const PlatformActionSchema = z.enum([
  "publish_factor",
  "update_factor",
  "set_payout_address",
]);
export type PlatformAction = z.infer<typeof PlatformActionSchema>;

export const PublicationStatusSchema = z.enum([
  "pending_review",
  "active",
  "rejected",
  "superseded",
]);
export type PublicationStatus = z.infer<typeof PublicationStatusSchema>;

export const SigningSessionStatusSchema = z.enum(["pending", "completed", "expired", "cancelled"]);
export type SigningSessionStatus = z.infer<typeof SigningSessionStatusSchema>;

export const SettlementStatusSchema = z.enum([
  "pending",
  "queued",
  "submitted",
  "confirmed",
  "failed",
]);
export type SettlementStatus = z.infer<typeof SettlementStatusSchema>;

export const PublishManifestSchema = z.object({
  kind: z.literal("tonquant.factor.publish-manifest"),
  manifestVersion: z.literal("1.0.0"),
  factorSlug: z.string().min(1),
  factorVersion: z.string().min(1),
  factor: FactorRegistryEntrySchema,
  preparedAt: z.string().datetime(),
});
export type PublishManifest = z.infer<typeof PublishManifestSchema>;

export const PreparedPlatformActionSchema = z
  .object({
    action: PlatformActionSchema,
    factorSlug: z.string().min(1),
    factorVersion: z.string().min(1).optional(),
    publisherAddress: RawTonAddressSchema,
    payoutAddress: RawTonAddressSchema,
    network: TonNetworkSchema,
    audience: z.string().url(),
    manifest: PublishManifestSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.action !== "set_payout_address" && !value.manifest) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "publish/update actions require a manifest",
        path: ["manifest"],
      });
    }
    if (value.manifest) {
      if (value.factorSlug !== value.manifest.factorSlug) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "factorSlug must match manifest.factorSlug",
          path: ["factorSlug"],
        });
      }
      if (value.factorVersion !== value.manifest.factorVersion) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "factorVersion must match manifest.factorVersion",
          path: ["factorVersion"],
        });
      }
    }
  });
export type PreparedPlatformAction = z.infer<typeof PreparedPlatformActionSchema>;

export const PublishIntentSchema = z
  .object({
    kind: z.literal("tonquant.factor.publish-intent"),
    action: PlatformActionSchema,
    factorSlug: z.string().min(1),
    factorVersion: z.string().min(1).optional(),
    publisherAddress: RawTonAddressSchema,
    payoutAddress: RawTonAddressSchema,
    manifestSha256: z
      .string()
      .regex(/^[0-9a-f]{64}$/u)
      .optional(),
    nonce: z.string().min(1),
    issuedAt: z.string().datetime(),
    expiresAt: z.string().datetime(),
    audience: z.string().url(),
    chain: z.literal("ton"),
    network: TonNetworkSchema,
  })
  .superRefine((value, ctx) => {
    if (value.action !== "set_payout_address" && !value.factorVersion) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "publish/update intents require a factorVersion",
        path: ["factorVersion"],
      });
    }
    if (value.action !== "set_payout_address" && !value.manifestSha256) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "publish/update intents require a manifestSha256",
        path: ["manifestSha256"],
      });
    }
  });
export type PublishIntent = z.infer<typeof PublishIntentSchema>;

export const TonConnectTextPayloadSchema = z.object({
  type: z.literal("text"),
  text: z.string().min(1),
  network: z.enum(["-239", "-3"]),
  from: RawTonAddressSchema,
});
export type TonConnectTextPayload = z.infer<typeof TonConnectTextPayloadSchema>;

export const TonConnectSignDataResultSchema = z.object({
  signature: z.string().min(1),
  address: RawTonAddressSchema,
  timestamp: z.number().int().nonnegative(),
  domain: z.string().min(1),
  payload: TonConnectTextPayloadSchema,
});
export type TonConnectSignDataResult = z.infer<typeof TonConnectSignDataResultSchema>;

export const SigningSessionSchema = z.object({
  sessionId: z.string().min(1),
  action: PlatformActionSchema,
  factorSlug: z.string().min(1),
  factorVersion: z.string().min(1).optional(),
  publisherAddress: RawTonAddressSchema,
  payoutAddress: RawTonAddressSchema,
  network: TonNetworkSchema,
  audience: z.string().url(),
  nonce: z.string().min(1),
  intent: PublishIntentSchema,
  intentText: z.string().min(1),
  manifest: PublishManifestSchema.optional(),
  manifestSha256: z
    .string()
    .regex(/^[0-9a-f]{64}$/u)
    .optional(),
  status: SigningSessionStatusSchema,
  signUrl: z.string().url(),
  expiresAt: z.string().datetime(),
  createdAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  publicationId: z.string().min(1).optional(),
});
export type SigningSession = z.infer<typeof SigningSessionSchema>;

export const PublicationRecordSchema = z.object({
  publicationId: z.string().min(1),
  action: z.enum(["publish_factor", "update_factor"]),
  factorSlug: z.string().min(1),
  factorVersion: z.string().min(1),
  publisherAddress: RawTonAddressSchema,
  payoutAddress: RawTonAddressSchema,
  manifest: PublishManifestSchema,
  manifestSha256: z.string().regex(/^[0-9a-f]{64}$/u),
  intent: PublishIntentSchema,
  status: PublicationStatusSchema,
  rejectionReason: z.string().min(1).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  signedAt: z.string().datetime(),
});
export type PublicationRecord = z.infer<typeof PublicationRecordSchema>;

export const PublicationStatusResponseSchema = z.object({
  publication: PublicationRecordSchema,
  activeVersion: z
    .object({
      factorSlug: z.string().min(1),
      factorVersion: z.string().min(1),
      manifestSha256: z.string().regex(/^[0-9a-f]{64}$/u),
      activatedAt: z.string().datetime(),
    })
    .optional(),
});
export type PublicationStatusResponse = z.infer<typeof PublicationStatusResponseSchema>;

export const PayoutChangeResultSchema = z.object({
  factorSlug: z.string().min(1),
  publisherAddress: RawTonAddressSchema,
  payoutAddress: RawTonAddressSchema,
  changedAt: z.string().datetime(),
});
export type PayoutChangeResult = z.infer<typeof PayoutChangeResultSchema>;

export const CommissionEventInputSchema = z.object({
  eventId: z.string().min(1),
  factorSlug: z.string().min(1),
  factorVersion: z.string().min(1),
  amountNano: z.string().regex(/^\d+$/u),
  sourceRef: z.string().min(1),
});
export type CommissionEventInput = z.infer<typeof CommissionEventInputSchema>;

export const CommissionLedgerEntrySchema = z.object({
  entryId: z.string().min(1),
  eventId: z.string().min(1),
  factorSlug: z.string().min(1),
  factorVersion: z.string().min(1),
  publisherAddress: RawTonAddressSchema,
  payoutAddress: RawTonAddressSchema,
  asset: z.literal("TON"),
  amountNano: z.string().regex(/^\d+$/u),
  status: SettlementStatusSchema,
  sourceRef: z.string().min(1),
  batchId: z.string().min(1).optional(),
  createdAt: z.string().datetime(),
});
export type CommissionLedgerEntry = z.infer<typeof CommissionLedgerEntrySchema>;

export const SettlementBatchSchema = z.object({
  batchId: z.string().min(1),
  payoutAddress: RawTonAddressSchema,
  asset: z.literal("TON"),
  totalAmountNano: z.string().regex(/^\d+$/u),
  entryIds: z.array(z.string().min(1)).min(1),
  status: SettlementStatusSchema,
  submissionRef: z.string().min(1).optional(),
  txHash: z.string().min(1).optional(),
  startedAt: z.string().datetime(),
  finishedAt: z.string().datetime().optional(),
  failureReason: z.string().min(1).optional(),
});
export type SettlementBatch = z.infer<typeof SettlementBatchSchema>;
