import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { CONFIG_DIR } from "../types/config.js";
import { ServiceError } from "../errors.js";
import { listFactors } from "./registry.js";
import {
  CompositeDefinitionSchema,
  CompositeIndexSchema,
  type ComponentWeight,
  type CompositeDefinition,
  type CompositeEntry,
  type CompositeIndex,
} from "../types/factor-compose.js";
import type { FactorBacktestSummary, FactorMetaPublic } from "../types/factor-registry.js";

// ── Paths ──────────────────────────────────────────────────
const REGISTRY_ROOT = join(CONFIG_DIR, "registry");
export const COMPOSITES_PATH = join(REGISTRY_ROOT, "composites.json");

// ── Error subclasses ───────────────────────────────────────
export class CompositionValidationError extends ServiceError {
  constructor(message: string) {
    super(message, "COMPOSITION_VALIDATION");
    this.name = "CompositionValidationError";
  }
}

export class DuplicateCompositeError extends ServiceError {
  constructor(id: string) {
    super(`Composite '${id}' already exists. Use --force to update.`, "DUPLICATE_COMPOSITE");
    this.name = "DuplicateCompositeError";
  }
}

export class CompositeNotFoundError extends ServiceError {
  constructor(id: string) {
    super(`Composite '${id}' not found.`, "COMPOSITE_NOT_FOUND");
    this.name = "CompositeNotFoundError";
  }
}

// ── Pure functions ─────────────────────────────────────────

/**
 * Normalize weights so sum of absolute values = 1.0.
 * Preserves sign. Returns new array (immutable).
 */
export function normalizeWeights(components: ReadonlyArray<ComponentWeight>): ComponentWeight[] {
  const absSum = components.reduce((sum, c) => sum + Math.abs(c.weight), 0);
  if (absSum === 0) {
    throw new CompositionValidationError("All component weights are zero.");
  }
  return components.map((c) => ({
    factorId: c.factorId,
    weight: c.weight / absSum,
  }));
}

/**
 * Derive composite backtest from component backtests using weighted averaging.
 * Uses absolute weights for the average computation.
 */
export function deriveBacktest(
  components: ReadonlyArray<{ weight: number; backtest: FactorBacktestSummary }>,
): FactorBacktestSummary {
  const absSum = components.reduce((sum, c) => sum + Math.abs(c.weight), 0);

  const weightedAvg = (getter: (bt: FactorBacktestSummary) => number): number =>
    components.reduce((sum, c) => sum + (Math.abs(c.weight) / absSum) * getter(c.backtest), 0);

  // Worst (most negative) drawdown — conservative estimate
  const worstDrawdown = Math.min(...components.map((c) => c.backtest.maxDrawdown));

  // Data range intersection: latest start, earliest end
  const starts = components.map((c) => c.backtest.dataRange.start).sort();
  const ends = components.map((c) => c.backtest.dataRange.end).sort();

  const rangeStart = starts[starts.length - 1]; // latest start
  const rangeEnd = ends[0]; // earliest end

  if (rangeStart >= rangeEnd) {
    throw new CompositionValidationError(
      "Component factors have non-overlapping data ranges. No common backtest period exists.",
    );
  }

  return {
    sharpe: weightedAvg((bt) => bt.sharpe),
    maxDrawdown: worstDrawdown,
    winRate: weightedAvg((bt) => bt.winRate),
    cagr: weightedAvg((bt) => bt.cagr),
    dataRange: { start: rangeStart, end: rangeEnd },
    tradeCount: components.reduce((sum, c) => sum + c.backtest.tradeCount, 0),
  };
}

/**
 * Validate that all component factor IDs exist in the available factors list.
 */
export function validateComponents(
  components: ReadonlyArray<ComponentWeight>,
  availableFactors: ReadonlyArray<FactorMetaPublic>,
): { valid: true } | { valid: false; missing: string[] } {
  const available = new Set(availableFactors.map((f) => f.id));
  const missing = components.filter((c) => !available.has(c.factorId)).map((c) => c.factorId);
  if (missing.length > 0) return { valid: false, missing };
  return { valid: true };
}

// ── IO helpers ─────────────────────────────────────────────

function readCompositeIndex(): CompositeIndex {
  if (!existsSync(COMPOSITES_PATH)) {
    return { version: "1.0.0", composites: [] };
  }
  try {
    const raw = JSON.parse(readFileSync(COMPOSITES_PATH, "utf-8"));
    return CompositeIndexSchema.parse(raw);
  } catch {
    throw new CompositionValidationError(
      `composites.json is corrupted. Delete ${COMPOSITES_PATH} to reset.`,
    );
  }
}

function writeCompositeIndex(index: CompositeIndex): void {
  mkdirSync(REGISTRY_ROOT, { recursive: true });
  const tmp = join(tmpdir(), `composites-${Date.now()}.json.tmp`);
  writeFileSync(tmp, JSON.stringify(index, null, 2));
  renameSync(tmp, COMPOSITES_PATH);
}

// ── Public API ─────────────────────────────────────────────

export interface ComposeOptions {
  force?: boolean;
}

export function composeFactors(
  definition: CompositeDefinition,
  opts: ComposeOptions = {},
): CompositeEntry {
  // 1. Validate definition schema
  const validated = CompositeDefinitionSchema.parse(definition);

  // 2. Guard against self-reference
  if (validated.components.some((c) => c.factorId === validated.id)) {
    throw new CompositionValidationError(
      `Composite '${validated.id}' cannot reference itself as a component.`,
    );
  }

  // 3. Resolve available factors from registry
  const allFactors = listFactors();
  const validation = validateComponents(validated.components, allFactors);
  if (!validation.valid) {
    throw new CompositionValidationError(
      `Missing factors: ${validation.missing.join(", ")}`,
    );
  }

  // 4. Check for duplicates
  const compositeIndex = readCompositeIndex();
  const existingIdx = compositeIndex.composites.findIndex(
    (c) => c.definition.id === validated.id,
  );
  if (existingIdx >= 0 && !opts.force) {
    throw new DuplicateCompositeError(validated.id);
  }

  // 5. Normalize weights if requested
  const finalComponents = validated.normalizeWeights
    ? normalizeWeights(validated.components)
    : validated.components;

  // 6. Resolve backtests and derive composite
  const factorMap = new Map(allFactors.map((f) => [f.id, f]));
  const componentBacktests = finalComponents.map((c) => ({
    weight: c.weight,
    backtest: factorMap.get(c.factorId)!.backtest,
  }));
  const derived = deriveBacktest(componentBacktests);

  // 7. Build entry
  const entry: CompositeEntry = {
    definition: { ...validated, components: finalComponents },
    derivedBacktest: derived,
  };

  // 8. Save to index (immutable update)
  const updatedComposites =
    existingIdx >= 0
      ? compositeIndex.composites.map((c, i) => (i === existingIdx ? entry : c))
      : [...compositeIndex.composites, entry];

  writeCompositeIndex({ ...compositeIndex, composites: updatedComposites });

  return entry;
}

export function listComposites(): CompositeEntry[] {
  return readCompositeIndex().composites;
}

export function getComposite(compositeId: string): CompositeEntry {
  const index = readCompositeIndex();
  const entry = index.composites.find((c) => c.definition.id === compositeId);
  if (!entry) throw new CompositeNotFoundError(compositeId);
  return entry;
}

export function deleteComposite(compositeId: string): boolean {
  const index = readCompositeIndex();
  const filtered = index.composites.filter((c) => c.definition.id !== compositeId);
  if (filtered.length === index.composites.length) return false;
  writeCompositeIndex({ ...index, composites: filtered });
  return true;
}
