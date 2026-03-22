import type { Command } from "commander";
import { CliCommandError } from "../utils/output.js";

export function registerBacktestCommand(program: Command): void {
  const command = program.command("backtest").description("Quant strategy backtesting [Phase 1]");

  command
    .command("run")
    .description("Run a TON quant backtest")
    .requiredOption("--strategy <strategy>", "Strategy id")
    .requiredOption("--symbols <symbols...>", "Symbols to test")
    .requiredOption("--start-date <date>", "Start date (YYYY-MM-DD)")
    .requiredOption("--end-date <date>", "End date (YYYY-MM-DD)")
    .action(async () => {
      throw new CliCommandError(
        "Quant backtest run is not yet implemented. Use the src/quant contract as the target boundary.",
        "NOT_IMPLEMENTED",
      );
    });
}
