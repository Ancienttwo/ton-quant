import type { Command } from "commander";
import {
  composeFactors,
  listComposites,
  getComposite,
  deleteComposite,
  publishFactor,
  listFactors,
  type CompositeEntry,
  type ComponentWeight,
} from "@tonquant/core";
import { handleCommand } from "../utils/output.js";
import chalk from "chalk";

// ── Component spec parser ────────────────────────────────────

function parseComponentSpec(spec: string): ComponentWeight[] {
  return spec.split(",").map((part) => {
    const trimmed = part.trim();
    const colonIdx = trimmed.lastIndexOf(":");
    if (colonIdx < 0) {
      throw new Error(`Invalid component spec "${trimmed}". Expected format: factorId:weight`);
    }
    const factorId = trimmed.slice(0, colonIdx);
    const weight = Number.parseFloat(trimmed.slice(colonIdx + 1));
    if (Number.isNaN(weight)) {
      throw new Error(`Invalid weight in "${trimmed}". Weight must be a number.`);
    }
    return { factorId, weight };
  });
}

// ── Composite ID generator ───────────────────────────────────

function nameToId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/gu, "_")
    .replace(/_+/gu, "_")
    .replace(/^_|_$/gu, "")
    .slice(0, 64);
}

// ── Human formatters ─────────────────────────────────────────

function formatCompositeResult(entry: CompositeEntry): string {
  const { definition: def, derivedBacktest: bt } = entry;
  const componentLines = def.components
    .map((c) => {
      const color = c.weight >= 0 ? chalk.cyan : chalk.yellow;
      return `    ${color(c.factorId)} ${color((c.weight * 100).toFixed(1) + "%")}`;
    })
    .join("\n");

  const normLabel = def.normalizeWeights ? chalk.dim("[normalized]") : chalk.dim("[raw]");

  return (
    `${chalk.green("Composed")} ${chalk.cyan(def.id)} ${normLabel}\n` +
    `  ${def.name} — ${def.description}\n\n` +
    `  Components:\n${componentLines}\n\n` +
    `  ${chalk.dim("Derived Backtest (estimated):")}\n` +
    `    Sharpe: ${chalk.green(bt.sharpe.toFixed(2))}  ` +
    `Drawdown: ${chalk.red(bt.maxDrawdown.toFixed(2))}  ` +
    `CAGR: ${chalk.green((bt.cagr * 100).toFixed(1))}%  ` +
    `Win: ${(bt.winRate * 100).toFixed(0)}%  ` +
    `Trades: ${bt.tradeCount}`
  );
}

function formatCompositeList(entries: CompositeEntry[]): string {
  if (entries.length === 0) return chalk.yellow("No composites saved.");
  const lines = entries.map((e) => {
    const { definition: def, derivedBacktest: bt } = e;
    return (
      `  ${chalk.cyan(def.id)} ${def.name} ` +
      `${chalk.dim(`(${def.components.length} factors)`)} ` +
      `Sharpe: ${chalk.green(bt.sharpe.toFixed(2))} ` +
      `CAGR: ${chalk.green((bt.cagr * 100).toFixed(1))}%`
    );
  });
  return `${chalk.cyan("Composites")} (${entries.length})\n\n${lines.join("\n")}`;
}

function formatCompositeDetail(entry: CompositeEntry): string {
  const { definition: def, derivedBacktest: bt } = entry;
  const normLabel = def.normalizeWeights ? chalk.dim("[normalized]") : chalk.dim("[raw]");

  const componentLines = def.components
    .map((c) => {
      const color = c.weight >= 0 ? chalk.cyan : chalk.yellow;
      return `    ${color(c.factorId)} ${color((c.weight * 100).toFixed(1) + "%")}`;
    })
    .join("\n");

  return (
    `${chalk.cyan(def.id)} ${normLabel}\n` +
    `  ${def.name}\n` +
    `  ${chalk.dim(def.description)}\n\n` +
    `  Components:\n${componentLines}\n\n` +
    `  ${chalk.dim("Derived Backtest (estimated):")}\n` +
    `    Sharpe: ${chalk.green(bt.sharpe.toFixed(2))}  ` +
    `Drawdown: ${chalk.red(bt.maxDrawdown.toFixed(2))}\n` +
    `    CAGR: ${chalk.green((bt.cagr * 100).toFixed(1))}%  ` +
    `Win: ${(bt.winRate * 100).toFixed(0)}%  ` +
    `Trades: ${bt.tradeCount}\n` +
    `    Range: ${bt.dataRange.start} → ${bt.dataRange.end}`
  );
}

// ── Command registration ─────────────────────────────────────

export function registerFactorComposeCommands(factor: Command): void {
  // ── compose ──
  factor
    .command("compose")
    .description("Create a weighted composite from existing factors")
    .requiredOption("--name <name>", "Composite display name")
    .requiredOption("--components <spec>", "Comma-separated factorId:weight (e.g. mom_30d:0.6,vol_7d:0.4)")
    .option("--description <desc>", "Composite description")
    .option("--no-normalize", "Skip weight normalization")
    .option("--publish", "Also publish composite to registry as a derived factor")
    .option("--force", "Overwrite existing composite with same ID")
    .action(async (opts) => {
      const json = factor.parent?.opts().json ?? false;
      await handleCommand(
        { json },
        async () => {
          const components = parseComponentSpec(opts.components);
          const id = nameToId(opts.name);
          if (id.length < 3) {
            throw new Error(
              `Name "${opts.name}" produces an ID too short (min 3 chars). Use a longer name.`,
            );
          }
          const now = new Date().toISOString();

          const entry = composeFactors(
            {
              id,
              name: opts.name,
              description: opts.description || `Composite: ${opts.name}`,
              components,
              normalizeWeights: opts.normalize !== false,
              createdAt: now,
              updatedAt: now,
            },
            { force: opts.force },
          );

          // Optionally publish to registry
          if (opts.publish) {
            // Resolve real assets from component factors
            const allRegistryFactors = listFactors();
            const factorMap = new Map(allRegistryFactors.map((f) => [f.id, f]));
            const allAssets = [
              ...new Set(
                entry.definition.components.flatMap((c) =>
                  factorMap.get(c.factorId)?.assets ?? [],
                ),
              ),
            ];
            const firstComponent = entry.definition.components[0];
            const timeframe = (firstComponent ? factorMap.get(firstComponent.factorId)?.timeframe : undefined) ?? "1d";

            publishFactor(
              {
                id: entry.definition.id,
                name: entry.definition.name,
                author: "local",
                category: "custom",
                source: "derived",
                assets: allAssets.length > 0 ? allAssets : ["UNKNOWN"],
                timeframe,
                description: entry.definition.description,
                parameters: [],
                backtest: entry.derivedBacktest,
                visibility: "free",
                version: "1.0.0",
                createdAt: now,
                updatedAt: now,
              },
              { force: true },
            );
          }

          return entry;
        },
        formatCompositeResult,
      );
    });

  // ── composites (list) ──
  factor
    .command("composites")
    .description("List saved composite factors")
    .action(async () => {
      const json = factor.parent?.opts().json ?? false;
      await handleCommand({ json }, async () => listComposites(), formatCompositeList);
    });

  // ── composite (detail) ──
  factor
    .command("composite <id>")
    .description("Show composite factor detail")
    .action(async (id: string) => {
      const json = factor.parent?.opts().json ?? false;
      await handleCommand({ json }, async () => getComposite(id), formatCompositeDetail);
    });

  // ── composite-delete ──
  factor
    .command("composite-delete <id>")
    .description("Delete a saved composite")
    .action(async (id: string) => {
      const json = factor.parent?.opts().json ?? false;
      await handleCommand(
        { json },
        async () => {
          const removed = deleteComposite(id);
          return { id, removed };
        },
        (r) =>
          r.removed
            ? `${chalk.yellow("Deleted")} composite ${chalk.cyan(r.id)}`
            : `${chalk.dim("Not found")} composite ${r.id}`,
      );
    });
}
