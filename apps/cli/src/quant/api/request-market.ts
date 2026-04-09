import { defaultProviderFor, resolveInstruments } from "../market/index.js";
import type {
  AssetClass,
  InstrumentRef,
  MarketRegion,
  ProviderCode,
  VenueCode,
} from "../types/base.js";

type InstrumentSelectionRequest = {
  readonly assetClass?: AssetClass;
  readonly marketRegion?: MarketRegion;
  readonly venue?: VenueCode;
  readonly provider?: ProviderCode;
  readonly symbols?: readonly string[];
  readonly instruments?: readonly InstrumentRef[];
};

type InstrumentSelectionResult = InstrumentSelectionRequest & {
  readonly assetClass: AssetClass;
  readonly marketRegion: MarketRegion;
  readonly provider: ProviderCode;
  readonly symbols: readonly string[];
  readonly instruments: readonly InstrumentRef[];
};

export function withResolvedInstruments<T extends InstrumentSelectionRequest>(
  request: T,
): T & InstrumentSelectionResult {
  const assetClass = request.assetClass ?? "crypto";
  const marketRegion = request.marketRegion ?? "ton";
  const provider = request.provider ?? defaultProviderFor(assetClass, marketRegion);
  const hasInstruments = (request.instruments?.length ?? 0) > 0;
  const hasSymbols = (request.symbols?.length ?? 0) > 0;
  const instruments = hasInstruments
    ? [...(request.instruments ?? [])]
    : hasSymbols
      ? resolveInstruments({
          symbols: request.symbols ?? [],
          assetClass,
          marketRegion,
          venue: request.venue,
          provider,
        })
      : [];
  const symbols = hasSymbols
    ? [...(request.symbols ?? [])]
    : instruments.map((instrument) => instrument.displaySymbol);

  return {
    ...request,
    assetClass,
    marketRegion,
    provider,
    symbols,
    instruments,
  };
}
