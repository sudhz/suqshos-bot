export interface IntroductionFields {
  name: string;
  age: string;
  gender: string;
  location: string;
  about: string;
}

export interface IntroEmbedOptions {
  fields: IntroductionFields;
  member: import("discord.js").GuildMember;
  memberCount: number;
}
