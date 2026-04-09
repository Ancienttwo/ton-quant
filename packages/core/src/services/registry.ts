import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ServiceError } from "../errors.js";
import { CONFIG_DIR } from "../types/config.js";
import {
  type FactorMetaPrivate,
  type FactorMetaPublic,
  FactorMetaPublicSchema,
  type FactorRegistryEntry,
  FactorRegistryEntrySchema,
  type FactorRegistryIndex,
  FactorRegistryIndexSchema,
  type FactorSubscription,
  SubscriptionFileSchema,
} from "../types/factor-registry.js";
import { ensureDir, readJsonFile, writeJsonFileAtomic } from "../utils/file-store.js";
import { mutateWithEvent } from "./event-log.js";

// ── Paths ──────────────────────────────────────────────────
const REGISTRY_ROOT = join(CONFIG_DIR, "registry");
const INDEX_PATH = join(REGISTRY_ROOT, "factors.json");
const SUBSCRIPTIONS_PATH = join(CONFIG_DIR, "subscriptions.json");

function factorDir(id: string): string {
  return join(REGISTRY_ROOT, "factors", id);
}

// ── Error subclasses ───────────────────────────────────────
export class DuplicateFactorError extends ServiceError {
  constructor(id: string) {
    super(`Factor '${id}' already exists. Use --force to update.`, "DUPLICATE_FACTOR");
    this.name = "DuplicateFactorError";
  }
}

export class FactorNotFoundError extends ServiceError {
  constructor(id: string) {
    super(`Factor '${id}' not found in registry.`, "FACTOR_NOT_FOUND");
    this.name = "FactorNotFoundError";
  }
}

export class BacktestValidationError extends ServiceError {
  constructor(details: string) {
    super(`Backtest validation failed: ${details}`, "BACKTEST_VALIDATION");
    this.name = "BacktestValidationError";
  }
}

// ── Helpers ────────────────────────────────────────────────
function ensureRegistryDir(): void {
  ensureDir(join(REGISTRY_ROOT, "factors"));
}

function readIndex(): FactorRegistryIndex {
  return readJsonFile<FactorRegistryIndex>(INDEX_PATH, FactorRegistryIndexSchema, {
    defaultValue: { version: "1.0.0", factors: [] },
    corruptedCode: "REGISTRY_CORRUPTED",
    corruptedMessage: `factors.json is corrupted. Delete ${INDEX_PATH} to reset.`,
  });
}

function writeIndex(index: FactorRegistryIndex): void {
  ensureRegistryDir();
  writeJsonFileAtomic(INDEX_PATH, index);
}

function readEntry(id: string): FactorRegistryEntry | null {
  const entryPath = join(factorDir(id), "entry.json");
  if (!existsSync(entryPath)) return null;
  try {
    const raw = JSON.parse(readFileSync(entryPath, "utf-8"));
    return FactorRegistryEntrySchema.parse(raw);
  } catch {
    throw new ServiceError(
      `entry.json for factor '${id}' is corrupted. Delete ${entryPath} to reset.`,
      "REGISTRY_CORRUPTED",
    );
  }
}

function writeEntry(entry: FactorRegistryEntry): void {
  const dir = factorDir(entry.public.id);
  ensureDir(dir);
  writeJsonFileAtomic(join(dir, "entry.json"), entry);
}

function readSubscriptions(): FactorSubscription[] {
  return readJsonFile<{ subscriptions: FactorSubscription[] }>(
    SUBSCRIPTIONS_PATH,
    SubscriptionFileSchema,
    {
      defaultValue: { subscriptions: [] },
      corruptedCode: "SUBSCRIPTIONS_CORRUPTED",
      corruptedMessage: `subscriptions.json is corrupted. Delete ${SUBSCRIPTIONS_PATH} to reset.`,
    },
  ).subscriptions;
}

function writeSubscriptions(subs: FactorSubscription[]): void {
  writeJsonFileAtomic(SUBSCRIPTIONS_PATH, { subscriptions: subs });
}

// ── Public API ─────────────────────────────────────────────

export interface PublishOptions {
  force?: boolean;
  privateData?: FactorMetaPrivate;
}

export function publishFactor(meta: FactorMetaPublic, opts: PublishOptions = {}): FactorMetaPublic {
  const validated = FactorMetaPublicSchema.parse(meta);
  return mutateWithEvent({
    paths: [INDEX_PATH, join(factorDir(validated.id), "entry.json")],
    event: {
      type: "factor.publish",
      entity: { kind: "factor", id: validated.id },
      result: "success",
      summary: opts.force
        ? `Updated factor ${validated.id} in registry.`
        : `Published factor ${validated.id} to registry.`,
      payload: {
        force: Boolean(opts.force),
        version: validated.version,
        visibility: validated.visibility,
      },
    },
    apply: () => {
      const index = readIndex();
      const existingIdx = index.factors.findIndex((f) => f.id === validated.id);
      if (existingIdx >= 0 && !opts.force) {
        throw new DuplicateFactorError(validated.id);
      }

      const updatedFactors =
        existingIdx >= 0
          ? index.factors.map((f, i) => (i === existingIdx ? validated : f))
          : [...index.factors, validated];

      writeIndex({ ...index, factors: updatedFactors });
      writeEntry({ public: validated, private: opts.privateData });
      return validated;
    },
  });
}

export interface DiscoverFilters {
  category?: string;
  asset?: string;
  minSharpe?: number;
  timeframe?: string;
}

export function discoverFactors(filters: DiscoverFilters = {}): FactorMetaPublic[] {
  const index = readIndex();
  let results = index.factors;

  if (filters.category) {
    results = results.filter((f) => f.category === filters.category);
  }
  if (filters.asset) {
    const asset = filters.asset.toUpperCase();
    results = results.filter((f) => f.assets.some((a) => a.toUpperCase() === asset));
  }
  if (filters.minSharpe !== undefined) {
    results = results.filter((f) => f.backtest.sharpe >= (filters.minSharpe as number));
  }
  if (filters.timeframe) {
    results = results.filter((f) => f.timeframe === filters.timeframe);
  }

  return results;
}

export function subscribeFactor(factorId: string): FactorSubscription {
  const result = mutateWithEvent({
    paths: [SUBSCRIPTIONS_PATH],
    event: (state) =>
      state.changed
        ? {
            type: "factor.subscribe",
            entity: { kind: "factor", id: factorId },
            result: "success",
            summary: `Subscribed to factor ${factorId}.`,
            payload: {
              subscribedVersion: state.subscription.subscribedVersion,
            },
          }
        : null,
    apply: () => {
      const index = readIndex();
      const factor = index.factors.find((f) => f.id === factorId);
      if (!factor) {
        throw new FactorNotFoundError(factorId);
      }

      const subs = readSubscriptions();
      const existing = subs.find((s) => s.factorId === factorId);
      if (existing) {
        return { changed: false as const, subscription: existing };
      }

      const subscription: FactorSubscription = {
        factorId,
        subscribedAt: new Date().toISOString(),
        subscribedVersion: factor.version,
      };
      writeSubscriptions([...subs, subscription]);
      return { changed: true as const, subscription };
    },
  });
  return result.subscription;
}

export function unsubscribeFactor(factorId: string): boolean {
  return mutateWithEvent({
    paths: [SUBSCRIPTIONS_PATH],
    event: (changed) =>
      changed
        ? {
            type: "factor.unsubscribe",
            entity: { kind: "factor", id: factorId },
            result: "success",
            summary: `Unsubscribed from factor ${factorId}.`,
          }
        : null,
    apply: () => {
      const subs = readSubscriptions();
      const filtered = subs.filter((s) => s.factorId !== factorId);
      if (filtered.length === subs.length) {
        return false;
      }
      writeSubscriptions(filtered);
      return true;
    },
  });
}

export function listFactors(opts: { subscribedOnly?: boolean } = {}): FactorMetaPublic[] {
  const index = readIndex();
  if (!opts.subscribedOnly) return index.factors;

  const subs = readSubscriptions();
  const subIds = new Set(subs.map((s) => s.factorId));
  return index.factors.filter((f) => subIds.has(f.id));
}

export function getFactorDetail(factorId: string): FactorRegistryEntry {
  const entry = readEntry(factorId);
  if (!entry) throw new FactorNotFoundError(factorId);
  return entry;
}

export function getFactorLeaderboard(
  opts: { period?: string; limit?: number } = {},
): FactorMetaPublic[] {
  const index = readIndex();
  const sorted = [...index.factors].sort((a, b) => b.backtest.sharpe - a.backtest.sharpe);
  return sorted.slice(0, opts.limit ?? 10);
}
