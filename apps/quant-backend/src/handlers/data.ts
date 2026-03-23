/**
 * Data fetch handler — generates synthetic OHLCV data for TON pairs.
 * Real API integration (STON.fi / GeckoTerminal) can replace the generator later.
 */

interface OHLCVBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

function generateSyntheticOHLCV(symbol: string, days: number, startDate?: string): OHLCVBar[] {
  const bars: OHLCVBar[] = [];
  const start = startDate ? new Date(startDate) : new Date(Date.now() - days * 86400_000);
  const basePrice = symbol.toUpperCase().includes("TON") ? 3.5 : 1.0;
  let price = basePrice;

  for (let i = 0; i < days; i++) {
    const date = new Date(start.getTime() + i * 86400_000);
    const dateStr = date.toISOString().slice(0, 10);
    const change = (Math.random() - 0.48) * 0.06;
    const open = price;
    price = price * (1 + change);
    const close = price;
    const high = Math.max(open, close) * (1 + Math.random() * 0.02);
    const low = Math.min(open, close) * (1 - Math.random() * 0.02);
    const volume = 1_000_000 + Math.random() * 5_000_000;

    bars.push({
      date: dateStr,
      open: Number(open.toFixed(6)),
      high: Number(high.toFixed(6)),
      low: Number(low.toFixed(6)),
      close: Number(close.toFixed(6)),
      volume: Math.round(volume),
    });
  }
  return bars;
}

function computeDateDiff(start: string, end: string): number {
  return Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400_000);
}

export function handleDataFetch(input: Record<string, unknown>): Record<string, unknown> {
  const symbols = (input.symbols as string[]) ?? ["TON/USDT"];
  const startDate = input.startDate as string | undefined;
  const endDate = input.endDate as string | undefined;
  const outputDir = input.outputDir as string | undefined;

  const days = startDate && endDate ? computeDateDiff(startDate, endDate) : 90;
  const allBars: Record<string, OHLCVBar[]> = {};
  let totalBars = 0;

  for (const symbol of symbols) {
    const bars = generateSyntheticOHLCV(symbol, days, startDate);
    allBars[symbol] = bars;
    totalBars += bars.length;

    if (outputDir) {
      const safeName = symbol.replace(/\//g, "-");
      const path = `${outputDir}/${safeName}.json`;
      Bun.write(path, JSON.stringify(bars, null, 2));
    }
  }

  const firstBar = allBars[symbols[0]]?.[0];
  const lastBar = allBars[symbols[0]]?.[allBars[symbols[0]].length - 1];

  return {
    status: "completed",
    summary: `Fetched ${totalBars} bars for ${symbols.length} symbol(s)`,
    artifacts: outputDir
      ? symbols.map((s) => ({
          path: `${outputDir}/${s.replace(/\//g, "-")}.json`,
          label: `${s} OHLCV`,
          kind: "dataset",
        }))
      : [],
    fetchedSymbols: symbols,
    cacheHits: 0,
    cacheMisses: symbols.length,
    barCount: totalBars,
    cacheFiles: [],
    symbolCount: symbols.length,
    dateRange: firstBar && lastBar ? { start: firstBar.date, end: lastBar.date } : undefined,
  };
}

export function handleDataList(_input: Record<string, unknown>): Record<string, unknown> {
  return {
    status: "completed",
    summary: "No cached datasets (mock backend)",
    artifacts: [],
    datasets: [],
  };
}

export function handleDataInfo(input: Record<string, unknown>): Record<string, unknown> {
  const symbol = (input.symbol as string) ?? "TON/USDT";
  return {
    status: "completed",
    summary: `Dataset info for ${symbol}`,
    artifacts: [],
    dataset: {
      symbol,
      interval: "1d",
      path: "(synthetic)",
      barCount: 90,
      startDate: new Date(Date.now() - 90 * 86400_000).toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10),
    },
  };
}
