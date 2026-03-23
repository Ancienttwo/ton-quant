import { z } from "zod";
import {
  DataModeSchema,
  DateStringSchema,
  MarketCodeSchema,
  QuantParamValueSchema,
  QuantRunMetaSchema,
} from "./base.js";

export const SignalDescriptorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  factorDependencies: z.array(z.string().min(1)).default([]),
});
export type SignalDescriptor = z.infer<typeof SignalDescriptorSchema>;

export const SignalListRequestSchema = z.object({
  outputDir: z.string().min(1).optional(),
});
export type SignalListRequest = z.input<typeof SignalListRequestSchema>;

export const SignalListResultSchema = QuantRunMetaSchema.extend({
  signals: z.array(SignalDescriptorSchema).default([]),
});
export type SignalListResult = z.infer<typeof SignalListResultSchema>;

export const SignalEvaluateRequestSchema = z.object({
  market: MarketCodeSchema.default("ton"),
  symbols: z.array(z.string().min(1)).min(1),
  signals: z.array(z.string().min(1)).min(1),
  signalParams: z.record(z.string(), z.record(z.string(), QuantParamValueSchema)).default({}),
  startDate: DateStringSchema.optional(),
  endDate: DateStringSchema.optional(),
  datasetPath: z.string().min(1).optional(),
  dataMode: DataModeSchema.optional(),
  outputDir: z.string().min(1).optional(),
});
export type SignalEvaluateRequest = z.input<typeof SignalEvaluateRequestSchema>;

export const SignalEvaluationSchema = z.object({
  signalId: z.string().min(1),
  triggered: z.boolean(),
  confidence: z.number().min(0).max(1).optional(),
  notes: z.string().optional(),
});
export type SignalEvaluation = z.infer<typeof SignalEvaluationSchema>;

export const SignalEvaluateResultSchema = QuantRunMetaSchema.extend({
  symbolCount: z.number().int().nonnegative(),
  evaluations: z.array(SignalEvaluationSchema).default([]),
});
export type SignalEvaluateResult = z.infer<typeof SignalEvaluateResultSchema>;
