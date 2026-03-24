import type { Command } from "commander";
import { runFactorCompute, runFactorList } from "../quant/api/factor.js";
import { formatFactorCompute, formatFactorList } from "../utils/format-quant.js";
import { handleCommand } from "../utils/output.js";
import { registerFactorAlertCommands } from "./factor-alert.js";
import { registerFactorBacktestCommands } from "./factor-backtest.js";
import { registerFactorComposeCommands } from "./factor-compose.js";
import { registerFactorMarketplaceCommands } from "./factor-core.js";
import { registerFactorReportCommands } from "./factor-report.js";
import { registerFactorSeedCommands } from "./factor-seed.js";
import { registerFactorSkillCommands } from "./factor-skill.js";

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

  // Backtest, alert, and report commands
  registerFactorBacktestCommands(command);
  registerFactorAlertCommands(command);
  registerFactorReportCommands(command);

  // Seed and skill export
  registerFactorSeedCommands(command);
  registerFactorSkillCommands(command);
}
