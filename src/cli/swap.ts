import type { Command } from "commander";
import { findAssetBySymbol, simulateSwap } from "../services/stonfi.js";
import type { SwapSimulationData } from "../types/cli.js";
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
          // TODO: P1 — Implement swap execution
          throw new CliCommandError(
            "Swap execution is not yet implemented. Use without --execute for simulation.",
            "NOT_IMPLEMENTED",
          );
        }

        await handleCommand<SwapSimulationData>(
          { json },
          async () => {
            const fromAsset = await findAssetBySymbol(from);
            const toAsset = await findAssetBySymbol(to);

            if (!fromAsset) {
              throw new CliCommandError(`Token "${from}" not found`, "TOKEN_NOT_FOUND");
            }
            if (!toAsset) {
              throw new CliCommandError(`Token "${to}" not found`, "TOKEN_NOT_FOUND");
            }

            const slippage = (Number.parseFloat(options.slippage) / 100).toString();
            const units = amount; // TODO: Convert to smallest unit based on decimals

            const result = await simulateSwap({
              offer_address: fromAsset.contract_address,
              ask_address: toAsset.contract_address,
              units,
              slippage_tolerance: slippage,
            });

            return {
              type: "simulation" as const,
              from: {
                symbol: fromAsset.symbol,
                amount,
                amount_usd: "0", // TODO: Calculate from price
              },
              to: {
                symbol: toAsset.symbol,
                expected_amount: result.ask_units,
                amount_usd: "0", // TODO: Calculate from price
              },
              price_impact: result.price_impact,
              fee: result.fee_units ?? "0",
              minimum_received: result.min_ask_units,
              slippage_tolerance: `${options.slippage}%`,
              route: result.route ?? [`${fromAsset.symbol} → ${toAsset.symbol}`],
            };
          },
          formatSwapSimulation,
        );
      },
    );
}
