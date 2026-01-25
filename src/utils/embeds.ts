import { EmbedBuilder, type GuildMember } from "discord.js";
import { config } from "../config";
import type { IntroductionFields } from "../types";

interface IntroEmbedOptions {
  fields: IntroductionFields;
  member: GuildMember;
  memberCount: number;
}

export function buildIntroductionEmbed({ fields, member, memberCount }: IntroEmbedOptions) {
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
    .setFooter({ text: `Member #${memberCount}` })
    .setTimestamp();

  if (fields.about) {
    embed.setDescription(fields.about);
  }

  return embed;
}
