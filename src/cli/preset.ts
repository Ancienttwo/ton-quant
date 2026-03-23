import type { Command } from "commander";
import { runPresetList, runPresetShow } from "../quant/api/preset.js";
import { handleCommand } from "../utils/output.js";

function formatPresetList(data: Record<string, unknown>): string {
  const presets = data.presets as Array<{
    id: string;
    name: string;
    strategy: string;
    description: string;
  }>;
  if (!presets?.length) return "No presets available.";
  return presets.map((p) => `${p.id} (${p.strategy}): ${p.description}`).join("\n");
}

function formatPresetShow(data: Record<string, unknown>): string {
  const preset = data.preset as Record<string, unknown>;
  const lines = [
    `Preset: ${preset.name}`,
    `Strategy: ${preset.strategy}`,
    `Description: ${preset.description}`,
    `Symbols: ${(preset.symbols as string[]).join(", ")}`,
  ];
  if (preset.thesis) lines.push(`Thesis: ${preset.thesis}`);
  const params = preset.params as Record<string, unknown>;
  if (params && Object.keys(params).length > 0) {
    lines.push("", "Parameters:");
    for (const [k, v] of Object.entries(params)) {
      lines.push(`  ${k}: ${v}`);
    }
  }
  return lines.join("\n");
}

export function registerPresetCommand(program: Command): void {
  const command = program.command("preset").description("Quant strategy presets [Phase 1]");

  command
    .command("list")
    .description("List built-in TON quant presets")
    .action(async () => {
      const json = program.opts().json ?? false;
      await handleCommand({ json }, () => runPresetList(), formatPresetList);
    });

  command
    .command("show <presetId>")
    .description("Show a TON quant preset definition")
    .action(async (presetId: string) => {
      const json = program.opts().json ?? false;
      await handleCommand({ json }, () => runPresetShow({ presetId }), formatPresetShow);
    });
}
