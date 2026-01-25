import { MessageFlags, type ModalSubmitInteraction, type GuildMember } from "discord.js";
import type { IntroductionFields } from "../types";
import { validateIntroduction } from "../utils/llm";
import { logger } from "../utils/logger";
import { buildIntroductionEmbed } from "../utils/embeds";
import { refreshStickyMessage } from "../utils/sticky";
import { assignMemberRoles } from "../utils/roles";

const DEFAULT_GENDER = "Not specified";

function extractFields(interaction: ModalSubmitInteraction): IntroductionFields {
  return {
    name: interaction.fields.getTextInputValue("name"),
    age: interaction.fields.getTextInputValue("age"),
    gender: interaction.fields.getStringSelectValues("gender")[0] ?? DEFAULT_GENDER,
    location: interaction.fields.getTextInputValue("location"),
    about: interaction.fields.getTextInputValue("about"),
  };
}

function parseAge(age: string): number | null {
  const parsed = parseInt(age, 10);
  return isNaN(parsed) ? null : parsed;
}

export async function handleIntroductionSubmit(interaction: ModalSubmitInteraction): Promise<void> {
  if (!interaction.inCachedGuild()) {
    await interaction.reply({ content: "This command can only be used in a server.", flags: MessageFlags.Ephemeral });
    return;
  }

  const log = logger.child({ userId: interaction.user.id, handler: "introduction" });
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const fields = extractFields(interaction);
  log.info({ fields }, "Introduction submitted");

  const age = parseAge(fields.age);
  if (!age || age < 18) {
    log.info({ age: fields.age }, "Underage user rejected");
    await interaction.editReply({ content: "You must be 18 or older to join this server." });
    return;
  }

  const validation = await validateIntroduction(fields);
  if (!validation.valid) {
    log.info({ reason: validation.reason }, "Introduction rejected");
    await interaction.editReply({
      content: `Your introduction was not approved: **${validation.reason}**\n\nPlease try again with genuine answers.`,
    });
    return;
  }

  const member = interaction.member as GuildMember;
  const channel = interaction.channel;

  if (!channel || !channel.isTextBased()) {
    log.warn("Introduction channel not found");
    await interaction.editReply({ content: "Could not find the introduction channel." });
    return;
  }

  try {
    await assignMemberRoles(member, fields.gender);
    log.info({ gender: fields.gender }, "Roles assigned");
  } catch (error) {
    log.error({ error }, "Failed to assign roles");
    await interaction.editReply({ content: "Failed to assign roles. Please contact a moderator." });
    return;
  }

  const embed = buildIntroductionEmbed({
    fields,
    member,
    memberCount: interaction.guild.memberCount,
  });

  await channel.send({
    content: `Say hi to ${member}!`,
    embeds: [embed],
    allowedMentions: { users: [member.id] },
  });

  await refreshStickyMessage(channel, interaction.client.user.id);
  log.info("Introduction completed successfully");

  await interaction.editReply({
    content: "Your introduction has been posted! You now have access to the server.",
  });
}
