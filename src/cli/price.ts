import type { Command } from "commander";
import { cachedFindAssetBySymbol } from "../services/cache.js";
import type { PriceData } from "../types/cli.js";
import { formatPrice } from "../utils/format.js";
import { CliCommandError, handleCommand } from "../utils/output.js";

export function registerPriceCommand(program: Command): void {
  program
    .command("price <symbol>")
    .description("Query token price, 24h change, and volume")
    .action(async (symbol: string) => {
      const json = program.opts().json ?? false;

      await handleCommand<PriceData>(
        { json },
        async () => {
          const asset = await cachedFindAssetBySymbol(symbol);
          if (!asset) {
            throw new CliCommandError(`Token "${symbol}" not found`, "TOKEN_NOT_FOUND");
          }

          return {
            symbol: asset.symbol,
            name: asset.display_name ?? asset.symbol,
            address: asset.contract_address,
            decimals: asset.decimals,
            price_usd: asset.dex_usd_price ?? asset.dex_price_usd ?? "0",
            change_24h: "N/A",
            volume_24h: "N/A",
          };
        },
        formatPrice,
      );
    });
}
