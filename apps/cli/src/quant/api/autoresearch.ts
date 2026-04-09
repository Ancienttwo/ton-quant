import {
  getTrack,
  initTrack,
  listTracks,
  promoteCandidate,
  rejectCandidate,
  runTrack,
} from "../autoresearch/index.js";
import {
  type QuantAutoresearchInitRequest,
  QuantAutoresearchInitRequestSchema,
  type QuantAutoresearchListRequest,
  QuantAutoresearchListRequestSchema,
  type QuantAutoresearchListResult,
  type QuantAutoresearchPromoteRequest,
  QuantAutoresearchPromoteRequestSchema,
  type QuantAutoresearchRejectRequest,
  QuantAutoresearchRejectRequestSchema,
  type QuantAutoresearchRunRequest,
  QuantAutoresearchRunRequestSchema,
  type QuantAutoresearchStatusRequest,
  QuantAutoresearchStatusRequestSchema,
  type QuantAutoresearchTrackResult,
} from "../types/index.js";
import type { RunQuantApiOptions } from "./shared.js";

export async function initAutoresearchTrack(
  request: QuantAutoresearchInitRequest,
  _options?: RunQuantApiOptions,
): Promise<QuantAutoresearchTrackResult> {
  const parsed = QuantAutoresearchInitRequestSchema.parse(request);
  return initTrack(parsed);
}

export async function runAutoresearchTrack(
  request: QuantAutoresearchRunRequest,
  _options?: RunQuantApiOptions,
): Promise<QuantAutoresearchTrackResult> {
  const parsed = QuantAutoresearchRunRequestSchema.parse(request);
  return runTrack(parsed);
}

export async function getAutoresearchTrack(
  request: QuantAutoresearchStatusRequest,
  _options?: RunQuantApiOptions,
): Promise<QuantAutoresearchTrackResult> {
  const parsed = QuantAutoresearchStatusRequestSchema.parse(request);
  return getTrack(parsed);
}

export async function listAutoresearchTracks(
  request: QuantAutoresearchListRequest = {},
  _options?: RunQuantApiOptions,
): Promise<QuantAutoresearchListResult> {
  const parsed = QuantAutoresearchListRequestSchema.parse(request);
  return listTracks(parsed);
}

export async function promoteAutoresearchCandidate(
  request: QuantAutoresearchPromoteRequest,
  _options?: RunQuantApiOptions,
): Promise<QuantAutoresearchTrackResult> {
  const parsed = QuantAutoresearchPromoteRequestSchema.parse(request);
  return promoteCandidate(parsed);
}

export async function rejectAutoresearchCandidate(
  request: QuantAutoresearchRejectRequest,
  _options?: RunQuantApiOptions,
): Promise<QuantAutoresearchTrackResult> {
  const parsed = QuantAutoresearchRejectRequestSchema.parse(request);
  return rejectCandidate(parsed);
}
