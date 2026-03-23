import {
  type DataFetchRequest,
  DataFetchRequestSchema,
  type DataFetchResult,
  DataFetchResultSchema,
  type DataInfoRequest,
  DataInfoRequestSchema,
  type DataInfoResult,
  DataInfoResultSchema,
  type DataListRequest,
  DataListRequestSchema,
  type DataListResult,
  DataListResultSchema,
} from "../types/index.js";
import { invokeQuantCli, type RunQuantApiOptions } from "./shared.js";

export async function runDataFetch(
  request: DataFetchRequest,
  options?: RunQuantApiOptions,
): Promise<DataFetchResult> {
  const parsed = DataFetchRequestSchema.parse(request);
  return invokeQuantCli(
    "data-fetch",
    ["data", "fetch"],
    parsed,
    parsed,
    (raw) => DataFetchResultSchema.parse(raw),
    options,
  );
}

export async function runDataList(
  request: DataListRequest = {},
  options?: RunQuantApiOptions,
): Promise<DataListResult> {
  const parsed = DataListRequestSchema.parse(request);
  return invokeQuantCli(
    "data-fetch",
    ["data", "list"],
    parsed,
    parsed,
    (raw) => DataListResultSchema.parse(raw),
    options,
  );
}

export async function runDataInfo(
  request: DataInfoRequest,
  options?: RunQuantApiOptions,
): Promise<DataInfoResult> {
  const parsed = DataInfoRequestSchema.parse(request);
  return invokeQuantCli(
    "data-fetch",
    ["data", "info"],
    parsed,
    parsed,
    (raw) => DataInfoResultSchema.parse(raw),
    options,
  );
}
