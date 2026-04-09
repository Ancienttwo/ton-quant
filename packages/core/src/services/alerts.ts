import { join } from "node:path";
import { CONFIG_DIR } from "../types/config.js";
import { AlertsFileSchema, type FactorAlert, FactorAlertSchema } from "../types/factor-registry.js";
import { readJsonFile, writeJsonFileAtomic } from "../utils/file-store.js";
import { mutateWithEvent } from "./event-log.js";
import { getFactorDetail } from "./registry.js";

// ── Paths ──────────────────────────────────────────────────
const ALERTS_PATH = join(CONFIG_DIR, "alerts.json");

// ── IO helpers ─────────────────────────────────────────────

function readAlerts(): FactorAlert[] {
  return readJsonFile<{ alerts: FactorAlert[] }>(ALERTS_PATH, AlertsFileSchema, {
    defaultValue: { alerts: [] },
    corruptedCode: "ALERTS_CORRUPTED",
    corruptedMessage: `alerts.json is corrupted. Delete ${ALERTS_PATH} to reset.`,
  }).alerts;
}

function writeAlerts(alerts: ReadonlyArray<FactorAlert>): void {
  writeJsonFileAtomic(ALERTS_PATH, { alerts });
}

// ── Public API ─────────────────────────────────────────────

export function setAlert(
  factorId: string,
  condition: "above" | "below",
  threshold: number,
): FactorAlert {
  const result = mutateWithEvent({
    paths: [ALERTS_PATH],
    event: (state) => ({
      type: "factor.alert.set",
      entity: { kind: "factor", id: factorId },
      result: "success",
      summary: `Set ${condition} alert for factor ${factorId}.`,
      payload: {
        condition,
        threshold,
        replaced: state.replaced,
      },
    }),
    apply: () => {
      getFactorDetail(factorId);

      const alert = FactorAlertSchema.parse({
        factorId,
        condition,
        threshold,
        createdAt: new Date().toISOString(),
        active: true,
      });

      const existing = readAlerts();
      const hasDuplicate = existing.some(
        (current) => current.factorId === factorId && current.condition === condition,
      );

      const updated = hasDuplicate
        ? existing.map((current) =>
            current.factorId === factorId && current.condition === condition ? alert : current,
          )
        : [...existing, alert];

      writeAlerts(updated);
      return { alert, replaced: hasDuplicate };
    },
  });
  return result.alert;
}

export function listAlerts(): FactorAlert[] {
  return readAlerts();
}

export function removeAlert(factorId: string): boolean {
  const result = mutateWithEvent({
    paths: [ALERTS_PATH],
    event: (state) =>
      state.removed
        ? {
            type: "factor.alert.remove",
            entity: { kind: "factor", id: factorId },
            result: "success",
            summary: `Removed alerts for factor ${factorId}.`,
            payload: {
              removedCount: state.removedCount,
            },
          }
        : null,
    apply: () => {
      const existing = readAlerts();
      const filtered = existing.filter((alert) => alert.factorId !== factorId);
      if (filtered.length === existing.length) {
        return { removed: false as const, removedCount: 0 };
      }
      writeAlerts(filtered);
      return {
        removed: true as const,
        removedCount: existing.length - filtered.length,
      };
    },
  });
  return result.removed;
}
