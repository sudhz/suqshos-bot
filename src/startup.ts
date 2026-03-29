import type { Client } from "discord.js";
import { Events } from "discord.js";
import { logger } from "./utils/logger";

const READY_CHECK_TIMEOUT_MS = 30_000;

type CleanupHandler = (signal: NodeJS.Signals | "uncaughtException") => Promise<void> | void;

let isShuttingDown = false;

const shutdownProcess = async (
  signal: NodeJS.Signals | "uncaughtException",
  exitCode: number,
  cleanup?: CleanupHandler,
) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  logger.info({ signal }, "Shutting down process");

  try {
    await cleanup?.(signal);
  } catch (error) {
    logger.error({ signal, error }, "Failed during shutdown cleanup");
  }

  process.exit(exitCode);
};

export const setupProcessHandlers = (cleanup?: CleanupHandler) => {
  process.on("unhandledRejection", (reason) => {
    logger.error({ reason }, "Unhandled promise rejection");
  });

  process.on("uncaughtException", (error) => {
    logger.error({ error }, "Uncaught exception");
    void shutdownProcess("uncaughtException", 1, cleanup);
  });

  process.on("SIGINT", () => {
    void shutdownProcess("SIGINT", 0, cleanup);
  });

  process.on("SIGTERM", () => {
    void shutdownProcess("SIGTERM", 0, cleanup);
  });

  process.on("SIGHUP", () => {
    void shutdownProcess("SIGHUP", 0, cleanup);
  });
};

export const setupGatewayLogging = (client: Client) => {
  client.on(Events.ShardReady, (shardId, unavailableGuilds) => {
    logger.info(
      { shardId, unavailableGuilds: unavailableGuilds?.size ?? 0 },
      "Shard ready",
    );
  });

  client.on(Events.ShardDisconnect, (event, shardId) => {
    logger.warn(
      {
        shardId,
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
      },
      "Shard disconnected",
    );
  });

  client.on(Events.ShardReconnecting, (shardId) => {
    logger.warn({ shardId }, "Shard reconnecting");
  });

  client.on(Events.ShardResume, (shardId, replayedEvents) => {
    logger.info({ shardId, replayedEvents }, "Shard resumed");
  });

  client.on(Events.ShardError, (error, shardId) => {
    logger.error({ shardId, error }, "Shard error");
  });
};

export const scheduleReadyCheck = (
  client: Client,
  timeoutMs: number = READY_CHECK_TIMEOUT_MS,
) => {
  setTimeout(() => {
    if (!client.isReady()) {
      logger.warn(
        { shardCount: client.ws.shards.size },
        `Bot has not connected after ${timeoutMs / 1000} seconds`,
      );
    }
  }, timeoutMs);
};
