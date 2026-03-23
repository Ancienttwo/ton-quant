import type { Command } from "commander";
import { runDataFetch, runDataInfo, runDataList } from "../quant/api/data-fetch.js";
import { handleCommand } from "../utils/output.js";

function formatDataFetch(data: Record<string, unknown>): string {
  const lines = [
    `Fetched ${data.barCount} bars for ${(data.fetchedSymbols as string[]).join(", ")}`,
  ];
  const range = data.dateRange as { start: string; end: string } | undefined;
  if (range) {
    lines.push(`Date range: ${range.start} → ${range.end}`);
  }
  return lines.join("\n");
}

function formatDataList(data: Record<string, unknown>): string {
  const datasets = data.datasets as Array<{ symbol: string; barCount: number; interval: string }>;
  if (!datasets?.length) return "No cached datasets.";
  return datasets.map((d) => `${d.symbol} (${d.interval}): ${d.barCount} bars`).join("\n");
}

function formatDataInfo(data: Record<string, unknown>): string {
  const ds = data.dataset as {
    symbol: string;
    interval: string;
    barCount: number;
    startDate?: string;
    endDate?: string;
  };
  const lines = [`Symbol: ${ds.symbol}`, `Interval: ${ds.interval}`, `Bars: ${ds.barCount}`];
  if (ds.startDate) lines.push(`Range: ${ds.startDate} → ${ds.endDate ?? "now"}`);
  return lines.join("\n");
}

export function registerDataCommand(program: Command): void {
  const command = program.command("data").description("Quant dataset management [Phase 1]");

  command
    .command("fetch <symbols...>")
    .description("Fetch and cache TON quant datasets")
    .action(async (symbols: string[]) => {
      const json = program.opts().json ?? false;
      await handleCommand({ json }, () => runDataFetch({ symbols }), formatDataFetch);
    });

  command
    .command("list")
    .description("List cached TON quant datasets")
    .action(async () => {
      const json = program.opts().json ?? false;
      await handleCommand({ json }, () => runDataList(), formatDataList);
    });

  command
    .command("info <symbol>")
    .description("Show metadata for a cached TON quant dataset")
    .action(async (symbol: string) => {
      const json = program.opts().json ?? false;
      await handleCommand({ json }, () => runDataInfo({ symbol }), formatDataInfo);
    });
}
