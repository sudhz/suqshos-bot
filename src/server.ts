import { logger } from "./utils/logger";

export function startHealthServer(
  port: number | string = process.env.PORT || 3000,
  host: string = process.env.HOST || "0.0.0.0",
) {
  const server = Bun.serve({
    hostname: host,
    port: Number(port),
    routes: {
      "/health": new Response("OK", { status: 200 }),
    },
    fetch() {
      return new Response("Not Found", { status: 404 });
    },
  });

  logger.info({ host, port }, "Health server started");

  return server;
}
