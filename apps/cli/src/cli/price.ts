import { fetchPriceData } from "@tonquant/core";
import type { Command } from "commander";
import { formatPrice } from "../utils/format.js";
import { handleCommand } from "../utils/output.js";

export function registerPriceCommand(program: Command): void {
  program
    .command("price <symbol>")
    .description("Query token price, 24h change, and volume")
    .action(async (symbol: string) => {
      const json = program.opts().json ?? false;
      await handleCommand({ json }, () => fetchPriceData(symbol), formatPrice);
    });
}
