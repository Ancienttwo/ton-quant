#!/usr/bin/env bun
import { Command } from "commander";
import { registerAutoresearchCommand } from "./cli/autoresearch.js";
import { registerBacktestCommand } from "./cli/backtest.js";
import { registerBalanceCommand } from "./cli/balance.js";
import { registerDataCommand } from "./cli/data.js";
import { registerFactorCommand } from "./cli/factor.js";
import { registerHistoryCommand } from "./cli/history.js";
import { registerInitCommand } from "./cli/init.js";
import { registerPoolsCommand } from "./cli/pools.js";
import { registerPresetCommand } from "./cli/preset.js";
import { registerPriceCommand } from "./cli/price.js";
import { registerResearchCommand } from "./cli/research.js";
import { registerSwapCommand } from "./cli/swap.js";
import { registerTrendingCommand } from "./cli/trending.js";

const program = new Command();

program
  .name("tonquant")
  .description("TON DeFi research and trading CLI for AI Agents")
  .version("0.1.0")
  .option("--json", "Output structured JSON for AI agent consumption")
  .option("--testnet", "Use testnet network")
  .option("--config <path>", "Custom config file path");

// P0 commands
registerPriceCommand(program);
registerPoolsCommand(program);
registerTrendingCommand(program);
registerInitCommand(program);
registerBalanceCommand(program);
registerSwapCommand(program);

// P1 stubs
registerResearchCommand(program);
registerHistoryCommand(program);
registerDataCommand(program);
registerFactorCommand(program);
registerBacktestCommand(program);
registerPresetCommand(program);
registerAutoresearchCommand(program);

program.parse();
