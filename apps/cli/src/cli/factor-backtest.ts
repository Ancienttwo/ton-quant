import {
  FactorBacktestSummarySchema,
  type FactorMetaPublic,
  getFactorDetail,
  publishFactor,
} from "@tonquant/core";
import type { Command } from "commander";
import { runBacktest } from "../quant/api/backtest.js";
import { formatBacktest } from "../utils/format-quant.js";
import { handleCommand } from "../utils/output.js";

// ── Pure helpers ─────────────────────────────────────────────

function computeCagr(totalReturn: number, dayCount: number): number {
  if (dayCount <= 0) return 0;
  return (1 + totalReturn) ** (365 / dayCount) - 1;
}

function defaultDateRange(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date(end.getTime() - 90 * 86_400_000);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

// ── Command registration ─────────────────────────────────────

export function registerFactorBacktestCommands(factor: Command): void {
  factor
    .command("backtest <factorId>")
    .description("Run backtest for a registry factor")
    .option("--start-date <date>", "Start date (YYYY-MM-DD)")
    .option("--end-date <date>", "End date (YYYY-MM-DD)")
    .option("--symbols <symbols>", "Comma-separated symbols override")
    .option("--update", "Update the factor registry with new backtest results")
    .action(async (factorId: string, opts) => {
      const json = factor.parent?.opts().json ?? false;
      await handleCommand(
        { json },
        async () => {
          // 1. Resolve factor from registry
          const entry = getFactorDetail(factorId);
          const pub = entry.public;

          // 2. Build backtest request
          const dates = defaultDateRange();
          const symbols = opts.symbols
            ? (opts.symbols as string).split(",").map((s: string) => s.trim())
            : pub.assets.map((a) => (a.includes("/") ? a : `${a}/USDT`));

          const params: Record<string, string | number> = entry.private?.parameterValues
            ? { ...entry.private.parameterValues }
            : {};

          const request = {
            strategy: pub.category,
            params,
            symbols,
            startDate: opts.startDate ?? dates.startDate,
            endDate: opts.endDate ?? dates.endDate,
          };

          // 3. Run backtest
          const result = await runBacktest(request);

          // 4. Convert to FactorBacktestSummary and optionally update
          if (opts.update) {
            const startMs = new Date(request.startDate).getTime();
            const endMs = new Date(request.endDate).getTime();
            const dayCount = (endMs - startMs) / 86_400_000;

            const summary = FactorBacktestSummarySchema.parse({
              sharpe: result.sharpe,
              maxDrawdown: result.maxDrawdown,
              winRate: result.winRate,
              cagr: computeCagr(result.totalReturn, dayCount),
              dataRange: { start: request.startDate, end: request.endDate },
              tradeCount: result.tradeCount,
            });

            const now = new Date().toISOString();
            const updated: FactorMetaPublic = {
              ...pub,
              backtest: summary,
              updatedAt: now,
            };
            publishFactor(updated, { force: true });
          }

          return result;
        },
        formatBacktest,
      );
    });
}
