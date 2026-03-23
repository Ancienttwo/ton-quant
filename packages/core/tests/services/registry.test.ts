import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

// Override CONFIG_DIR before importing registry
const TEST_DIR = join(tmpdir(), `tonquant-registry-test-${Date.now()}`);

// We need to mock CONFIG_DIR. Since the registry uses it via import,
// we test the schemas directly and integration-test through the service.
import {
  FactorMetaPublicSchema,
  FactorMetaPrivateSchema,
  FactorRegistryIndexSchema,
  FactorIdSchema,
  FactorBacktestSummarySchema,
  FactorCategorySchema,
  FactorSubscriptionSchema,
  FactorPerformanceReportSchema,
  FactorAlertSchema,
} from "../../src/types/factor-registry.js";

// ── Schema validation tests ────────────────────────────────

describe("FactorIdSchema", () => {
  test("accepts valid IDs", () => {
    expect(FactorIdSchema.parse("mom_30d_ton")).toBe("mom_30d_ton");
    expect(FactorIdSchema.parse("rsi")).toBe("rsi");
    expect(FactorIdSchema.parse("vol_7d")).toBe("vol_7d");
  });

  test("rejects invalid IDs", () => {
    expect(() => FactorIdSchema.parse("ab")).toThrow(); // too short
    expect(() => FactorIdSchema.parse("UPPERCASE")).toThrow(); // uppercase
    expect(() => FactorIdSchema.parse("has-dashes")).toThrow(); // dashes
    expect(() => FactorIdSchema.parse("has spaces")).toThrow(); // spaces
    expect(() => FactorIdSchema.parse("a".repeat(65))).toThrow(); // too long
  });
});

describe("FactorCategorySchema", () => {
  test("accepts valid categories", () => {
    expect(FactorCategorySchema.parse("momentum")).toBe("momentum");
    expect(FactorCategorySchema.parse("value")).toBe("value");
    expect(FactorCategorySchema.parse("volatility")).toBe("volatility");
    expect(FactorCategorySchema.parse("liquidity")).toBe("liquidity");
    expect(FactorCategorySchema.parse("sentiment")).toBe("sentiment");
    expect(FactorCategorySchema.parse("custom")).toBe("custom");
  });

  test("rejects invalid categories", () => {
    expect(() => FactorCategorySchema.parse("invalid")).toThrow();
    expect(() => FactorCategorySchema.parse("")).toThrow();
  });
});

describe("FactorBacktestSummarySchema", () => {
  test("validates complete backtest", () => {
    const bt = {
      sharpe: 1.5,
      maxDrawdown: -0.15,
      winRate: 0.62,
      cagr: 0.25,
      dataRange: { start: "2026-01-01", end: "2026-03-01" },
      tradeCount: 42,
    };
    expect(FactorBacktestSummarySchema.parse(bt)).toEqual(bt);
  });

  test("rejects missing fields", () => {
    expect(() => FactorBacktestSummarySchema.parse({ sharpe: 1.5 })).toThrow();
  });

  test("rejects negative trade count", () => {
    expect(() =>
      FactorBacktestSummarySchema.parse({
        sharpe: 1.5,
        maxDrawdown: -0.1,
        winRate: 0.5,
        cagr: 0.1,
        dataRange: { start: "2026-01-01", end: "2026-03-01" },
        tradeCount: -1,
      }),
    ).toThrow();
  });
});

describe("FactorMetaPublicSchema", () => {
  const validFactor = {
    id: "mom_30d_ton",
    name: "30-Day Momentum",
    author: "local",
    category: "momentum" as const,
    source: "indicator" as const,
    assets: ["TON"],
    timeframe: "1d",
    description: "30-day momentum factor for TON",
    parameters: [],
    backtest: {
      sharpe: 1.8,
      maxDrawdown: -0.12,
      winRate: 0.58,
      cagr: 0.32,
      dataRange: { start: "2026-01-01", end: "2026-03-01" },
      tradeCount: 30,
    },
    visibility: "free" as const,
    version: "1.0.0",
    createdAt: "2026-03-24T00:00:00Z",
    updatedAt: "2026-03-24T00:00:00Z",
  };

  test("validates complete factor metadata", () => {
    const result = FactorMetaPublicSchema.parse(validFactor);
    expect(result.id).toBe("mom_30d_ton");
    expect(result.category).toBe("momentum");
    expect(result.backtest.sharpe).toBe(1.8);
  });

  test("rejects missing required fields", () => {
    const { id: _, ...noId } = validFactor;
    expect(() => FactorMetaPublicSchema.parse(noId)).toThrow();
  });

  test("rejects empty assets array", () => {
    expect(() => FactorMetaPublicSchema.parse({ ...validFactor, assets: [] })).toThrow();
  });

  test("defaults visibility to free", () => {
    const { visibility: _, ...noVis } = validFactor;
    const result = FactorMetaPublicSchema.parse(noVis);
    expect(result.visibility).toBe("free");
  });

  test("defaults version to 1.0.0", () => {
    const { version: _, ...noVer } = validFactor;
    const result = FactorMetaPublicSchema.parse(noVer);
    expect(result.version).toBe("1.0.0");
  });
});

describe("FactorMetaPrivateSchema", () => {
  test("validates private data", () => {
    const priv = {
      parameterValues: { window: 30, threshold: 0.5 },
      formula: "sma(close, window) / close - 1",
      signalThresholds: { buy: 0.02, sell: -0.01 },
    };
    const result = FactorMetaPrivateSchema.parse(priv);
    expect(result.parameterValues.window).toBe(30);
  });

  test("allows minimal private data", () => {
    const result = FactorMetaPrivateSchema.parse({ parameterValues: {} });
    expect(result.parameterValues).toEqual({});
  });
});

describe("FactorRegistryIndexSchema", () => {
  test("parses empty index", () => {
    const result = FactorRegistryIndexSchema.parse({});
    expect(result.version).toBe("1.0.0");
    expect(result.factors).toEqual([]);
  });
});

describe("FactorSubscriptionSchema", () => {
  test("validates subscription", () => {
    const sub = {
      factorId: "mom_30d_ton",
      subscribedAt: "2026-03-24T00:00:00Z",
      subscribedVersion: "1.0.0",
    };
    expect(FactorSubscriptionSchema.parse(sub)).toEqual(sub);
  });
});

describe("FactorPerformanceReportSchema", () => {
  test("validates report with verified=false default", () => {
    const report = {
      factorId: "mom_30d_ton",
      agentId: "openclaw_agent_1",
      returnPct: 0.12,
      period: "7d",
      reportedAt: "2026-03-24T00:00:00Z",
    };
    const result = FactorPerformanceReportSchema.parse(report);
    expect(result.verified).toBe(false);
  });
});

describe("FactorAlertSchema", () => {
  test("validates alert", () => {
    const alert = {
      factorId: "mom_30d_ton",
      condition: "above" as const,
      threshold: 0.8,
      createdAt: "2026-03-24T00:00:00Z",
    };
    const result = FactorAlertSchema.parse(alert);
    expect(result.active).toBe(true);
  });
});
