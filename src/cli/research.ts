import type { Command } from "commander";
import { fetchResearchData } from "../services/queries.js";
import { formatResearch } from "../utils/format.js";
import { handleCommand } from "../utils/output.js";

export function registerResearchCommand(program: Command): void {
  program
    .command("research <symbol>")
    .description("Comprehensive research report (price + pools + liquidity)")
    .action(async (symbol: string) => {
      const json = program.opts().json ?? false;
      await handleCommand({ json }, () => fetchResearchData(symbol), formatResearch);
    });
}
