import {
  type FactorComputeRequest,
  FactorComputeRequestSchema,
  type FactorComputeResult,
  FactorComputeResultSchema,
  type FactorListRequest,
  FactorListRequestSchema,
  type FactorListResult,
  FactorListResultSchema,
} from "../types/index.js";
import { invokeQuantCli, type RunQuantApiOptions } from "./shared.js";

export async function runFactorList(
  request: FactorListRequest = {},
  options?: RunQuantApiOptions,
): Promise<FactorListResult> {
  const parsed = FactorListRequestSchema.parse(request);
  return invokeQuantCli(
    "factors",
    ["factor", "list"],
    parsed,
    parsed,
    (raw) => FactorListResultSchema.parse(raw),
    options,
  );
}

export async function runFactorCompute(
  request: FactorComputeRequest,
  options?: RunQuantApiOptions,
): Promise<FactorComputeResult> {
  const parsed = FactorComputeRequestSchema.parse(request);
  return invokeQuantCli(
    "factors",
    ["factor", "compute"],
    parsed,
    parsed,
    (raw) => FactorComputeResultSchema.parse(raw),
    options,
  );
}
