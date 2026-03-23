import { fetchSwapSimulation } from "@tonquant/core";
import type { Command } from "commander";
import { formatSwapSimulation } from "../utils/format.js";
import { CliCommandError, handleCommand } from "../utils/output.js";

export function registerSwapCommand(program: Command): void {
  program
    .command("swap <from> <to> <amount>")
    .description("Simulate or execute a token swap")
    .option("--execute", "Execute the swap (requires wallet)")
    .option("--slippage <pct>", "Slippage tolerance percentage", "1")
    .action(
      async (
        from: string,
        to: string,
        amount: string,
        options: { execute?: boolean; slippage: string },
      ) => {
        const json = program.opts().json ?? false;

        if (options.execute) {
          throw new CliCommandError(
            "Swap execution is not yet implemented. Use without --execute for simulation.",
            "NOT_IMPLEMENTED",
          );
        }

        await handleCommand(
          { json },
          () => fetchSwapSimulation(from, to, amount, options.slippage),
          formatSwapSimulation,
        );
      },
    );
}
