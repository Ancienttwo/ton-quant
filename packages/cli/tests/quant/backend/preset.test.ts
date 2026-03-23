import { describe, expect, test } from "bun:test";
// @ts-expect-error — quant-backend is standalone, not in tsconfig
import { handlePresetList, handlePresetShow } from "../../../quant-backend/handlers/preset.ts";

describe("preset handler", () => {
  test("handlePresetList returns all presets", () => {
    const result = handlePresetList({});
    expect(result.status).toBe("completed");
    const presets = result.presets as Array<{ id: string; name: string }>;
    expect(presets.length).toBeGreaterThanOrEqual(3);
    expect(presets.some((p) => p.id === "momentum-ton")).toBe(true);
  });

  test("handlePresetShow returns preset details", () => {
    const result = handlePresetShow({ presetId: "momentum-ton" });
    expect(result.status).toBe("completed");
    const preset = result.preset as Record<string, unknown>;
    expect(preset.name).toBe("TON Momentum");
    expect(preset.strategy).toBe("momentum");
    expect(preset.symbols).toEqual(["TON/USDT"]);
    expect(preset.params).toBeDefined();
  });

  test("handlePresetShow throws on unknown preset", () => {
    expect(() => handlePresetShow({ presetId: "nonexistent" })).toThrow(/Preset not found/);
  });
});
