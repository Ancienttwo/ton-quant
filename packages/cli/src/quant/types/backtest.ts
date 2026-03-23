import { z } from "zod";
import {
  DataModeSchema,
  DateStringSchema,
  MarketCodeSchema,
  QuantParamValueSchema,
  QuantRunMetaSchema,
} from "./base.js";

export const SlippageConfigSchema = z.object({
  model: z.enum(["fixed_tick", "percentage"]).default("percentage"),
  value: z.number().nonnegative().default(0),
});
export type SlippageConfig = z.infer<typeof SlippageConfigSchema>;

export const BacktestCostConfigSchema = z.object({
  slippage: SlippageConfigSchema.optional(),
  borrowRateAnnual: z.number().nonnegative().default(0),
});
export type BacktestCostConfig = z.infer<typeof BacktestCostConfigSchema>;

export const BacktestRequestSchema = z.object({
  strategy: z.string().min(1),
  params: z.record(z.string(), QuantParamValueSchema).default({}),
  market: MarketCodeSchema.default("ton"),
  symbols: z.array(z.string().min(1)).min(1),
  referenceSymbols: z.array(z.string().min(1)).optional(),
  startDate: DateStringSchema,
  endDate: DateStringSchema,
  weights: z.record(z.string(), z.number()).optional(),
  initialCapital: z.number().positive().optional(),
  costConfig: BacktestCostConfigSchema.optional(),
  datasetPath: z.string().min(1).optional(),
  dataMode: DataModeSchema.optional(),
  outputDir: z.string().min(1).optional(),
});
export type BacktestRequest = z.input<typeof BacktestRequestSchema>;

export const BacktestResultSchema = QuantRunMetaSchema.extend({
  sharpe: z.number(),
  maxDrawdown: z.number().nonnegative(),
  totalReturn: z.number(),
  winRate: z.number().min(0).max(1),
  tradeCount: z.number().int().nonnegative(),
  calmar: z.number(),
  sortino: z.number(),
  informationRatio: z.number().default(0),
  maxConsecutiveLossDays: z.number().int().nonnegative().default(0),
  monthlyReturns: z.record(z.string(), z.number()).default({}),
  dailyEquity: z.array(z.number()).default([]),
});
export type BacktestResult = z.infer<typeof BacktestResultSchema>;
