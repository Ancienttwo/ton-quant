import type { CliError } from "../types/cli.js";

/**
 * Format successful output as JSON envelope or delegate to human formatter.
 */
export function formatOutput<T>(
  data: T,
  options: { json: boolean },
  humanFormatter?: (data: T) => string,
): string {
  if (options.json) {
    return JSON.stringify({ status: "ok", data }, null, 2);
  }
  if (humanFormatter) {
    return humanFormatter(data);
  }
  return JSON.stringify(data, null, 2);
}

/**
 * Format error output as JSON envelope or human-readable message.
 */
export function formatError(error: string, code: string, options: { json: boolean }): string {
  if (options.json) {
    const envelope: CliError = { status: "error", error, code };
    return JSON.stringify(envelope, null, 2);
  }
  return `Error [${code}]: ${error}`;
}

/**
 * Print output and exit with appropriate code.
 */
export function printAndExit(output: string, exitCode = 0): never {
  if (exitCode === 0) {
    process.stdout.write(`${output}\n`);
  } else {
    process.stderr.write(`${output}\n`);
  }
  process.exit(exitCode);
}

/**
 * Handle command execution with consistent error handling.
 */
export async function handleCommand<T>(
  options: { json: boolean },
  executor: () => Promise<T>,
  humanFormatter?: (data: T) => string,
): Promise<void> {
  try {
    const data = await executor();
    const output = formatOutput(data, options, humanFormatter);
    printAndExit(output, 0);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const code = err instanceof CliCommandError ? err.code : "UNKNOWN_ERROR";
    const output = formatError(message, code, options);
    printAndExit(output, 1);
  }
}

/**
 * Structured CLI error with error code.
 */
export class CliCommandError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "CliCommandError";
    this.code = code;
  }
}
