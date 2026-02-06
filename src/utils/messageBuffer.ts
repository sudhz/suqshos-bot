import { Message } from "discord.js";
import { config } from "../config";
import type { BufferEntry, BurstHandler } from "../types";

const buffers = new Map<string, BufferEntry>();

function getKey(userId: string, channelId: string): string {
  return `${userId}:${channelId}`;
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

export function addToBurst(
  userId: string,
  channelId: string,
  text: string,
  message: Message,
  onBurstComplete: BurstHandler
): void {
  const key = getKey(userId, channelId);
  const existing = buffers.get(key);

  if (existing?.timer) {
    clearTimeout(existing.timer);
  }

  const entry: BufferEntry = {
    texts: existing ? [...existing.texts, text] : [text],
    wordCount: (existing?.wordCount ?? 0) + countWords(text),
    lastMessage: message,
    timer: setTimeout(() => {
      buffers.delete(key);
      const combined = entry.texts.join(" ");

      if (entry.wordCount >= config.messageBuffer.minWords) {
        onBurstComplete(combined, entry.lastMessage);
      }
    }, config.messageBuffer.debounceMs),
  };

  buffers.set(key, entry);
}
