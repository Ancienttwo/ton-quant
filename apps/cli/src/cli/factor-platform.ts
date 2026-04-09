import { readFileSync, writeFileSync } from "node:fs";
import {
  buildPreparedPlatformAction,
  buildPublishManifest,
  getFactorDetail,
  type PreparedPlatformAction,
  PreparedPlatformActionSchema,
  PublicationStatusResponseSchema,
  SigningSessionSchema,
} from "@tonquant/core";
import type { Command } from "commander";
import { z } from "zod";
import {
  formatPlatformPrepared,
  formatPlatformPublicationStatus,
  formatPlatformSigningSession,
} from "../utils/format-platform.js";
import { CliCommandError, handleCommand } from "../utils/output.js";

const PlatformEnvelopeSchema = <T extends z.ZodTypeAny>(schema: T) =>
  z.object({
    status: z.literal("ok"),
    data: schema,
  });

const PlatformErrorEnvelopeSchema = z.object({
  status: z.literal("error"),
  error: z.string(),
  code: z.string(),
});

async function platformRequest<T extends z.ZodTypeAny>(params: {
  platformUrl: string;
  path: string;
  method?: "GET" | "POST";
  body?: unknown;
  schema: T;
}): Promise<z.output<T>> {
  const response = await fetch(`${params.platformUrl.replace(/\/$/u, "")}${params.path}`, {
    method: params.method ?? "GET",
    headers: params.body ? { "content-type": "application/json" } : undefined,
    body: params.body ? JSON.stringify(params.body) : undefined,
  });

  const payload = await response.json();
  if (response.ok) {
    return PlatformEnvelopeSchema(params.schema).parse(payload).data;
  }

  const parsedError = PlatformErrorEnvelopeSchema.safeParse(payload);
  if (parsedError.success) {
    throw new CliCommandError(parsedError.data.error, parsedError.data.code);
  }

  throw new CliCommandError("Platform API returned an invalid response.", "PLATFORM_HTTP_INVALID");
}

function resolveAudience(explicit?: string): string {
  return (
    explicit ??
    process.env.TONQUANT_PLATFORM_AUDIENCE ??
    process.env.TONQUANT_PLATFORM_SIGNER_ORIGIN ??
    "http://localhost:5173"
  );
}

function resolvePlatformUrl(explicit?: string): string {
  return explicit ?? process.env.TONQUANT_PLATFORM_URL ?? "http://localhost:3001";
}

function resolveNetwork(testnetEnabled: boolean): "mainnet" | "testnet" {
  return testnetEnabled ? "testnet" : "mainnet";
}

function loadPreparedAction(path: string): PreparedPlatformAction {
  const raw = JSON.parse(readFileSync(path, "utf-8"));
  const prepared = PreparedPlatformActionSchema.safeParse(raw.prepared ?? raw);
  if (!prepared.success) {
    throw new CliCommandError("Prepared publish file is invalid.", "PLATFORM_PREPARED_INVALID");
  }
  return prepared.data;
}

interface PublishPrepareOptions {
  publisherAddress: string;
  payoutAddress?: string;
  action?: "publish_factor" | "update_factor";
  audience?: string;
  output?: string;
}

interface PublishSubmitOptions {
  platformUrl?: string;
  preparedFile: string;
}

interface PublishStatusOptions {
  platformUrl?: string;
}

interface PayoutSetOptions {
  platformUrl?: string;
  publisherAddress: string;
  payoutAddress: string;
  audience?: string;
}

export function registerFactorPlatformCommands(factor: Command): void {
  factor
    .command("publish-prepare <factorId>")
    .description("Prepare a local factor for platform publication")
    .requiredOption(
      "--publisher-address <address>",
      "Owning TON wallet address in raw or friendly format",
    )
    .option(
      "--payout-address <address>",
      "Future payout TON wallet address; defaults to publisher address",
    )
    .option("--action <action>", "publish_factor or update_factor", "publish_factor")
    .option("--audience <url>", "Signer page origin; defaults to env or http://localhost:5173")
    .option("--output <path>", "Write the prepared payload to a file")
    .action(async (factorId: string, opts: PublishPrepareOptions) => {
      const json = factor.parent?.opts().json ?? false;
      const testnet = factor.parent?.opts().testnet ?? false;
      await handleCommand(
        { json },
        async () => {
          const detail = getFactorDetail(factorId);
          const manifest = buildPublishManifest(detail);
          const prepared = buildPreparedPlatformAction({
            action: opts.action ?? "publish_factor",
            factorSlug: manifest.factorSlug,
            factorVersion: manifest.factorVersion,
            publisherAddress: opts.publisherAddress,
            payoutAddress: opts.payoutAddress ?? opts.publisherAddress,
            network: resolveNetwork(testnet),
            audience: resolveAudience(opts.audience),
            manifest,
          });

          if (opts.output) {
            writeFileSync(opts.output, `${JSON.stringify(prepared, null, 2)}\n`, "utf-8");
          }

          return { prepared, outputPath: opts.output };
        },
        formatPlatformPrepared,
      );
    });

  factor
    .command("publish-submit")
    .description("Submit a prepared platform publish action and create a wallet signing session")
    .requiredOption("--prepared-file <path>", "JSON file produced by publish-prepare")
    .option("--platform-url <url>", "Platform API origin; defaults to env or http://localhost:3001")
    .action(async (opts: PublishSubmitOptions) => {
      const json = factor.parent?.opts().json ?? false;
      await handleCommand(
        { json },
        async () =>
          platformRequest({
            platformUrl: resolvePlatformUrl(opts.platformUrl),
            path: "/v1/wallet/nonce",
            method: "POST",
            body: loadPreparedAction(opts.preparedFile),
            schema: SigningSessionSchema,
          }),
        formatPlatformSigningSession,
      );
    });

  factor
    .command("publish-status <publicationId>")
    .description("Check the platform review status for a publication")
    .option("--platform-url <url>", "Platform API origin; defaults to env or http://localhost:3001")
    .action(async (publicationId: string, opts: PublishStatusOptions) => {
      const json = factor.parent?.opts().json ?? false;
      await handleCommand(
        { json },
        async () =>
          platformRequest({
            platformUrl: resolvePlatformUrl(opts.platformUrl),
            path: `/v1/publications/${publicationId}`,
            schema: PublicationStatusResponseSchema,
          }),
        formatPlatformPublicationStatus,
      );
    });

  factor
    .command("payout-set <factorSlug>")
    .description("Create a payout-address signing session for a published factor")
    .requiredOption("--publisher-address <address>", "Owning TON wallet address")
    .requiredOption("--payout-address <address>", "New payout TON wallet address")
    .option("--audience <url>", "Signer page origin; defaults to env or http://localhost:5173")
    .option("--platform-url <url>", "Platform API origin; defaults to env or http://localhost:3001")
    .action(async (factorSlug: string, opts: PayoutSetOptions) => {
      const json = factor.parent?.opts().json ?? false;
      const testnet = factor.parent?.opts().testnet ?? false;
      await handleCommand(
        { json },
        async () =>
          platformRequest({
            platformUrl: resolvePlatformUrl(opts.platformUrl),
            path: "/v1/wallet/nonce",
            method: "POST",
            body: {
              action: "set_payout_address",
              factorSlug,
              publisherAddress: opts.publisherAddress,
              payoutAddress: opts.payoutAddress,
              network: resolveNetwork(testnet),
              audience: resolveAudience(opts.audience),
            },
            schema: SigningSessionSchema,
          }),
        formatPlatformSigningSession,
      );
    });
}
