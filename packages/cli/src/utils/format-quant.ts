/**
 * Phase 1 quant command formatters — Retro-Futuristic Terminal design system.
 *
 * Color mapping (DESIGN.md):
 *   Primary   → chalk.cyan    (key data, highlights)
 *   Secondary → chalk.yellow  (warnings, secondary accent)
 *   Success   → chalk.green   (positive, profit)
 *   Error     → chalk.red     (negative, loss)
 *   Info      → chalk.blueBright (informational)
 *   Neutral   → chalk.dim     (labels, secondary text)
 *   Bold      → chalk.bold    (headers)
 */

import chalk from "chalk";
import Table from "cli-table3";

// ── Helpers ──────────────────────────────────────────────────

function signColor(value: number): string {
  const str = value > 0 ? `+${value}` : `${value}`;
  if (value > 0) return chalk.green(str);
  if (value < 0) return chalk.red(str);
  return chalk.dim(str);
}

function pctColor(value: number): string {
  const str = `${value}%`;
  if (value > 0) return chalk.green(str);
  if (value < 0) return chalk.red(str);
  return chalk.dim(str);
}

function header(title: string): string {
  return chalk.bold.cyan(`  ${title}`);
}

function label(text: string): string {
  return chalk.dim(text);
}

function divider(): string {
  return chalk.dim("  " + "─".repeat(48));
}

// ── Data Commands ────────────────────────────────────────────

export function formatDataFetch(data: Record<string, unknown>): string {
  const symbols = data.fetchedSymbols as string[];
  const range = data.dateRange as { start: string; end: string } | undefined;

  const table = new Table({
    head: ["Symbol", "Bars", "Interval"],
    style: { head: ["cyan"] },
  });

  for (const s of symbols) {
    table.push([chalk.cyan(s), String(data.barCount), "1d"]);
  }

  const lines = [
    "",
    header("Data Fetch"),
    divider(),
    table.toString(),
  ];

  if (range) {
    lines.push(`  ${label("Range:")} ${chalk.cyan(range.start)} → ${chalk.cyan(range.end)}`);
  }
  lines.push(`  ${label("Cache:")} ${data.cacheHits} hits, ${data.cacheMisses} misses`);
  lines.push("");

  return lines.join("\n");
}

export function formatDataList(data: Record<string, unknown>): string {
  const datasets = data.datasets as Array<{ symbol: string; barCount: number; interval: string }>;
  if (!datasets?.length) return `\n${header("Datasets")}\n${divider()}\n  ${chalk.dim("No cached datasets.")}\n`;

  const table = new Table({
    head: ["Symbol", "Interval", "Bars"],
    style: { head: ["cyan"] },
  });
  for (const d of datasets) {
    table.push([chalk.cyan(d.symbol), d.interval, String(d.barCount)]);
  }
  return `\n${header("Datasets")}\n${divider()}\n${table.toString()}\n`;
}

export function formatDataInfo(data: Record<string, unknown>): string {
  const ds = data.dataset as {
    symbol: string;
    interval: string;
    barCount: number;
    startDate?: string;
    endDate?: string;
  };
  const lines = [
    "",
    header(`Dataset: ${ds.symbol}`),
    divider(),
    `  ${label("Interval:")}  ${chalk.cyan(ds.interval)}`,
    `  ${label("Bars:")}      ${chalk.cyan(String(ds.barCount))}`,
  ];
  if (ds.startDate) {
    lines.push(`  ${label("Range:")}     ${chalk.cyan(ds.startDate)} → ${chalk.cyan(ds.endDate ?? "now")}`);
  }
  lines.push("");
  return lines.join("\n");
}

// ── Factor Commands ──────────────────────────────────────────

export function formatFactorList(data: Record<string, unknown>): string {
  const factors = data.factors as Array<{
    id: string;
    name: string;
    category: string;
    description: string;
    source: string;
  }>;
  if (!factors?.length) return `\n${header("Factors")}\n  ${chalk.dim("No factors available.")}\n`;

  const table = new Table({
    head: ["ID", "Name", "Category", "Source"],
    style: { head: ["cyan"] },
  });
  for (const f of factors) {
    table.push([chalk.cyan(f.id), f.name, chalk.dim(f.category), chalk.dim(f.source)]);
  }
  return `\n${header("Available Factors")}\n${divider()}\n${table.toString()}\n`;
}

function colorRSI(value: number): string {
  if (value > 70) return chalk.red(`${value} (overbought)`);
  if (value < 30) return chalk.green(`${value} (oversold)`);
  return chalk.cyan(String(value));
}

function colorMACD(value: number): string {
  if (value > 0) return chalk.green(value.toFixed(6));
  if (value < 0) return chalk.red(value.toFixed(6));
  return chalk.dim(value.toFixed(6));
}

export function formatFactorCompute(data: Record<string, unknown>): string {
  const columns = data.factorColumns as string[];
  const table = new Table({
    head: ["Factor", "Value"],
    style: { head: ["cyan"] },
  });

  for (const col of columns) {
    const val = (data as Record<string, unknown>)[col];
    if (typeof val !== "number") continue;

    let formatted: string;
    if (col === "rsi") formatted = colorRSI(val);
    else if (col.startsWith("macd")) formatted = colorMACD(val);
    else if (col === "volatility") formatted = chalk.yellow(`${val}%`);
    else formatted = chalk.cyan(String(val));

    table.push([chalk.dim(col), formatted]);
  }

  return [
    "",
    header("Factor Analysis"),
    divider(),
    `  ${label("Dataset:")} ${chalk.cyan(String(data.datasetRows))} rows, ${chalk.cyan(String(data.factorCount))} factor(s)`,
    table.toString(),
    "",
  ].join("\n");
}

// ── Backtest Commands ────────────────────────────────────────

function colorSharpe(val: number): string {
  if (val > 1) return chalk.green(val.toFixed(4));
  if (val < 0) return chalk.red(val.toFixed(4));
  return chalk.yellow(val.toFixed(4));
}

function colorDrawdown(val: number): string {
  const pct = (val * 100).toFixed(2);
  if (val > 0.1) return chalk.red(`${pct}%`);
  if (val > 0.05) return chalk.yellow(`${pct}%`);
  return chalk.green(`${pct}%`);
}

export function formatBacktest(data: Record<string, unknown>): string {
  const table = new Table({
    head: ["Metric", "Value"],
    style: { head: ["cyan"] },
  });

  table.push(
    [label("Sharpe Ratio"), colorSharpe(data.sharpe as number)],
    [label("Total Return"), pctColor(data.totalReturn as number)],
    [label("Max Drawdown"), colorDrawdown(data.maxDrawdown as number)],
    [label("Win Rate"), chalk.cyan(`${((data.winRate as number) * 100).toFixed(1)}%`)],
    [label("Trade Count"), chalk.cyan(String(data.tradeCount))],
    [label("Calmar Ratio"), colorSharpe(data.calmar as number)],
    [label("Sortino Ratio"), colorSharpe(data.sortino as number)],
  );

  return [
    "",
    header("Backtest Results"),
    divider(),
    table.toString(),
    "",
  ].join("\n");
}

// ── Preset Commands ──────────────────────────────────────────

export function formatPresetList(data: Record<string, unknown>): string {
  const presets = data.presets as Array<{
    id: string;
    name: string;
    strategy: string;
    description: string;
  }>;
  if (!presets?.length) return `\n${header("Presets")}\n  ${chalk.dim("No presets available.")}\n`;

  const table = new Table({
    head: ["ID", "Name", "Strategy"],
    style: { head: ["cyan"] },
  });
  for (const p of presets) {
    table.push([chalk.cyan(p.id), p.name, chalk.dim(p.strategy)]);
  }
  return `\n${header("Strategy Presets")}\n${divider()}\n${table.toString()}\n`;
}

export function formatPresetShow(data: Record<string, unknown>): string {
  const preset = data.preset as Record<string, unknown>;
  const params = preset.params as Record<string, unknown>;

  const lines = [
    "",
    header(`Preset: ${preset.name}`),
    divider(),
    `  ${label("Strategy:")}    ${chalk.cyan(String(preset.strategy))}`,
    `  ${label("Symbols:")}     ${chalk.cyan((preset.symbols as string[]).join(", "))}`,
  ];
  if (preset.thesis) {
    lines.push(`  ${label("Thesis:")}      ${chalk.blueBright(String(preset.thesis))}`);
  }

  if (params && Object.keys(params).length > 0) {
    const paramTable = new Table({
      head: ["Parameter", "Value"],
      style: { head: ["cyan"] },
    });
    for (const [k, v] of Object.entries(params)) {
      paramTable.push([chalk.dim(k), chalk.cyan(String(v))]);
    }
    lines.push("", paramTable.toString());
  }

  lines.push("");
  return lines.join("\n");
}

// ── Autoresearch Commands ────────────────────────────────────

function recColor(rec: string): string {
  switch (rec.toLowerCase()) {
    case "buy":
      return chalk.green.bold("BUY");
    case "sell":
      return chalk.red.bold("SELL");
    default:
      return chalk.yellow.bold("HOLD");
  }
}

export function formatAutoresearchResult(data: Record<string, unknown>): string {
  const steps = data.steps as Array<{ step: string; status: string; summary: string }>;
  const status = data.status as string;

  const statusColor = status === "success" ? chalk.green.bold("SUCCESS") : chalk.red.bold(status.toUpperCase());

  const lines = [
    "",
    header("Autoresearch"),
    divider(),
    `  ${label("Status:")} ${statusColor}`,
    "",
  ];

  // Pipeline steps
  for (const step of steps) {
    const icon = step.status === "completed" ? chalk.green("✓") : chalk.red("✗");
    const stepName = chalk.cyan(step.step.replace(/_/g, " "));
    lines.push(`  ${icon} ${stepName}  ${chalk.dim(step.summary)}`);
  }

  // Results
  const result = data.data as Record<string, unknown> | null;
  if (result) {
    const metrics = result.metrics as Record<string, number>;
    lines.push("");
    lines.push(divider());

    const metricsTable = new Table({
      head: ["Metric", "Value"],
      style: { head: ["cyan"] },
    });
    metricsTable.push(
      [label("Recommendation"), recColor(result.recommendation as string)],
      [label("Sharpe Ratio"), colorSharpe(metrics.sharpe ?? 0)],
      [label("Total Return"), pctColor(metrics.totalReturn ?? 0)],
      [label("Max Drawdown"), colorDrawdown(metrics.maxDrawdown ?? 0)],
      [label("Win Rate"), chalk.cyan(`${((metrics.winRate ?? 0) * 100).toFixed(1)}%`)],
      [label("Trades"), chalk.cyan(String(metrics.tradeCount ?? 0))],
    );
    lines.push(metricsTable.toString());

    // Factor summary
    const factors = result.factorsSummary as Record<string, number> | undefined;
    if (factors && Object.keys(factors).length > 0) {
      lines.push("");
      lines.push(`  ${chalk.bold.cyan("Factors:")}`);
      for (const [name, val] of Object.entries(factors)) {
        let formatted: string;
        if (name === "rsi") formatted = colorRSI(val);
        else if (name.startsWith("macd")) formatted = colorMACD(val);
        else if (name === "volatility") formatted = chalk.yellow(`${val}%`);
        else formatted = chalk.cyan(String(val));
        lines.push(`    ${chalk.dim(name)}: ${formatted}`);
      }
    }

    lines.push("");
    lines.push(`  ${label("Report:")} ${chalk.blueBright(String(result.reportPath))}`);
  }

  lines.push("");
  return lines.join("\n");
}
