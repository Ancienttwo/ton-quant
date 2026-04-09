#!/usr/bin/env bun
/**
 * Build an asciinema .cast file from demo/run.sh output with proper timing.
 * Usage: bun run demo/build-cast.ts > demo/recording.cast
 */

import { spawnSync } from "node:child_process";

const COLS = 120;
const ROWS = 38;

// Run the demo and capture output
const result = spawnSync("./demo/run.sh", {
  shell: true,
  encoding: "utf-8",
  env: { ...process.env, TERM: "xterm-256color" },
});

const output = result.stdout + result.stderr;
const lines = output.split("\n");

// Build cast frames with timing
const header = {
  version: 2,
  width: COLS,
  height: ROWS,
  timestamp: Math.floor(Date.now() / 1000),
  env: { SHELL: "/bin/zsh", TERM: "xterm-256color" },
};

const frames: [number, string, string][] = [];
let time = 0;

// Section timing rules
const SECTION_PAUSE = 1.5; // pause before section header
const LINE_DELAY = 0.04; // base delay per line
const CMD_DELAY = 0.8; // pause after $ command line
const TABLE_LINE_DELAY = 0.02; // faster for table rendering
const RESULT_PAUSE = 2.0; // pause on important results
const TYPING_CHAR_DELAY = 0.03; // typing simulation

for (let i = 0; i < lines.length; i++) {
  const line = lines[i] ?? "";

  // Detect sections by cyan color or box drawing
  const isSection = line.includes("━━━") && line.includes("\x1b[1;36m");
  const isBoxLine = line.includes("╔") || line.includes("╚") || line.includes("║");
  const isPrompt = line.includes("\x1b[1;33m$\x1b[0m");
  const isTableLine =
    line.includes("┌") || line.includes("├") || line.includes("└") || line.includes("│");
  const isSuccess = line.includes("✓");
  const isRecommendation =
    line.includes("Recommendation") ||
    line.includes("BUY") ||
    line.includes("SELL") ||
    line.includes("HOLD");

  // Add appropriate delay
  if (isSection) {
    time += SECTION_PAUSE;
  } else if (isPrompt) {
    // Simulate typing the command character by character
    const parts = line.split("\x1b[0m ");
    if (parts.length > 1) {
      const cmdText = parts.slice(1).join(" ");
      // Show prompt first
      frames.push([time, "o", `${line.split(cmdText)[0]}`]);
      time += 0.3;
      // Type each char
      for (const char of cmdText) {
        frames.push([time, "o", char]);
        time += TYPING_CHAR_DELAY;
      }
      frames.push([time, "o", "\r\n"]);
      time += CMD_DELAY;
      continue;
    }
    time += CMD_DELAY;
  } else if (isTableLine) {
    time += TABLE_LINE_DELAY;
  } else if (isSuccess) {
    time += 0.6; // pause on each pipeline step
  } else if (isRecommendation) {
    time += RESULT_PAUSE;
  } else if (isBoxLine) {
    time += 0.1;
  } else {
    time += LINE_DELAY;
  }

  frames.push([time, "o", `${line}\r\n`]);
}

// Write cast file
process.stdout.write(`${JSON.stringify(header)}\n`);
for (const frame of frames) {
  process.stdout.write(`${JSON.stringify(frame)}\n`);
}
