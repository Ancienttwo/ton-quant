import { z } from "zod";

// ============================================================
// Factor Registry Schemas
// Single source of truth for marketplace factor metadata.
// Extends the quant boundary's FactorDescriptorSchema concepts
// with registry-specific fields (backtest, visibility, author).
// ============================================================

export const FactorCategorySchema = z.enum([
  "momentum",
  "value",
  "volatility",
  "liquidity",
  "sentiment",
  "custom",
]);
export type FactorCategory = z.infer<typeof FactorCategorySchema>;

export const FactorSourceTypeSchema = z.enum(["indicator", "liquidity", "derived"]);

export const FactorParameterEntrySchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  defaultValue: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
});
export type FactorParameterEntry = z.infer<typeof FactorParameterEntrySchema>;

export const FactorBacktestSummarySchema = z.object({
  sharpe: z.number(),
  maxDrawdown: z.number(),
  winRate: z.number(),
  cagr: z.number(),
  dataRange: z.object({
    start: z.string(),
    end: z.string(),
  }),
  tradeCount: z.number().int().nonnegative(),
});
export type FactorBacktestSummary = z.infer<typeof FactorBacktestSummarySchema>;

export const FactorVisibilitySchema = z.enum(["free", "preview", "paid"]);

// Factor ID: lowercase alphanumeric + underscores, 3-64 chars
export const FactorIdSchema = z
  .string()
  .regex(/^[a-z0-9_]{3,64}$/u, "Factor ID must be 3-64 chars, lowercase alphanumeric + underscore");

// ── Public layer (always visible) ──────────────────────────
export const FactorMetaPublicSchema = z.object({
  id: FactorIdSchema,
  name: z.string().min(1),
  author: z.string().min(1),
  category: FactorCategorySchema,
  source: FactorSourceTypeSchema,
  assets: z.array(z.string().min(1)).min(1),
  timeframe: z.string().min(1),
  description: z.string().min(1),
  parameters: z.array(FactorParameterEntrySchema).default([]),
  backtest: FactorBacktestSummarySchema,
  visibility: FactorVisibilitySchema.default("free"),
  version: z.string().default("1.0.0"),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type FactorMetaPublic = z.infer<typeof FactorMetaPublicSchema>;

// ── Private layer (visible after subscribe/purchase) ───────
export const FactorMetaPrivateSchema = z.object({
  parameterValues: z.record(z.string(), z.union([z.string(), z.number()])),
  formula: z.string().optional(),
  signalThresholds: z
    .object({
      buy: z.number(),
      sell: z.number(),
    })
    .optional(),
});
export type FactorMetaPrivate = z.infer<typeof FactorMetaPrivateSchema>;

// ── Full factor (public + private combined) ────────────────
export const FactorRegistryEntrySchema = z.object({
  public: FactorMetaPublicSchema,
  private: FactorMetaPrivateSchema.optional(),
});
export type FactorRegistryEntry = z.infer<typeof FactorRegistryEntrySchema>;

// ── Registry index ─────────────────────────────────────────
export const FactorRegistryIndexSchema = z.object({
  version: z.string().default("1.0.0"),
  factors: z.array(FactorMetaPublicSchema).default([]),
});
export type FactorRegistryIndex = z.infer<typeof FactorRegistryIndexSchema>;

// ── Subscription record ────────────────────────────────────
export const FactorSubscriptionSchema = z.object({
  factorId: FactorIdSchema,
  subscribedAt: z.string(),
  subscribedVersion: z.string(),
});
export type FactorSubscription = z.infer<typeof FactorSubscriptionSchema>;

export const SubscriptionFileSchema = z.object({
  subscriptions: z.array(FactorSubscriptionSchema).default([]),
});

// ── Social proof report ────────────────────────────────────
export const FactorPerformanceReportSchema = z.object({
  factorId: FactorIdSchema,
  agentId: z.string().min(1),
  returnPct: z.number(),
  period: z.string().min(1),
  reportedAt: z.string(),
  verified: z.literal(false).default(false),
});
export type FactorPerformanceReport = z.infer<typeof FactorPerformanceReportSchema>;

// ── Alert definition ───────────────────────────────────────
export const FactorAlertSchema = z.object({
  factorId: FactorIdSchema,
  condition: z.enum(["above", "below"]),
  threshold: z.number(),
  createdAt: z.string(),
  active: z.boolean().default(true),
});
export type FactorAlert = z.infer<typeof FactorAlertSchema>;

export const AlertsFileSchema = z.object({
  alerts: z.array(FactorAlertSchema).default([]),
});

export const ReportsFileSchema = z.object({
  reports: z.array(FactorPerformanceReportSchema).default([]),
});
