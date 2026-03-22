import type { Command } from "commander";
import { CliCommandError } from "../utils/output.js";

export function registerAutoresearchCommand(program: Command): void {
  const command = program
    .command("autoresearch")
    .description("Quant autoresearch track management [Phase 1]");

  command
    .command("init")
    .description("Initialize a TON quant autoresearch track")
    .requiredOption("--title <title>", "Track title")
    .requiredOption("--strategy <strategy>", "Strategy id")
    .requiredOption("--symbols <symbols...>", "Symbols to evaluate")
    .requiredOption("--start-date <date>", "Start date (YYYY-MM-DD)")
    .requiredOption("--end-date <date>", "End date (YYYY-MM-DD)")
    .action(async () => {
      throw new CliCommandError(
        "Quant autoresearch init is not yet implemented. Use the src/quant contract as the target boundary.",
        "NOT_IMPLEMENTED",
      );
    });

  command
    .command("run")
    .description("Run bounded autoresearch iterations for a track")
    .requiredOption("--track <trackId>", "Track id")
    .option("--iterations <count>", "Iteration budget", "20")
    .action(async () => {
      throw new CliCommandError(
        "Quant autoresearch run is not yet implemented. Use the src/quant contract as the target boundary.",
        "NOT_IMPLEMENTED",
      );
    });

  command
    .command("status")
    .description("Show a TON quant autoresearch track")
    .requiredOption("--track <trackId>", "Track id")
    .action(async () => {
      throw new CliCommandError(
        "Quant autoresearch status is not yet implemented. Use the src/quant contract as the target boundary.",
        "NOT_IMPLEMENTED",
      );
    });

  command
    .command("list")
    .description("List TON quant autoresearch tracks")
    .action(async () => {
      throw new CliCommandError(
        "Quant autoresearch list is not yet implemented. Use the src/quant contract as the target boundary.",
        "NOT_IMPLEMENTED",
      );
    });
}
