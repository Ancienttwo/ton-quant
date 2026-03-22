import type { Command } from "commander";
import { buildPriceIndex, cachedGetAssets, cachedGetPools } from "../services/cache.js";
import type { TrendingData } from "../types/cli.js";
import { formatTrending } from "../utils/format.js";
import { handleCommand } from "../utils/output.js";
import { fromRawUnits } from "../utils/units.js";

export function registerTrendingCommand(program: Command): void {
  program
    .command("trending")
    .description("Show trending tokens ranked by liquidity")
    .option("-n, --limit <number>", "Number of tokens to show", "10")
    .action(async (options: { limit: string }) => {
      const json = program.opts().json ?? false;
      const limit = Number.parseInt(options.limit, 10);

      await handleCommand<TrendingData>(
        { json },
        async () => {
          const assets = await cachedGetAssets();
          const pools = await cachedGetPools();
          const priceIndex = buildPriceIndex(assets);

          // Build asset lookup by address
          const assetByAddress = new Map(assets.map((a) => [a.contract_address, a]));

          // Calculate total liquidity per asset across all pools
          const liquidityByAddress = new Map<string, number>();
          for (const pool of pools) {
            if (pool.deprecated) continue;
            const a0 = assetByAddress.get(pool.token0_address);
            const a1 = assetByAddress.get(pool.token1_address);
            if (!a0 || !a1) continue;

            const p0 = Number.parseFloat(priceIndex.get(pool.token0_address) ?? "0");
            const p1 = Number.parseFloat(priceIndex.get(pool.token1_address) ?? "0");
            const r0 = Number.parseFloat(fromRawUnits(pool.reserve0, a0.decimals));
            const r1 = Number.parseFloat(fromRawUnits(pool.reserve1, a1.decimals));
            const poolLiq = r0 * p0 + r1 * p1;

            for (const addr of [pool.token0_address, pool.token1_address]) {
              liquidityByAddress.set(addr, (liquidityByAddress.get(addr) ?? 0) + poolLiq);
            }
          }

          // Sort assets by total liquidity descending
          const ranked = [...assets]
            .filter((a) => liquidityByAddress.has(a.contract_address))
            .sort(
              (a, b) =>
                (liquidityByAddress.get(b.contract_address) ?? 0) -
                (liquidityByAddress.get(a.contract_address) ?? 0),
            )
            .slice(0, limit);

          return {
            tokens: ranked.map((asset, index) => ({
              rank: index + 1,
              symbol: asset.symbol,
              price_usd: asset.dex_usd_price ?? asset.dex_price_usd ?? "0",
              change_24h: "N/A",
              volume_24h: "N/A",
            })),
          };
        },
        formatTrending,
      );
    });
}
