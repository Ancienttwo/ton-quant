import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { CONFIG_DIR } from "../types/config.js";
import { ServiceError } from "../errors.js";
import { getFactorDetail } from "./registry.js";
import {
  FactorPerformanceReportSchema,
  ReportsFileSchema,
  type FactorPerformanceReport,
} from "../types/factor-registry.js";

// ── Constants ──────────────────────────────────────────────
const REPORTS_PATH = join(CONFIG_DIR, "reports.json");
const MAX_REPORTS = 1000;

// ── Error subclasses ───────────────────────────────────────
export class ReportValidationError extends ServiceError {
  constructor(message: string) {
    super(message, "REPORT_VALIDATION");
    this.name = "ReportValidationError";
  }
}

// ── IO helpers ─────────────────────────────────────────────

function readReports(): FactorPerformanceReport[] {
  if (!existsSync(REPORTS_PATH)) return [];
  try {
    const raw = JSON.parse(readFileSync(REPORTS_PATH, "utf-8"));
    return ReportsFileSchema.parse(raw).reports;
  } catch {
    throw new ServiceError(
      `reports.json is corrupted. Delete ${REPORTS_PATH} to reset.`,
      "REPORTS_CORRUPTED",
    );
  }
}

function writeReports(reports: ReadonlyArray<FactorPerformanceReport>): void {
  mkdirSync(join(CONFIG_DIR), { recursive: true });
  const tmp = join(tmpdir(), `reports-${Date.now()}-${randomBytes(4).toString("hex")}.json.tmp`);
  writeFileSync(tmp, JSON.stringify({ reports }, null, 2));
  renameSync(tmp, REPORTS_PATH);
}

// ── Public API ─────────────────────────────────────────────

export function submitReport(
  factorId: string,
  returnPct: number,
  period: string,
  agentId?: string,
): FactorPerformanceReport {
  // Validate factor exists
  getFactorDetail(factorId);

  const report = FactorPerformanceReportSchema.parse({
    factorId,
    agentId: agentId ?? "anonymous",
    returnPct,
    period,
    reportedAt: new Date().toISOString(),
    verified: false,
  });

  const existing = readReports();
  // Trim oldest reports if exceeding cap
  const trimmed = existing.length >= MAX_REPORTS
    ? existing.slice(existing.length - MAX_REPORTS + 1)
    : existing;
  writeReports([...trimmed, report]);
  return report;
}

export function listReports(factorId?: string): FactorPerformanceReport[] {
  const all = readReports();
  if (!factorId) return all;
  return all.filter((r) => r.factorId === factorId);
}
