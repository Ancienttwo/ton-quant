import type { Command } from "commander";
import { runFactorCompute, runFactorList } from "../quant/api/factor.js";
import { handleCommand } from "../utils/output.js";

function formatFactorList(data: Record<string, unknown>): string {
  const factors = data.factors as Array<{
    id: string;
    name: string;
    category: string;
    description: string;
  }>;
  if (!factors?.length) return "No factors available.";
  return factors.map((f) => `${f.id} (${f.category}): ${f.description}`).join("\n");
}

function formatFactorCompute(data: Record<string, unknown>): string {
  const columns = data.factorColumns as string[];
  const lines = [`Computed ${data.factorCount} factor(s) on ${data.datasetRows} rows`, ""];
  for (const col of columns) {
    const val = (data as Record<string, unknown>)[col];
    if (typeof val === "number") {
      lines.push(`  ${col}: ${val}`);
    }
  }
  return lines.join("\n");
}

export function registerFactorCommand(program: Command): void {
  const command = program.command("factor").description("Factor computation [Phase 1]");

  command
    .command("list")
    .description("List available quant factors")
    .action(async () => {
      const json = program.opts().json ?? false;
      await handleCommand({ json }, () => runFactorList(), formatFactorList);
    });

  command
    .command("compute")
    .description("Compute factors on TON quant data")
    .requiredOption("--factors <factors>", "Comma-separated factor IDs (rsi,macd,volatility)")
    .option("--symbols <symbols>", "Comma-separated symbols", "TON/USDT")
    .action(async (opts: { factors: string; symbols: string }) => {
      const json = program.opts().json ?? false;
      await handleCommand(
        { json },
        () =>
          runFactorCompute({
            symbols: opts.symbols.split(","),
            factors: opts.factors.split(","),
          }),
        formatFactorCompute,
      );
    });
}
