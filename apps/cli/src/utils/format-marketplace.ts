/**
 * Phase 2 factor marketplace formatters — Retro-Futuristic Terminal design system.
 * Shared helpers imported from format-helpers.ts.
 */

import chalk from "chalk";
import Table from "cli-table3";
import type {
  FactorMetaPublic,
  FactorAlert,
  FactorPerformanceReport,
  FactorSubscription,
} from "@tonquant/core";
import {
  colorSharpe,
  divider,
  header,
  label,
  pctColor,
  truncate,
} from "./format-helpers.js";

// ── Leaderboard ─────────────────────────────────────────────

function rankColor(rank: number, text: string): string {
  if (rank === 1) return chalk.yellow(text);
  if (rank <= 3) return chalk.cyan(text);
  return chalk.dim(text);
}

export function formatFactorTop(factors: FactorMetaPublic[]): string {
  if (factors.length === 0) {
    return [
      "",
      header("Factor Leaderboard"),
      divider(),
      `  ${chalk.dim("Registry is empty — no factors published yet.")}`,
      "",
      `  ${chalk.dim("Get started:")}`,
      `    ${chalk.cyan('tonquant factor publish --name "my_factor" --category momentum \\')}`,
      `    ${chalk.cyan("  --assets TON --timeframe 1d")}`,
      "",
    ].join("\n");
  }

  const table = new Table({
    head: ["#", "Factor", "Sharpe", "CAGR", "Win Rate", "Cat"],
    style: { head: ["cyan"] },
  });

  for (const [i, f] of factors.entries()) {
    const rank = i + 1;
    const id = truncate(f.id, 20);
    const sharpe = colorSharpe(f.backtest.sharpe);
    const cagr = pctColor(Math.round(f.backtest.cagr * 1000) / 10);
    const winRate = `${(f.backtest.winRate * 100).toFixed(0)}%`;
    const cat = f.category.slice(0, 4);

    table.push([
      rankColor(rank, `#${rank}`),
      rankColor(rank, id),
      sharpe,
      cagr,
      chalk.cyan(winRate),
      chalk.dim(cat),
    ]);
  }

  return [
    "",
    header("Factor Leaderboard"),
    divider(),
    table.toString(),
    `  ${chalk.dim(`${factors.length} factors ranked by Sharpe`)}`,
    "",
  ].join("\n");
}

// ── Discover ────────────────────────────────────────────────

export interface DiscoverDisplayFilters {
  category?: string;
  asset?: string;
  minSharpe?: number;
  timeframe?: string;
}

export function formatFactorDiscover(
  factors: FactorMetaPublic[],
  filters?: DiscoverDisplayFilters,
): string {
  if (factors.length === 0) {
    const lines = [
      "",
      header("Factor Search"),
      divider(),
      `  ${chalk.dim("No factors match your filters.")}`,
    ];

    if (filters) {
      const applied = Object.entries(filters)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `    ${chalk.dim(`${k}:`)} ${chalk.dim(String(v))}`);
      if (applied.length > 0) {
        lines.push("", `  ${chalk.dim("Applied filters:")}`, ...applied);
      }
    }

    lines.push(
      "",
      `  ${chalk.dim("Try:")}`,
      `    ${chalk.cyan("• Run `factor top` to see all factors")}`,
      "",
    );
    return lines.join("\n");
  }

  const table = new Table({
    head: ["ID", "Cat", "Sharpe", "Assets", "TF", "Vis"],
    style: { head: ["cyan"] },
  });

  for (const f of factors) {
    table.push([
      chalk.cyan(truncate(f.id, 20)),
      chalk.dim(f.category.slice(0, 4)),
      colorSharpe(f.backtest.sharpe),
      f.assets.join(","),
      f.timeframe,
      chalk.dim(f.visibility),
    ]);
  }

  const filterSuffix = filters
    ? Object.entries(filters)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${k}=${v}`)
        .join(", ")
    : "";

  return [
    "",
    header("Factor Search"),
    divider(),
    table.toString(),
    `  ${chalk.dim(`${factors.length} factors found${filterSuffix ? ` (filtered: ${filterSuffix})` : ""}`)}`,
    "",
  ].join("\n");
}

// ── Publish ─────────────────────────────────────────────────

export function formatFactorPublish(meta: FactorMetaPublic): string {
  const sharpe = colorSharpe(meta.backtest.sharpe);
  const cagr = pctColor(Math.round(meta.backtest.cagr * 1000) / 10);
  const winRate = `${(meta.backtest.winRate * 100).toFixed(0)}%`;

  return [
    "",
    chalk.bold.green("  Factor Published"),
    divider(),
    `  ${label("ID:")}         ${chalk.cyan(meta.id)}`,
    `  ${label("Name:")}       ${meta.name}`,
    `  ${label("Category:")}   ${meta.category}`,
    `  ${label("Assets:")}     ${meta.assets.join(", ")}`,
    `  ${label("Timeframe:")}  ${meta.timeframe}`,
    `  ${label("Version:")}    ${meta.version}`,
    "",
    `  ${label("Backtest:")}   Sharpe ${sharpe} · CAGR ${cagr} · Win ${winRate}`,
    "",
  ].join("\n");
}

// ── Compose ─────────────────────────────────────────────────

export interface CompositionResult {
  id: string;
  components: Array<{ factorId: string; weight: number; sharpe: number }>;
  estimatedSharpe: number;
  saved: boolean;
}

export function formatFactorCompose(result: CompositionResult): string {
  const lines = [
    "",
    header("Factor Composition"),
    divider(),
    `  ${chalk.dim("Components:")}`,
  ];

  for (const c of result.components) {
    const w = c.weight.toFixed(2);
    const s = colorSharpe(c.sharpe);
    lines.push(`    ${chalk.cyan(w)} × ${chalk.cyan(truncate(c.factorId, 20))}  (Sharpe: ${s})`);
  }

  lines.push(
    "",
    `  ${label("Composed Factor:")}`,
    `  ${label("ID:")}          ${chalk.cyan(result.id)}`,
    `  ${label("Est. Sharpe:")} ~${colorSharpe(result.estimatedSharpe)} (weighted)`,
    `  ${label("Status:")}      ${result.saved ? chalk.green("Saved to registry") : chalk.yellow("Not saved")}`,
    "",
  );

  return lines.join("\n");
}

// ── Subscribe / Unsubscribe ─────────────────────────────────

export function formatFactorSubscribe(sub: FactorSubscription): string {
  return `${chalk.green("Subscribed")} to ${chalk.cyan(sub.factorId)} at ${chalk.dim(sub.subscribedAt)}`;
}

export interface UnsubscribeResult {
  factorId: string;
  removed: boolean;
}

export function formatFactorUnsubscribe(result: UnsubscribeResult): string {
  if (result.removed) {
    return `${chalk.yellow("Unsubscribed")} from ${chalk.cyan(result.factorId)}`;
  }
  return `${chalk.dim("Not subscribed")} to ${result.factorId}`;
}

// ── Alerts ──────────────────────────────────────────────────

export function formatFactorAlertList(alerts: FactorAlert[]): string {
  if (alerts.length === 0) {
    return [
      "",
      header("Factor Alerts"),
      divider(),
      `  ${chalk.dim("No active alerts.")}`,
      "",
      `  ${chalk.dim("Set one:")}`,
      `    ${chalk.cyan("tonquant factor alert-set --help")}`,
      "",
    ].join("\n");
  }

  const table = new Table({
    head: ["Factor", "Condition", "Threshold", "Active"],
    style: { head: ["cyan"] },
  });

  for (const a of alerts) {
    table.push([
      chalk.cyan(truncate(a.factorId, 20)),
      a.condition,
      String(a.threshold),
      a.active ? chalk.green("✓") : chalk.dim("✗"),
    ]);
  }

  const activeCount = alerts.filter((a) => a.active).length;
  return [
    "",
    header("Factor Alerts"),
    divider(),
    table.toString(),
    `  ${chalk.dim(`${activeCount} active alert${activeCount !== 1 ? "s" : ""}`)}`,
    "",
  ].join("\n");
}

export function formatFactorAlertSet(alert: FactorAlert): string {
  return [
    `${chalk.green("Alert set:")} ${chalk.cyan(alert.factorId)}`,
    `  ${label("Condition:")} ${alert.condition} ${chalk.cyan(String(alert.threshold))}`,
  ].join("\n");
}

// ── Social Proof Report ─────────────────────────────────────

export function formatFactorReport(report: FactorPerformanceReport): string {
  return [
    "",
    chalk.bold.green("  Performance Report Submitted"),
    divider(),
    `  ${label("Factor:")}     ${chalk.cyan(report.factorId)}`,
    `  ${label("Return:")}     ${pctColor(report.returnPct)} (${report.period})`,
    `  ${label("Agent:")}      ${chalk.cyan(report.agentId)}`,
    `  ${label("Status:")}     ${chalk.yellow("unverified")}`,
    "",
  ].join("\n");
}

export function formatFactorReportList(reports: FactorPerformanceReport[]): string {
  if (reports.length === 0) {
    return [
      "",
      header("Performance Reports"),
      divider(),
      `  ${chalk.dim("No reports submitted yet.")}`,
      "",
    ].join("\n");
  }

  const table = new Table({
    head: ["Factor", "Return", "Period", "Agent", "Status"],
    style: { head: ["cyan"] },
  });

  for (const r of reports) {
    table.push([
      chalk.cyan(r.factorId),
      pctColor(r.returnPct),
      r.period,
      truncate(r.agentId, 20),
      r.verified ? chalk.green("verified") : chalk.yellow("unverified"),
    ]);
  }

  return [
    "",
    header(`Performance Reports (${reports.length})`),
    divider(),
    table.toString(),
    "",
  ].join("\n");
}
