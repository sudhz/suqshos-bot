export type Gender = "Male" | "Female" | "Non-binary" | "Prefer not to say";

export const config = {
  guildId: "1126830960047034488",
  channelId: "1130435096403509308",
  memberRoleId: "1130245220613759006",
  genderRoles: {
    "Male": "1130256772628750347",
    "Female": "1130256823560183858",
    "Non-binary": "1464989667890827538",
  } as Partial<Record<Gender, string>>,
  llm: {
    baseUrl: "https://api.deepinfra.com/v1/openai",
    model: "deepseek-ai/DeepSeek-V3.2",
  },
  embed: {
    bannerUrl: "https://i.postimg.cc/Pxy4KS98/suqsho-s-den-welcome.png",
    accentColor: 0x8b5cf6,
  },
} as const;
