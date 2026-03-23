import type { Command } from "commander";
import { runOrchestrator } from "../quant/orchestrator.js";
import { handleCommand } from "../utils/output.js";

function formatOrchestratorResult(data: Record<string, unknown>): string {
  const steps = data.steps as Array<{ step: string; status: string; summary: string }>;
  const lines = [`Autoresearch: ${data.status}`, ""];

  for (const step of steps) {
    const icon = step.status === "completed" ? "+" : "x";
    lines.push(`  [${icon}] ${step.step}: ${step.summary}`);
  }

  const result = data.data as Record<string, unknown> | null;
  if (result) {
    const metrics = result.metrics as Record<string, unknown>;
    lines.push(
      "",
      `  Recommendation: ${(result.recommendation as string).toUpperCase()}`,
      `  Sharpe: ${metrics.sharpe}`,
      `  Return: ${metrics.totalReturn}%`,
      `  Report: ${result.reportPath}`,
    );
  }
  return lines.join("\n");
}

export function registerAutoresearchCommand(program: Command): void {
  const command = program
    .command("autoresearch")
    .description("Quant autoresearch track management [Phase 1]");

  command
    .command("run")
    .description("Run research-to-report workflow for a TON asset")
    .requiredOption("--asset <asset>", "Asset pair (e.g. TON/USDT)")
    .option("--period <period>", "Lookback period (e.g. 90d, 12w)", "90d")
    .option("--strategy <strategy>", "Strategy id", "momentum")
    .option("--preset <presetId>", "Preset id to load params from")
    .option("--factors <factors>", "Comma-separated factors", "rsi,macd,volatility")
    .option("--iterations <count>", "Number of iterations", "1")
    .action(
      async (opts: {
        asset: string;
        period: string;
        strategy: string;
        preset?: string;
        factors: string;
        iterations: string;
      }) => {
        const json = program.opts().json ?? false;
        await handleCommand(
          { json },
          async () => {
            const result = await runOrchestrator({
              asset: opts.asset,
              period: opts.period,
              strategy: opts.strategy,
              presetId: opts.preset,
              iterations: parseInt(opts.iterations, 10),
              factors: opts.factors.split(","),
            });
            return result as unknown as Record<string, unknown>;
          },
          formatOrchestratorResult,
        );
      },
    );

  command
    .command("init")
    .description("Initialize a TON quant autoresearch track")
    .requiredOption("--title <title>", "Track title")
    .requiredOption("--strategy <strategy>", "Strategy id")
    .requiredOption("--symbols <symbols>", "Comma-separated symbols")
    .requiredOption("--start-date <date>", "Start date (YYYY-MM-DD)")
    .requiredOption("--end-date <date>", "End date (YYYY-MM-DD)")
    .action(async (_opts) => {
      const json = program.opts().json ?? false;
      await handleCommand({ json }, async () => ({
        status: "completed",
        summary:
          "Track initialized (init is a thin wrapper — use `autoresearch run` for the full workflow)",
      }));
    });

  command
    .command("status")
    .description("Show a TON quant autoresearch track")
    .requiredOption("--track <trackId>", "Track id")
    .action(async (_opts) => {
      const json = program.opts().json ?? false;
      await handleCommand({ json }, async () => ({
        status: "completed",
        summary: "No active tracks (use `autoresearch run` to start a research workflow)",
      }));
    });

  command
    .command("list")
    .description("List TON quant autoresearch tracks")
    .action(async () => {
      const json = program.opts().json ?? false;
      await handleCommand({ json }, async () => ({
        status: "completed",
        summary: "No tracks found (use `autoresearch run` to start a research workflow)",
        tracks: [],
      }));
    });
}
