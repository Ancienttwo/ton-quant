import type { Command } from "commander";
import { runFactorCompute, runFactorList } from "../quant/api/factor.js";
import { formatFactorCompute, formatFactorList } from "../utils/format-quant.js";
import { handleCommand } from "../utils/output.js";
import { registerFactorMarketplaceCommands } from "./factor-core.js";
import { registerFactorComposeCommands } from "./factor-compose.js";

export function registerFactorCommand(program: Command): void {
  const command = program.command("factor").description("Factor computation & marketplace");

  // Quant boundary commands (Phase 1)
  command
    .command("list")
    .description("List available quant factors")
    .action(async () => {
      const json = program.opts().json ?? false;
      await handleCommand({ json }, () => runFactorList(), formatFactorList);
    });

  command
    .command("compute")
    .description("Compute factors on TON quant data")
    .requiredOption("--factors <factors>", "Comma-separated factor IDs (rsi,macd,volatility)")
    .option("--symbols <symbols>", "Comma-separated symbols", "TON/USDT")
    .action(async (opts: { factors: string; symbols: string }) => {
      const json = program.opts().json ?? false;
      await handleCommand(
        { json },
        () =>
          runFactorCompute({
            symbols: opts.symbols.split(","),
            factors: opts.factors.split(","),
          }),
        formatFactorCompute,
      );
    });

  // Marketplace commands (publish, discover, subscribe, top, etc.)
  registerFactorMarketplaceCommands(command);

  // Composition commands (compose, composites, composite, composite-delete)
  registerFactorComposeCommands(command);
}
