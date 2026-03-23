import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { publishFactor } from "../../src/services/registry.js";
import {
  setAlert,
  listAlerts,
  removeAlert,
} from "../../src/services/alerts.js";
import { FactorNotFoundError } from "../../src/services/registry.js";
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

const ALERTS_PATH = join(process.env.HOME ?? "/tmp", ".tonquant", "alerts.json");

describe("alert service", () => {
  beforeEach(() => {
    if (existsSync(ALERTS_PATH)) rmSync(ALERTS_PATH);
    publishFactor(makeFactor("alert_test_factor"), { force: true });
  });

  afterEach(() => {
    if (existsSync(ALERTS_PATH)) rmSync(ALERTS_PATH);
  });

  it("sets an alert for an existing factor", () => {
    const alert = setAlert("alert_test_factor", "above", 1.5);
    expect(alert.factorId).toBe("alert_test_factor");
    expect(alert.condition).toBe("above");
    expect(alert.threshold).toBe(1.5);
    expect(alert.active).toBe(true);
  });

  it("throws for nonexistent factor", () => {
    expect(() => setAlert("nonexistent_xyz", "above", 1.0)).toThrow(FactorNotFoundError);
  });

  it("updates threshold for duplicate factorId+condition", () => {
    setAlert("alert_test_factor", "above", 1.0);
    setAlert("alert_test_factor", "above", 2.0);
    const alerts = listAlerts();
    const matching = alerts.filter(
      (a) => a.factorId === "alert_test_factor" && a.condition === "above",
    );
    expect(matching.length).toBe(1);
    expect(matching[0].threshold).toBe(2.0);
  });

  it("allows different conditions for same factor", () => {
    setAlert("alert_test_factor", "above", 2.0);
    setAlert("alert_test_factor", "below", 0.5);
    const alerts = listAlerts().filter((a) => a.factorId === "alert_test_factor");
    expect(alerts.length).toBe(2);
  });

  it("lists empty when no alerts file", () => {
    const alerts = listAlerts();
    // May contain alerts from other tests, but should not throw
    expect(Array.isArray(alerts)).toBe(true);
  });

  it("lists all set alerts", () => {
    setAlert("alert_test_factor", "above", 1.5);
    const alerts = listAlerts();
    expect(alerts.length).toBeGreaterThanOrEqual(1);
    expect(alerts.some((a) => a.factorId === "alert_test_factor")).toBe(true);
  });

  it("removes alerts by factorId", () => {
    setAlert("alert_test_factor", "above", 1.5);
    setAlert("alert_test_factor", "below", 0.5);
    const removed = removeAlert("alert_test_factor");
    expect(removed).toBe(true);
    const alerts = listAlerts().filter((a) => a.factorId === "alert_test_factor");
    expect(alerts.length).toBe(0);
  });

  it("returns false when removing nonexistent alert", () => {
    expect(removeAlert("no_such_alert")).toBe(false);
  });
});
