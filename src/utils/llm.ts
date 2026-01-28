import { config } from "../config";
import type { IntroductionFields, TranslationResult } from "../types";
import { logger } from "./logger";

const log = logger.child({ module: "llm" });

interface ValidationResult {
  valid: boolean;
  reason: string;
}

export async function validateIntroduction(fields: IntroductionFields): Promise<ValidationResult> {
  const systemPrompt = `You are validating a Discord server introduction. Analyze if the user provided genuine, thoughtful answers.

REJECT if:
- Gibberish or random characters
- Single letter/word non-answers
- Clearly fake (age: 999, location: "asdf")
- Offensive or inappropriate content

ACCEPT if answers appear genuine, even if brief.

Respond with JSON only:
{"valid": true, "reason": "ok"}
or
{"valid": false, "reason": "Brief explanation of what's wrong"}`;

  const userMessage = `Validate this introduction:
- Name: ${fields.name}
- Age: ${fields.age}
- Gender: ${fields.gender}
- Location: ${fields.location}`;

  log.debug({ model: config.llm.model }, "Calling LLM for validation");

  const response = await fetch(`${config.llm.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DEEPINFRA_API_KEY}`,
    },
    body: JSON.stringify({
      model: config.llm.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.1,
      max_tokens: 100,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    log.error({ status: response.status, error: errorText }, "LLM API error");
    return { valid: true, reason: "Validation service unavailable, auto-approved" };
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim();

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]) as ValidationResult;
      log.debug({ result }, "LLM validation result");
      return result;
    }
  } catch {
    log.error({ content }, "Failed to parse LLM response");
  }

  return { valid: true, reason: "ok" };
}

export async function detectAndTranslate(text: string): Promise<TranslationResult> {
  const systemPrompt = `You detect if text is in English and translate if not.

Rules:
- If the text is entirely in English (including common internet slang, abbreviations, emojis), respond: {"isEnglish": true}
- If the text contains ANY non-English words, respond: {"isEnglish": false, "language": "Language Name", "translation": "English translation here"}
- For mixed-language messages, translate the entire message to English

Respond with JSON only, no other text.`;

  log.debug({ textLength: text.length }, "Detecting language");

  const response = await fetch(`${config.llm.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DEEPINFRA_API_KEY}`,
    },
    body: JSON.stringify({
      model: config.llm.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Check this message: "${text}"` },
      ],
      temperature: 0.1,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    log.error({ status: response.status }, "Translation API error");
    return { isEnglish: true };
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim();

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]) as TranslationResult;
      log.debug({ result }, "Translation result");
      return result;
    }
  } catch {
    log.error({ content }, "Failed to parse translation response");
  }

  return { isEnglish: true };
}
