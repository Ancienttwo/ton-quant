import type { Command } from "commander";
import { runBacktest } from "../quant/api/backtest.js";
import { handleCommand } from "../utils/output.js";

function formatBacktest(data: Record<string, unknown>): string {
  return [
    `Strategy Backtest Results`,
    ``,
    `  Sharpe Ratio:     ${data.sharpe}`,
    `  Total Return:     ${data.totalReturn}%`,
    `  Max Drawdown:     ${((data.maxDrawdown as number) * 100).toFixed(2)}%`,
    `  Win Rate:         ${((data.winRate as number) * 100).toFixed(1)}%`,
    `  Trade Count:      ${data.tradeCount}`,
    `  Calmar Ratio:     ${data.calmar}`,
    `  Sortino Ratio:    ${data.sortino}`,
  ].join("\n");
}

export function registerBacktestCommand(program: Command): void {
  const command = program.command("backtest").description("Quant strategy backtesting [Phase 1]");

  command
    .command("run")
    .description("Run a TON quant backtest")
    .requiredOption("--strategy <strategy>", "Strategy id (e.g. momentum)")
    .option("--symbols <symbols>", "Comma-separated symbols", "TON/USDT")
    .option("--start-date <date>", "Start date (YYYY-MM-DD)")
    .option("--end-date <date>", "End date (YYYY-MM-DD)")
    .action(
      async (opts: { strategy: string; symbols: string; startDate?: string; endDate?: string }) => {
        const json = program.opts().json ?? false;
        const now = new Date();
        const start =
          opts.startDate ?? new Date(now.getTime() - 90 * 86400_000).toISOString().slice(0, 10);
        const end = opts.endDate ?? now.toISOString().slice(0, 10);
        await handleCommand(
          { json },
          () =>
            runBacktest({
              strategy: opts.strategy,
              symbols: opts.symbols.split(","),
              startDate: start,
              endDate: end,
            }),
          formatBacktest,
        );
      },
    );
}
