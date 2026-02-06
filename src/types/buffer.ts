import type { Message } from "discord.js";

export interface BufferEntry {
  texts: string[];
  wordCount: number;
  lastMessage: Message;
  timer: Timer;
}

export type BurstHandler = (combinedText: string, lastMessage: Message) => Promise<void>;
