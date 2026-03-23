import { describe, expect, test } from "bun:test";
import { calcUsdValue, fromRawUnits, toRawUnits } from "@tonquant/core";

describe("swap command", () => {
  test("converts human amount to raw units for simulation", () => {
    const raw = toRawUnits("1.5", 9);
    expect(raw).toBe("1500000000");
  });

  test("converts simulation result back to human units", () => {
    const human = fromRawUnits("368000000", 9);
    expect(human).toBe("0.368");
  });

  test("calculates USD for from amount", () => {
    const usd = calcUsdValue("1000", "0.0068");
    expect(usd).toBe("6.80");
  });

  test("calculates USD for to amount", () => {
    const usd = calcUsdValue("0.368", "18.50");
    expect(usd).toBe("6.81");
  });

  test("slippage conversion", () => {
    const slippage = (Number.parseFloat("1") / 100).toString();
    expect(slippage).toBe("0.01");
  });
});
