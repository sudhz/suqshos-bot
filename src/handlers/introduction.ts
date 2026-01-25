import { EmbedBuilder, MessageFlags, type ModalSubmitInteraction, type GuildMember } from "discord.js";
import { config, type Gender } from "../config";
import { validateIntroduction } from "../utils/llm";
import { logger } from "../utils/logger";

export async function handleIntroductionSubmit(interaction: ModalSubmitInteraction): Promise<void> {
  if (!interaction.inCachedGuild()) {
    await interaction.reply({ content: "This command can only be used in a server.", flags: MessageFlags.Ephemeral });
    return;
  }

  const userId = interaction.user.id;
  const log = logger.child({ userId, handler: "introduction" });

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const fields = {
    name: interaction.fields.getTextInputValue("name"),
    age: interaction.fields.getTextInputValue("age"),
    gender: interaction.fields.getStringSelectValues("gender")[0] ?? "Not specified",
    location: interaction.fields.getTextInputValue("location"),
    about: interaction.fields.getTextInputValue("about"),
  };

  log.info({ fields }, "Introduction submitted");

  const ageNum = parseInt(fields.age, 10);
  if (isNaN(ageNum) || ageNum < 18) {
    log.info({ age: fields.age }, "Underage user rejected");
    await interaction.editReply({
      content: "You must be 18 or older to join this server.",
    });
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

  const genderRoleId = config.genderRoles[fields.gender as Gender];
  try {
    await member.roles.add([config.memberRoleId, genderRoleId].filter(Boolean) as string[]);
    log.info({ gender: fields.gender }, "Roles assigned");
  } catch (error) {
    log.error({ error }, "Failed to assign roles");
    await interaction.editReply({ content: "Failed to assign roles. Please contact a moderator." });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(config.embed.accentColor)
    .setTitle(fields.name)
    .setImage(config.embed.bannerUrl)
    .setThumbnail(member.displayAvatarURL())
    .addFields(
      { name: "Age", value: fields.age, inline: true },
      { name: "Gender", value: fields.gender, inline: true },
      { name: "Location", value: fields.location, inline: true }
    )
    .setFooter({ text: `Member #${interaction.guild?.memberCount ?? "?"}` })
    .setTimestamp();

  if (fields.about) {
    embed.setDescription(fields.about);
  }

  await channel.send({
    content: `Say hi to ${member}!`,
    embeds: [embed],
    allowedMentions: { users: [member.id] },
  });

  log.info("Introduction completed successfully");

  await interaction.editReply({
    content: "Your introduction has been posted! You now have access to the server.",
  });
}
