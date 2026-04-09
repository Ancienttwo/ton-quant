import type { Command } from "commander";
import { runFactorCompute, runFactorList } from "../quant/api/factor.js";
import type { AssetClass, MarketRegion, ProviderCode, VenueCode } from "../quant/types/index.js";
import { formatFactorCompute, formatFactorList } from "../utils/format-quant.js";
import { handleCommand } from "../utils/output.js";
import { registerFactorAlertCommands } from "./factor-alert.js";
import { registerFactorBacktestCommands } from "./factor-backtest.js";
import { registerFactorComposeCommands } from "./factor-compose.js";
import { registerFactorMarketplaceCommands } from "./factor-core.js";
import { registerFactorReportCommands } from "./factor-report.js";
import { registerFactorSeedCommands } from "./factor-seed.js";
import { registerFactorSkillCommands } from "./factor-skill.js";

interface FactorComputeOptions {
  factors: string;
  symbols?: string;
  datasetPath?: string;
  assetClass?: AssetClass;
  marketRegion?: MarketRegion;
  venue?: VenueCode;
  provider?: ProviderCode;
}

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
    .description("Compute factors on normalized quant data")
    .requiredOption("--factors <factors>", "Comma-separated factor IDs (rsi,macd,volatility)")
    .option("--symbols <symbols>", "Comma-separated symbols")
    .option("--dataset-path <path>", "Use an existing normalized dataset file")
    .option("--asset-class <assetClass>", "Asset class: crypto|equity|bond", "crypto")
    .option("--market-region <marketRegion>", "Market region: ton|us|hk|cn", "ton")
    .option("--venue <venue>", "Venue override (stonfi|nyse|nasdaq|hkex|sse|szse|cibm)")
    .option("--provider <provider>", "Provider override (stonfi|tonapi|yfinance|openbb|synthetic)")
    .action(async (opts: FactorComputeOptions) => {
      const json = program.opts().json ?? false;
      const symbols = opts.symbols ? opts.symbols.split(",") : opts.datasetPath ? [] : ["TON/USDT"];
      await handleCommand(
        { json },
        () =>
          runFactorCompute({
            symbols,
            factors: opts.factors.split(","),
            datasetPath: opts.datasetPath,
            assetClass: opts.assetClass,
            marketRegion: opts.marketRegion,
            venue: opts.venue,
            provider: opts.provider,
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
