import { existsSync } from "node:fs";
import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import type { Config } from "../types/config.js";
import { CONFIG_DIR, CONFIG_FILE, ConfigSchema } from "../types/config.js";
import { CliCommandError } from "../utils/output.js";

/**
 * Ensure the config directory exists.
 */
export async function ensureConfigDir(): Promise<void> {
  if (!existsSync(CONFIG_DIR)) {
    await mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 });
  }
}

/**
 * Load and validate configuration from disk.
 * Returns default config if file doesn't exist.
 */
export async function loadConfig(): Promise<Config> {
  if (!existsSync(CONFIG_FILE)) {
    return ConfigSchema.parse({});
  }

  try {
    const raw = await readFile(CONFIG_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return ConfigSchema.parse(parsed);
  } catch (err) {
    throw new CliCommandError(
      `Failed to load config from ${CONFIG_FILE}: ${err instanceof Error ? err.message : String(err)}`,
      "CONFIG_LOAD_ERROR",
    );
  }
}

/**
 * Save configuration to disk with restricted permissions.
 * Creates a new config object (immutability).
 */
export async function saveConfig(config: Config): Promise<void> {
  await ensureConfigDir();
  const content = JSON.stringify(config, null, 2);
  await writeFile(CONFIG_FILE, content, { encoding: "utf-8" });
  await chmod(CONFIG_FILE, 0o600);
}

/**
 * Get the config file path.
 */
export function getConfigPath(): string {
  return CONFIG_FILE;
}
