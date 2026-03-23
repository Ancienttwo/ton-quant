import { describe, expect, test } from "bun:test";
import { getConfigPath, loadConfig } from "../../src/config/index.js";
import { CONFIG_FILE, ConfigSchema } from "../../src/types/config.js";

describe("config", () => {
  test("ConfigSchema parses valid config", () => {
    const config = ConfigSchema.parse({
      network: "mainnet",
      wallet: {
        mnemonic_encrypted: "abc123",
        address: "UQ_addr",
        version: "v5r1",
      },
    });
    expect(config.network).toBe("mainnet");
    expect(config.wallet?.address).toBe("UQ_addr");
    expect(config.preferences.default_slippage).toBe(0.01);
  });

  test("ConfigSchema applies defaults for empty input", () => {
    const config = ConfigSchema.parse({});
    expect(config.network).toBe("mainnet");
    expect(config.wallet).toBeUndefined();
    expect(config.preferences.default_dex).toBe("stonfi");
    expect(config.preferences.currency).toBe("usd");
  });

  test("ConfigSchema rejects invalid network", () => {
    expect(() => ConfigSchema.parse({ network: "devnet" })).toThrow();
  });

  test("getConfigPath returns CONFIG_FILE", () => {
    expect(getConfigPath()).toBe(CONFIG_FILE);
  });

  test("loadConfig returns defaults when no file exists", async () => {
    // loadConfig returns defaults if CONFIG_FILE doesn't exist
    // This test may read the real config if it exists on the machine
    const config = await loadConfig();
    expect(config.network).toBeDefined();
    expect(config.preferences).toBeDefined();
  });
});
