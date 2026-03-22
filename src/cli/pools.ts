import type { Command } from "commander";
import { buildPriceIndex, cachedGetAssets, cachedGetPools } from "../services/cache.js";
import type { PoolData } from "../types/cli.js";
import { formatPool } from "../utils/format.js";
import { CliCommandError, handleCommand } from "../utils/output.js";
import { calcUsdValue, fromRawUnits } from "../utils/units.js";

export function registerPoolsCommand(program: Command): void {
  program
    .command("pools <pair>")
    .description("Query trading pair pool details (e.g. NOT/TON)")
    .action(async (pair: string) => {
      const json = program.opts().json ?? false;

      await handleCommand<PoolData>(
        { json },
        async () => {
          const parts = pair.split("/");
          if (parts.length !== 2 || !parts[0] || !parts[1]) {
            throw new CliCommandError(
              'Invalid pair format. Use "TOKEN_A/TOKEN_B"',
              "INVALID_PAIR_FORMAT",
            );
          }

          const [symbolA, symbolB] = parts;
          const assets = await cachedGetAssets();
          const upperA = symbolA.toUpperCase();
          const upperB = symbolB.toUpperCase();
          const assetA = assets.find((a) => a.symbol.toUpperCase() === upperA);
          const assetB = assets.find((a) => a.symbol.toUpperCase() === upperB);

          if (!assetA) {
            throw new CliCommandError(`Token "${symbolA}" not found`, "TOKEN_NOT_FOUND");
          }
          if (!assetB) {
            throw new CliCommandError(`Token "${symbolB}" not found`, "TOKEN_NOT_FOUND");
          }

          const pools = await cachedGetPools();
          const pool = pools.find(
            (p) =>
              (p.token0_address === assetA.contract_address &&
                p.token1_address === assetB.contract_address) ||
              (p.token0_address === assetB.contract_address &&
                p.token1_address === assetA.contract_address),
          );
          if (!pool) {
            throw new CliCommandError(`No pool found for ${symbolA}/${symbolB}`, "POOL_NOT_FOUND");
          }

          const priceIndex = buildPriceIndex(assets);
          const priceA = priceIndex.get(assetA.contract_address) ?? "0";
          const priceB = priceIndex.get(assetB.contract_address) ?? "0";
          const humanReserve0 = fromRawUnits(pool.reserve0, assetA.decimals);
          const humanReserve1 = fromRawUnits(pool.reserve1, assetB.decimals);
          const usdA = Number.parseFloat(calcUsdValue(humanReserve0, priceA));
          const usdB = Number.parseFloat(calcUsdValue(humanReserve1, priceB));
          const liquidityUsd = (usdA + usdB).toFixed(2);

          return {
            pool_address: pool.address,
            token0: { symbol: assetA.symbol, reserve: humanReserve0 },
            token1: { symbol: assetB.symbol, reserve: humanReserve1 },
            liquidity_usd: liquidityUsd,
            volume_24h: "N/A",
            fee_rate: pool.lp_fee ?? "0.3%",
            apy: pool.apy_1d,
          };
        },
        formatPool,
      );
    });
}
