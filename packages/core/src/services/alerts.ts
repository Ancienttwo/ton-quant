import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ServiceError } from "../errors.js";
import { CONFIG_DIR } from "../types/config.js";
import { AlertsFileSchema, type FactorAlert, FactorAlertSchema } from "../types/factor-registry.js";
import { getFactorDetail } from "./registry.js";

// ── Paths ──────────────────────────────────────────────────
const ALERTS_PATH = join(CONFIG_DIR, "alerts.json");

// ── IO helpers ─────────────────────────────────────────────

function readAlerts(): FactorAlert[] {
  if (!existsSync(ALERTS_PATH)) return [];
  try {
    const raw = JSON.parse(readFileSync(ALERTS_PATH, "utf-8"));
    return AlertsFileSchema.parse(raw).alerts;
  } catch {
    throw new ServiceError(
      `alerts.json is corrupted. Delete ${ALERTS_PATH} to reset.`,
      "ALERTS_CORRUPTED",
    );
  }
}

function writeAlerts(alerts: ReadonlyArray<FactorAlert>): void {
  mkdirSync(join(CONFIG_DIR), { recursive: true });
  const tmp = join(tmpdir(), `alerts-${Date.now()}-${randomBytes(4).toString("hex")}.json.tmp`);
  writeFileSync(tmp, JSON.stringify({ alerts }, null, 2));
  renameSync(tmp, ALERTS_PATH);
}

// ── Public API ─────────────────────────────────────────────

export function setAlert(
  factorId: string,
  condition: "above" | "below",
  threshold: number,
): FactorAlert {
  // Validate factor exists
  getFactorDetail(factorId);

  const alert = FactorAlertSchema.parse({
    factorId,
    condition,
    threshold,
    createdAt: new Date().toISOString(),
    active: true,
  });

  const existing = readAlerts();

  // Deduplicate: same factorId + condition → update threshold
  const hasDuplicate = existing.some((a) => a.factorId === factorId && a.condition === condition);

  const updated = hasDuplicate
    ? existing.map((a) => (a.factorId === factorId && a.condition === condition ? alert : a))
    : [...existing, alert];

  writeAlerts(updated);
  return alert;
}

export function listAlerts(): FactorAlert[] {
  return readAlerts();
}

export function removeAlert(factorId: string): boolean {
  const existing = readAlerts();
  const filtered = existing.filter((a) => a.factorId !== factorId);
  if (filtered.length === existing.length) return false;
  writeAlerts(filtered);
  return true;
}
