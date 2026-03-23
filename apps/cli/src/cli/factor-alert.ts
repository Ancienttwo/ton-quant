import type { Command } from "commander";
import { setAlert, listAlerts, removeAlert } from "@tonquant/core";
import { handleCommand } from "../utils/output.js";
import {
  formatFactorAlertSet,
  formatFactorAlertList,
} from "../utils/format-marketplace.js";
import chalk from "chalk";

// ── Command registration ─────────────────────────────────────

export function registerFactorAlertCommands(factor: Command): void {
  // ── alert-set ──
  factor
    .command("alert-set <factorId>")
    .description("Set a factor alert (above/below threshold)")
    .requiredOption("--condition <condition>", "Trigger condition: above or below")
    .requiredOption("--threshold <n>", "Threshold value", parseFloat)
    .action(async (factorId: string, opts) => {
      const json = factor.parent?.opts().json ?? false;
      await handleCommand(
        { json },
        async () => {
          const condition = opts.condition as string;
          if (condition !== "above" && condition !== "below") {
            throw new Error(`Invalid condition '${condition}'. Use 'above' or 'below'.`);
          }
          return setAlert(factorId, condition, opts.threshold);
        },
        formatFactorAlertSet,
      );
    });

  // ── alert-list ──
  factor
    .command("alert-list")
    .description("List all factor alerts")
    .action(async () => {
      const json = factor.parent?.opts().json ?? false;
      await handleCommand({ json }, async () => listAlerts(), formatFactorAlertList);
    });

  // ── alert-remove ──
  factor
    .command("alert-remove <factorId>")
    .description("Remove all alerts for a factor")
    .action(async (factorId: string) => {
      const json = factor.parent?.opts().json ?? false;
      await handleCommand(
        { json },
        async () => {
          const removed = removeAlert(factorId);
          return { factorId, removed };
        },
        (r) =>
          r.removed
            ? `${chalk.yellow("Removed")} alerts for ${chalk.cyan(r.factorId)}`
            : `${chalk.dim("No alerts found")} for ${r.factorId}`,
      );
    });
}
