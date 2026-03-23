import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CONFIG_DIR } from "../types/config.js";
import { ServiceError } from "../errors.js";
import {
  FactorRegistryIndexSchema,
  FactorMetaPublicSchema,
  FactorRegistryEntrySchema,
  SubscriptionFileSchema,
  type FactorMetaPublic,
  type FactorRegistryEntry,
  type FactorRegistryIndex,
  type FactorSubscription,
  type FactorMetaPrivate,
} from "../types/factor-registry.js";

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
  mkdirSync(join(REGISTRY_ROOT, "factors"), { recursive: true });
}

function readIndex(): FactorRegistryIndex {
  if (!existsSync(INDEX_PATH)) {
    return { version: "1.0.0", factors: [] };
  }
  const raw = JSON.parse(readFileSync(INDEX_PATH, "utf-8"));
  return FactorRegistryIndexSchema.parse(raw);
}

function writeIndex(index: FactorRegistryIndex): void {
  ensureRegistryDir();
  writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2));
}

function readEntry(id: string): FactorRegistryEntry | null {
  const entryPath = join(factorDir(id), "entry.json");
  if (!existsSync(entryPath)) return null;
  const raw = JSON.parse(readFileSync(entryPath, "utf-8"));
  return FactorRegistryEntrySchema.parse(raw);
}

function writeEntry(entry: FactorRegistryEntry): void {
  const dir = factorDir(entry.public.id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "entry.json"), JSON.stringify(entry, null, 2));
}

function readSubscriptions(): FactorSubscription[] {
  if (!existsSync(SUBSCRIPTIONS_PATH)) return [];
  const raw = JSON.parse(readFileSync(SUBSCRIPTIONS_PATH, "utf-8"));
  return SubscriptionFileSchema.parse(raw).subscriptions;
}

function writeSubscriptions(subs: FactorSubscription[]): void {
  writeFileSync(SUBSCRIPTIONS_PATH, JSON.stringify({ subscriptions: subs }, null, 2));
}

// ── Public API ─────────────────────────────────────────────

export interface PublishOptions {
  force?: boolean;
  privateData?: FactorMetaPrivate;
}

export function publishFactor(meta: FactorMetaPublic, opts: PublishOptions = {}): FactorMetaPublic {
  const validated = FactorMetaPublicSchema.parse(meta);
  const index = readIndex();

  const existingIdx = index.factors.findIndex((f) => f.id === validated.id);
  if (existingIdx >= 0 && !opts.force) {
    throw new DuplicateFactorError(validated.id);
  }

  // Update or insert in index
  const updatedFactors =
    existingIdx >= 0
      ? index.factors.map((f, i) => (i === existingIdx ? validated : f))
      : [...index.factors, validated];

  writeIndex({ ...index, factors: updatedFactors });
  writeEntry({ public: validated, private: opts.privateData });

  return validated;
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
  const index = readIndex();
  const factor = index.factors.find((f) => f.id === factorId);
  if (!factor) {
    throw new FactorNotFoundError(factorId);
  }

  const subs = readSubscriptions();
  const existing = subs.find((s) => s.factorId === factorId);
  if (existing) {
    return existing; // Idempotent
  }

  const subscription: FactorSubscription = {
    factorId,
    subscribedAt: new Date().toISOString(),
    subscribedVersion: factor.version,
  };
  writeSubscriptions([...subs, subscription]);
  return subscription;
}

export function unsubscribeFactor(factorId: string): boolean {
  const subs = readSubscriptions();
  const filtered = subs.filter((s) => s.factorId !== factorId);
  if (filtered.length === subs.length) return false;
  writeSubscriptions(filtered);
  return true;
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

export function getFactorLeaderboard(opts: { period?: string; limit?: number } = {}): FactorMetaPublic[] {
  const index = readIndex();
  const sorted = [...index.factors].sort((a, b) => b.backtest.sharpe - a.backtest.sharpe);
  return sorted.slice(0, opts.limit ?? 10);
}
