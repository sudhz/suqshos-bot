import { Events, MessageFlags, type Client, type GuildMember } from "discord.js";
import { config } from "../config";
import { getModal, MODAL_ID } from "../commands/introduce";
import { handleIntroductionSubmit } from "./introduction";
import { logger } from "../utils/logger";

export function registerInteractionHandler(client: Client) {
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
}
