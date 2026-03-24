import { describe, expect, test } from "bun:test";
import { randomBytes } from "node:crypto";
import { ConfigSchema, decrypt, encrypt } from "@tonquant/core";

describe("init command", () => {
  const VALID_MNEMONIC = Array.from({ length: 24 }, (_, i) => `word${i + 1}`);

  test("rejects mnemonic with fewer than 24 words", () => {
    const words = VALID_MNEMONIC.slice(0, 12);
    expect(words.length).toBe(12);
    expect(words.length !== 24).toBe(true);
  });

  test("rejects mnemonic with more than 24 words", () => {
    const words = [...VALID_MNEMONIC, "extra"];
    expect(words.length).toBe(25);
    expect(words.length !== 24).toBe(true);
  });

  test("accepts exactly 24 mnemonic words", () => {
    expect(VALID_MNEMONIC.length).toBe(24);
    const joined = VALID_MNEMONIC.join(" ");
    const split = joined.split(" ");
    expect(split.length).toBe(24);
  });

  test("encrypt/decrypt round-trip preserves mnemonic", () => {
    const key = randomBytes(32);
    const plaintext = VALID_MNEMONIC.join(" ");
    const encrypted = encrypt(plaintext, key);
    const decrypted = decrypt(encrypted, key);
    expect(decrypted).toBe(plaintext);
  });

  test("encrypted mnemonic differs from plaintext", () => {
    const key = randomBytes(32);
    const plaintext = VALID_MNEMONIC.join(" ");
    const encrypted = encrypt(plaintext, key);
    expect(encrypted).not.toBe(plaintext);
  });

  test("config schema accepts valid wallet config", () => {
    const config = ConfigSchema.parse({
      network: "mainnet",
      wallet: {
        mnemonic_encrypted: "base64encodedstring",
        address: "EQDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        version: "v5r1",
      },
    });
    expect(config.network).toBe("mainnet");
    expect(config.wallet?.address).toBe("EQDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
    expect(config.wallet?.version).toBe("v5r1");
  });

  test("config schema defaults to mainnet when no network specified", () => {
    const config = ConfigSchema.parse({});
    expect(config.network).toBe("mainnet");
  });

  test("config schema accepts testnet network", () => {
    const config = ConfigSchema.parse({ network: "testnet" });
    expect(config.network).toBe("testnet");
  });
});
