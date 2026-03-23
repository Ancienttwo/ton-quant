import { z } from "zod";

// Re-export domain data types from core
export {
  type BalanceData,
  BalanceDataSchema,
  type HistoryData,
  HistoryDataSchema,
  HistoryTransactionSchema,
  type PoolData,
  PoolDataSchema,
  type PriceData,
  PriceDataSchema,
  type ResearchData,
  ResearchDataSchema,
  type SwapExecutionData,
  SwapExecutionDataSchema,
  type SwapSimulationData,
  SwapSimulationDataSchema,
  type TrendingData,
  TrendingDataSchema,
  TrendingTokenSchema,
} from "@tonquant/core";

// ============================================================
// CLI Output Envelope (CLI-specific, stays here)
// ============================================================

export const CliSuccessSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    status: z.literal("ok"),
    data: dataSchema,
  });

export const CliErrorSchema = z.object({
  status: z.literal("error"),
  error: z.string(),
  code: z.string(),
});
export type CliError = z.infer<typeof CliErrorSchema>;
