import type { Command } from "commander";
import { runDataFetch, runDataInfo, runDataList } from "../quant/api/data-fetch.js";
import { formatDataFetch, formatDataInfo, formatDataList } from "../utils/format-quant.js";
import { handleCommand } from "../utils/output.js";

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
