import { describe, expect, test } from "bun:test";

describe("pools command", () => {
  test("outputs pool data for valid pair", async () => {
    // TODO: Mock stonfi service, verify pool output
    expect(true).toBe(true); // Placeholder
  });

  test("returns INVALID_PAIR_FORMAT for malformed input", async () => {
    // TODO: Verify error on "NOTTON" (missing slash)
    expect(true).toBe(true); // Placeholder
  });
});
