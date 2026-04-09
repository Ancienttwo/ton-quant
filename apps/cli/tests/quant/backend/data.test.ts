import { describe, expect, test } from "bun:test";
// @ts-expect-error - backend fixtures are runtime-tested outside the CLI tsconfig boundary
import {
  handleDataFetch,
  handleDataInfo,
  handleDataList,
} from "../../../../quant-backend/src/handlers/data";

describe("data handler", () => {
  test("handleDataFetch generates 90 bars by default", () => {
    const result = handleDataFetch({ symbols: ["TON/USDT"] });
    expect(result.status).toBe("completed");
    expect(result.barCount).toBe(90);
    expect(result.fetchedSymbols).toEqual(["TON/USDT"]);
    expect(result.symbolCount).toBe(1);
  });

  test("handleDataFetch respects date range", () => {
    const result = handleDataFetch({
      symbols: ["TON/USDT"],
      startDate: "2026-01-01",
      endDate: "2026-01-31",
    });
    expect(result.barCount).toBe(30);
    const range = result.dateRange as { start: string; end: string };
    expect(range.start).toBe("2026-01-01");
  });

  test("handleDataFetch handles multiple symbols", () => {
    const result = handleDataFetch({ symbols: ["TON/USDT", "STON/TON"] });
    expect(result.symbolCount).toBe(2);
    expect((result.fetchedSymbols as string[]).length).toBe(2);
    expect(result.barCount).toBe(180); // 90 * 2
  });

  test("handleDataList returns empty datasets", () => {
    const result = handleDataList({});
    expect(result.status).toBe("completed");
    expect((result.datasets as unknown[]).length).toBe(0);
  });

  test("handleDataInfo returns dataset metadata", () => {
    const result = handleDataInfo({ symbol: "TON/USDT" });
    expect(result.status).toBe("completed");
    const dataset = result.dataset as { symbol: string; interval: string };
    expect(dataset.symbol).toBe("TON/USDT");
    expect(dataset.interval).toBe("1d");
  });

  test("handleDataFetch resolves HK equities onto HKEX", () => {
    const result = handleDataInfo({
      symbol: "0700",
      assetClass: "equity",
      marketRegion: "hk",
    });
    const dataset = result.dataset as {
      symbol: string;
      instrument: { marketRegion: string; venue: string };
    };
    expect(dataset.symbol).toBe("0700");
    expect(dataset.instrument.marketRegion).toBe("hk");
    expect(dataset.instrument.venue).toBe("hkex");
  });

  test("handleDataFetch resolves A-shares onto SSE by default", () => {
    const result = handleDataInfo({
      symbol: "600519",
      assetClass: "equity",
      marketRegion: "cn",
    });
    const dataset = result.dataset as {
      symbol: string;
      instrument: { marketRegion: string; venue: string };
    };
    expect(dataset.symbol).toBe("600519");
    expect(dataset.instrument.marketRegion).toBe("cn");
    expect(dataset.instrument.venue).toBe("sse");
  });
});
