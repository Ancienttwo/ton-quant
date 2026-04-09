import { describe, expect, test } from "bun:test";
import type {
  BalanceData,
  HistoryData,
  PoolData,
  PriceData,
  ResearchData,
  SwapSimulationData,
  TrendingData,
} from "../../src/types/cli.js";
import {
  formatBalance,
  formatHistory,
  formatPool,
  formatPrice,
  formatResearch,
  formatSwapSimulation,
  formatTrending,
  greenRed,
} from "../../src/utils/format.js";
import {
  formatAutoresearchList as formatQuantAutoresearchList,
  formatAutoresearchResult as formatQuantAutoresearchResult,
} from "../../src/utils/format-quant.js";

describe("greenRed", () => {
  test("returns green-styled string for positive values", () => {
    expect(greenRed("+3.2%")).toContain("+3.2%");
  });

  test("returns red-styled string for negative values", () => {
    expect(greenRed("-1.5%")).toContain("-1.5%");
  });

  test("returns gray-styled string for neutral values", () => {
    expect(greenRed("0%")).toContain("0%");
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

describe("formatPool", () => {
  test("formats pool data as table", () => {
    const data: PoolData = {
      pool_address: "EQ_pool",
      token0: { symbol: "NOT", reserve: "100000" },
      token1: { symbol: "TON", reserve: "500" },
      liquidity_usd: "2850.00",
      volume_24h: "N/A",
      fee_rate: "0.3%",
      apy: "12.5%",
    };
    const result = formatPool(data);
    expect(result).toContain("NOT");
    expect(result).toContain("TON");
    expect(result).toContain("2850.00");
    expect(result).toContain("0.3%");
  });
});

describe("formatTrending", () => {
  test("formats trending data as table", () => {
    const data: TrendingData = {
      tokens: [
        { rank: 1, symbol: "NOT", price_usd: "0.0068", change_24h: "+12.5%", volume_24h: "N/A" },
        { rank: 2, symbol: "DOGS", price_usd: "0.0005", change_24h: "+8.3%", volume_24h: "N/A" },
      ],
    };
    const result = formatTrending(data);
    expect(result).toContain("NOT");
    expect(result).toContain("DOGS");
  });
});

describe("formatBalance", () => {
  test("formats balance data", () => {
    const data: BalanceData = {
      address: "UQ_test",
      network: "mainnet",
      toncoin: { balance: "12.5", usd_value: "46.25" },
      jettons: [{ symbol: "NOT", balance: "5000", usd_value: "34.00" }],
      total_usd: "80.25",
    };
    const result = formatBalance(data);
    expect(result).toContain("UQ_test");
    expect(result).toContain("12.5");
    expect(result).toContain("NOT");
    expect(result).toContain("80.25");
  });
});

describe("formatSwapSimulation", () => {
  test("formats swap simulation data", () => {
    const data: SwapSimulationData = {
      type: "simulation",
      from: { symbol: "NOT", amount: "1000", amount_usd: "6.80" },
      to: { symbol: "TON", expected_amount: "0.368", amount_usd: "6.75" },
      price_impact: "0.1%",
      fee: "0.003",
      minimum_received: "0.364",
      slippage_tolerance: "1%",
      route: ["NOT → TON"],
    };
    const result = formatSwapSimulation(data);
    expect(result).toContain("Swap Simulation");
    expect(result).toContain("NOT");
    expect(result).toContain("0.368");
    expect(result).toContain("0.1%");
  });
});

describe("formatHistory", () => {
  test("formats history data as table", () => {
    const data: HistoryData = {
      address: "UQ_test",
      transactions: [
        {
          event_id: "e1",
          timestamp: "2024-03-22T00:00:00Z",
          type: "TonTransfer",
          description: "Sent 1 TON",
          status: "ok",
        },
      ],
      total: 1,
    };
    const result = formatHistory(data);
    expect(result).toContain("UQ_test");
    expect(result).toContain("TonTransfer");
    expect(result).toContain("Sent 1 TON");
  });
});

describe("formatResearch", () => {
  test("formats research report", () => {
    const data: ResearchData = {
      token: {
        symbol: "NOT",
        name: "Notcoin",
        address: "EQ_not",
        decimals: 9,
        price_usd: "0.01",
        change_24h: "N/A",
        volume_24h: "N/A",
      },
      pools: [
        {
          pool_address: "EQ_p",
          token0: { symbol: "NOT", reserve: "100000" },
          token1: { symbol: "TON", reserve: "500" },
          liquidity_usd: "2850.00",
          volume_24h: "N/A",
          fee_rate: "0.3%",
        },
      ],
      summary: { total_liquidity_usd: "2850.00", pool_count: 1, top_pair: "NOT/TON" },
    };
    const result = formatResearch(data);
    expect(result).toContain("Research Report");
    expect(result).toContain("NOT");
    expect(result).toContain("2850.00");
    expect(result).toContain("NOT/TON");
  });
});

describe("formatAutoresearchResult", () => {
  test("formats durable track metadata", () => {
    const result = formatQuantAutoresearchResult({
      status: "pending-review",
      baseline: {
        title: "TON Momentum",
        strategy: "momentum",
        symbols: ["TON/USDT"],
        startDate: "2024-01-01",
        endDate: "2024-03-31",
      },
      state: {
        status: "pending-review",
        latestRun: {
          runId: "run-123",
          status: "completed",
          iterationsCompleted: 1,
          iterationsRequested: 1,
        },
        bestCandidateId: null,
        latestCandidateId: "run-123-1",
      },
      candidates: [
        {
          candidateId: "run-123-1",
          status: "pending-review",
          summary: "Recommendation BUY",
        },
      ],
      history: [
        {
          timestamp: "2024-03-31T00:00:00.000Z",
          message: "Run completed",
        },
      ],
    });

    expect(result).toContain("TON Momentum");
    expect(result).toContain("run-123");
    expect(result).toContain("run-123-1");
    expect(result).toContain("Run completed");
  });
});

describe("formatAutoresearchList", () => {
  test("formats track summaries", () => {
    const result = formatQuantAutoresearchList({
      tracks: [
        {
          trackId: "track-1",
          title: "TON Momentum",
          status: "pending-review",
          updatedAt: "2024-03-31T00:00:00.000Z",
          candidateCount: 2,
          pendingPromotionCount: 1,
        },
      ],
    });

    expect(result).toContain("track-1");
    expect(result).toContain("2");
    expect(result).toContain("1");
  });
});
