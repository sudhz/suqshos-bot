import { Client, Events, GatewayIntentBits, MessageFlags, REST, Routes, type GuildMember } from "discord.js";
import { config } from "./config";
import { data as introduceCommand, getModal, MODAL_ID } from "./commands/introduce";
import { handleIntroductionSubmit } from "./handlers/introduction";
import { logger } from "./utils/logger";
import { startHealthServer } from "./server";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
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

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "introduce") {
      logger.debug({ userId: interaction.user.id }, "Introduce command invoked");

      if (interaction.channelId !== config.channelId) {
        logger.debug({ userId: interaction.user.id }, "Wrong channel for introduce");
        await interaction.reply({
          content: `Please use this command in <#${config.channelId}>`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const member = interaction.member as GuildMember | null;
      if (member?.roles.cache.has(config.memberRoleId)) {
        logger.debug({ userId: interaction.user.id }, "Already verified user tried to introduce");
        await interaction.reply({
          content: "You have already been verified!",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await interaction.showModal(getModal());
    }
  }

  if (interaction.isModalSubmit() && interaction.customId === MODAL_ID) {
    await handleIntroductionSubmit(interaction);
  }
});

client.login(process.env.DISCORD_TOKEN);

startHealthServer();
