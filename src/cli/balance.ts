import type { Command } from "commander";
import { loadConfig } from "../config/index.js";
import { getBalance, getJettonBalances } from "../services/tonapi.js";
import { getWalletAddress } from "../services/wallet.js";
import type { BalanceData } from "../types/cli.js";
import { formatBalance } from "../utils/format.js";
import { handleCommand } from "../utils/output.js";

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

          const jettons = options.all ? await getJettonBalances(address) : [];

          // TODO: Calculate USD values from prices
          const tonUsd = "0";
          const jettonEntries = jettons.map((j) => ({
            symbol: j.jetton.symbol,
            balance: j.balance,
            usd_value: "0", // TODO: Calculate from price
          }));

          return {
            address,
            network: config.network,
            toncoin: {
              balance: tonBalance.balance,
              usd_value: tonUsd,
            },
            jettons: jettonEntries,
            total_usd: "0", // TODO: Sum all USD values
          };
        },
        formatBalance,
      );
    });
}
