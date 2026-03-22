import { z } from "zod";
import {
  DataModeSchema,
  DateStringSchema,
  MarketCodeSchema,
  QuantParamValueSchema,
  QuantRunMetaSchema,
} from "./base.js";

export const FactorComputeModeSchema = z.enum(["batch"]);
export const FactorSourceSchema = z.enum(["indicator", "liquidity", "derived"]);

export const FactorParameterSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  defaultValue: QuantParamValueSchema.optional(),
});
export type FactorParameter = z.infer<typeof FactorParameterSchema>;

export const FactorDescriptorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  description: z.string().min(1),
  parameters: z.array(FactorParameterSchema).default([]),
  inputFields: z.array(z.string()).default([]),
  computeMode: FactorComputeModeSchema.default("batch"),
  source: FactorSourceSchema,
});
export type FactorDescriptor = z.infer<typeof FactorDescriptorSchema>;

export const FactorListRequestSchema = z.object({
  outputDir: z.string().min(1).optional(),
});
export type FactorListRequest = z.input<typeof FactorListRequestSchema>;

export const FactorListResultSchema = QuantRunMetaSchema.extend({
  factors: z.array(FactorDescriptorSchema).default([]),
});
export type FactorListResult = z.infer<typeof FactorListResultSchema>;

export const FactorComputeRequestSchema = z.object({
  market: MarketCodeSchema.default("ton"),
  symbols: z.array(z.string().min(1)).min(1),
  factors: z.array(z.string().min(1)).min(1),
  factorParams: z.record(z.string(), z.record(z.string(), QuantParamValueSchema)).default({}),
  startDate: DateStringSchema.optional(),
  endDate: DateStringSchema.optional(),
  datasetPath: z.string().min(1).optional(),
  dataMode: DataModeSchema.optional(),
  outputDir: z.string().min(1).optional(),
});
export type FactorComputeRequest = z.input<typeof FactorComputeRequestSchema>;

export const FactorComputeResultSchema = QuantRunMetaSchema.extend({
  datasetRows: z.number().int().nonnegative(),
  factorCount: z.number().int().nonnegative(),
  symbolCount: z.number().int().nonnegative(),
  factorColumns: z.array(z.string()).default([]),
});
export type FactorComputeResult = z.infer<typeof FactorComputeResultSchema>;
