import { Client, Events, GatewayIntentBits, REST, Routes } from "discord.js";
import { config } from "./config";
import { data as introduceCommand } from "./commands/introduce";
import { registerInteractionHandler } from "./handlers/interactions";
import { registerMessageHandler } from "./handlers/messageCreate";
import { logger } from "./utils/logger";
import { startHealthServer } from "./server";

const READY_CHECK_TIMEOUT_MS = 30_000;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on(Events.Debug, (message) => logger.debug({ source: "discord.js" }, message));
client.on(Events.Warn, (message) => logger.warn({ source: "discord.js" }, message));
client.on(Events.Error, (error) => logger.error({ source: "discord.js", error }, "Discord.js error"));

const setupProcessHandlers = () => {
  process.on("unhandledRejection", (reason) => {
    logger.error({ reason }, "Unhandled promise rejection");
  });

  process.on("uncaughtException", (error) => {
    logger.error({ error }, "Uncaught exception");
    process.exit(1);
  });
};

const scheduleReadyCheck = () => {
  setTimeout(() => {
    if (!client.isReady()) {
      logger.warn("Bot has not connected after 30 seconds");
    }
  }, READY_CHECK_TIMEOUT_MS);
};

client.once(Events.ClientReady, async (readyClient) => {
  logger.info({ tag: readyClient.user.tag }, "Bot logged in");

  const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

  try {
    await rest.put(Routes.applicationGuildCommands(readyClient.user.id, config.guildId), {
      body: [introduceCommand.toJSON()],
    });
    logger.info("Slash commands registered");
  } catch (error) {
    logger.error({ error }, "Failed to register commands");
  }
});

const start = async () => {
  setupProcessHandlers();
  registerInteractionHandler(client);
  registerMessageHandler(client);
  scheduleReadyCheck();
  startHealthServer();

  try {
    await client.login(process.env.DISCORD_TOKEN);
  } catch (error) {
    logger.error({ error }, "Failed to login to Discord");
    process.exit(1);
  }
};

void start();
