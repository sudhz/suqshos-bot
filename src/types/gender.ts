export const GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"] as const;
export type Gender = (typeof GENDERS)[number];
