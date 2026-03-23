import { join } from "node:path";
import { z } from "zod";
import { CONFIG_DIR } from "../../types/config.js";

export const TONQUANT_QUANT_ROOT = join(CONFIG_DIR, "quant");

export const DateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/u, "Expected YYYY-MM-DD");

export const MarketCodeSchema = z.enum(["ton"]);
export type MarketCode = z.infer<typeof MarketCodeSchema>;

export const DataModeSchema = z.enum(["cached", "live", "derived"]);
export type DataMode = z.infer<typeof DataModeSchema>;

export const QuantParamValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
export type QuantParamValue = z.infer<typeof QuantParamValueSchema>;

export const ArtifactKindSchema = z.enum(["json", "log", "dataset", "table", "chart", "file"]);
export type ArtifactKind = z.infer<typeof ArtifactKindSchema>;

export const ArtifactRefSchema = z.object({
  path: z.string().min(1),
  label: z.string().min(1).optional(),
  kind: ArtifactKindSchema.default("file"),
});
export type ArtifactRef = z.infer<typeof ArtifactRefSchema>;

export const QuantRunStatusSchema = z.enum([
  "idle",
  "running",
  "completed",
  "cancelled",
  "failed",
  "blocked",
  "pending-review",
]);
export type QuantRunStatus = z.infer<typeof QuantRunStatusSchema>;

export const QuantRunMetaSchema = z.object({
  runId: z.string().min(1),
  status: QuantRunStatusSchema,
  summary: z.string().nullable().optional(),
  artifacts: z.array(ArtifactRefSchema).default([]),
});
export type QuantRunMeta = z.infer<typeof QuantRunMetaSchema>;

export const QuantArtifactDomainSchema = z.enum([
  "data-fetch",
  "factors",
  "signals",
  "backtests",
  "presets",
  "autoresearch",
  "autoresearch-runs",
]);
export type QuantArtifactDomain = z.infer<typeof QuantArtifactDomainSchema>;
