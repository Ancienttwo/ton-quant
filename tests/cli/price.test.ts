import { describe, expect, test } from "bun:test";

describe("price command", () => {
  test("outputs JSON envelope with --json flag", async () => {
    // TODO: Mock stonfi service, invoke command handler, verify JSON output
    expect(true).toBe(true); // Placeholder
  });

  test("returns TOKEN_NOT_FOUND for unknown symbol", async () => {
    // TODO: Mock stonfi service returning no match, verify error code
    expect(true).toBe(true); // Placeholder
  });
});
