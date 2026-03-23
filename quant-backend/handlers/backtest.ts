/**
 * Backtest handler — simple momentum strategy engine.
 * Supports position sizing, slippage, and basic performance metrics.
 */

interface OHLCVBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface BacktestTrade {
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  returnPct: number;
  side: "long" | "short";
}

function loadBars(input: Record<string, unknown>): OHLCVBar[] {
  const datasetPath = input.datasetPath as string | undefined;
  if (datasetPath) {
    try {
      const raw = require("node:fs").readFileSync(datasetPath, "utf-8");
      return JSON.parse(raw) as OHLCVBar[];
    } catch {
      throw new Error(`Failed to read dataset at ${datasetPath}`);
    }
  }

  // Generate synthetic data
  const days = 90;
  const bars: OHLCVBar[] = [];
  let price = 3.5;
  const start = new Date(Date.now() - days * 86400_000);
  for (let i = 0; i < days; i++) {
    const date = new Date(start.getTime() + i * 86400_000).toISOString().slice(0, 10);
    const change = (Math.random() - 0.48) * 0.06;
    const open = price;
    price *= 1 + change;
    bars.push({
      date,
      open: Number(open.toFixed(6)),
      high: Number((Math.max(open, price) * 1.01).toFixed(6)),
      low: Number((Math.min(open, price) * 0.99).toFixed(6)),
      close: Number(price.toFixed(6)),
      volume: Math.round(1_000_000 + Math.random() * 5_000_000),
    });
  }
  return bars;
}

function computeSMA(closes: number[], period: number): (number | null)[] {
  return closes.map((_, i) => {
    if (i < period - 1) return null;
    const slice = closes.slice(i - period + 1, i + 1);
    return slice.reduce((a, b) => a + b, 0) / period;
  });
}

function runMomentumStrategy(
  bars: OHLCVBar[],
  params: Record<string, unknown>,
): { trades: BacktestTrade[]; equity: number[] } {
  const fastPeriod = (params.fast_period as number) ?? 10;
  const slowPeriod = (params.slow_period as number) ?? 30;
  const initialCapital = (params.initialCapital as number) ?? 10_000;
  const slippagePct = (params.slippage as number) ?? 0.001;

  if (bars.length < slowPeriod + 1) {
    throw new Error(
      `Momentum strategy requires at least ${slowPeriod + 1} bars, got ${bars.length}`,
    );
  }

  const closes = bars.map((b) => b.close);
  const fastSMA = computeSMA(closes, fastPeriod);
  const slowSMA = computeSMA(closes, slowPeriod);

  const trades: BacktestTrade[] = [];
  const equity: number[] = [];
  let capital = initialCapital;
  let position: { entryDate: string; entryPrice: number; shares: number } | null = null;

  for (let i = 0; i < bars.length; i++) {
    const fast = fastSMA[i];
    const slow = slowSMA[i];

    if (fast === null || slow === null) {
      equity.push(capital);
      continue;
    }

    // Entry: fast crosses above slow
    if (!position && fast > slow) {
      const entryPrice = bars[i].close * (1 + slippagePct);
      const shares = capital / entryPrice;
      position = { entryDate: bars[i].date, entryPrice, shares };
    }
    // Exit: fast crosses below slow
    else if (position && fast < slow) {
      const exitPrice = bars[i].close * (1 - slippagePct);
      const proceeds = position.shares * exitPrice;
      const returnPct = (exitPrice - position.entryPrice) / position.entryPrice;
      trades.push({
        entryDate: position.entryDate,
        exitDate: bars[i].date,
        entryPrice: Number(position.entryPrice.toFixed(6)),
        exitPrice: Number(exitPrice.toFixed(6)),
        returnPct: Number(returnPct.toFixed(4)),
        side: "long",
      });
      capital = proceeds;
      position = null;
    }

    // Mark-to-market
    const mtm = position ? position.shares * bars[i].close : capital;
    equity.push(Number(mtm.toFixed(2)));
  }

  // Close open position at end
  if (position) {
    const exitPrice = bars[bars.length - 1].close * (1 - slippagePct);
    const proceeds = position.shares * exitPrice;
    trades.push({
      entryDate: position.entryDate,
      exitDate: bars[bars.length - 1].date,
      entryPrice: Number(position.entryPrice.toFixed(6)),
      exitPrice: Number(exitPrice.toFixed(6)),
      returnPct: Number(((exitPrice - position.entryPrice) / position.entryPrice).toFixed(4)),
      side: "long",
    });
    capital = proceeds;
  }

  return { trades, equity };
}

function computeMetrics(equity: number[], trades: BacktestTrade[]): Record<string, number> {
  const initialCapital = equity[0] ?? 10_000;
  const finalCapital = equity[equity.length - 1] ?? initialCapital;
  const totalReturn = (finalCapital - initialCapital) / initialCapital;

  // Daily returns
  const dailyReturns: number[] = [];
  for (let i = 1; i < equity.length; i++) {
    dailyReturns.push((equity[i] - equity[i - 1]) / equity[i - 1]);
  }

  // Sharpe ratio (annualized)
  const meanReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
  const stdDev = Math.sqrt(
    dailyReturns.reduce((sum, r) => sum + (r - meanReturn) ** 2, 0) / (dailyReturns.length - 1),
  );
  const sharpe = stdDev > 0 ? (meanReturn / stdDev) * Math.sqrt(252) : 0;

  // Max drawdown
  let peak = equity[0];
  let maxDrawdown = 0;
  for (const value of equity) {
    if (value > peak) peak = value;
    const dd = (peak - value) / peak;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  // Win rate
  const wins = trades.filter((t) => t.returnPct > 0).length;
  const winRate = trades.length > 0 ? wins / trades.length : 0;

  // Calmar ratio
  const annualizedReturn = totalReturn * (252 / equity.length);
  const calmar = maxDrawdown > 0 ? annualizedReturn / maxDrawdown : 0;

  // Sortino ratio
  const negReturns = dailyReturns.filter((r) => r < 0);
  const downDev = Math.sqrt(
    negReturns.reduce((sum, r) => sum + r ** 2, 0) / Math.max(negReturns.length, 1),
  );
  const sortino = downDev > 0 ? (meanReturn / downDev) * Math.sqrt(252) : 0;

  // Max consecutive loss days
  let maxLossDays = 0;
  let currentLossDays = 0;
  for (const r of dailyReturns) {
    if (r < 0) {
      currentLossDays++;
      maxLossDays = Math.max(maxLossDays, currentLossDays);
    } else {
      currentLossDays = 0;
    }
  }

  return {
    sharpe: Number(sharpe.toFixed(4)),
    maxDrawdown: Number(maxDrawdown.toFixed(4)),
    totalReturn: Number((totalReturn * 100).toFixed(2)),
    winRate: Number(winRate.toFixed(4)),
    tradeCount: trades.length,
    calmar: Number(calmar.toFixed(4)),
    sortino: Number(sortino.toFixed(4)),
    informationRatio: 0,
    maxConsecutiveLossDays: maxLossDays,
  };
}

export function handleBacktest(input: Record<string, unknown>): Record<string, unknown> {
  const strategy = (input.strategy as string) ?? "momentum";
  const params = (input.params as Record<string, unknown>) ?? {};
  const outputDir = input.outputDir as string | undefined;

  if (strategy !== "momentum") {
    throw new Error(`Unknown strategy: ${strategy}. Available: momentum`);
  }

  const bars = loadBars(input);
  const { trades, equity } = runMomentumStrategy(bars, {
    ...params,
    initialCapital: input.initialCapital,
    slippage: (input.costConfig as Record<string, unknown>)?.slippage
      ? ((input.costConfig as Record<string, unknown>).slippage as Record<string, unknown>).value
      : 0.001,
  });
  const metrics = computeMetrics(equity, trades);

  // Monthly returns
  const monthlyReturns: Record<string, number> = {};
  let lastMonth = "";
  let monthStart = equity[0];
  for (let i = 0; i < bars.length; i++) {
    const month = bars[i].date.slice(0, 7);
    if (month !== lastMonth && lastMonth) {
      monthlyReturns[lastMonth] = Number(
        (((equity[i - 1] - monthStart) / monthStart) * 100).toFixed(2),
      );
      monthStart = equity[i - 1];
    }
    lastMonth = month;
  }
  if (lastMonth) {
    monthlyReturns[lastMonth] = Number(
      (((equity[equity.length - 1] - monthStart) / monthStart) * 100).toFixed(2),
    );
  }

  if (outputDir) {
    const fs = require("node:fs");
    fs.writeFileSync(
      `${outputDir}/backtest.json`,
      JSON.stringify({ metrics, trades, equity }, null, 2),
    );
  }

  return {
    status: "completed",
    summary: `Backtest: ${metrics.totalReturn}% return, ${metrics.sharpe} sharpe, ${metrics.tradeCount} trades`,
    artifacts: outputDir
      ? [{ path: `${outputDir}/backtest.json`, label: "Backtest results", kind: "json" }]
      : [],
    ...metrics,
    monthlyReturns,
    dailyEquity: equity,
  };
}
