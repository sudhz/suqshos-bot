import { logger } from "./utils/logger";

export function startHealthServer(port: number | string = process.env.PORT || 3000) {
  Bun.serve({
    port: Number(port),
    routes: {
      "/health": new Response("OK", { status: 200 }),
    },
    fetch() {
      return new Response("Not Found", { status: 404 });
    },
  });

  logger.info({ port }, "Health server started");
}
