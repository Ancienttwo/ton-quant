// Shared color threshold logic for factor metrics.
// Single source of truth for Leaderboard and BacktestViewer.

export function sharpeLevel(s: number): "good" | "mid" | "bad" {
  if (s > 1.0) return "good";
  if (s > 0) return "mid";
  return "bad";
}

export function cagrLevel(c: number): "good" | "bad" {
  return c >= 0 ? "good" : "bad";
}

export function drawdownLevel(dd: number): "good" | "mid" | "bad" {
  if (dd < 5) return "good";
  if (dd < 10) return "mid";
  return "bad";
}

// CSS variable mappings for table (returns var() strings)
const LEVEL_CSS: Record<string, string> = {
  good: "var(--success)",
  mid: "var(--secondary)",
  bad: "var(--error)",
};

export function levelToCss(level: "good" | "mid" | "bad"): string {
  return LEVEL_CSS[level];
}

// MetricBadge color token mappings
const LEVEL_TOKEN: Record<string, "success" | "secondary" | "error"> = {
  good: "success",
  mid: "secondary",
  bad: "error",
};

export function levelToToken(level: "good" | "mid" | "bad"): "success" | "secondary" | "error" {
  return LEVEL_TOKEN[level];
}
