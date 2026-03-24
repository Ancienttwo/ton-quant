import { beforeEach, describe, expect, it } from "bun:test";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { seedRegistry } from "../../src/services/seed.js";
import { exportTopFactorsAsSkills, formatSkillMarkdown } from "../../src/services/skill-export.js";

const INDEX_PATH = join(process.env.HOME ?? "/tmp", ".tonquant", "registry", "factors.json");

describe("skill export service", () => {
  beforeEach(() => {
    if (existsSync(INDEX_PATH)) rmSync(INDEX_PATH);
    seedRegistry();
  });

  it("exports top factors as skill definitions", () => {
    const skills = exportTopFactorsAsSkills(5);
    expect(skills.length).toBe(5);
    // Should be sorted by Sharpe (descending)
    for (let i = 1; i < skills.length; i++) {
      expect(skills[i - 1]?.sharpe).toBeGreaterThanOrEqual(skills[i]?.sharpe);
    }
  });

  it("skill has all required fields", () => {
    const skills = exportTopFactorsAsSkills(1);
    const skill = skills[0];
    expect(skill.name).toBeTruthy();
    expect(skill.factorId).toBeTruthy();
    expect(skill.category).toBeTruthy();
    expect(skill.usage).toContain("tonquant factor backtest");
    expect(skill.assets.length).toBeGreaterThan(0);
  });

  it("defaults to 10 skills", () => {
    const skills = exportTopFactorsAsSkills();
    expect(skills.length).toBe(10);
  });

  it("formats skills as markdown", () => {
    const skills = exportTopFactorsAsSkills(3);
    const md = formatSkillMarkdown(skills);
    expect(md).toContain("# TonQuant Factor Skills");
    expect(md).toContain("**Factor ID:**");
    expect(md).toContain("tonquant factor subscribe");
    expect(md).toContain("Recommended Companion Skills");
    expect(md).toContain("opennews");
    // Each skill should appear
    for (const skill of skills) {
      expect(md).toContain(skill.factorId);
    }
  });

  it("returns empty array when no factors", () => {
    if (existsSync(INDEX_PATH)) rmSync(INDEX_PATH);
    const skills = exportTopFactorsAsSkills();
    expect(skills.length).toBe(0);
  });
});
