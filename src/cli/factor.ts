import type { Command } from "commander";
import { CliCommandError } from "../utils/output.js";

export function registerFactorCommand(program: Command): void {
  const command = program.command("factor").description("Quant factor workflows [Phase 1]");

  command
    .command("list")
    .description("List available TON quant factors")
    .action(async () => {
      throw new CliCommandError(
        "Quant factor list is not yet implemented. Use the src/quant contract as the target boundary.",
        "NOT_IMPLEMENTED",
      );
    });

  command
    .command("compute")
    .description("Compute quant factors over TON datasets")
    .requiredOption("--symbols <symbols...>", "Symbols to evaluate")
    .requiredOption("--factors <factors...>", "Factor ids to compute")
    .action(async () => {
      throw new CliCommandError(
        "Quant factor compute is not yet implemented. Use the src/quant contract as the target boundary.",
        "NOT_IMPLEMENTED",
      );
    });
}
