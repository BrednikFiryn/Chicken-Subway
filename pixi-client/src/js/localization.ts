
export type SupportedLang = "en" | "es" | "it" | "de" | "nl" | "pl" | "fr";

export type LocalizationType = Record<string, string>;

export const LOCALIZATION: Record<SupportedLang, LocalizationType> = {
  "en": {
  },
  "es": {
  },
  "it": {
  },
  "de": {
  },
  "nl": {
  },
  "pl": {
  },
  "fr": {
  },
};

export function detectLanguage(): SupportedLang {
  const lang = (navigator.language || "en").toLowerCase();
  const supported: SupportedLang[] = ["en", "es", "it", "de", "nl", "pl", "fr"];
  const found = supported.find(l => lang.startsWith(l));
  return (found || "en") as SupportedLang;
}

let currentLang: SupportedLang = detectLanguage();

export function setLanguage(lang: SupportedLang) {
  currentLang = lang;
}

export function t(key: string): string {
  return LOCALIZATION[currentLang][key] || key;
}
