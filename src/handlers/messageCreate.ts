import { Client, EmbedBuilder, Events, Message } from "discord.js";
import { config } from "../config";
import { detectAndTranslate } from "../utils/llm";
import { isRateLimited } from "../utils/rateLimit";
import { logger } from "../utils/logger";

const log = logger.child({ module: "messageCreate" });

export function registerMessageHandler(client: Client): void {
  client.on(Events.MessageCreate, async (message: Message) => {
    if (message.author.bot) {
      return;
    }

    if (config.excludedChannelIds.includes(message.channelId)) {
      return;
    }

    const text = message.content.trim();
    if (!text) {
      return;
    }

    if (isRateLimited(message.author.id)) {
      log.debug({ userId: message.author.id }, "User rate limited, skipping");
      return;
    }

    try {
      const result = await detectAndTranslate(text);

      if (!result.isEnglish && result.translation && result.language) {
        const embed = new EmbedBuilder()
          .setColor(config.embed.accentColor)
          .setTitle("🌐 Translation")
          .addFields({ name: `${result.language} → English`, value: result.translation })
          .setFooter({ text: "We keep main channels in English so everyone can follow along" });

        await message.reply({
          content: `Head over to <#${config.nonEnglishChannelId}> for non-English conversations!`,
          embeds: [embed],
          allowedMentions: { users: [] },
        });

        log.info(
          {
            userId: message.author.id,
            language: result.language,
            channelId: message.channelId,
          },
          "Non-English message detected and translated"
        );
      }
    } catch (error) {
      log.error({ error, messageId: message.id }, "Failed to process message");
    }
  });

  log.info("Message handler registered");
}
