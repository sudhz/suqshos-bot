import { EmbedBuilder } from "discord.js";
import { config } from "../config";
import type { IntroEmbedOptions } from "../types";

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
