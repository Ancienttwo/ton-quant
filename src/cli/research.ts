import type { Command } from "commander";
import { CliCommandError } from "../utils/output.js";

export function registerResearchCommand(program: Command): void {
  program
    .command("research <symbol>")
    .description("Comprehensive research report (price + pools + holders) [P1]")
    .action(async (_symbol: string) => {
      // TODO: P1 — Implement comprehensive research
      throw new CliCommandError("Research command is not yet implemented.", "NOT_IMPLEMENTED");
    });
}
