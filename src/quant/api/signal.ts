import {
  type SignalEvaluateRequest,
  SignalEvaluateRequestSchema,
  type SignalEvaluateResult,
  SignalEvaluateResultSchema,
  type SignalListRequest,
  SignalListRequestSchema,
  type SignalListResult,
  SignalListResultSchema,
} from "../types/index.js";
import { invokeQuantCli, type RunQuantApiOptions } from "./shared.js";

export async function runSignalList(
  request: SignalListRequest = {},
  options?: RunQuantApiOptions,
): Promise<SignalListResult> {
  const parsed = SignalListRequestSchema.parse(request);
  return invokeQuantCli(
    "signals",
    ["signal", "list"],
    parsed,
    parsed,
    (raw) => SignalListResultSchema.parse(raw),
    options,
  );
}

export async function runSignalEvaluate(
  request: SignalEvaluateRequest,
  options?: RunQuantApiOptions,
): Promise<SignalEvaluateResult> {
  const parsed = SignalEvaluateRequestSchema.parse(request);
  return invokeQuantCli(
    "signals",
    ["signal", "evaluate"],
    parsed,
    parsed,
    (raw) => SignalEvaluateResultSchema.parse(raw),
    options,
  );
}
