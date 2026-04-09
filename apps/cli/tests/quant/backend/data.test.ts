import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
// @ts-expect-error - backend fixtures are runtime-tested outside the CLI tsconfig boundary
import {
  handleDataFetch,
  handleDataInfo,
  handleDataList,
} from "../../../../quant-backend/src/handlers/data";
// @ts-expect-error - backend fixtures are runtime-tested outside the CLI tsconfig boundary
import type { DatasetDocument } from "../../../../quant-backend/src/market/datasets";
// @ts-expect-error - backend fixtures are runtime-tested outside the CLI tsconfig boundary
import {
  createDatasetDocument,
  readDatasetDocument,
} from "../../../../quant-backend/src/market/datasets";
// @ts-expect-error - backend fixtures are runtime-tested outside the CLI tsconfig boundary
import { resolveInstrument } from "../../../../quant-backend/src/market/instruments";
// @ts-expect-error - backend fixtures are runtime-tested outside the CLI tsconfig boundary
import * as yfinanceMarket from "../../../../quant-backend/src/market/yfinance";

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function createTempDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

function datasetFor(symbol: string, provider: "yfinance" | "synthetic"): DatasetDocument {
  const instrument = resolveInstrument({
    symbol,
    assetClass: "equity",
    marketRegion: "us",
    provider,
  });
  return createDatasetDocument({
    instrument,
    interval: "1d",
    bars: [
      {
        date: "2024-01-02",
        open: 100,
        high: 101,
        low: 99,
        close: 100.5,
        volume: 1_000_000,
      },
      {
        date: "2024-01-03",
        open: 100.5,
        high: 102,
        low: 100,
        close: 101.25,
        volume: 1_100_000,
      },
    ],
  });
}

describe("data handler", () => {
  test("handleDataFetch generates 90 bars by default", async () => {
    const result = await handleDataFetch({ symbols: ["TON/USDT"] });
    expect(result.status).toBe("completed");
    expect(result.barCount).toBe(90);
    expect(result.fetchedSymbols).toEqual(["TON/USDT"]);
    expect(result.symbolCount).toBe(1);
  });

  test("handleDataFetch respects date range", async () => {
    const result = await handleDataFetch({
      symbols: ["TON/USDT"],
      startDate: "2026-01-01",
      endDate: "2026-01-31",
    });
    expect(result.barCount).toBe(30);
    const range = result.dateRange as { start: string; end: string };
    expect(range.start).toBe("2026-01-01");
  });

  test("handleDataFetch handles multiple symbols", async () => {
    const result = await handleDataFetch({ symbols: ["TON/USDT", "STON/TON"] });
    expect(result.symbolCount).toBe(2);
    expect((result.fetchedSymbols as string[]).length).toBe(2);
    expect(result.barCount).toBe(180); // 90 * 2
  });

  test("handleDataList returns empty datasets", () => {
    const result = handleDataList({});
    expect(result.status).toBe("completed");
    expect((result.datasets as unknown[]).length).toBe(0);
  });

  test("handleDataInfo returns dataset metadata", async () => {
    const result = await handleDataInfo({ symbol: "TON/USDT" });
    expect(result.status).toBe("completed");
    const dataset = result.dataset as { symbol: string; interval: string };
    expect(dataset.symbol).toBe("TON/USDT");
    expect(dataset.interval).toBe("1d");
  });

  test("handleDataFetch resolves HK equities onto HKEX", async () => {
    const result = await handleDataInfo({
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

  test("handleDataFetch resolves A-shares onto SSE by default", async () => {
    const result = await handleDataInfo({
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

  test("yfinance symbol normalization handles HK and CN market suffixes", () => {
    const hkInstrument = resolveInstrument({
      symbol: "700",
      assetClass: "equity",
      marketRegion: "hk",
      provider: "yfinance",
    });
    const sseInstrument = resolveInstrument({
      symbol: "600519",
      assetClass: "equity",
      marketRegion: "cn",
      venue: "sse",
      provider: "yfinance",
    });
    const szseInstrument = resolveInstrument({
      symbol: "000001",
      assetClass: "equity",
      marketRegion: "cn",
      venue: "szse",
      provider: "yfinance",
    });

    expect(yfinanceMarket.yfinanceSymbolForInstrument(hkInstrument)).toBe("0700.HK");
    expect(yfinanceMarket.yfinanceSymbolForInstrument(sseInstrument)).toBe("600519.SS");
    expect(yfinanceMarket.yfinanceSymbolForInstrument(szseInstrument)).toBe("000001.SZ");
  });

  test("handleDataFetch writes distinct cache files for same symbol across providers", async () => {
    const outputDir = createTempDir("tonquant-datasets-");
    const fetchSpy = spyOn(yfinanceMarket, "fetchYFinanceDatasetDocument").mockResolvedValue(
      datasetFor("AAPL", "yfinance"),
    );
    const result = await handleDataFetch({
      instruments: [
        resolveInstrument({
          symbol: "AAPL",
          assetClass: "equity",
          marketRegion: "us",
          provider: "yfinance",
        }),
        resolveInstrument({
          symbol: "AAPL",
          assetClass: "equity",
          marketRegion: "us",
          provider: "synthetic",
        }),
      ],
      outputDir,
    });

    const cacheFiles = result.cacheFiles as string[];
    expect(cacheFiles).toHaveLength(2);
    expect(new Set(cacheFiles).size).toBe(2);
    expect(cacheFiles.every((path) => existsSync(path))).toBe(true);
    fetchSpy.mockRestore();
  });

  test("handleDataFetch persists provider-backed yfinance datasets", async () => {
    const outputDir = createTempDir("tonquant-yf-fetch-");
    const fetchSpy = spyOn(yfinanceMarket, "fetchYFinanceDatasetDocument").mockResolvedValue(
      datasetFor("AAPL", "yfinance"),
    );

    const result = await handleDataFetch({
      symbols: ["AAPL"],
      assetClass: "equity",
      marketRegion: "us",
      provider: "yfinance",
      outputDir,
    });

    const cacheFile = (result.cacheFiles as string[])[0];
    const persisted = readDatasetDocument(cacheFile as string);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(persisted.provider).toBe("yfinance");
    expect(persisted.instrument.provider).toBe("yfinance");
    expect(persisted.bars).toHaveLength(2);
    fetchSpy.mockRestore();
  });

  test("handleDataInfo uses yfinance provider preview when cache is missing", async () => {
    const fetchSpy = spyOn(yfinanceMarket, "fetchYFinanceDatasetDocument").mockResolvedValue(
      datasetFor("AAPL", "yfinance"),
    );

    const result = await handleDataInfo({
      symbol: "AAPL",
      assetClass: "equity",
      marketRegion: "us",
      provider: "yfinance",
    });

    const dataset = result.dataset as {
      path: string;
      barCount: number;
      instrument: { provider: string };
    };
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(dataset.path).toBe("(not cached yet)");
    expect(dataset.barCount).toBe(2);
    expect(dataset.instrument.provider).toBe("yfinance");
    fetchSpy.mockRestore();
  });

  test("handleDataFetch surfaces provider errors without synthetic fallback", async () => {
    const fetchSpy = spyOn(yfinanceMarket, "fetchYFinanceDatasetDocument").mockRejectedValue(
      new Error("No Yahoo Finance data for 999999.SS"),
    );

    await expect(
      handleDataFetch({
        symbols: ["999999"],
        assetClass: "equity",
        marketRegion: "cn",
        venue: "sse",
        provider: "yfinance",
      }),
    ).rejects.toThrow("No Yahoo Finance data for 999999.SS");

    fetchSpy.mockRestore();
  });

  test("handleDataInfo preserves provider-specific cached datasets", async () => {
    const domainRoot = createTempDir("tonquant-dataset-domain-");
    const firstRunDir = join(domainRoot, "run-a");
    const secondRunDir = join(domainRoot, "run-b");
    mkdirSync(firstRunDir, { recursive: true });
    mkdirSync(secondRunDir, { recursive: true });
    const fetchSpy = spyOn(yfinanceMarket, "fetchYFinanceDatasetDocument").mockResolvedValue(
      datasetFor("AAPL", "yfinance"),
    );

    await handleDataFetch({
      symbols: ["AAPL"],
      assetClass: "equity",
      marketRegion: "us",
      provider: "synthetic",
      outputDir: firstRunDir,
    });
    const secondFetch = await handleDataFetch({
      symbols: ["AAPL"],
      assetClass: "equity",
      marketRegion: "us",
      provider: "yfinance",
      outputDir: secondRunDir,
    });

    const cachedInfo = await handleDataInfo({
      symbol: "AAPL",
      assetClass: "equity",
      marketRegion: "us",
      provider: "yfinance",
      outputDir: secondRunDir,
    });
    const dataset = cachedInfo.dataset as {
      instrument: { provider: string };
      path: string;
    };
    const persisted = readDatasetDocument((secondFetch.cacheFiles as string[])[0] as string);

    expect(dataset.instrument.provider).toBe("yfinance");
    expect(dataset.path).toContain("yfinance");
    expect(persisted.provider).toBe("yfinance");
    expect(persisted.instrument.provider).toBe("yfinance");
    fetchSpy.mockRestore();
  });
});
