import {
  type Config,
  createWalletFromMnemonic,
  encrypt,
  loadConfig,
  loadOrCreateKey,
  saveConfig,
} from "@tonquant/core";
import type { Command } from "commander";
import { CliCommandError, handleCommand } from "../utils/output.js";

export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description("Configure wallet and network settings")
    .option("--testnet", "Use testnet")
    .option("--mnemonic <words>", "Space-separated mnemonic words")
    .action(async (options: { testnet?: boolean; mnemonic?: string }) => {
      const json = program.opts().json ?? false;

      await handleCommand({ json }, async () => {
        if (!options.mnemonic) {
          throw new CliCommandError(
            "Mnemonic required. Use --mnemonic 'word1 word2 ...'",
            "MNEMONIC_REQUIRED",
          );
        }

        const words = options.mnemonic.split(" ");
        if (words.length !== 24) {
          throw new CliCommandError(
            `Expected 24 mnemonic words, got ${words.length}`,
            "INVALID_MNEMONIC",
          );
        }

        const walletInfo = await createWalletFromMnemonic(words);
        const network = options.testnet ? "testnet" : "mainnet";

        const key = await loadOrCreateKey();
        const encryptedMnemonic = encrypt(words.join(" "), key);

        const existingConfig = await loadConfig();
        const newConfig: Config = {
          ...existingConfig,
          network,
          wallet: {
            mnemonic_encrypted: encryptedMnemonic,
            address: walletInfo.address,
            version: "v5r1",
          },
        };

        await saveConfig(newConfig);

        return {
          message: "Wallet configured successfully",
          address: walletInfo.address,
          network,
        };
      });
    });
}
