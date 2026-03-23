import type { Command } from "commander";
import {
  publishFactor,
  discoverFactors,
  subscribeFactor,
  unsubscribeFactor,
  listFactors,
  getFactorLeaderboard,
  type FactorMetaPublic,
} from "@tonquant/core";
import { handleCommand } from "../utils/output.js";
import chalk from "chalk";

// ── Human formatters ───────────────────────────────────────

function formatFactorList(factors: FactorMetaPublic[]): string {
  if (factors.length === 0) return chalk.yellow("No factors found.");
  const lines = factors.map(
    (f) =>
      `  ${chalk.cyan(f.id)} ${chalk.dim(`[${f.category}]`)} ${f.name}\n` +
      `    Sharpe: ${chalk.green(f.backtest.sharpe.toFixed(2))}  ` +
      `Drawdown: ${chalk.red(f.backtest.maxDrawdown.toFixed(2))}  ` +
      `Assets: ${f.assets.join(", ")}`,
  );
  return `${chalk.cyan("Factors")} (${factors.length})\n\n${lines.join("\n\n")}`;
}

function formatSubscription(sub: { factorId: string; subscribedAt: string }): string {
  return `${chalk.green("Subscribed")} to ${chalk.cyan(sub.factorId)} at ${sub.subscribedAt}`;
}

// ── Command registration ───────────────────────────────────

/**
 * Add marketplace subcommands to an existing factor Command.
 * Called from factor.ts after the quant subcommands (list, compute) are registered.
 */
export function registerFactorMarketplaceCommands(factor: Command): void {

  // ── publish ──
  factor
    .command("publish")
    .description("Publish a factor to the local registry")
    .requiredOption("--name <name>", "Factor display name")
    .requiredOption("--category <category>", "Category: momentum|value|volatility|liquidity|sentiment|custom")
    .requiredOption("--assets <assets>", "Comma-separated asset symbols (e.g. TON,NOT)")
    .requiredOption("--timeframe <timeframe>", "Timeframe (e.g. 1d, 4h)")
    .option("--source <source>", "Source type: indicator|liquidity|derived", "indicator")
    .option("--description <desc>", "Factor description", "")
    .option("--backtest-file <path>", "Path to backtest result JSON")
    .option("--force", "Overwrite existing factor with same ID")
    .action(async (opts) => {
      const json = factor.parent?.opts().json ?? false;
      await handleCommand(
        { json },
        async () => {
          const id = opts.name.toLowerCase().replace(/[^a-z0-9]/gu, "_").slice(0, 64);
          const now = new Date().toISOString();
          const assets = (opts.assets as string).split(",").map((a: string) => a.trim());

          // Parse backtest file or use defaults
          let backtest = {
            sharpe: 0,
            maxDrawdown: 0,
            winRate: 0,
            cagr: 0,
            dataRange: { start: "2026-01-01", end: now.slice(0, 10) },
            tradeCount: 0,
          };
          if (opts.backtestFile) {
            const { readFileSync } = await import("node:fs");
            const raw = JSON.parse(readFileSync(opts.backtestFile, "utf-8"));
            backtest = { ...backtest, ...raw };
          }

          const meta: FactorMetaPublic = {
            id,
            name: opts.name,
            author: "local",
            category: opts.category,
            source: opts.source,
            assets,
            timeframe: opts.timeframe,
            description: opts.description || `${opts.name} factor`,
            parameters: [],
            backtest,
            visibility: "free",
            version: "1.0.0",
            createdAt: now,
            updatedAt: now,
          };

          return publishFactor(meta, { force: opts.force });
        },
        (result) => `${chalk.green("Published")} factor ${chalk.cyan(result.id)} (${result.category})`,
      );
    });

  // ── discover ──
  factor
    .command("discover")
    .description("Discover factors with filters")
    .option("--category <category>", "Filter by category")
    .option("--asset <asset>", "Filter by asset symbol")
    .option("--min-sharpe <n>", "Minimum Sharpe ratio", parseFloat)
    .option("--timeframe <tf>", "Filter by timeframe")
    .action(async (opts) => {
      const json = factor.parent?.opts().json ?? false;
      await handleCommand(
        { json },
        async () =>
          discoverFactors({
            category: opts.category,
            asset: opts.asset,
            minSharpe: opts.minSharpe,
            timeframe: opts.timeframe,
          }),
        formatFactorList,
      );
    });

  // ── subscribe ──
  factor
    .command("subscribe <factorId>")
    .description("Subscribe to a factor")
    .action(async (factorId: string) => {
      const json = factor.parent?.opts().json ?? false;
      await handleCommand({ json }, async () => subscribeFactor(factorId), formatSubscription);
    });

  // ── unsubscribe ──
  factor
    .command("unsubscribe <factorId>")
    .description("Unsubscribe from a factor")
    .action(async (factorId: string) => {
      const json = factor.parent?.opts().json ?? false;
      await handleCommand(
        { json },
        async () => {
          const removed = unsubscribeFactor(factorId);
          return { factorId, removed };
        },
        (r) =>
          r.removed
            ? `${chalk.yellow("Unsubscribed")} from ${chalk.cyan(r.factorId)}`
            : `${chalk.dim("Not subscribed")} to ${r.factorId}`,
      );
    });

  // Note: `factor list` is handled by the quant boundary (factor.ts).
  // Use `factor discover` for marketplace search.

  // ── top (leaderboard) ──
  factor
    .command("top")
    .description("Show factor leaderboard by performance")
    .option("--limit <n>", "Number of factors to show", parseInt, 10)
    .action(async (opts) => {
      const json = factor.parent?.opts().json ?? false;
      await handleCommand(
        { json },
        async () => getFactorLeaderboard({ limit: opts.limit }),
        (factors) => {
          if (factors.length === 0) return chalk.yellow("No factors in registry.");
          const lines = factors.map(
            (f, i) =>
              `  ${chalk.dim(`#${i + 1}`)} ${chalk.cyan(f.id)} ` +
              `Sharpe: ${chalk.green(f.backtest.sharpe.toFixed(2))}  ` +
              `CAGR: ${chalk.green((f.backtest.cagr * 100).toFixed(1))}%  ` +
              `Win: ${(f.backtest.winRate * 100).toFixed(0)}%`,
          );
          return `${chalk.cyan("Factor Leaderboard")}\n\n${lines.join("\n")}`;
        },
      );
    });
}
