import type { Command } from "commander";
import { loadConfig } from "../config/index.js";
import { buildPriceIndex, cachedGetAssets } from "../services/cache.js";
import { getBalance, getJettonBalances } from "../services/tonapi.js";
import { getWalletAddress } from "../services/wallet.js";
import type { BalanceData } from "../types/cli.js";
import { formatBalance } from "../utils/format.js";
import { handleCommand } from "../utils/output.js";
import { calcUsdValue, fromRawUnits } from "../utils/units.js";

const TON_DECIMALS = 9;

export function registerBalanceCommand(program: Command): void {
  program
    .command("balance")
    .description("Show wallet balance")
    .option("--all", "Include all jetton balances")
    .action(async (options: { all?: boolean }) => {
      const json = program.opts().json ?? false;

      await handleCommand<BalanceData>(
        { json },
        async () => {
          const config = await loadConfig();
          const address = getWalletAddress(config);
          const tonBalance = await getBalance(address);

          const assets = await cachedGetAssets();
          const priceIndex = buildPriceIndex(assets);

          // Convert nanoTON to human-readable TON
          const humanTonBalance = fromRawUnits(tonBalance.balance, TON_DECIMALS);

          // Find TON price — native TON proxy address in STON.fi
          const tonAsset = assets.find((a) => a.symbol.toUpperCase() === "TON");
          const tonPrice = tonAsset
            ? (tonAsset.dex_usd_price ?? tonAsset.dex_price_usd ?? "0")
            : "0";
          const tonUsd = calcUsdValue(humanTonBalance, tonPrice);

          let totalUsd = Number.parseFloat(tonUsd);

          const jettons = options.all ? await getJettonBalances(address) : [];
          const jettonEntries = jettons.map((j) => {
            const humanBalance = fromRawUnits(j.balance, j.jetton.decimals);
            const price = priceIndex.get(j.jetton.address) ?? "0";
            const usdValue = calcUsdValue(humanBalance, price);
            totalUsd += Number.parseFloat(usdValue);
            return {
              symbol: j.jetton.symbol,
              balance: humanBalance,
              usd_value: usdValue,
            };
          });

          return {
            address,
            network: config.network,
            toncoin: {
              balance: humanTonBalance,
              usd_value: tonUsd,
            },
            jettons: jettonEntries,
            total_usd: totalUsd.toFixed(2),
          };
        },
        formatBalance,
      );
    });
}
