import type { Command } from "commander";
import { getAssets } from "../services/stonfi.js";
import type { TrendingData } from "../types/cli.js";
import { formatTrending } from "../utils/format.js";
import { handleCommand } from "../utils/output.js";

export function registerTrendingCommand(program: Command): void {
  program
    .command("trending")
    .description("Show trending tokens ranked by trading volume")
    .option("-n, --limit <number>", "Number of tokens to show", "10")
    .action(async (options: { limit: string }) => {
      const json = program.opts().json ?? false;
      const limit = Number.parseInt(options.limit, 10);

      await handleCommand<TrendingData>(
        { json },
        async () => {
          const assets = await getAssets();

          // TODO: Sort by actual 24h volume when available
          // For now, sort by price as a placeholder
          const sorted = [...assets]
            .filter((a) => a.dex_usd_price || a.dex_price_usd)
            .sort((a, b) => {
              const priceA = Number.parseFloat(a.dex_usd_price ?? a.dex_price_usd ?? "0");
              const priceB = Number.parseFloat(b.dex_usd_price ?? b.dex_price_usd ?? "0");
              return priceB - priceA;
            })
            .slice(0, limit);

          return {
            tokens: sorted.map((asset, index) => ({
              rank: index + 1,
              symbol: asset.symbol,
              price_usd: asset.dex_usd_price ?? asset.dex_price_usd ?? "0",
              change_24h: "N/A", // TODO: Calculate from historical
              volume_24h: "0", // TODO: Get from pool stats
            })),
          };
        },
        formatTrending,
      );
    });
}
