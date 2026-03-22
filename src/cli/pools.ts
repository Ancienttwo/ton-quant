import type { Command } from "commander";
import { findPool, getAssets } from "../services/stonfi.js";
import type { PoolData } from "../types/cli.js";
import { formatPool } from "../utils/format.js";
import { CliCommandError, handleCommand } from "../utils/output.js";

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
          const assets = await getAssets();
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

          const pool = await findPool(assetA.contract_address, assetB.contract_address);
          if (!pool) {
            throw new CliCommandError(`No pool found for ${symbolA}/${symbolB}`, "POOL_NOT_FOUND");
          }

          return {
            pool_address: pool.address,
            token0: { symbol: assetA.symbol, reserve: pool.reserve0 },
            token1: { symbol: assetB.symbol, reserve: pool.reserve1 },
            liquidity_usd: "0", // TODO: Calculate from reserves + prices
            volume_24h: "0", // TODO: Get from pool stats
            fee_rate: pool.lp_fee ?? "0.3%",
            apy: pool.apy_1d,
          };
        },
        formatPool,
      );
    });
}
