import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { CONFIG_DIR } from "../types/config.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEYFILE_PATH = join(CONFIG_DIR, ".keyfile");

/**
 * Encrypt plaintext using AES-256-GCM.
 * Returns base64-encoded string: iv + authTag + ciphertext.
 */
export function encrypt(plaintext: string, key: Buffer): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf-8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

/**
 * Decrypt base64-encoded ciphertext using AES-256-GCM.
 */
export function decrypt(ciphertext: string, key: Buffer): string {
  const data = Buffer.from(ciphertext, "base64");
  const iv = data.subarray(0, IV_LENGTH);
  const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted) + decipher.final("utf-8");
}

/**
 * Load or generate encryption key.
 * Key is stored at ~/.tonquant/.keyfile with 0o600 permissions.
 */
export async function loadOrCreateKey(): Promise<Buffer> {
  if (existsSync(KEYFILE_PATH)) {
    const hex = await readFile(KEYFILE_PATH, "utf-8");
    return Buffer.from(hex.trim(), "hex");
  }

  if (!existsSync(CONFIG_DIR)) {
    await mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 });
  }

  const key = randomBytes(32);
  await writeFile(KEYFILE_PATH, key.toString("hex"), { encoding: "utf-8" });
  await chmod(KEYFILE_PATH, 0o600);
  return key;
}
