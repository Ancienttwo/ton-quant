import type { FactorMetaPublic } from "../types/factor-registry.js";
import { getFactorLeaderboard } from "./registry.js";

// ── Types ──────────────────────────────────────────────────

export interface SkillDefinition {
  readonly name: string;
  readonly description: string;
  readonly factorId: string;
  readonly category: string;
  readonly sharpe: number;
  readonly assets: readonly string[];
  readonly timeframe: string;
  readonly usage: string;
}

// ── Public API ─────────────────────────────────────────────

function factorToSkill(factor: FactorMetaPublic): SkillDefinition {
  return {
    name: factor.name,
    description: factor.description,
    factorId: factor.id,
    category: factor.category,
    sharpe: factor.backtest.sharpe,
    assets: factor.assets,
    timeframe: factor.timeframe,
    usage: `tonquant factor backtest ${factor.id} --json`,
  };
}

/**
 * Export top-ranked factors as agent-consumable skill definitions.
 */
export function exportTopFactorsAsSkills(limit = 10): SkillDefinition[] {
  const top = getFactorLeaderboard({ limit });
  return top.map(factorToSkill);
}

/**
 * Format skill definitions as Markdown for SKILL.md or stdout.
 */
export function formatSkillMarkdown(skills: ReadonlyArray<SkillDefinition>): string {
  const lines: string[] = [
    "# TonQuant Factor Skills",
    "",
    `> Auto-generated from top ${skills.length} factors by Sharpe ratio.`,
    "> Use these skills to give any OpenClaw-compatible agent access to quantitative factors.",
    "",
  ];

  for (const skill of skills) {
    lines.push(
      `## ${skill.name}`,
      "",
      `- **Factor ID:** \`${skill.factorId}\``,
      `- **Category:** ${skill.category}`,
      `- **Sharpe:** ${skill.sharpe.toFixed(2)}`,
      `- **Assets:** ${skill.assets.join(", ")}`,
      `- **Timeframe:** ${skill.timeframe}`,
      "",
      skill.description,
      "",
      "```bash",
      `# Subscribe to this factor`,
      `tonquant factor subscribe ${skill.factorId} --json`,
      "",
      `# Run backtest`,
      skill.usage,
      "",
      `# Set alert`,
      `tonquant factor alert-set ${skill.factorId} --condition above --threshold ${skill.sharpe.toFixed(1)} --json`,
      "```",
      "",
      "---",
      "",
    );
  }

  lines.push(
    "## Recommended Companion Skills",
    "",
    "- **opennews**: Use `search_news_by_coin` to contextualize strategy performance.",
    "  Before promoting autoresearch candidates, check recent news for the traded token.",
    "  Before executing swaps, verify no high-impact negative news (aiRating > 80, signal = bearish).",
    "",
    "```bash",
    "npx skills add https://github.com/6551Team/opennews-mcp --skill opennews",
    "```",
    "",
  );

  return lines.join("\n");
}
