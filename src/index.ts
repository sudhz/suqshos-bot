import { Client, Events, GatewayIntentBits, REST, Routes } from "discord.js";
import { config } from "./config";
import { data as introduceCommand } from "./commands/introduce";
import { registerInteractionHandler } from "./handlers/interactions";
import { registerMessageHandler } from "./handlers/messageCreate";
import { logger } from "./utils/logger";
import { startHealthServer } from "./server";

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

registerInteractionHandler(client);
registerMessageHandler(client);

client.login(process.env.DISCORD_TOKEN);

startHealthServer();
