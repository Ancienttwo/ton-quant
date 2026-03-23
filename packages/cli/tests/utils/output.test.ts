import { describe, expect, test } from "bun:test";
import { CliCommandError, formatError, formatOutput } from "../../src/utils/output.js";

describe("formatOutput", () => {
  test("returns JSON envelope when json option is true", () => {
    const data = { symbol: "TON", price_usd: "1.85" };
    const result = formatOutput(data, { json: true });
    const parsed = JSON.parse(result);

    expect(parsed.status).toBe("ok");
    expect(parsed.data).toEqual(data);
  });

  test("calls human formatter when json option is false", () => {
    const data = { symbol: "TON" };
    const formatter = (d: typeof data) => `Token: ${d.symbol}`;
    const result = formatOutput(data, { json: false }, formatter);

    expect(result).toBe("Token: TON");
  });

  test("falls back to JSON.stringify when no human formatter provided", () => {
    const data = { symbol: "TON" };
    const result = formatOutput(data, { json: false });

    expect(result).toContain("TON");
  });
});

describe("formatError", () => {
  test("returns JSON error envelope when json option is true", () => {
    const result = formatError("Not found", "NOT_FOUND", { json: true });
    const parsed = JSON.parse(result);

    expect(parsed.status).toBe("error");
    expect(parsed.error).toBe("Not found");
    expect(parsed.code).toBe("NOT_FOUND");
  });

  test("returns human-readable error when json option is false", () => {
    const result = formatError("Not found", "NOT_FOUND", { json: false });

    expect(result).toBe("Error [NOT_FOUND]: Not found");
  });
});

describe("CliCommandError", () => {
  test("has correct name, message, and code", () => {
    const error = new CliCommandError("test message", "TEST_CODE");

    expect(error.name).toBe("CliCommandError");
    expect(error.message).toBe("test message");
    expect(error.code).toBe("TEST_CODE");
    expect(error instanceof Error).toBe(true);
  });
});
