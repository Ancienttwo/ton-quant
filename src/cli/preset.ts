import type { Command } from "commander";
import { CliCommandError } from "../utils/output.js";

export function registerPresetCommand(program: Command): void {
  const command = program.command("preset").description("Quant strategy presets [Phase 1]");

  command
    .command("list")
    .description("List built-in TON quant presets")
    .action(async () => {
      throw new CliCommandError(
        "Quant preset list is not yet implemented. Use the src/quant contract as the target boundary.",
        "NOT_IMPLEMENTED",
      );
    });

  command
    .command("show <presetId>")
    .description("Show a TON quant preset definition")
    .action(async () => {
      throw new CliCommandError(
        "Quant preset show is not yet implemented. Use the src/quant contract as the target boundary.",
        "NOT_IMPLEMENTED",
      );
    });
}
