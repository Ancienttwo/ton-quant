import type { SpawnOptions } from "bun";

export type QuantReadableStreamLike = ReadableStream<Uint8Array> | NodeJS.ReadableStream;
export type QuantWritableSink = NodeJS.WritableStream;

export interface QuantSpawnedProcess {
  readonly stdin?: number | QuantWritableSink;
  readonly stdout?: number | QuantReadableStreamLike;
  readonly stderr?: number | QuantReadableStreamLike;
  readonly exited: Promise<number>;
  kill(signal?: string): void;
}

export type QuantSpawnOptions = SpawnOptions.OptionsObject<"pipe", "pipe", "pipe">;
export type QuantSpawnImpl = (cmd: string[], options: QuantSpawnOptions) => QuantSpawnedProcess;

export function resolveQuantSpawnImpl(): QuantSpawnImpl {
  return (cmd, options) => Bun.spawn(cmd, options) as unknown as QuantSpawnedProcess;
}
