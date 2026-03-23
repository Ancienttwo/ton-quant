import { describe, expect, test } from "bun:test";
import { resolveQuantCli } from "../../../src/quant/runner/resolve-cli.js";

describe("resolveQuantCli", () => {
  test("resolves to quant-backend when it exists", () => {
    // quant-backend/cli.ts exists in the project root
    const result = resolveQuantCli();
    expect(result[0]).toBe("bun");
    expect(result[1]).toBe("run");
    expect(result[2]).toContain("quant-backend");
  });

  test("prefers TONQUANT_QUANT_CLI env var", () => {
    const original = process.env.TONQUANT_QUANT_CLI;
    process.env.TONQUANT_QUANT_CLI = "python3 /path/to/cli.py";
    try {
      const result = resolveQuantCli();
      expect(result).toEqual(["python3", "/path/to/cli.py"]);
    } finally {
      if (original) process.env.TONQUANT_QUANT_CLI = original;
      else delete process.env.TONQUANT_QUANT_CLI;
    }
  });
});
