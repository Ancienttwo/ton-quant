import { describe, expect, test } from "bun:test";
import { getWalletAddress } from "../../src/services/wallet.js";
import type { Config } from "../../src/types/config.js";
import { CliCommandError } from "../../src/utils/output.js";

describe("wallet service", () => {
  test("getWalletAddress returns address from config", () => {
    const config: Config = {
      network: "mainnet",
      wallet: {
        mnemonic_encrypted: "[encrypted]",
        address: "UQ_test_address",
        version: "v5r1",
      },
      preferences: {
        default_slippage: 0.01,
        default_dex: "stonfi",
        currency: "usd",
      },
    };
    const address = getWalletAddress(config);
    expect(address).toBe("UQ_test_address");
  });

  test("getWalletAddress throws when wallet not configured", () => {
    const config: Config = {
      network: "mainnet",
      preferences: {
        default_slippage: 0.01,
        default_dex: "stonfi",
        currency: "usd",
      },
    };
    expect(() => getWalletAddress(config)).toThrow(CliCommandError);
  });

  test("getWalletAddress error has correct code", () => {
    const config: Config = {
      network: "mainnet",
      preferences: {
        default_slippage: 0.01,
        default_dex: "stonfi",
        currency: "usd",
      },
    };
    try {
      getWalletAddress(config);
    } catch (e) {
      expect(e).toBeInstanceOf(CliCommandError);
      expect((e as CliCommandError).code).toBe("WALLET_NOT_CONFIGURED");
    }
  });
});
