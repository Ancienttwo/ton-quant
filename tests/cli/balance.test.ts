import { describe, expect, test } from "bun:test";

describe("balance command", () => {
  test("outputs TON balance", async () => {
    // TODO: Mock tonapi service, verify balance output
    expect(true).toBe(true); // Placeholder
  });

  test("includes jetton balances with --all", async () => {
    // TODO: Mock tonapi, verify jetton entries included
    expect(true).toBe(true); // Placeholder
  });
});
