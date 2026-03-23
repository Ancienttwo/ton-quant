import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ComponentWeightSchema,
  CompositeDefinitionSchema,
  CompositeEntrySchema,
  CompositeIndexSchema,
} from "../../src/types/factor-compose.js";
import {
  normalizeWeights,
  deriveBacktest,
  validateComponents,
  composeFactors,
  listComposites,
  getComposite,
  deleteComposite,
  CompositionValidationError,
  DuplicateCompositeError,
  CompositeNotFoundError,
  COMPOSITES_PATH,
} from "../../src/services/compose.js";
import { publishFactor } from "../../src/services/registry.js";
import type { FactorMetaPublic, FactorBacktestSummary } from "../../src/types/factor-registry.js";

// ── Test helpers ─────────────────────────────────────────────

function makeBacktest(overrides: Partial<FactorBacktestSummary> = {}): FactorBacktestSummary {
  return {
    sharpe: 1.5,
    maxDrawdown: -0.12,
    winRate: 0.55,
    cagr: 0.25,
    dataRange: { start: "2026-01-01", end: "2026-03-01" },
    tradeCount: 30,
    ...overrides,
  };
}

function makeFactor(id: string, overrides: Partial<FactorMetaPublic> = {}): FactorMetaPublic {
  return {
    id,
    name: `Factor ${id}`,
    author: "test",
    category: "momentum",
    source: "indicator",
    assets: ["TON"],
    timeframe: "1d",
    description: `Test factor ${id}`,
    parameters: [],
    backtest: makeBacktest(),
    visibility: "free",
    version: "1.0.0",
    createdAt: "2026-03-24T00:00:00Z",
    updatedAt: "2026-03-24T00:00:00Z",
    ...overrides,
  };
}

const now = "2026-03-24T10:00:00Z";

// ============================================================
// Schema Tests
// ============================================================

describe("ComponentWeightSchema", () => {
  it("accepts valid weight", () => {
    const result = ComponentWeightSchema.parse({ factorId: "mom_30d", weight: 0.6 });
    expect(result.factorId).toBe("mom_30d");
    expect(result.weight).toBe(0.6);
  });

  it("accepts negative weight for hedging", () => {
    const result = ComponentWeightSchema.parse({ factorId: "vol_7d", weight: -0.3 });
    expect(result.weight).toBe(-0.3);
  });

  it("rejects weight > 1", () => {
    expect(() => ComponentWeightSchema.parse({ factorId: "mom_30d", weight: 1.5 })).toThrow();
  });

  it("rejects weight < -1", () => {
    expect(() => ComponentWeightSchema.parse({ factorId: "mom_30d", weight: -1.5 })).toThrow();
  });

  it("rejects invalid factor ID", () => {
    expect(() => ComponentWeightSchema.parse({ factorId: "AB", weight: 0.5 })).toThrow();
  });
});

describe("CompositeDefinitionSchema", () => {
  it("requires minimum 2 components", () => {
    expect(() =>
      CompositeDefinitionSchema.parse({
        id: "blend_one",
        name: "Single",
        description: "Just one",
        components: [{ factorId: "mom_30d", weight: 1.0 }],
        createdAt: now,
        updatedAt: now,
      }),
    ).toThrow();
  });

  it("defaults normalizeWeights to true", () => {
    const result = CompositeDefinitionSchema.parse({
      id: "mom_vol_blend",
      name: "Blend",
      description: "Test blend",
      components: [
        { factorId: "mom_30d", weight: 0.6 },
        { factorId: "vol_7d", weight: 0.4 },
      ],
      createdAt: now,
      updatedAt: now,
    });
    expect(result.normalizeWeights).toBe(true);
  });

  it("validates composite ID format", () => {
    expect(() =>
      CompositeDefinitionSchema.parse({
        id: "AB",
        name: "Bad",
        description: "Bad ID",
        components: [
          { factorId: "mom_30d", weight: 0.5 },
          { factorId: "vol_7d", weight: 0.5 },
        ],
        createdAt: now,
        updatedAt: now,
      }),
    ).toThrow();
  });
});

// ============================================================
// Pure Function Tests
// ============================================================

describe("normalizeWeights", () => {
  it("returns same weights when already normalized", () => {
    const input = [
      { factorId: "aaa", weight: 0.6 },
      { factorId: "bbb", weight: 0.4 },
    ];
    const result = normalizeWeights(input);
    expect(result[0].weight).toBeCloseTo(0.6);
    expect(result[1].weight).toBeCloseTo(0.4);
  });

  it("normalizes unequal weights", () => {
    const input = [
      { factorId: "aaa", weight: 0.9 },
      { factorId: "bbb", weight: 0.3 },
    ];
    const result = normalizeWeights(input);
    // abs sum = 1.2, so 0.9/1.2=0.75, 0.3/1.2=0.25
    expect(result[0].weight).toBeCloseTo(0.75);
    expect(result[1].weight).toBeCloseTo(0.25);
  });

  it("preserves sign for negative weights", () => {
    const input = [
      { factorId: "aaa", weight: 0.8 },
      { factorId: "bbb", weight: -0.2 },
    ];
    const result = normalizeWeights(input);
    // abs sum = 1.0, already normalized
    expect(result[0].weight).toBeCloseTo(0.8);
    expect(result[1].weight).toBeCloseTo(-0.2);
  });

  it("throws on all-zero weights", () => {
    const input = [
      { factorId: "aaa", weight: 0 },
      { factorId: "bbb", weight: 0 },
    ];
    expect(() => normalizeWeights(input)).toThrow(CompositionValidationError);
  });

  it("does not mutate input array", () => {
    const input = [
      { factorId: "aaa", weight: 0.9 },
      { factorId: "bbb", weight: 0.3 },
    ];
    const originalWeight = input[0].weight;
    normalizeWeights(input);
    expect(input[0].weight).toBe(originalWeight);
  });
});

describe("deriveBacktest", () => {
  const bt1 = makeBacktest({ sharpe: 2.0, maxDrawdown: -0.10, winRate: 0.60, cagr: 0.30, tradeCount: 30 });
  const bt2 = makeBacktest({ sharpe: 1.0, maxDrawdown: -0.20, winRate: 0.50, cagr: 0.15, tradeCount: 42 });

  it("calculates weighted average sharpe", () => {
    const result = deriveBacktest([
      { weight: 0.6, backtest: bt1 },
      { weight: 0.4, backtest: bt2 },
    ]);
    // 0.6*2.0 + 0.4*1.0 = 1.6
    expect(result.sharpe).toBeCloseTo(1.6);
  });

  it("uses worst (most negative) drawdown", () => {
    const result = deriveBacktest([
      { weight: 0.6, backtest: bt1 },
      { weight: 0.4, backtest: bt2 },
    ]);
    expect(result.maxDrawdown).toBe(-0.20);
  });

  it("calculates weighted average win rate", () => {
    const result = deriveBacktest([
      { weight: 0.6, backtest: bt1 },
      { weight: 0.4, backtest: bt2 },
    ]);
    // 0.6*0.60 + 0.4*0.50 = 0.56
    expect(result.winRate).toBeCloseTo(0.56);
  });

  it("calculates weighted average cagr", () => {
    const result = deriveBacktest([
      { weight: 0.6, backtest: bt1 },
      { weight: 0.4, backtest: bt2 },
    ]);
    // 0.6*0.30 + 0.4*0.15 = 0.24
    expect(result.cagr).toBeCloseTo(0.24);
  });

  it("intersects data ranges (latest start, earliest end)", () => {
    const btA = makeBacktest({ dataRange: { start: "2026-01-01", end: "2026-03-15" } });
    const btB = makeBacktest({ dataRange: { start: "2026-01-15", end: "2026-04-01" } });
    const result = deriveBacktest([
      { weight: 0.5, backtest: btA },
      { weight: 0.5, backtest: btB },
    ]);
    expect(result.dataRange.start).toBe("2026-01-15");
    expect(result.dataRange.end).toBe("2026-03-15");
  });

  it("sums trade counts", () => {
    const result = deriveBacktest([
      { weight: 0.6, backtest: bt1 },
      { weight: 0.4, backtest: bt2 },
    ]);
    expect(result.tradeCount).toBe(72);
  });

  it("uses absolute weights for averaging", () => {
    const result = deriveBacktest([
      { weight: 0.8, backtest: bt1 },
      { weight: -0.2, backtest: bt2 },
    ]);
    // abs weights: 0.8, 0.2 → normalized: 0.8, 0.2
    // sharpe: 0.8*2.0 + 0.2*1.0 = 1.8
    expect(result.sharpe).toBeCloseTo(1.8);
  });

  it("throws on non-overlapping data ranges", () => {
    const btA = makeBacktest({ dataRange: { start: "2025-01-01", end: "2025-03-01" } });
    const btB = makeBacktest({ dataRange: { start: "2025-06-01", end: "2025-09-01" } });
    expect(() =>
      deriveBacktest([
        { weight: 0.5, backtest: btA },
        { weight: 0.5, backtest: btB },
      ]),
    ).toThrow(CompositionValidationError);
  });
});

describe("validateComponents", () => {
  const factors = [makeFactor("mom_30d"), makeFactor("vol_7d")];

  it("passes when all components exist", () => {
    const result = validateComponents(
      [
        { factorId: "mom_30d", weight: 0.5 },
        { factorId: "vol_7d", weight: 0.5 },
      ],
      factors,
    );
    expect(result).toEqual({ valid: true });
  });

  it("reports missing factors", () => {
    const result = validateComponents(
      [
        { factorId: "mom_30d", weight: 0.5 },
        { factorId: "nonexistent", weight: 0.5 },
      ],
      factors,
    );
    expect(result).toEqual({ valid: false, missing: ["nonexistent"] });
  });
});

// ============================================================
// Integration Tests (with filesystem)
// ============================================================

describe("compose service integration", () => {
  const TEST_REGISTRY_ROOT = join(process.env.HOME ?? "/tmp", ".tonquant", "registry");
  const TEST_COMPOSITES = join(TEST_REGISTRY_ROOT, "composites.json");

  // Seed two factors before each test
  beforeEach(() => {
    // Clean composites file
    if (existsSync(TEST_COMPOSITES)) {
      rmSync(TEST_COMPOSITES);
    }

    // Publish test factors
    publishFactor(makeFactor("alpha_mom"), { force: true });
    publishFactor(
      makeFactor("beta_vol", {
        category: "volatility",
        backtest: makeBacktest({ sharpe: 1.0, maxDrawdown: -0.20, winRate: 0.50, cagr: 0.15, tradeCount: 42 }),
      }),
      { force: true },
    );
  });

  afterEach(() => {
    if (existsSync(TEST_COMPOSITES)) {
      rmSync(TEST_COMPOSITES);
    }
  });

  it("composes two factors successfully", () => {
    const entry = composeFactors({
      id: "mom_vol_blend",
      name: "Momentum-Volatility Blend",
      description: "60% momentum, 40% volatility",
      components: [
        { factorId: "alpha_mom", weight: 0.6 },
        { factorId: "beta_vol", weight: 0.4 },
      ],
      normalizeWeights: true,
      createdAt: now,
      updatedAt: now,
    });

    expect(entry.definition.id).toBe("mom_vol_blend");
    expect(entry.derivedBacktest.sharpe).toBeCloseTo(1.3); // 0.6*1.5 + 0.4*1.0
    expect(entry.derivedBacktest.maxDrawdown).toBe(-0.20);
  });

  it("rejects self-referencing composite", () => {
    expect(() =>
      composeFactors({
        id: "alpha_mom",
        name: "Self Ref",
        description: "References itself",
        components: [
          { factorId: "alpha_mom", weight: 0.5 },
          { factorId: "beta_vol", weight: 0.5 },
        ],
        normalizeWeights: true,
        createdAt: now,
        updatedAt: now,
      }),
    ).toThrow(CompositionValidationError);
  });

  it("throws for missing component factor", () => {
    expect(() =>
      composeFactors({
        id: "bad_blend",
        name: "Bad Blend",
        description: "References missing factor",
        components: [
          { factorId: "alpha_mom", weight: 0.5 },
          { factorId: "nonexistent", weight: 0.5 },
        ],
        normalizeWeights: true,
        createdAt: now,
        updatedAt: now,
      }),
    ).toThrow(CompositionValidationError);
  });

  it("rejects duplicate composite without force", () => {
    const def = {
      id: "dup_blend",
      name: "Dup",
      description: "Duplicate test",
      components: [
        { factorId: "alpha_mom", weight: 0.5 },
        { factorId: "beta_vol", weight: 0.5 },
      ],
      normalizeWeights: true,
      createdAt: now,
      updatedAt: now,
    };
    composeFactors(def);
    expect(() => composeFactors(def)).toThrow(DuplicateCompositeError);
  });

  it("allows overwrite with force", () => {
    const def = {
      id: "force_blend",
      name: "Force",
      description: "Force overwrite test",
      components: [
        { factorId: "alpha_mom", weight: 0.5 },
        { factorId: "beta_vol", weight: 0.5 },
      ],
      normalizeWeights: true,
      createdAt: now,
      updatedAt: now,
    };
    composeFactors(def);
    const updated = composeFactors(def, { force: true });
    expect(updated.definition.id).toBe("force_blend");
  });

  it("lists all saved composites", () => {
    composeFactors({
      id: "list_blend_a",
      name: "A",
      description: "First",
      components: [
        { factorId: "alpha_mom", weight: 0.5 },
        { factorId: "beta_vol", weight: 0.5 },
      ],
      normalizeWeights: true,
      createdAt: now,
      updatedAt: now,
    });
    composeFactors({
      id: "list_blend_b",
      name: "B",
      description: "Second",
      components: [
        { factorId: "alpha_mom", weight: 0.7 },
        { factorId: "beta_vol", weight: 0.3 },
      ],
      normalizeWeights: true,
      createdAt: now,
      updatedAt: now,
    });

    const all = listComposites();
    expect(all.length).toBe(2);
  });

  it("gets composite by ID", () => {
    composeFactors({
      id: "get_blend",
      name: "Get",
      description: "Get test",
      components: [
        { factorId: "alpha_mom", weight: 0.5 },
        { factorId: "beta_vol", weight: 0.5 },
      ],
      normalizeWeights: true,
      createdAt: now,
      updatedAt: now,
    });

    const entry = getComposite("get_blend");
    expect(entry.definition.name).toBe("Get");
  });

  it("throws for unknown composite ID", () => {
    expect(() => getComposite("nonexistent")).toThrow(CompositeNotFoundError);
  });

  it("deletes composite", () => {
    composeFactors({
      id: "del_blend",
      name: "Del",
      description: "Delete test",
      components: [
        { factorId: "alpha_mom", weight: 0.5 },
        { factorId: "beta_vol", weight: 0.5 },
      ],
      normalizeWeights: true,
      createdAt: now,
      updatedAt: now,
    });

    expect(deleteComposite("del_blend")).toBe(true);
    expect(deleteComposite("del_blend")).toBe(false);
    expect(listComposites().length).toBe(0);
  });
});
