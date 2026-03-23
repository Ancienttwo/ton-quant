import type { Command } from "commander";
import { fetchBalanceData } from "../services/queries.js";
import { formatBalance } from "../utils/format.js";
import { handleCommand } from "../utils/output.js";

export function registerBalanceCommand(program: Command): void {
  program
    .command("balance")
    .description("Show wallet balance")
    .option("--all", "Include all jetton balances")
    .action(async (options: { all?: boolean }) => {
      const json = program.opts().json ?? false;
      await handleCommand({ json }, () => fetchBalanceData(options.all ?? false), formatBalance);
    });
}
