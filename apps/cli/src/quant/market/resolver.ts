import { ServiceError } from "@tonquant/core";
import {
  type AssetClass,
  type CalendarId,
  type InstrumentRef,
  InstrumentRefSchema,
  type MarketRegion,
  type ProviderCode,
  type VenueCode,
} from "../types/base.js";

interface MarketDefaults {
  readonly quoteCurrency: string;
  readonly timezone: string;
  readonly calendarId: CalendarId;
  readonly defaultVenue: VenueCode;
  readonly defaultProvider: ProviderCode;
}

const CRYPTO_MARKET_DEFAULTS: Record<MarketRegion, MarketDefaults | undefined> = {
  ton: {
    quoteCurrency: "USD",
    timezone: "UTC",
    calendarId: "24-7",
    defaultVenue: "stonfi",
    defaultProvider: "stonfi",
  },
  us: undefined,
  hk: undefined,
  cn: undefined,
};

const EQUITY_MARKET_DEFAULTS: Record<MarketRegion, MarketDefaults | undefined> = {
  ton: undefined,
  us: {
    quoteCurrency: "USD",
    timezone: "America/New_York",
    calendarId: "XNYS",
    defaultVenue: "nyse",
    defaultProvider: "yfinance",
  },
  hk: {
    quoteCurrency: "HKD",
    timezone: "Asia/Hong_Kong",
    calendarId: "XHKG",
    defaultVenue: "hkex",
    defaultProvider: "openbb",
  },
  cn: {
    quoteCurrency: "CNY",
    timezone: "Asia/Shanghai",
    calendarId: "XSHG",
    defaultVenue: "sse",
    defaultProvider: "openbb",
  },
};

const BOND_MARKET_DEFAULTS: Record<MarketRegion, MarketDefaults | undefined> = {
  ton: undefined,
  us: undefined,
  hk: undefined,
  cn: {
    quoteCurrency: "CNY",
    timezone: "Asia/Shanghai",
    calendarId: "CIBM",
    defaultVenue: "cibm",
    defaultProvider: "openbb",
  },
};

function marketDefaultsFor(assetClass: AssetClass, marketRegion: MarketRegion): MarketDefaults {
  const defaults =
    assetClass === "crypto"
      ? CRYPTO_MARKET_DEFAULTS[marketRegion]
      : assetClass === "equity"
        ? EQUITY_MARKET_DEFAULTS[marketRegion]
        : BOND_MARKET_DEFAULTS[marketRegion];
  if (!defaults) {
    throw new ServiceError(
      `Unsupported market combination: ${assetClass}/${marketRegion}`,
      "QUANT_MARKET_COMBINATION_UNSUPPORTED",
    );
  }
  return defaults;
}

function defaultVenueFor(assetClass: AssetClass, marketRegion: MarketRegion): VenueCode {
  return marketDefaultsFor(assetClass, marketRegion).defaultVenue;
}

export function defaultProviderFor(
  assetClass: AssetClass,
  marketRegion: MarketRegion,
): ProviderCode {
  return marketDefaultsFor(assetClass, marketRegion).defaultProvider;
}

function assertVenueAllowed(
  assetClass: AssetClass,
  marketRegion: MarketRegion,
  venue: VenueCode,
): void {
  if (assetClass === "crypto" && !(marketRegion === "ton" && venue === "stonfi")) {
    throw new ServiceError(
      `Unsupported crypto venue '${venue}' for market '${marketRegion}'.`,
      "QUANT_MARKET_COMBINATION_UNSUPPORTED",
    );
  }
  if (
    assetClass === "equity" &&
    !(
      (marketRegion === "us" && (venue === "nyse" || venue === "nasdaq")) ||
      (marketRegion === "hk" && venue === "hkex") ||
      (marketRegion === "cn" && (venue === "sse" || venue === "szse"))
    )
  ) {
    throw new ServiceError(
      `Unsupported equity venue '${venue}' for market '${marketRegion}'.`,
      "QUANT_MARKET_COMBINATION_UNSUPPORTED",
    );
  }
  if (assetClass === "bond" && !(marketRegion === "cn" && venue === "cibm")) {
    throw new ServiceError(
      `Unsupported bond venue '${venue}' for market '${marketRegion}'.`,
      "QUANT_MARKET_COMBINATION_UNSUPPORTED",
    );
  }
}

function normalizeSymbolForProvider(
  symbol: string,
  assetClass: AssetClass,
  marketRegion: MarketRegion,
  venue: VenueCode,
  provider: ProviderCode,
): string {
  const trimmed = symbol.trim().toUpperCase();
  if (provider === "synthetic") return trimmed;
  if (assetClass === "crypto" && marketRegion === "ton") {
    if (provider === "stonfi" || provider === "tonapi") return trimmed;
    return trimmed.replace(/\//g, "-");
  }
  if (assetClass === "equity" && marketRegion === "us") {
    return trimmed;
  }
  if (assetClass === "equity" && marketRegion === "hk") {
    return /^\d+$/.test(trimmed) ? `${trimmed.padStart(4, "0")}.HK` : trimmed;
  }
  if (assetClass === "equity" && marketRegion === "cn") {
    if (!/^\d{6}$/.test(trimmed)) return trimmed;
    return venue === "sse" ? `${trimmed}.SS` : `${trimmed}.SZ`;
  }
  return trimmed;
}

export interface ResolveInstrumentInput {
  readonly symbol: string;
  readonly assetClass: AssetClass;
  readonly marketRegion: MarketRegion;
  readonly venue?: VenueCode;
  readonly provider?: ProviderCode;
}

export function resolveInstrument(input: ResolveInstrumentInput): InstrumentRef {
  const defaults = marketDefaultsFor(input.assetClass, input.marketRegion);
  const venue = input.venue ?? defaultVenueFor(input.assetClass, input.marketRegion);
  assertVenueAllowed(input.assetClass, input.marketRegion, venue);
  const provider = input.provider ?? defaults.defaultProvider;
  const displaySymbol = input.symbol.trim().toUpperCase();

  return InstrumentRefSchema.parse({
    id: [
      input.assetClass,
      input.marketRegion,
      venue,
      displaySymbol.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    ].join(":"),
    assetClass: input.assetClass,
    marketRegion: input.marketRegion,
    venue,
    displaySymbol,
    providerSymbols: {
      synthetic: normalizeSymbolForProvider(
        displaySymbol,
        input.assetClass,
        input.marketRegion,
        venue,
        "synthetic",
      ),
      [provider]: normalizeSymbolForProvider(
        displaySymbol,
        input.assetClass,
        input.marketRegion,
        venue,
        provider,
      ),
    },
    quoteCurrency: defaults.quoteCurrency,
    timezone: defaults.timezone,
    calendarId: defaults.calendarId,
  });
}

export interface ResolveInstrumentsInput {
  readonly symbols: readonly string[];
  readonly assetClass: AssetClass;
  readonly marketRegion: MarketRegion;
  readonly venue?: VenueCode;
  readonly provider?: ProviderCode;
}

export function resolveInstruments(input: ResolveInstrumentsInput): InstrumentRef[] {
  return input.symbols.map((symbol) =>
    resolveInstrument({
      symbol,
      assetClass: input.assetClass,
      marketRegion: input.marketRegion,
      venue: input.venue,
      provider: input.provider,
    }),
  );
}
