import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { type Asset, clearCache } from "@tonquant/core";

const mockAsset: Asset = {
  contract_address: "EQ_not_addr",
  symbol: "NOT",
  display_name: "Notcoin",
  decimals: 9,
  dex_usd_price: "0.0068",
};

let fetchSpy: ReturnType<typeof spyOn>;

beforeEach(() => {
  clearCache();
  fetchSpy = spyOn(globalThis, "fetch").mockImplementation((() =>
    Promise.resolve(
      new Response(JSON.stringify({ asset_list: [mockAsset] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )) as unknown as typeof fetch);
});

afterEach(() => {
  fetchSpy.mockRestore();
  clearCache();
});

describe("price command", () => {
  test("cachedFindAssetBySymbol returns enriched data", async () => {
    const { cachedFindAssetBySymbol } = await import("@tonquant/core");
    const asset = await cachedFindAssetBySymbol("NOT");
    expect(asset).toBeDefined();
    expect(asset?.symbol).toBe("NOT");
    expect(asset?.dex_usd_price).toBe("0.0068");
  });

  test("cachedFindAssetBySymbol returns undefined for unknown", async () => {
    const { cachedFindAssetBySymbol } = await import("@tonquant/core");
    const asset = await cachedFindAssetBySymbol("UNKNOWN");
    expect(asset).toBeUndefined();
  });
});
