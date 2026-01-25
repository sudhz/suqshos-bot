import { EmbedBuilder, type GuildTextBasedChannel } from "discord.js";
import { config } from "../config";

const STICKY_TITLE = "Let's get to know you!";

export function getStickyEmbed() {
  return new EmbedBuilder()
    .setColor(config.embed.accentColor)
    .setTitle(STICKY_TITLE)
    .setDescription(
      "Use the `/introduce` command and tell us a bit about yourself. " +
      "Once you're done, you'll get full access to the server!"
    );
}

export async function refreshStickyMessage(channel: GuildTextBasedChannel, botId: string) {
  const messages = await channel.messages.fetch({ limit: 10 });
  const oldSticky = messages.find(
    (m) => m.author.id === botId && m.embeds[0]?.title === STICKY_TITLE
  );
  if (oldSticky) {
    await oldSticky.delete().catch(() => {});
  }
  await channel.send({ embeds: [getStickyEmbed()] });
}
