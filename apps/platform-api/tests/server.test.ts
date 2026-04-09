import { afterEach, describe, expect, test } from "bun:test";
import { Buffer } from "node:buffer";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { keyPairFromSeed, sha256_sync, sign } from "@ton/crypto";
import { WalletContractV5R1 } from "@ton/ton";
import type { FactorRegistryEntry } from "@tonquant/core";
import { buildPublishManifest } from "@tonquant/core";
import { createPlatformApiServer } from "../src/server.js";

const INTERNAL_TOKEN = "internal-token";
let eventLogSequence = 0;

const factorEntry: FactorRegistryEntry = {
  public: {
    id: "ton_signal_alpha",
    name: "TON Signal Alpha",
    author: "test",
    category: "momentum",
    source: "indicator",
    assets: ["TON"],
    timeframe: "1d",
    description: "Alpha signal",
    parameters: [],
    backtest: {
      sharpe: 2.1,
      maxDrawdown: -0.12,
      winRate: 0.61,
      cagr: 0.31,
      dataRange: {
        start: "2026-01-01",
        end: "2026-04-01",
      },
      tradeCount: 58,
    },
    visibility: "free",
    version: "1.0.0",
    createdAt: "2026-03-01T00:00:00.000Z",
    updatedAt: "2026-04-09T00:00:00.000Z",
  },
  private: {
    parameterValues: {
      window: 20,
    },
  },
};

function tonConnectTextMessage(params: {
  address: string;
  domain: string;
  timestamp: number;
  text: string;
}): Buffer {
  const [workchainPart, hashPart] = params.address.split(":");
  const workchain = Buffer.alloc(4);
  workchain.writeInt32BE(Number(workchainPart), 0);
  const hash = Buffer.from(hashPart ?? "", "hex");
  const domain = Buffer.from(params.domain, "utf-8");
  const domainLength = Buffer.alloc(4);
  domainLength.writeUInt32BE(domain.length, 0);
  const timestamp = Buffer.alloc(8);
  timestamp.writeBigUInt64BE(BigInt(params.timestamp), 0);
  const payload = Buffer.from(params.text, "utf-8");
  const payloadLength = Buffer.alloc(4);
  payloadLength.writeUInt32BE(payload.length, 0);

  return Buffer.concat([
    Buffer.from([0xff, 0xff]),
    Buffer.from("ton-connect/sign-data/", "utf-8"),
    workchain,
    hash,
    domainLength,
    domain,
    timestamp,
    Buffer.from("txt", "utf-8"),
    payloadLength,
    payload,
  ]);
}

function makeSignedResult(params: {
  address: string;
  publicSeedByte: number;
  domain: string;
  text: string;
  timestampIso: string;
}) {
  const keyPair = keyPairFromSeed(Buffer.alloc(32, params.publicSeedByte));
  const timestamp = Math.floor(new Date(params.timestampIso).getTime() / 1000);
  const message = tonConnectTextMessage({
    address: params.address,
    domain: params.domain,
    timestamp,
    text: params.text,
  });
  const signature = sign(sha256_sync(message), keyPair.secretKey).toString("base64");

  return {
    publicKeyHex: keyPair.publicKey.toString("hex"),
    signedResult: {
      signature,
      address: params.address,
      timestamp,
      domain: params.domain,
      payload: {
        type: "text" as const,
        text: params.text,
        network: "-239" as const,
        from: params.address,
      },
    },
  };
}

async function readData<T>(response: Response): Promise<T> {
  const parsed = (await response.json()) as { status: string; data: T };
  return parsed.data;
}

function internalHeaders(): Record<string, string> {
  return {
    "content-type": "application/json",
    authorization: `Bearer ${INTERNAL_TOKEN}`,
  };
}

async function submitPublication(params: {
  app: ReturnType<typeof createPlatformApiServer>;
  manifest: ReturnType<typeof buildPublishManifest>;
  walletAddress: string;
  publicSeedByte: number;
  action?: "publish_factor" | "update_factor";
}): Promise<{ publicationId: string; status: string }> {
  const sessionResponse = await params.app.fetch(
    new Request("http://platform.test/v1/wallet/nonce", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: params.action ?? "publish_factor",
        factorSlug: params.manifest.factorSlug,
        factorVersion: params.manifest.factorVersion,
        publisherAddress: params.walletAddress,
        payoutAddress: params.walletAddress,
        network: "mainnet",
        audience: "https://publish.tonquant.test",
        manifest: params.manifest,
      }),
    }),
  );
  const session = await readData<{
    sessionId: string;
    intentText: string;
    createdAt: string;
  }>(sessionResponse);
  const signed = makeSignedResult({
    address: params.walletAddress,
    publicSeedByte: params.publicSeedByte,
    domain: "publish.tonquant.test",
    text: session.intentText,
    timestampIso: new Date(new Date(session.createdAt).getTime() + 30_000).toISOString(),
  });

  const path =
    params.action === "update_factor"
      ? `/v1/factors/${params.manifest.factorSlug}/update`
      : "/v1/factors/publish";
  const publishResponse = await params.app.fetch(
    new Request(`http://platform.test${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sessionId: session.sessionId,
        ...signed,
      }),
    }),
  );
  return readData<{ publicationId: string; status: string }>(publishResponse);
}

async function approvePublication(
  app: ReturnType<typeof createPlatformApiServer>,
  publicationId: string,
): Promise<{ status: string }> {
  const response = await app.fetch(
    new Request(`http://platform.test/v1/internal/publications/${publicationId}/review`, {
      method: "POST",
      headers: internalHeaders(),
      body: JSON.stringify({ decision: "approve" }),
    }),
  );
  return readData<{ status: string }>(response);
}

afterEach(() => {
  delete process.env.TONQUANT_PLATFORM_TON_RPC_URL;
  delete process.env.TONQUANT_PLATFORM_SETTLEMENT_MNEMONIC;
  if (process.env.TONQUANT_EVENT_LOG_PATH) {
    rmSync(process.env.TONQUANT_EVENT_LOG_PATH, { force: true });
    rmSync(`${process.env.TONQUANT_EVENT_LOG_PATH}.lock`, { force: true });
  }
  delete process.env.TONQUANT_EVENT_LOG_PATH;
  delete process.env.TONQUANT_EVENT_LOG_FAIL_APPEND;
});

describe("platform api server", () => {
  function resetEventLogPath(): void {
    delete process.env.TONQUANT_PLATFORM_TON_RPC_URL;
    delete process.env.TONQUANT_PLATFORM_SETTLEMENT_MNEMONIC;
    process.env.TONQUANT_EVENT_LOG_PATH = join(
      process.env.HOME ?? "/tmp",
      ".tonquant",
      `test-platform-events-${process.pid}-${eventLogSequence++}.jsonl`,
    );
  }

  test("publish -> review approve -> payout change -> future ledger uses new address", async () => {
    resetEventLogPath();
    const app = createPlatformApiServer({
      dbPath: ":memory:",
      publicBaseUrl: "http://platform.test",
      signerOrigin: "https://publish.tonquant.test",
      sessionTtlMs: 60_000,
      internalToken: INTERNAL_TOKEN,
    });
    const keyPair = keyPairFromSeed(Buffer.alloc(32, 11));
    const wallet = WalletContractV5R1.create({
      workchain: 0,
      publicKey: keyPair.publicKey,
    });
    const manifest = buildPublishManifest(factorEntry);

    const sessionResponse = await app.fetch(
      new Request("http://platform.test/v1/wallet/nonce", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "publish_factor",
          factorSlug: manifest.factorSlug,
          factorVersion: manifest.factorVersion,
          publisherAddress: wallet.address.toRawString(),
          payoutAddress: wallet.address.toRawString(),
          network: "mainnet",
          audience: "https://publish.tonquant.test",
          manifest,
        }),
      }),
    );
    expect(sessionResponse.status).toBe(200);
    const session = await readData<{
      sessionId: string;
      intentText: string;
      signUrl: string;
      createdAt: string;
    }>(sessionResponse);
    expect(session.signUrl).toContain("session=");
    expect(session.signUrl).not.toContain("api=");

    const signed = makeSignedResult({
      address: wallet.address.toRawString(),
      publicSeedByte: 11,
      domain: "publish.tonquant.test",
      text: session.intentText,
      timestampIso: new Date(new Date(session.createdAt).getTime() + 30_000).toISOString(),
    });

    const publishResponse = await app.fetch(
      new Request("http://platform.test/v1/factors/publish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId: session.sessionId,
          ...signed,
        }),
      }),
    );
    expect(publishResponse.status).toBe(200);
    const publication = await readData<{ publicationId: string; status: string }>(publishResponse);
    expect(publication.status).toBe("pending_review");

    const reviewResponse = await app.fetch(
      new Request(
        `http://platform.test/v1/internal/publications/${publication.publicationId}/review`,
        {
          method: "POST",
          headers: internalHeaders(),
          body: JSON.stringify({ decision: "approve" }),
        },
      ),
    );
    expect(reviewResponse.status).toBe(200);
    const reviewed = await readData<{ status: string }>(reviewResponse);
    expect(reviewed.status).toBe("active");

    const payoutWallet = WalletContractV5R1.create({
      workchain: 0,
      publicKey: keyPairFromSeed(Buffer.alloc(32, 19)).publicKey,
    });
    const payoutSessionResponse = await app.fetch(
      new Request("http://platform.test/v1/wallet/nonce", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "set_payout_address",
          factorSlug: manifest.factorSlug,
          publisherAddress: wallet.address.toRawString(),
          payoutAddress: payoutWallet.address.toRawString(),
          network: "mainnet",
          audience: "https://publish.tonquant.test",
        }),
      }),
    );
    const payoutSession = await readData<{
      sessionId: string;
      intentText: string;
      createdAt: string;
    }>(payoutSessionResponse);
    const payoutSigned = makeSignedResult({
      address: wallet.address.toRawString(),
      publicSeedByte: 11,
      domain: "publish.tonquant.test",
      text: payoutSession.intentText,
      timestampIso: new Date(new Date(payoutSession.createdAt).getTime() + 30_000).toISOString(),
    });

    const payoutResponse = await app.fetch(
      new Request(`http://platform.test/v1/factors/${manifest.factorSlug}/payout-address`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId: payoutSession.sessionId,
          ...payoutSigned,
        }),
      }),
    );
    expect(payoutResponse.status).toBe(200);
    const payoutResult = await readData<{ payoutAddress: string }>(payoutResponse);
    expect(payoutResult.payoutAddress).toBe(payoutWallet.address.toRawString());

    const commissionResponse = await app.fetch(
      new Request("http://platform.test/v1/internal/commission-events", {
        method: "POST",
        headers: internalHeaders(),
        body: JSON.stringify({
          eventId: "evt_1",
          factorSlug: manifest.factorSlug,
          factorVersion: manifest.factorVersion,
          amountNano: "1000",
          sourceRef: "order-1",
        }),
      }),
    );
    expect(commissionResponse.status).toBe(200);
    const ledgerEntry = await readData<{ payoutAddress: string }>(commissionResponse);
    expect(ledgerEntry.payoutAddress).toBe(payoutWallet.address.toRawString());

    app.close();
  });

  test("settlements batch by payout address and keep retryable failure state", async () => {
    resetEventLogPath();
    const app = createPlatformApiServer({
      dbPath: ":memory:",
      publicBaseUrl: "http://platform.test",
      signerOrigin: "https://publish.tonquant.test",
      sessionTtlMs: 60_000,
      internalToken: INTERNAL_TOKEN,
    });
    const keyPair = keyPairFromSeed(Buffer.alloc(32, 21));
    const wallet = WalletContractV5R1.create({
      workchain: 0,
      publicKey: keyPair.publicKey,
    });
    const manifest = buildPublishManifest({
      ...factorEntry,
      public: {
        ...factorEntry.public,
        id: "ton_signal_beta",
      },
    });

    const sessionResponse = await app.fetch(
      new Request("http://platform.test/v1/wallet/nonce", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "publish_factor",
          factorSlug: manifest.factorSlug,
          factorVersion: manifest.factorVersion,
          publisherAddress: wallet.address.toRawString(),
          payoutAddress: wallet.address.toRawString(),
          network: "mainnet",
          audience: "https://publish.tonquant.test",
          manifest,
        }),
      }),
    );
    const session = await readData<{ sessionId: string; intentText: string; createdAt: string }>(
      sessionResponse,
    );
    const signed = makeSignedResult({
      address: wallet.address.toRawString(),
      publicSeedByte: 21,
      domain: "publish.tonquant.test",
      text: session.intentText,
      timestampIso: new Date(new Date(session.createdAt).getTime() + 30_000).toISOString(),
    });

    const publishResponse = await app.fetch(
      new Request("http://platform.test/v1/factors/publish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId: session.sessionId,
          ...signed,
        }),
      }),
    );
    const publication = await readData<{ publicationId: string }>(publishResponse);

    await app.fetch(
      new Request(
        `http://platform.test/v1/internal/publications/${publication.publicationId}/review`,
        {
          method: "POST",
          headers: internalHeaders(),
          body: JSON.stringify({ decision: "approve" }),
        },
      ),
    );

    await app.fetch(
      new Request("http://platform.test/v1/internal/commission-events", {
        method: "POST",
        headers: internalHeaders(),
        body: JSON.stringify({
          eventId: "evt_2",
          factorSlug: manifest.factorSlug,
          factorVersion: manifest.factorVersion,
          amountNano: "3000",
          sourceRef: "order-2",
        }),
      }),
    );
    await app.fetch(
      new Request("http://platform.test/v1/internal/commission-events", {
        method: "POST",
        headers: internalHeaders(),
        body: JSON.stringify({
          eventId: "evt_3",
          factorSlug: manifest.factorSlug,
          factorVersion: manifest.factorVersion,
          amountNano: "4000",
          sourceRef: "order-3",
        }),
      }),
    );

    const settlementResponse = await app.fetch(
      new Request("http://platform.test/v1/internal/settlements/run", {
        method: "POST",
        headers: internalHeaders(),
        body: JSON.stringify({}),
      }),
    );
    expect(settlementResponse.status).toBe(200);
    const batches =
      await readData<Array<{ status: string; entryIds: string[]; totalAmountNano: string }>>(
        settlementResponse,
      );
    expect(batches).toHaveLength(1);
    expect(batches[0]?.status).toBe("failed");
    expect(batches[0]?.entryIds).toHaveLength(2);
    expect(batches[0]?.totalAmountNano).toBe("7000");

    app.close();
  });

  test("internal routes require authorization", async () => {
    resetEventLogPath();
    const app = createPlatformApiServer({
      dbPath: ":memory:",
      publicBaseUrl: "http://platform.test",
      signerOrigin: "https://publish.tonquant.test",
      sessionTtlMs: 60_000,
      internalToken: INTERNAL_TOKEN,
    });

    const response = await app.fetch(
      new Request("http://platform.test/v1/internal/settlements/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(401);
    const payload = (await response.json()) as { code: string };
    expect(payload.code).toBe("PLATFORM_INTERNAL_UNAUTHORIZED");

    app.close();
  });

  test("rejected first publication can be resubmitted with the same slug and version", async () => {
    resetEventLogPath();
    const app = createPlatformApiServer({
      dbPath: ":memory:",
      publicBaseUrl: "http://platform.test",
      signerOrigin: "https://publish.tonquant.test",
      sessionTtlMs: 60_000,
      internalToken: INTERNAL_TOKEN,
    });
    const keyPair = keyPairFromSeed(Buffer.alloc(32, 31));
    const wallet = WalletContractV5R1.create({
      workchain: 0,
      publicKey: keyPair.publicKey,
    });
    const manifest = buildPublishManifest({
      ...factorEntry,
      public: {
        ...factorEntry.public,
        id: "ton_signal_retry",
      },
    });

    const firstPublication = await submitPublication({
      app,
      manifest,
      walletAddress: wallet.address.toRawString(),
      publicSeedByte: 31,
    });

    const rejectResponse = await app.fetch(
      new Request(
        `http://platform.test/v1/internal/publications/${firstPublication.publicationId}/review`,
        {
          method: "POST",
          headers: internalHeaders(),
          body: JSON.stringify({ decision: "reject", rejectionReason: "needs edits" }),
        },
      ),
    );
    expect(rejectResponse.status).toBe(200);

    const secondPublication = await submitPublication({
      app,
      manifest,
      walletAddress: wallet.address.toRawString(),
      publicSeedByte: 31,
    });
    expect(secondPublication.status).toBe("pending_review");

    const approved = await approvePublication(app, secondPublication.publicationId);
    expect(approved.status).toBe("active");

    const statusResponse = await app.fetch(
      new Request(`http://platform.test/v1/publications/${secondPublication.publicationId}`),
    );
    const status = await readData<{
      publication: { status: string };
      activeVersion?: { factorVersion: string };
    }>(statusResponse);
    expect(status.publication.status).toBe("active");
    expect(status.activeVersion?.factorVersion).toBe(manifest.factorVersion);

    app.close();
  });

  test("approving an update keeps newer payout routing and supersedes the prior publication", async () => {
    resetEventLogPath();
    const app = createPlatformApiServer({
      dbPath: ":memory:",
      publicBaseUrl: "http://platform.test",
      signerOrigin: "https://publish.tonquant.test",
      sessionTtlMs: 60_000,
      internalToken: INTERNAL_TOKEN,
    });
    const keyPair = keyPairFromSeed(Buffer.alloc(32, 41));
    const wallet = WalletContractV5R1.create({
      workchain: 0,
      publicKey: keyPair.publicKey,
    });
    const initialManifest = buildPublishManifest({
      ...factorEntry,
      public: {
        ...factorEntry.public,
        id: "ton_signal_upgrade",
        version: "1.0.0",
      },
    });

    const initialPublication = await submitPublication({
      app,
      manifest: initialManifest,
      walletAddress: wallet.address.toRawString(),
      publicSeedByte: 41,
    });
    await approvePublication(app, initialPublication.publicationId);

    const updateManifest = buildPublishManifest({
      ...factorEntry,
      public: {
        ...factorEntry.public,
        id: "ton_signal_upgrade",
        version: "1.1.0",
      },
    });
    const updatePublication = await submitPublication({
      app,
      manifest: updateManifest,
      walletAddress: wallet.address.toRawString(),
      publicSeedByte: 41,
      action: "update_factor",
    });

    const payoutWallet = WalletContractV5R1.create({
      workchain: 0,
      publicKey: keyPairFromSeed(Buffer.alloc(32, 42)).publicKey,
    });
    const payoutSessionResponse = await app.fetch(
      new Request("http://platform.test/v1/wallet/nonce", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "set_payout_address",
          factorSlug: updateManifest.factorSlug,
          publisherAddress: wallet.address.toRawString(),
          payoutAddress: payoutWallet.address.toRawString(),
          network: "mainnet",
          audience: "https://publish.tonquant.test",
        }),
      }),
    );
    const payoutSession = await readData<{
      sessionId: string;
      intentText: string;
      createdAt: string;
    }>(payoutSessionResponse);
    const payoutSigned = makeSignedResult({
      address: wallet.address.toRawString(),
      publicSeedByte: 41,
      domain: "publish.tonquant.test",
      text: payoutSession.intentText,
      timestampIso: new Date(new Date(payoutSession.createdAt).getTime() + 30_000).toISOString(),
    });

    const payoutResponse = await app.fetch(
      new Request(`http://platform.test/v1/factors/${updateManifest.factorSlug}/payout-address`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId: payoutSession.sessionId,
          ...payoutSigned,
        }),
      }),
    );
    expect(payoutResponse.status).toBe(200);

    const approvedUpdate = await approvePublication(app, updatePublication.publicationId);
    expect(approvedUpdate.status).toBe("active");

    const oldPublicationStatus = await app.fetch(
      new Request(`http://platform.test/v1/publications/${initialPublication.publicationId}`),
    );
    const oldPublication = await readData<{ publication: { status: string } }>(
      oldPublicationStatus,
    );
    expect(oldPublication.publication.status).toBe("superseded");

    const commissionResponse = await app.fetch(
      new Request("http://platform.test/v1/internal/commission-events", {
        method: "POST",
        headers: internalHeaders(),
        body: JSON.stringify({
          eventId: "evt_upgrade",
          factorSlug: updateManifest.factorSlug,
          factorVersion: updateManifest.factorVersion,
          amountNano: "2222",
          sourceRef: "order-upgrade",
        }),
      }),
    );
    expect(commissionResponse.status).toBe(200);
    const ledgerEntry = await readData<{ payoutAddress: string }>(commissionResponse);
    expect(ledgerEntry.payoutAddress).toBe(payoutWallet.address.toRawString());

    app.close();
  });

  test("concurrent settlement runs claim pending ledger entries only once", async () => {
    resetEventLogPath();
    const app = createPlatformApiServer({
      dbPath: ":memory:",
      publicBaseUrl: "http://platform.test",
      signerOrigin: "https://publish.tonquant.test",
      sessionTtlMs: 60_000,
      internalToken: INTERNAL_TOKEN,
    });
    const keyPair = keyPairFromSeed(Buffer.alloc(32, 51));
    const wallet = WalletContractV5R1.create({
      workchain: 0,
      publicKey: keyPair.publicKey,
    });
    const manifest = buildPublishManifest({
      ...factorEntry,
      public: {
        ...factorEntry.public,
        id: "ton_signal_concurrent",
      },
    });

    const publication = await submitPublication({
      app,
      manifest,
      walletAddress: wallet.address.toRawString(),
      publicSeedByte: 51,
    });
    await approvePublication(app, publication.publicationId);

    await app.fetch(
      new Request("http://platform.test/v1/internal/commission-events", {
        method: "POST",
        headers: internalHeaders(),
        body: JSON.stringify({
          eventId: "evt_concurrent_1",
          factorSlug: manifest.factorSlug,
          factorVersion: manifest.factorVersion,
          amountNano: "5000",
          sourceRef: "order-concurrent-1",
        }),
      }),
    );

    let submissions = 0;
    (
      app.store as unknown as {
        submitSettlementTransfer: (batch: {
          batchId: string;
        }) => Promise<{ submissionRef: string }>;
      }
    ).submitSettlementTransfer = async (batch) => {
      submissions += 1;
      await new Promise((resolve) => setTimeout(resolve, 25));
      return { submissionRef: `sub_${batch.batchId}` };
    };

    const [first, second] = await Promise.all([
      app.fetch(
        new Request("http://platform.test/v1/internal/settlements/run", {
          method: "POST",
          headers: internalHeaders(),
          body: JSON.stringify({}),
        }),
      ),
      app.fetch(
        new Request("http://platform.test/v1/internal/settlements/run", {
          method: "POST",
          headers: internalHeaders(),
          body: JSON.stringify({}),
        }),
      ),
    ]);

    const firstBatches = await readData<Array<{ batchId: string }>>(first);
    const secondBatches = await readData<Array<{ batchId: string }>>(second);
    const batchCounts = [firstBatches.length, secondBatches.length].sort();
    expect(batchCounts).toEqual([0, 1]);
    expect(submissions).toBe(1);

    app.close();
  });
});
