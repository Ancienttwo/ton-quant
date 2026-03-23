import {
  type BacktestRequest,
  BacktestRequestSchema,
  type BacktestResult,
  BacktestResultSchema,
} from "../types/index.js";
import { invokeQuantCli, type RunQuantApiOptions } from "./shared.js";

export async function runBacktest(
  request: BacktestRequest,
  options?: RunQuantApiOptions,
): Promise<BacktestResult> {
  const parsed = BacktestRequestSchema.parse(request);
  return invokeQuantCli(
    "backtests",
    ["backtest", "run"],
    parsed,
    parsed,
    (raw) => BacktestResultSchema.parse(raw),
    options,
  );
}
