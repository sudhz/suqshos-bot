import { config } from "../config";
import { logger } from "./logger";

const log = logger.child({ module: "llm" });

interface IntroductionFields {
  name: string;
  age: string;
  gender: string;
  location: string;
  about: string;
}

interface ValidationResult {
  valid: boolean;
  reason: string;
}

const SYSTEM_PROMPT = `You are validating a Discord server introduction. Analyze if the user provided genuine, thoughtful answers.

REJECT if:
- Gibberish or random characters
- Single letter/word non-answers
- Clearly fake (age: 999, location: "asdf")
- Offensive or inappropriate content

ACCEPT if answers appear genuine, even if brief. The "About" field is optional and can be empty.

Respond with JSON only:
{"valid": true, "reason": "ok"}
or
{"valid": false, "reason": "Brief explanation of what's wrong"}`;

export async function validateIntroduction(fields: IntroductionFields): Promise<ValidationResult> {
  const userMessage = `Validate this introduction:
- Name: ${fields.name}
- Age: ${fields.age}
- Gender: ${fields.gender}
- Location: ${fields.location}
- About: ${fields.about || "(not provided)"}`;

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
        { role: "system", content: SYSTEM_PROMPT },
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
