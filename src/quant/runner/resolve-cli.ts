import { existsSync } from "node:fs";
import { join } from "node:path";
import { CliCommandError } from "../../utils/output.js";

function parseCommand(command: string): string[] {
  return command
    .split(/\s+/u)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function resolveQuantCli(): string[] {
  const explicit = process.env.TONQUANT_QUANT_CLI;
  if (explicit) {
    return parseCommand(explicit);
  }

  const pythonProject = process.env.TONQUANT_QUANT_PYTHON_PROJECT;
  if (pythonProject) {
    return ["uv", "run", "--project", pythonProject, "tonquant-quant-cli"];
  }

  const localProject = join(process.cwd(), "quant-python");
  if (existsSync(localProject)) {
    return ["uv", "run", "--project", localProject, "tonquant-quant-cli"];
  }

  throw new CliCommandError(
    "Quant backend is not configured. Set TONQUANT_QUANT_CLI or TONQUANT_QUANT_PYTHON_PROJECT.",
    "QUANT_BACKEND_NOT_CONFIGURED",
  );
}
