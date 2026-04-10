import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import {
  clearMarketCache,
  fetchMarketCandlesData,
  fetchMarketCompareData,
  fetchMarketQuoteData,
  fetchMarketSearchData,
} from "../../src/index.js";

let fetchSpy: ReturnType<typeof spyOn>;
let dateNowSpy: ReturnType<typeof spyOn> | null = null;

const binanceExchangeInfo = {
  symbols: [
    {
      symbol: "BTCUSDT",
      status: "TRADING",
      baseAsset: "BTC",
      quoteAsset: "USDT",
      isSpotTradingAllowed: true,
    },
    {
      symbol: "ETHUSDT",
      status: "TRADING",
      baseAsset: "ETH",
      quoteAsset: "USDT",
      isSpotTradingAllowed: true,
    },
  ],
};

const binanceTicker = {
  symbol: "BTCUSDT",
  priceChangePercent: "1.250",
  lastPrice: "72000.00",
  quoteVolume: "123456789.00",
  highPrice: "73000.00",
  lowPrice: "70000.00",
  closeTime: 1_775_838_586_248,
};

const binanceKlines = [
  [
    1_775_606_400_000,
    "71000.00",
    "72500.00",
    "70500.00",
    "72000.00",
    "100.00",
    1_775_692_799_999,
    "7200000.00",
    111,
    "50.00",
    "3600000.00",
    "0",
  ],
];

const hyperliquidMeta = {
  universe: [{ name: "BTC" }, { name: "ETH" }],
};

const hyperliquidAllMids = {
  BTC: "72100.0",
  ETH: "3500.0",
};

const hyperliquidCandles = [
  {
    t: 1_775_520_000_000,
    T: 1_775_606_399_999,
    s: "BTC",
    i: "1d",
    o: "70000.0",
    c: "71000.0",
    h: "71500.0",
    l: "69000.0",
    v: "50000.0",
    n: 100,
  },
  {
    t: 1_775_606_400_000,
    T: 1_775_692_799_999,
    s: "BTC",
    i: "1d",
    o: "71000.0",
    c: "72000.0",
    h: "72500.0",
    l: "70500.0",
    v: "60000.0",
    n: 120,
  },
];

beforeEach(() => {
  clearMarketCache();
  fetchSpy = spyOn(globalThis, "fetch").mockImplementation((async (input, init) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url.includes("/exchangeInfo")) {
      return new Response(JSON.stringify(binanceExchangeInfo), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (url.includes("/ticker/24hr")) {
      return new Response(JSON.stringify(binanceTicker), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (url.includes("/klines")) {
      return new Response(JSON.stringify(binanceKlines), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (url === "https://api.hyperliquid.xyz/info") {
      const body = JSON.parse(String(init?.body ?? "{}")) as { type?: string };
      if (body.type === "meta") {
        return new Response(JSON.stringify(hyperliquidMeta), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (body.type === "allMids") {
        return new Response(JSON.stringify(hyperliquidAllMids), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (body.type === "candleSnapshot") {
        return new Response(JSON.stringify(hyperliquidCandles), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
    return new Response("not found", { status: 404 });
  }) as typeof fetch);
});

afterEach(() => {
  fetchSpy.mockRestore();
  dateNowSpy?.mockRestore();
  dateNowSpy = null;
  clearMarketCache();
});

describe("market service", () => {
  test("fetchMarketQuoteData returns Binance quote with trust metadata", async () => {
    const quote = await fetchMarketQuoteData("BTC");
    expect(quote.symbol).toBe("BTC");
    expect(quote.trust.provider).toBe("binance");
    expect(quote.trust.provider_symbol).toBe("BTCUSDT");
    expect(quote.price).toBe("72000.00");
  });

  test("fetchMarketQuoteData caches identical request keys", async () => {
    await fetchMarketQuoteData("BTC", "binance");
    await fetchMarketQuoteData("BTC", "binance");
    const calls = fetchSpy.mock.calls.filter((call: [unknown, unknown?]) =>
      String(call[0]).includes("/ticker/24hr"),
    );
    expect(calls).toHaveLength(1);
  });

  test("fetchMarketQuoteData refreshes age_seconds even when served from cache", async () => {
    dateNowSpy = spyOn(Date, "now").mockReturnValue(1_775_838_586_248);
    const first = await fetchMarketQuoteData("BTC", "binance");
    expect(first.trust.age_seconds).toBe(0);

    dateNowSpy.mockReturnValue(1_775_838_591_248);
    const second = await fetchMarketQuoteData("BTC", "binance");
    expect(second.trust.age_seconds).toBe(5);
  });

  test("fetchMarketQuoteData returns Hyperliquid quote with perp provenance", async () => {
    const quote = await fetchMarketQuoteData("BTC", "hyperliquid");
    expect(quote.symbol).toBe("BTC");
    expect(quote.trust.provider).toBe("hyperliquid");
    expect(quote.trust.market_type).toBe("perpetual");
    expect(quote.price).toBe("72100.0");
  });

  test("fetchMarketSearchData returns candidates across providers", async () => {
    const result = await fetchMarketSearchData("BTC");
    expect(result.candidates.some((candidate) => candidate.provider === "binance")).toBe(true);
    expect(result.candidates.some((candidate) => candidate.provider === "hyperliquid")).toBe(true);
  });

  test("fetchMarketCompareData computes symmetric spread", async () => {
    const result = await fetchMarketCompareData("BTC");
    expect(result.quotes).toHaveLength(2);
    expect(Number(result.spread_abs)).toBeGreaterThan(0);
  });

  test("fetchMarketCandlesData isolates cache by provider", async () => {
    await fetchMarketCandlesData("BTC", { provider: "binance", interval: "1d", limit: 1 });
    await fetchMarketCandlesData("BTC", { provider: "hyperliquid", interval: "1d", limit: 1 });
    const binanceCalls = fetchSpy.mock.calls.filter((call: [unknown, unknown?]) =>
      String(call[0]).includes("/klines"),
    );
    const hyperliquidCalls = fetchSpy.mock.calls.filter(
      (call: [unknown, { body?: unknown }?]) =>
        String(call[0]) === "https://api.hyperliquid.xyz/info" &&
        String(call[1]?.body ?? "").includes("candleSnapshot"),
    );
    expect(binanceCalls).toHaveLength(1);
    expect(hyperliquidCalls).toHaveLength(1);
  });

  test("fetchMarketCandlesData respects the requested limit for Hyperliquid", async () => {
    const result = await fetchMarketCandlesData("BTC", {
      provider: "hyperliquid",
      interval: "1d",
      limit: 1,
    });
    expect(result.candles).toHaveLength(1);
  });
});
