import { Client, EmbedBuilder, Events, Message } from "discord.js";
import { config } from "../config";
import { detectAndTranslate } from "../utils/llm";
import { addToBurst } from "../utils/messageBuffer";
import { isRateLimited, incrementRateLimit } from "../utils/rateLimit";
import { logger } from "../utils/logger";

const log = logger.child({ module: "messageCreate" });

const URL_REGEX = /https?:\/\/[^\s]+/gi;

function isOnlyUrls(text: string): boolean {
  return text.replace(URL_REGEX, "").trim() === "";
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

async function handleTranslation(text: string, message: Message): Promise<void> {
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
        .addFields(
          { name: "Original", value: text },
          { name: `${result.language} → English`, value: result.translation }
        )
        .setFooter({ text: "We keep this channel in English so everyone can follow along" });

      await message.reply({
        content: "Please keep this channel in English only!",
        embeds: [embed],
        allowedMentions: { users: [] },
      });

      incrementRateLimit(message.author.id);

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
}

export function registerMessageHandler(client: Client): void {
  client.on(Events.MessageCreate, async (message: Message) => {
    const text = message.content.trim();

    if (
      message.author.bot ||
      message.channelId !== config.monitoredChannelId ||
      message.channel.isVoiceBased() ||
      !text ||
      isOnlyUrls(text)
    ) {
      return;
    }

    const wordCount = countWords(text);

    if (wordCount <= 2) {
      addToBurst(message.author.id, message.channelId, text, message, handleTranslation);
    } else {
      await handleTranslation(text, message);
    }
  });

  log.info("Message handler registered");
}
