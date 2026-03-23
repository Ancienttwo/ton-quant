import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { clearCache } from "../../src/services/cache.js";
import {
  fetchPoolData,
  fetchPriceData,
  fetchResearchData,
  fetchSwapSimulation,
  fetchTrendingData,
} from "../../src/services/queries.js";
import type { Asset, Pool } from "../../src/types/api.js";

const assets: Asset[] = [
  {
    contract_address: "EQ_not",
    symbol: "NOT",
    display_name: "Notcoin",
    decimals: 9,
    dex_usd_price: "0.01",
  },
  {
    contract_address: "EQ_ton",
    symbol: "TON",
    display_name: "Toncoin",
    decimals: 9,
    dex_usd_price: "3.70",
  },
];

const pools: Pool[] = [
  {
    address: "EQ_pool_1",
    token0_address: "EQ_not",
    token1_address: "EQ_ton",
    reserve0: "100000000000000",
    reserve1: "500000000000",
    lp_fee: "0.3%",
    apy_1d: "12.5%",
  },
];

let fetchSpy: ReturnType<typeof spyOn>;

beforeEach(() => {
  clearCache();
  fetchSpy = spyOn(globalThis, "fetch").mockImplementation(((url: string) => {
    if (url.includes("/pools")) {
      return Promise.resolve(
        new Response(JSON.stringify({ pool_list: pools }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }
    return Promise.resolve(
      new Response(JSON.stringify({ asset_list: assets }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
  }) as unknown as typeof fetch);
});

afterEach(() => {
  fetchSpy.mockRestore();
  clearCache();
});

describe("fetchPriceData", () => {
  test("returns enriched price data for known symbol", async () => {
    const data = await fetchPriceData("NOT");
    expect(data.symbol).toBe("NOT");
    expect(data.name).toBe("Notcoin");
    expect(data.price_usd).toBe("0.01");
    expect(data.address).toBe("EQ_not");
    expect(data.decimals).toBe(9);
  });

  test("throws TOKEN_NOT_FOUND for unknown symbol", async () => {
    await expect(fetchPriceData("XYZ")).rejects.toThrow("not found");
  });

  test("is case-insensitive", async () => {
    const data = await fetchPriceData("not");
    expect(data.symbol).toBe("NOT");
  });
});

describe("fetchPoolData", () => {
  test("returns enriched pool data with liquidity", async () => {
    const data = await fetchPoolData("NOT", "TON");
    expect(data.pool_address).toBe("EQ_pool_1");
    expect(data.fee_rate).toBe("0.3%");
    expect(data.apy).toBe("12.5%");
    // liquidity = 100000 NOT * 0.01 + 500 TON * 3.70 = 1000 + 1850 = 2850
    expect(data.liquidity_usd).toBe("2850.00");
  });

  test("throws TOKEN_NOT_FOUND for unknown token", async () => {
    await expect(fetchPoolData("XYZ", "TON")).rejects.toThrow("not found");
  });

  test("throws POOL_NOT_FOUND for nonexistent pair", async () => {
    // TON/TON doesn't exist
    await expect(fetchPoolData("TON", "TON")).rejects.toThrow("No pool found");
  });
});

describe("fetchTrendingData", () => {
  test("returns tokens ranked by liquidity", async () => {
    const data = await fetchTrendingData(10);
    expect(data.tokens.length).toBeGreaterThan(0);
    expect(data.tokens[0]?.rank).toBe(1);
    expect(data.tokens[0]?.symbol).toBeDefined();
  });

  test("respects limit parameter", async () => {
    const data = await fetchTrendingData(1);
    expect(data.tokens).toHaveLength(1);
  });
});

describe("fetchSwapSimulation", () => {
  test("returns simulation with unit conversion and USD", async () => {
    // Override fetch to handle both assets and swap simulate
    fetchSpy.mockRestore();
    fetchSpy = spyOn(globalThis, "fetch").mockImplementation(((url: string) => {
      if (url.includes("/swap/simulate")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              offer_address: "EQ_not",
              ask_address: "EQ_ton",
              offer_units: "1000000000000",
              ask_units: "270270270",
              swap_rate: "0.00027027",
              price_impact: "0.15%",
              min_ask_units: "267567567",
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          ),
        );
      }
      if (url.includes("/pools")) {
        return Promise.resolve(
          new Response(JSON.stringify({ pool_list: pools }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }
      return Promise.resolve(
        new Response(JSON.stringify({ asset_list: assets }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }) as unknown as typeof fetch);

    const data = await fetchSwapSimulation("NOT", "TON", "1000", "1");
    expect(data.type).toBe("simulation");
    expect(data.from.symbol).toBe("NOT");
    expect(data.to.symbol).toBe("TON");
    expect(data.price_impact).toBe("0.15%");
    expect(data.slippage_tolerance).toBe("1%");
    expect(Number.parseFloat(data.from.amount_usd)).toBeGreaterThan(0);
  });

  test("throws for unknown token", async () => {
    await expect(fetchSwapSimulation("XYZ", "TON", "100", "1")).rejects.toThrow("not found");
  });
});

describe("fetchResearchData", () => {
  test("returns composite research data", async () => {
    const data = await fetchResearchData("NOT");
    expect(data.token.symbol).toBe("NOT");
    expect(data.pools.length).toBeGreaterThan(0);
    expect(data.summary.pool_count).toBeGreaterThan(0);
    expect(Number.parseFloat(data.summary.total_liquidity_usd)).toBeGreaterThan(0);
  });
});
