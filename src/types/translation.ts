export interface TranslationResult {
  isEnglish: boolean;
  language?: string;
  translation?: string;
}

export interface ValidationResult {
  valid: boolean;
  reason: string;
}
