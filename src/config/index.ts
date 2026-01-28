import type { Gender } from "../types";
import configJson from "./config.json";

export const config = {
  ...configJson,
  genderRoles: configJson.genderRoles as Partial<Record<Gender, string>>,
  embed: {
    ...configJson.embed,
    accentColor: parseInt(configJson.embed.accentColor, 16),
  },
};
