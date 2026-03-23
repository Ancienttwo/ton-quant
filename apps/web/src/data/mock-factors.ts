import type { EquityCurvePoint, FactorMetaPublic } from "./types";

// Seed factors matching TerminalDemo leaderboard data + extras for filtering.
export const MOCK_FACTORS: readonly FactorMetaPublic[] = [
  {
    id: "ton_momentum_1d",
    name: "30-Day Momentum",
    author: "tonquant-core",
    category: "momentum",
    source: "indicator",
    assets: ["TON"],
    timeframe: "1d",
    description:
      "Classic price momentum factor measuring 30-day rate of change. Captures medium-term trend continuation in TON markets.",
    parameters: [
      { name: "window", description: "Lookback period in days", defaultValue: 30 },
      { name: "smoothing", description: "EMA smoothing period", defaultValue: 5 },
    ],
    backtest: {
      sharpe: 1.8402,
      maxDrawdown: 8.21,
      winRate: 0.68,
      cagr: 42.3,
      dataRange: { start: "2025-12-01", end: "2026-03-01" },
      tradeCount: 142,
    },
    visibility: "free",
    version: "1.0.0",
    createdAt: "2026-02-15T00:00:00Z",
    updatedAt: "2026-03-20T00:00:00Z",
  },
  {
    id: "not_vol_revert",
    name: "NOT Volatility Reversion",
    author: "tonquant-core",
    category: "volatility",
    source: "indicator",
    assets: ["NOT", "TON"],
    timeframe: "1d",
    description:
      "Mean-reversion factor based on realized volatility z-score. Captures overextended moves in NOT/TON pair.",
    parameters: [
      { name: "vol_window", description: "Volatility lookback in days", defaultValue: 14 },
      { name: "z_threshold", description: "Z-score threshold for signals", defaultValue: 2.0 },
    ],
    backtest: {
      sharpe: 1.4521,
      maxDrawdown: 11.3,
      winRate: 0.62,
      cagr: 31.7,
      dataRange: { start: "2025-12-01", end: "2026-03-01" },
      tradeCount: 98,
    },
    visibility: "free",
    version: "1.0.0",
    createdAt: "2026-02-18T00:00:00Z",
    updatedAt: "2026-03-19T00:00:00Z",
  },
  {
    id: "dex_liq_flow",
    name: "DEX Liquidity Flow",
    author: "tonquant-core",
    category: "liquidity",
    source: "liquidity",
    assets: ["TON", "USDT"],
    timeframe: "1d",
    description:
      "Tracks net liquidity add/remove flows across STON.fi pools. Rising liquidity inflows signal institutional confidence.",
    parameters: [
      { name: "pool_filter", description: "Minimum pool TVL to include", defaultValue: 100000 },
      { name: "flow_window", description: "Flow aggregation window in hours", defaultValue: 24 },
    ],
    backtest: {
      sharpe: 1.2103,
      maxDrawdown: 6.5,
      winRate: 0.59,
      cagr: 24.5,
      dataRange: { start: "2025-12-01", end: "2026-03-01" },
      tradeCount: 76,
    },
    visibility: "free",
    version: "1.0.0",
    createdAt: "2026-02-20T00:00:00Z",
    updatedAt: "2026-03-18T00:00:00Z",
  },
  {
    id: "rsi_oversold_14d",
    name: "RSI Oversold 14D",
    author: "tonquant-core",
    category: "momentum",
    source: "indicator",
    assets: ["TON"],
    timeframe: "1d",
    description:
      "Buys when 14-day RSI drops below oversold threshold. Classic contrarian momentum factor for TON.",
    parameters: [
      { name: "rsi_period", description: "RSI calculation period", defaultValue: 14 },
      { name: "oversold", description: "Oversold RSI threshold", defaultValue: 30 },
    ],
    backtest: {
      sharpe: 0.9814,
      maxDrawdown: 14.2,
      winRate: 0.55,
      cagr: 18.2,
      dataRange: { start: "2025-12-01", end: "2026-03-01" },
      tradeCount: 64,
    },
    visibility: "free",
    version: "1.0.0",
    createdAt: "2026-02-22T00:00:00Z",
    updatedAt: "2026-03-17T00:00:00Z",
  },
  {
    id: "whale_sentiment",
    name: "Whale Sentiment Index",
    author: "tonquant-core",
    category: "sentiment",
    source: "derived",
    assets: ["TON"],
    timeframe: "1d",
    description:
      "Aggregates large wallet (>100K TON) transaction patterns to derive a directional sentiment score.",
    parameters: [
      { name: "min_balance", description: "Minimum wallet balance for whale classification", defaultValue: 100000 },
      { name: "lookback", description: "Transaction lookback in days", defaultValue: 7 },
    ],
    backtest: {
      sharpe: 0.8701,
      maxDrawdown: 16.8,
      winRate: 0.53,
      cagr: 15.1,
      dataRange: { start: "2025-12-01", end: "2026-03-01" },
      tradeCount: 52,
    },
    visibility: "free",
    version: "1.0.0",
    createdAt: "2026-02-25T00:00:00Z",
    updatedAt: "2026-03-16T00:00:00Z",
  },
  {
    id: "ton_value_ratio",
    name: "TON Value Ratio",
    author: "community",
    category: "value",
    source: "derived",
    assets: ["TON"],
    timeframe: "1d",
    description:
      "Compares TON market cap to on-chain activity metrics (TVL, daily active addresses) to derive a value score.",
    parameters: [
      { name: "tvl_weight", description: "Weight of TVL in composite score", defaultValue: 0.6 },
      { name: "addr_weight", description: "Weight of active addresses", defaultValue: 0.4 },
    ],
    backtest: {
      sharpe: 1.1205,
      maxDrawdown: 9.7,
      winRate: 0.57,
      cagr: 21.8,
      dataRange: { start: "2025-12-15", end: "2026-03-01" },
      tradeCount: 45,
    },
    visibility: "free",
    version: "1.0.0",
    createdAt: "2026-03-01T00:00:00Z",
    updatedAt: "2026-03-15T00:00:00Z",
  },
  {
    id: "ston_lp_yield",
    name: "STON.fi LP Yield Signal",
    author: "community",
    category: "liquidity",
    source: "liquidity",
    assets: ["TON", "USDT", "NOT"],
    timeframe: "4h",
    description:
      "Monitors LP yield spikes across STON.fi pools. Yield compression signals capital rotation; yield expansion signals opportunity.",
    parameters: [
      { name: "yield_z", description: "Z-score threshold for yield spike", defaultValue: 1.5 },
      { name: "min_tvl", description: "Minimum pool TVL", defaultValue: 50000 },
    ],
    backtest: {
      sharpe: 0.7502,
      maxDrawdown: 12.1,
      winRate: 0.51,
      cagr: 13.4,
      dataRange: { start: "2026-01-01", end: "2026-03-01" },
      tradeCount: 88,
    },
    visibility: "preview",
    version: "1.0.0",
    createdAt: "2026-03-05T00:00:00Z",
    updatedAt: "2026-03-14T00:00:00Z",
  },
  {
    id: "jetton_vol_spike",
    name: "Jetton Volume Spike",
    author: "community",
    category: "custom",
    source: "derived",
    assets: ["NOT", "DOGS", "TON"],
    timeframe: "1h",
    description:
      "Detects abnormal volume spikes across jetton pairs on STON.fi. Often precedes large price moves within 4-24 hours.",
    parameters: [
      { name: "vol_multiplier", description: "Volume spike multiplier vs 7d average", defaultValue: 3.0 },
      { name: "min_trades", description: "Minimum trade count in window", defaultValue: 50 },
    ],
    backtest: {
      sharpe: 0.6310,
      maxDrawdown: 19.5,
      winRate: 0.48,
      cagr: 10.2,
      dataRange: { start: "2026-01-15", end: "2026-03-01" },
      tradeCount: 124,
    },
    visibility: "free",
    version: "0.9.0",
    createdAt: "2026-03-08T00:00:00Z",
    updatedAt: "2026-03-13T00:00:00Z",
  },
];

/**
 * Generate a synthetic equity curve from backtest summary.
 * Produces ~dayCount daily points converging to stated CAGR with realistic drawdown.
 */
export function generateEquityCurve(
  backtest: FactorMetaPublic["backtest"],
): EquityCurvePoint[] {
  const start = new Date(backtest.dataRange.start);
  const end = new Date(backtest.dataRange.end);
  const dayCount = Math.max(
    30,
    Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
  );

  // Daily drift from annualized CAGR
  const annualizedReturn = backtest.cagr / 100;
  const dailyDrift = annualizedReturn / 252;

  // Daily vol calibrated from Sharpe (annualized Sharpe = drift * sqrt(252) / vol)
  const dailyVol =
    backtest.sharpe > 0 ? dailyDrift / (backtest.sharpe / Math.sqrt(252)) : 0.02;

  // Seeded random for reproducibility per factor
  let seed = 0;
  for (const ch of backtest.dataRange.start) {
    seed = ((seed << 5) - seed + ch.charCodeAt(0)) | 0;
  }
  seed = Math.abs(seed) + Math.round(backtest.sharpe * 1000);
  const rand = () => {
    seed = (seed * 16807 + 0) % 2147483647;
    return seed / 2147483647;
  };

  const points: EquityCurvePoint[] = [];
  let value = 100;
  let peak = 100;
  let hasHitDrawdown = false;
  const drawdownDay = Math.floor(dayCount * 0.4 + rand() * dayCount * 0.3);

  // Box-Muller normal
  const randn = () => {
    const u1 = rand();
    const u2 = rand();
    return Math.sqrt(-2 * Math.log(u1 + 1e-10)) * Math.cos(2 * Math.PI * u2);
  };

  for (let d = 0; d <= dayCount; d++) {
    const date = new Date(start.getTime() + d * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().slice(0, 10);

    if (d === 0) {
      points.push({ time: dateStr, value: 100 });
      continue;
    }

    // Inject drawdown near the target day
    let dailyReturn: number;
    if (!hasHitDrawdown && d >= drawdownDay && d <= drawdownDay + 5) {
      dailyReturn = -backtest.maxDrawdown / 100 / 5 + randn() * dailyVol * 0.3;
      if (d === drawdownDay + 5) hasHitDrawdown = true;
    } else {
      dailyReturn = dailyDrift + randn() * dailyVol;
    }

    value = value * (1 + dailyReturn);
    value = Math.max(value, 10); // floor to prevent negative
    peak = Math.max(peak, value);
    points.push({ time: dateStr, value: Math.round(value * 100) / 100 });
  }

  return points;
}
