import {
  type QuantAutoresearchInitRequest,
  QuantAutoresearchInitRequestSchema,
  type QuantAutoresearchListRequest,
  QuantAutoresearchListRequestSchema,
  type QuantAutoresearchListResult,
  QuantAutoresearchListResultSchema,
  type QuantAutoresearchPromoteRequest,
  QuantAutoresearchPromoteRequestSchema,
  type QuantAutoresearchRejectRequest,
  QuantAutoresearchRejectRequestSchema,
  type QuantAutoresearchRunRequest,
  QuantAutoresearchRunRequestSchema,
  type QuantAutoresearchStatusRequest,
  QuantAutoresearchStatusRequestSchema,
  type QuantAutoresearchTrackResult,
  QuantAutoresearchTrackResultSchema,
} from "../types/index.js";
import { invokeQuantCli, type RunQuantApiOptions } from "./shared.js";

export async function initAutoresearchTrack(
  request: QuantAutoresearchInitRequest,
  options?: RunQuantApiOptions,
): Promise<QuantAutoresearchTrackResult> {
  const parsed = QuantAutoresearchInitRequestSchema.parse(request);
  return invokeQuantCli(
    "autoresearch",
    ["autoresearch", "init"],
    parsed,
    parsed,
    (raw) => QuantAutoresearchTrackResultSchema.parse(raw),
    options,
  );
}

export async function runAutoresearchTrack(
  request: QuantAutoresearchRunRequest,
  options?: RunQuantApiOptions,
): Promise<QuantAutoresearchTrackResult> {
  const parsed = QuantAutoresearchRunRequestSchema.parse(request);
  return invokeQuantCli(
    "autoresearch-runs",
    ["autoresearch", "run"],
    parsed,
    parsed,
    (raw) => QuantAutoresearchTrackResultSchema.parse(raw),
    options,
  );
}

export async function getAutoresearchTrack(
  request: QuantAutoresearchStatusRequest,
  options?: RunQuantApiOptions,
): Promise<QuantAutoresearchTrackResult> {
  const parsed = QuantAutoresearchStatusRequestSchema.parse(request);
  return invokeQuantCli(
    "autoresearch",
    ["autoresearch", "status"],
    parsed,
    parsed,
    (raw) => QuantAutoresearchTrackResultSchema.parse(raw),
    options,
  );
}

export async function listAutoresearchTracks(
  request: QuantAutoresearchListRequest = {},
  options?: RunQuantApiOptions,
): Promise<QuantAutoresearchListResult> {
  const parsed = QuantAutoresearchListRequestSchema.parse(request);
  return invokeQuantCli(
    "autoresearch",
    ["autoresearch", "list"],
    parsed,
    parsed,
    (raw) => QuantAutoresearchListResultSchema.parse(raw),
    options,
  );
}

export async function promoteAutoresearchCandidate(
  request: QuantAutoresearchPromoteRequest,
  options?: RunQuantApiOptions,
): Promise<QuantAutoresearchTrackResult> {
  const parsed = QuantAutoresearchPromoteRequestSchema.parse(request);
  return invokeQuantCli(
    "autoresearch",
    ["autoresearch", "promote"],
    parsed,
    parsed,
    (raw) => QuantAutoresearchTrackResultSchema.parse(raw),
    options,
  );
}

export async function rejectAutoresearchCandidate(
  request: QuantAutoresearchRejectRequest,
  options?: RunQuantApiOptions,
): Promise<QuantAutoresearchTrackResult> {
  const parsed = QuantAutoresearchRejectRequestSchema.parse(request);
  return invokeQuantCli(
    "autoresearch",
    ["autoresearch", "reject"],
    parsed,
    parsed,
    (raw) => QuantAutoresearchTrackResultSchema.parse(raw),
    options,
  );
}
