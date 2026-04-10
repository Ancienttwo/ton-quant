import { createPlatformApiServer } from "./server.js";

const app = createPlatformApiServer();
const port = Number(process.env.PORT ?? 3001);

const server = Bun.serve({
  port,
  fetch: app.fetch,
});

process.stdout.write(`TonQuant platform API listening on ${server.url}\n`);
