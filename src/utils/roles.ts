import type { GuildMember } from "discord.js";
import { config } from "../config";
import type { Gender } from "../types";

export async function assignMemberRoles(member: GuildMember, gender: string) {
  const genderRoleId = config.genderRoles[gender as Gender];
  const roles = [config.memberRoleId, genderRoleId].filter(Boolean) as string[];
  await member.roles.add(roles);
}
