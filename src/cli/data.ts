import type { Command } from "commander";
import { CliCommandError } from "../utils/output.js";

export function registerDataCommand(program: Command): void {
  const command = program.command("data").description("Quant dataset management [Phase 1]");

  command
    .command("fetch <symbols...>")
    .description("Fetch and cache TON quant datasets")
    .action(async () => {
      throw new CliCommandError(
        "Quant data fetch is not yet implemented. Use the src/quant contract as the target boundary.",
        "NOT_IMPLEMENTED",
      );
    });

  command
    .command("list")
    .description("List cached TON quant datasets")
    .action(async () => {
      throw new CliCommandError(
        "Quant data list is not yet implemented. Use the src/quant contract as the target boundary.",
        "NOT_IMPLEMENTED",
      );
    });

  command
    .command("info <symbol>")
    .description("Show metadata for a cached TON quant dataset")
    .action(async () => {
      throw new CliCommandError(
        "Quant data info is not yet implemented. Use the src/quant contract as the target boundary.",
        "NOT_IMPLEMENTED",
      );
    });
}
