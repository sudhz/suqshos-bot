import type { Client } from "discord.js";
import { Events } from "discord.js";
import { logger } from "./utils/logger";

const READY_CHECK_TIMEOUT_MS = 30_000;

export const setupProcessHandlers = () => {
  process.on("unhandledRejection", (reason) => {
    logger.error({ reason }, "Unhandled promise rejection");
  });

  process.on("uncaughtException", (error) => {
    logger.error({ error }, "Uncaught exception");
    process.exit(1);
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
