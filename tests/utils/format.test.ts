import { describe, expect, test } from "bun:test";
import type { PriceData, TrendingData } from "../../src/types/cli.js";
import { formatPrice, formatTrending, greenRed } from "../../src/utils/format.js";

describe("greenRed", () => {
  test("returns green-styled string for positive values", () => {
    const result = greenRed("+3.2%");
    expect(result).toContain("+3.2%");
  });

  test("returns red-styled string for negative values", () => {
    const result = greenRed("-1.5%");
    expect(result).toContain("-1.5%");
  });

  test("returns gray-styled string for neutral values", () => {
    const result = greenRed("0%");
    expect(result).toContain("0%");
  });
});

describe("formatPrice", () => {
  test("formats price data with symbol and price", () => {
    const data: PriceData = {
      symbol: "NOT",
      name: "Notcoin",
      address: "EQ...",
      decimals: 9,
      price_usd: "0.0068",
      change_24h: "+3.2%",
      volume_24h: "1200000",
    };
    const result = formatPrice(data);

    expect(result).toContain("NOT");
    expect(result).toContain("Notcoin");
    expect(result).toContain("0.0068");
  });
});

describe("formatTrending", () => {
  test("formats trending data as table", () => {
    const data: TrendingData = {
      tokens: [
        {
          rank: 1,
          symbol: "NOT",
          price_usd: "0.0068",
          change_24h: "+12.5%",
          volume_24h: "5000000",
        },
        {
          rank: 2,
          symbol: "DOGS",
          price_usd: "0.0005",
          change_24h: "+8.3%",
          volume_24h: "3200000",
        },
      ],
    };
    const result = formatTrending(data);

    expect(result).toContain("NOT");
    expect(result).toContain("DOGS");
  });
});
