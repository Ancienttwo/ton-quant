import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { FactorNotFoundError, publishFactor } from "../../src/services/registry.js";
import { listReports, submitReport } from "../../src/services/reports.js";
import type { FactorMetaPublic } from "../../src/types/factor-registry.js";

// ── Helpers ──────────────────────────────────────────────────

function makeFactor(id: string): FactorMetaPublic {
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
    backtest: {
      sharpe: 1.5,
      maxDrawdown: -0.12,
      winRate: 0.55,
      cagr: 0.25,
      dataRange: { start: "2026-01-01", end: "2026-03-01" },
      tradeCount: 30,
    },
    visibility: "free",
    version: "1.0.0",
    createdAt: "2026-03-24T00:00:00Z",
    updatedAt: "2026-03-24T00:00:00Z",
  };
}

const REPORTS_PATH = join(process.env.HOME ?? "/tmp", ".tonquant", "reports.json");

describe("report service", () => {
  beforeEach(() => {
    if (existsSync(REPORTS_PATH)) rmSync(REPORTS_PATH);
    publishFactor(makeFactor("report_test_factor"), { force: true });
  });

  afterEach(() => {
    if (existsSync(REPORTS_PATH)) rmSync(REPORTS_PATH);
  });

  it("submits a performance report", () => {
    const report = submitReport("report_test_factor", 15.5, "30d", "agent_001");
    expect(report.factorId).toBe("report_test_factor");
    expect(report.returnPct).toBe(15.5);
    expect(report.period).toBe("30d");
    expect(report.agentId).toBe("agent_001");
    expect(report.verified).toBe(false);
  });

  it("defaults agentId to anonymous", () => {
    const report = submitReport("report_test_factor", 10.0, "7d");
    expect(report.agentId).toBe("anonymous");
  });

  it("throws for nonexistent factor", () => {
    expect(() => submitReport("nonexistent_xyz", 10.0, "7d")).toThrow(FactorNotFoundError);
  });

  it("appends multiple reports for same factor", () => {
    submitReport("report_test_factor", 10.0, "7d", "agent_a");
    submitReport("report_test_factor", 20.0, "30d", "agent_b");
    const reports = listReports("report_test_factor");
    expect(reports.length).toBe(2);
  });

  it("lists all reports without filter", () => {
    submitReport("report_test_factor", 10.0, "7d");
    const all = listReports();
    expect(all.length).toBeGreaterThanOrEqual(1);
  });

  it("filters reports by factorId", () => {
    submitReport("report_test_factor", 10.0, "7d");
    const filtered = listReports("report_test_factor");
    expect(filtered.every((r) => r.factorId === "report_test_factor")).toBe(true);
    const empty = listReports("other_factor");
    expect(empty.length).toBe(0);
  });

  it("returns empty array when no reports file", () => {
    const reports = listReports();
    expect(Array.isArray(reports)).toBe(true);
  });
});
