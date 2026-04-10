import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  CONFIG_DIR,
  type FactorMetaPublic,
  getAutomationJob,
  publishFactor,
  removeAlert,
  removeAutomationJob,
  scheduleAutomationJob,
  setAlert,
} from "@tonquant/core";
import { runAutomationDaemon, runAutomationJobNow } from "../../src/automation/runtime.js";

const EVENT_LOG_PATH = join(
  process.env.HOME ?? "/tmp",
  ".tonquant",
  "test-cli-automation-events.jsonl",
);
const EVENT_LOG_LOCK_PATH = `${EVENT_LOG_PATH}.lock`;

const createdJobIds = new Set<string>();
const createdArtifactDirs = new Set<string>();
const createdFactorIds = new Set<string>();

function uniqueId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

function makeFactor(id: string, sharpe = 1.5): FactorMetaPublic {
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
      sharpe,
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

function resetEventLogEnv(): void {
  process.env.TONQUANT_EVENT_LOG_PATH = EVENT_LOG_PATH;
  delete process.env.TONQUANT_EVENT_LOG_FAIL_APPEND;
}

function clearEventArtifacts(): void {
  if (existsSync(EVENT_LOG_PATH)) rmSync(EVENT_LOG_PATH);
  if (existsSync(EVENT_LOG_LOCK_PATH)) rmSync(EVENT_LOG_LOCK_PATH);
}

describe("automation runtime", () => {
  beforeEach(() => {
    resetEventLogEnv();
    clearEventArtifacts();
  });

  afterEach(() => {
    for (const jobId of createdJobIds) {
      removeAutomationJob(jobId);
    }
    createdJobIds.clear();

    for (const factorId of createdFactorIds) {
      removeAlert(factorId);
    }
    createdFactorIds.clear();

    for (const artifactDir of createdArtifactDirs) {
      if (existsSync(artifactDir)) {
        rmSync(artifactDir, { recursive: true, force: true });
      }
    }
    createdArtifactDirs.clear();

    clearEventArtifacts();
    delete process.env.TONQUANT_EVENT_LOG_PATH;
    delete process.env.TONQUANT_EVENT_LOG_FAIL_APPEND;
  });

  it("runs a scheduled job immediately through the shared runtime path", async () => {
    const factorId = uniqueId("runtime_factor");
    createdFactorIds.add(factorId);
    publishFactor(makeFactor(factorId), { force: true });
    setAlert(factorId, "above", 1.0);

    const jobId = uniqueId("runtime_run_now");
    createdJobIds.add(jobId);
    scheduleAutomationJob({
      jobId,
      kind: "factor.alert.evaluate",
      params: { factorId },
      schedule: { kind: "every", every: "30m" },
      actor: { kind: "manual", id: "test" },
    });

    const result = await runAutomationJobNow({ jobId });
    const detail = getAutomationJob(jobId);

    expect(result.record.status).toBe("completed");
    expect(detail.state.lastRunId).toBe(result.record.runId);
    expect(detail.history.at(-1)?.status).toBe("success");

    const artifactDir = dirname(
      result.record.artifactPaths.find((path) => path.endsWith("result.json")) ?? "",
    );
    createdArtifactDirs.add(artifactDir);
    expect(
      existsSync(join(CONFIG_DIR, "quant", "automation-runs", result.record.runId, "result.json")),
    ).toBe(true);
  });

  it("executes one due job in daemon once mode", async () => {
    const factorId = uniqueId("daemon_factor");
    createdFactorIds.add(factorId);
    publishFactor(makeFactor(factorId), { force: true });
    setAlert(factorId, "above", 1.0);

    const jobId = uniqueId("daemon_job");
    createdJobIds.add(jobId);
    scheduleAutomationJob({
      jobId,
      kind: "factor.alert.evaluate",
      params: { factorId },
      schedule: { kind: "at", at: new Date(Date.now() + 1).toISOString() },
      actor: { kind: "manual", id: "test" },
    });

    await new Promise((resolve) => setTimeout(resolve, 5));
    const result = await runAutomationDaemon({
      once: true,
      ownerId: uniqueId("daemon_owner"),
    });

    expect(result.executedJobIds).toContain(jobId);
    expect(result.failedJobIds).toHaveLength(0);

    const detail = getAutomationJob(jobId);
    expect(detail.state.status).toBe("completed");

    const runId = detail.state.lastRunId;
    expect(runId).toBeTruthy();
    if (runId) {
      const artifactDir = join(CONFIG_DIR, "quant", "automation-runs", runId);
      createdArtifactDirs.add(artifactDir);
      expect(existsSync(join(artifactDir, "result.json"))).toBe(true);
    }
  });
});
