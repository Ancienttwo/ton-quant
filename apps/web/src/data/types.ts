// Browser-safe TypeScript interfaces mirroring @tonquant/core Zod schemas.
// No Zod dependency — pure types only.

export type FactorCategory =
  | "momentum"
  | "value"
  | "volatility"
  | "liquidity"
  | "sentiment"
  | "custom";

export type FactorSourceType = "indicator" | "liquidity" | "derived";

export type FactorVisibility = "free" | "preview" | "paid";

export interface FactorParameterEntry {
  readonly name: string;
  readonly description: string;
  readonly defaultValue?: string | number | boolean | null;
}

export interface FactorBacktestSummary {
  readonly sharpe: number;
  readonly maxDrawdown: number;
  readonly winRate: number;
  readonly cagr: number;
  readonly dataRange: {
    readonly start: string;
    readonly end: string;
  };
  readonly tradeCount: number;
}

export interface FactorMetaPublic {
  readonly id: string;
  readonly name: string;
  readonly author: string;
  readonly category: FactorCategory;
  readonly source: FactorSourceType;
  readonly assets: readonly string[];
  readonly timeframe: string;
  readonly description: string;
  readonly parameters: readonly FactorParameterEntry[];
  readonly backtest: FactorBacktestSummary;
  readonly visibility: FactorVisibility;
  readonly version: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface EquityCurvePoint {
  readonly time: string;
  readonly value: number;
}
