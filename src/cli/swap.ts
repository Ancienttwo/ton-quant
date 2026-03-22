import type { Command } from "commander";
import { buildPriceIndex, cachedFindAssetBySymbol, cachedGetAssets } from "../services/cache.js";
import { simulateSwap } from "../services/stonfi.js";
import type { SwapSimulationData } from "../types/cli.js";
import { formatSwapSimulation } from "../utils/format.js";
import { CliCommandError, handleCommand } from "../utils/output.js";
import { calcUsdValue, fromRawUnits, toRawUnits } from "../utils/units.js";

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

        await handleCommand<SwapSimulationData>(
          { json },
          async () => {
            const fromAsset = await cachedFindAssetBySymbol(from);
            const toAsset = await cachedFindAssetBySymbol(to);

            if (!fromAsset) {
              throw new CliCommandError(`Token "${from}" not found`, "TOKEN_NOT_FOUND");
            }
            if (!toAsset) {
              throw new CliCommandError(`Token "${to}" not found`, "TOKEN_NOT_FOUND");
            }

            const slippage = (Number.parseFloat(options.slippage) / 100).toString();
            const rawUnits = toRawUnits(amount, fromAsset.decimals);

            const result = await simulateSwap({
              offer_address: fromAsset.contract_address,
              ask_address: toAsset.contract_address,
              units: rawUnits,
              slippage_tolerance: slippage,
            });

            const expectedAmount = fromRawUnits(result.ask_units, toAsset.decimals);
            const minReceived = fromRawUnits(result.min_ask_units, toAsset.decimals);

            const assets = await cachedGetAssets();
            const priceIndex = buildPriceIndex(assets);
            const fromPrice = priceIndex.get(fromAsset.contract_address) ?? "0";
            const toPrice = priceIndex.get(toAsset.contract_address) ?? "0";

            return {
              type: "simulation" as const,
              from: {
                symbol: fromAsset.symbol,
                amount,
                amount_usd: calcUsdValue(amount, fromPrice),
              },
              to: {
                symbol: toAsset.symbol,
                expected_amount: expectedAmount,
                amount_usd: calcUsdValue(expectedAmount, toPrice),
              },
              price_impact: result.price_impact,
              fee: result.fee_units ? fromRawUnits(result.fee_units, toAsset.decimals) : "0",
              minimum_received: minReceived,
              slippage_tolerance: `${options.slippage}%`,
              route: result.route ?? [`${fromAsset.symbol} → ${toAsset.symbol}`],
            };
          },
          formatSwapSimulation,
        );
      },
    );
}
