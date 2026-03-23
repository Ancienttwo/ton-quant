/**
 * Factor computation handler — RSI, MACD, volatility.
 * Includes data point minimum validation per eng review #7.
 */

interface OHLCVBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const FACTOR_REGISTRY: Record<
  string,
  { name: string; category: string; description: string; minDataPoints: number; source: string }
> = {
  rsi: {
    name: "RSI",
    category: "momentum",
    description: "Relative Strength Index (14-period)",
    minDataPoints: 15,
    source: "indicator",
  },
  macd: {
    name: "MACD",
    category: "momentum",
    description: "Moving Average Convergence Divergence (12/26/9)",
    minDataPoints: 27,
    source: "indicator",
  },
  volatility: {
    name: "Volatility",
    category: "risk",
    description: "20-day realized volatility (annualized)",
    minDataPoints: 21,
    source: "indicator",
  },
  sma_20: {
    name: "SMA-20",
    category: "trend",
    description: "20-day Simple Moving Average",
    minDataPoints: 20,
    source: "indicator",
  },
  volume_ratio: {
    name: "Volume Ratio",
    category: "liquidity",
    description: "Current volume / 20-day average volume",
    minDataPoints: 20,
    source: "liquidity",
  },
};

function computeRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) {
    throw new Error(
      `RSI(${period}) requires at least ${period + 1} data points, got ${closes.length}`,
    );
  }
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return Number((100 - 100 / (1 + rs)).toFixed(2));
}

function computeMACD(
  closes: number[],
  fast = 12,
  slow = 26,
  signal = 9,
): { macd: number; signal: number; histogram: number } {
  if (closes.length < slow + 1) {
    throw new Error(
      `MACD(${fast}/${slow}/${signal}) requires at least ${slow + 1} data points, got ${closes.length}`,
    );
  }
  const ema = (data: number[], period: number): number[] => {
    const k = 2 / (period + 1);
    const result = [data[0]];
    for (let i = 1; i < data.length; i++) {
      result.push(data[i] * k + result[i - 1] * (1 - k));
    }
    return result;
  };
  const emaFast = ema(closes, fast);
  const emaSlow = ema(closes, slow);
  const macdLine = emaFast.map((v, i) => v - emaSlow[i]);
  const signalLine = ema(macdLine.slice(slow - 1), signal);
  const lastMacd = macdLine[macdLine.length - 1];
  const lastSignal = signalLine[signalLine.length - 1];
  return {
    macd: Number(lastMacd.toFixed(6)),
    signal: Number(lastSignal.toFixed(6)),
    histogram: Number((lastMacd - lastSignal).toFixed(6)),
  };
}

function computeVolatility(closes: number[], period = 20): number {
  if (closes.length < period + 1) {
    throw new Error(
      `Volatility(${period}) requires at least ${period + 1} data points, got ${closes.length}`,
    );
  }
  const returns: number[] = [];
  for (let i = closes.length - period; i < closes.length; i++) {
    returns.push(Math.log(closes[i] / closes[i - 1]));
  }
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / (returns.length - 1);
  return Number((Math.sqrt(variance) * Math.sqrt(252) * 100).toFixed(2));
}

function computeSMA(closes: number[], period = 20): number {
  if (closes.length < period) {
    throw new Error(`SMA(${period}) requires at least ${period} data points, got ${closes.length}`);
  }
  const slice = closes.slice(-period);
  return Number((slice.reduce((a, b) => a + b, 0) / period).toFixed(6));
}

function computeVolumeRatio(volumes: number[], period = 20): number {
  if (volumes.length < period) {
    throw new Error(
      `Volume Ratio(${period}) requires at least ${period} data points, got ${volumes.length}`,
    );
  }
  const avgVolume = volumes.slice(-period).reduce((a, b) => a + b, 0) / period;
  const current = volumes[volumes.length - 1];
  return avgVolume > 0 ? Number((current / avgVolume).toFixed(2)) : 0;
}

function loadDataset(input: Record<string, unknown>): OHLCVBar[] {
  const datasetPath = input.datasetPath as string | undefined;
  if (datasetPath) {
    try {
      const raw = require("node:fs").readFileSync(datasetPath, "utf-8");
      return JSON.parse(raw) as OHLCVBar[];
    } catch {
      throw new Error(`Failed to read dataset at ${datasetPath}`);
    }
  }
  // If no dataset path, generate synthetic data
  const _symbols = (input.symbols as string[]) ?? ["TON/USDT"];
  // Return synthetic bars for first symbol
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

export function handleFactorList(_input: Record<string, unknown>): Record<string, unknown> {
  const factors = Object.entries(FACTOR_REGISTRY).map(([id, info]) => ({
    id,
    name: info.name,
    category: info.category,
    description: info.description,
    parameters: [],
    inputFields: ["close"],
    computeMode: "batch",
    source: info.source,
  }));

  return {
    status: "completed",
    summary: `${factors.length} factors available`,
    artifacts: [],
    factors,
  };
}

export function handleFactorCompute(input: Record<string, unknown>): Record<string, unknown> {
  const factorIds = (input.factors as string[]) ?? ["rsi"];
  const bars = loadDataset(input);
  const closes = bars.map((b) => b.close);
  const volumes = bars.map((b) => b.volume);
  const outputDir = input.outputDir as string | undefined;

  // Validate data point minimums
  for (const fid of factorIds) {
    const reg = FACTOR_REGISTRY[fid];
    if (reg && bars.length < reg.minDataPoints) {
      throw new Error(
        `${reg.name} requires at least ${reg.minDataPoints} data points, got ${bars.length}`,
      );
    }
  }

  const results: Record<string, unknown> = {};
  const columns: string[] = [];

  for (const fid of factorIds) {
    switch (fid) {
      case "rsi":
        results.rsi = computeRSI(closes);
        columns.push("rsi");
        break;
      case "macd": {
        const macd = computeMACD(closes);
        results.macd = macd.macd;
        results.macd_signal = macd.signal;
        results.macd_histogram = macd.histogram;
        columns.push("macd", "macd_signal", "macd_histogram");
        break;
      }
      case "volatility":
        results.volatility = computeVolatility(closes);
        columns.push("volatility");
        break;
      case "sma_20":
        results.sma_20 = computeSMA(closes);
        columns.push("sma_20");
        break;
      case "volume_ratio":
        results.volume_ratio = computeVolumeRatio(volumes);
        columns.push("volume_ratio");
        break;
      default:
        throw new Error(`Unknown factor: ${fid}`);
    }
  }

  if (outputDir) {
    const fs = require("node:fs");
    fs.writeFileSync(`${outputDir}/factors.json`, JSON.stringify(results, null, 2));
  }

  return {
    status: "completed",
    summary: `Computed ${factorIds.length} factor(s) on ${bars.length} bars`,
    artifacts: outputDir
      ? [{ path: `${outputDir}/factors.json`, label: "Factor values", kind: "json" }]
      : [],
    datasetRows: bars.length,
    factorCount: factorIds.length,
    symbolCount: 1,
    factorColumns: columns,
    ...results,
  };
}
