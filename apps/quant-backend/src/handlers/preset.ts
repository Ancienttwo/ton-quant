/**
 * Preset handler — hardcoded strategy presets for demo.
 */

interface PresetDetail {
  id: string;
  name: string;
  description: string;
  strategy: string;
  market: string;
  symbols: string[];
  params: Record<string, unknown>;
  paramRanges: Record<string, { min: number; max: number; step?: number }>;
  costConfig?: Record<string, unknown>;
  thesis?: string;
}

const PRESETS: PresetDetail[] = [
  {
    id: "momentum-ton",
    name: "TON Momentum",
    description: "SMA crossover momentum strategy for TON/USDT",
    strategy: "momentum",
    market: "ton",
    symbols: ["TON/USDT"],
    params: {
      fast_period: 10,
      slow_period: 30,
    },
    paramRanges: {
      fast_period: { min: 5, max: 20, step: 1 },
      slow_period: { min: 20, max: 50, step: 5 },
    },
    costConfig: {
      slippage: { model: "percentage", value: 0.001 },
      borrowRateAnnual: 0,
    },
    thesis: "TON exhibits strong momentum due to Telegram ecosystem catalysts",
  },
  {
    id: "conservative-ton",
    name: "TON Conservative",
    description: "Slow SMA crossover with tight risk control",
    strategy: "momentum",
    market: "ton",
    symbols: ["TON/USDT"],
    params: {
      fast_period: 20,
      slow_period: 50,
    },
    paramRanges: {
      fast_period: { min: 15, max: 30, step: 5 },
      slow_period: { min: 40, max: 60, step: 5 },
    },
    costConfig: {
      slippage: { model: "percentage", value: 0.002 },
      borrowRateAnnual: 0,
    },
    thesis: "Fewer trades, lower risk for longer-term position holding",
  },
  {
    id: "aggressive-ton",
    name: "TON Aggressive",
    description: "Fast SMA crossover for short-term momentum",
    strategy: "momentum",
    market: "ton",
    symbols: ["TON/USDT"],
    params: {
      fast_period: 5,
      slow_period: 15,
    },
    paramRanges: {
      fast_period: { min: 3, max: 10, step: 1 },
      slow_period: { min: 10, max: 25, step: 1 },
    },
    costConfig: {
      slippage: { model: "percentage", value: 0.001 },
      borrowRateAnnual: 0,
    },
    thesis: "Capture short-term price moves with higher trade frequency",
  },
];

export function handlePresetList(_input: Record<string, unknown>): Record<string, unknown> {
  return {
    status: "completed",
    summary: `${PRESETS.length} presets available`,
    artifacts: [],
    presets: PRESETS.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      strategy: p.strategy,
    })),
  };
}

export function handlePresetShow(input: Record<string, unknown>): Record<string, unknown> {
  const presetId = (input.presetId as string) ?? "";
  const preset = PRESETS.find((p) => p.id === presetId);

  if (!preset) {
    const available = PRESETS.map((p) => p.id).join(", ");
    throw new Error(`Preset not found: "${presetId}". Available: ${available}`);
  }

  return {
    status: "completed",
    summary: `Preset: ${preset.name}`,
    artifacts: [],
    preset,
  };
}
