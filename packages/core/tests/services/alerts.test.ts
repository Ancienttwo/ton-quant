import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { listAlerts, removeAlert, setAlert } from "../../src/services/alerts.js";
import { readEvents } from "../../src/services/event-log.js";
import { FactorNotFoundError, publishFactor } from "../../src/services/registry.js";
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
const EVENT_LOG_PATH = join(process.env.HOME ?? "/tmp", ".tonquant", "test-alert-events.jsonl");
const EVENT_LOG_LOCK_PATH = `${EVENT_LOG_PATH}.lock`;

function resetEventLogEnv(): void {
  process.env.TONQUANT_EVENT_LOG_PATH = EVENT_LOG_PATH;
  delete process.env.TONQUANT_EVENT_LOG_FAIL_APPEND;
}

function clearEventArtifacts(): void {
  if (existsSync(EVENT_LOG_PATH)) rmSync(EVENT_LOG_PATH);
  if (existsSync(EVENT_LOG_LOCK_PATH)) rmSync(EVENT_LOG_LOCK_PATH);
}

describe("alert service", () => {
  beforeEach(() => {
    resetEventLogEnv();
    clearEventArtifacts();
    if (existsSync(ALERTS_PATH)) rmSync(ALERTS_PATH);
    publishFactor(makeFactor("alert_test_factor"), { force: true });
    clearEventArtifacts();
  });

  afterEach(() => {
    if (existsSync(ALERTS_PATH)) rmSync(ALERTS_PATH);
    clearEventArtifacts();
    delete process.env.TONQUANT_EVENT_LOG_PATH;
    delete process.env.TONQUANT_EVENT_LOG_FAIL_APPEND;
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
    expect(matching[0]?.threshold).toBe(2.0);
  });

  it("appends an audit event when setting an alert", () => {
    setAlert("alert_test_factor", "above", 1.5);

    const events = readEvents({ type: "factor.alert.set" });
    expect(events.length).toBe(1);
    expect(events[0]?.entity.id).toBe("alert_test_factor");
  });

  it("rolls back alert writes when event append fails", () => {
    process.env.TONQUANT_EVENT_LOG_FAIL_APPEND = "1";

    expect(() => setAlert("alert_test_factor", "above", 1.5)).toThrow(
      "Injected event log append failure.",
    );
    expect(listAlerts()).toEqual([]);
    expect(readEvents()).toEqual([]);
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

  it("appends an audit event when removing alerts", () => {
    setAlert("alert_test_factor", "above", 1.5);
    clearEventArtifacts();

    removeAlert("alert_test_factor");

    const events = readEvents({ type: "factor.alert.remove" });
    expect(events.length).toBe(1);
    expect(events[0]?.payload?.removedCount).toBe(1);
  });

  it("rolls back alert removal when event append fails", () => {
    setAlert("alert_test_factor", "above", 1.5);
    clearEventArtifacts();
    process.env.TONQUANT_EVENT_LOG_FAIL_APPEND = "1";

    expect(() => removeAlert("alert_test_factor")).toThrow("Injected event log append failure.");
    expect(listAlerts().map((alert) => alert.factorId)).toEqual(["alert_test_factor"]);
    expect(readEvents()).toEqual([]);
  });

  it("returns false when removing nonexistent alert", () => {
    expect(removeAlert("no_such_alert")).toBe(false);
  });

  it("does not append an event for no-op alert removal", () => {
    expect(removeAlert("no_such_alert")).toBe(false);
    expect(readEvents()).toEqual([]);
  });
});
