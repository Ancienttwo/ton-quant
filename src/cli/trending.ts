import type { Command } from "commander";
import { fetchTrendingData } from "../services/queries.js";
import { formatTrending } from "../utils/format.js";
import { handleCommand } from "../utils/output.js";

export function registerTrendingCommand(program: Command): void {
  program
    .command("trending")
    .description("Show trending tokens ranked by liquidity")
    .option("-n, --limit <number>", "Number of tokens to show", "10")
    .action(async (options: { limit: string }) => {
      const json = program.opts().json ?? false;
      const limit = Number.parseInt(options.limit, 10);
      await handleCommand({ json }, () => fetchTrendingData(limit), formatTrending);
    });
}
