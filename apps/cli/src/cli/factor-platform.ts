import { writeFileSync } from "node:fs";
import { buildPreparedPlatformAction, buildPublishManifest, getFactorDetail } from "@tonquant/core";
import type { Command } from "commander";
import {
  createSigningSession,
  fetchPublicationStatus,
  loadPreparedAction,
  resolveAudience,
  resolveNetwork,
  resolvePlatformUrl,
} from "../automation/platform-client.js";
import {
  formatPlatformPrepared,
  formatPlatformPublicationStatus,
  formatPlatformSigningSession,
} from "../utils/format-platform.js";
import { handleCommand } from "../utils/output.js";

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
          createSigningSession({
            platformUrl: resolvePlatformUrl(opts.platformUrl),
            body: loadPreparedAction(opts.preparedFile),
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
          fetchPublicationStatus({
            platformUrl: resolvePlatformUrl(opts.platformUrl),
            publicationId,
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
          createSigningSession({
            platformUrl: resolvePlatformUrl(opts.platformUrl),
            body: {
              action: "set_payout_address",
              factorSlug,
              publisherAddress: opts.publisherAddress,
              payoutAddress: opts.payoutAddress,
              network: resolveNetwork(testnet),
              audience: resolveAudience(opts.audience),
            },
          }),
        formatPlatformSigningSession,
      );
    });
}
