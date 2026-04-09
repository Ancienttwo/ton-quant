import { describe, expect, test } from "bun:test";
import { ServiceError } from "@tonquant/core";
import { withResolvedInstruments } from "../../../src/quant/api/request-market";

describe("request-market", () => {
  test("rejects crypto requests for yfinance during instrument resolution", () => {
    try {
      withResolvedInstruments({
        symbols: ["TON/USDT"],
        assetClass: "crypto",
        marketRegion: "ton",
        provider: "yfinance",
      });
      throw new Error("Expected yfinance crypto resolution to throw.");
    } catch (error) {
      expect(error).toBeInstanceOf(ServiceError);
      expect((error as ServiceError).code).toBe("QUANT_PROVIDER_UNSUPPORTED");
      expect((error as Error).message).toBe(
        "Unsupported provider 'yfinance' for market 'crypto/ton'.",
      );
    }
  });
});
