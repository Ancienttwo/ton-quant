import type { Command } from "commander";
import { CliCommandError } from "../utils/output.js";

export function registerHistoryCommand(program: Command): void {
  program
    .command("history")
    .description("View recent transaction history [P1]")
    .option("--limit <n>", "Number of transactions to show", "20")
    .action(async (_options: { limit: string }) => {
      // TODO: P1 — Implement transaction history
      throw new CliCommandError("History command is not yet implemented.", "NOT_IMPLEMENTED");
    });
}
