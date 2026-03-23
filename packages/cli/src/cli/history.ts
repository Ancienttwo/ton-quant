import type { Command } from "commander";
import { fetchHistoryData } from "../services/queries.js";
import { formatHistory } from "../utils/format.js";
import { handleCommand } from "../utils/output.js";

export function registerHistoryCommand(program: Command): void {
  program
    .command("history")
    .description("View recent transaction history")
    .option("--limit <n>", "Number of transactions to show", "20")
    .action(async (options: { limit: string }) => {
      const json = program.opts().json ?? false;
      const limit = Number.parseInt(options.limit, 10);
      await handleCommand({ json }, () => fetchHistoryData(limit), formatHistory);
    });
}
