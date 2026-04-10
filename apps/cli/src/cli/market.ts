import {
  fetchMarketCandlesData,
  fetchMarketCompareData,
  fetchMarketQuoteData,
  fetchMarketSearchData,
} from "@tonquant/core";
import type { Command } from "commander";
import type { MarketProvider } from "../types/cli.js";
import {
  formatMarketCandles,
  formatMarketCompare,
  formatMarketQuote,
  formatMarketSearch,
} from "../utils/format.js";
import { CliCommandError, handleCommand } from "../utils/output.js";

function parseProvider(raw: string | undefined): MarketProvider | undefined {
  if (!raw) return undefined;
  if (raw === "binance" || raw === "hyperliquid") {
    return raw;
  }
  throw new CliCommandError(
    `Unsupported market provider '${raw}'. Expected 'binance' or 'hyperliquid'.`,
    "MARKET_PROVIDER_INVALID",
  );
}

export function registerMarketCommand(program: Command): void {
  const market = program
    .command("market")
    .description("Public market-first quotes and history for generic crypto symbols");

  market
    .command("quote <symbol>")
    .description("Quote a generic crypto symbol from public market data")
    .option("-p, --provider <provider>", "Provider (binance|hyperliquid)")
    .action(async (symbol: string, options: { provider?: string }) => {
      const json = program.opts().json ?? false;
      await handleCommand(
        { json },
        () => fetchMarketQuoteData(symbol, parseProvider(options.provider)),
        formatMarketQuote,
      );
    });

  market
    .command("search <query>")
    .description("Search public-market instruments across supported providers")
    .option("-p, --provider <provider>", "Provider (binance|hyperliquid)")
    .action(async (query: string, options: { provider?: string }) => {
      const json = program.opts().json ?? false;
      await handleCommand(
        { json },
        () => fetchMarketSearchData(query, parseProvider(options.provider)),
        formatMarketSearch,
      );
    });

  market
    .command("compare <symbol>")
    .description("Compare Binance spot and Hyperliquid perp quotes for the same symbol")
    .action(async (symbol: string) => {
      const json = program.opts().json ?? false;
      await handleCommand({ json }, () => fetchMarketCompareData(symbol), formatMarketCompare);
    });

  market
    .command("candles <symbol>")
    .description("Fetch public-market OHLCV candles for a generic crypto symbol")
    .option("-p, --provider <provider>", "Provider (binance|hyperliquid)")
    .option("-i, --interval <interval>", "Interval (15m|1h|4h|1d)", "1d")
    .option("-n, --limit <number>", "Number of candles to fetch", "30")
    .action(
      async (symbol: string, options: { provider?: string; interval: string; limit: string }) => {
        const json = program.opts().json ?? false;
        await handleCommand(
          { json },
          () =>
            fetchMarketCandlesData(symbol, {
              provider: parseProvider(options.provider),
              interval: options.interval,
              limit: Number.parseInt(options.limit, 10),
            }),
          formatMarketCandles,
        );
      },
    );
}
