import { randomUUID } from "node:crypto";
import {
  createQuantArtifactDir,
  listArtifacts,
  normalizeArtifacts,
  writeArtifactJson,
  writeArtifactText,
} from "../runner/artifact-manager.js";
import { QuantCliError, type RunQuantCliOptions, runQuantCli } from "../runner/cli-runner.js";
import type { QuantSpawnImpl } from "../runner/spawn.js";
import type { ArtifactRef, QuantArtifactDomain } from "../types/base.js";

export interface RunQuantApiOptions {
  timeoutMs?: number;
  cliCommand?: string[];
  spawnImpl?: QuantSpawnImpl;
}

function extractStderr(error: unknown): string[] {
  if (error instanceof QuantCliError && error.stderr.trim()) {
    return error.stderr.trim().split("\n").filter(Boolean);
  }
  if (error instanceof Error) return [error.message];
  return [String(error)];
}

function logContent(error: unknown): string {
  if (error instanceof QuantCliError && error.stderr.trim()) {
    return error.stderr;
  }
  return extractStderr(error).join("\n");
}

function mergeArtifacts(artifactDir: string, artifacts: ArtifactRef[]): ArtifactRef[] {
  const normalized = normalizeArtifacts(artifactDir, artifacts);
  const discovered = listArtifacts(artifactDir);
  const byPath = new Map<string, ArtifactRef>();
  for (const artifact of [...normalized, ...discovered]) {
    byPath.set(artifact.path, artifact);
  }
  return [...byPath.values()];
}

export function createRunContext(
  domain: QuantArtifactDomain,
  outputDir?: string,
): { artifactDir: string; runId: string } {
  const runId = randomUUID();
  const artifactDir = createQuantArtifactDir(domain, runId, outputDir);
  return { artifactDir, runId };
}

export async function invokeQuantCli<T>(
  domain: QuantArtifactDomain,
  subcommand: string[],
  publicRequest: Record<string, unknown>,
  cliPayload: Record<string, unknown>,
  parseResult: (raw: unknown) => T & { artifacts: ArtifactRef[] },
  options?: RunQuantApiOptions,
): Promise<T> {
  const outputDir =
    typeof publicRequest.outputDir === "string" ? publicRequest.outputDir : undefined;
  const { artifactDir, runId } = createRunContext(domain, outputDir);
  const payload = {
    ...cliPayload,
    runId,
    outputDir: artifactDir,
  };

  writeArtifactJson(artifactDir, "request.json", payload);

  try {
    const result = await runQuantCli({
      subcommand,
      input: payload,
      timeoutMs: options?.timeoutMs,
      cliCommand: options?.cliCommand,
      spawnImpl: options?.spawnImpl,
    } satisfies RunQuantCliOptions);
    writeArtifactText(artifactDir, "run.log", result.stderr);
    let rawJson: unknown;
    try {
      rawJson = JSON.parse(result.stdout);
    } catch {
      const preview = result.stdout.slice(0, 200);
      throw new QuantCliError(`Quant CLI returned invalid JSON. stdout preview: ${preview}`, {
        command: subcommand,
        stderr: result.stderr,
      });
    }
    const parsed = parseResult(rawJson);
    const artifacts = mergeArtifacts(artifactDir, parsed.artifacts);
    const finalResult = {
      ...parsed,
      runId,
      artifacts,
    };
    writeArtifactJson(artifactDir, "result.json", finalResult);
    return finalResult;
  } catch (error) {
    writeArtifactText(artifactDir, "run.log", logContent(error));
    writeArtifactJson(artifactDir, "result.json", {
      runId,
      status: "failed",
      summary: error instanceof Error ? error.message : "Quant CLI invocation failed",
      artifacts: listArtifacts(artifactDir),
      errors: extractStderr(error),
    });
    throw error;
  }
}
