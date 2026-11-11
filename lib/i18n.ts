import type { Lang, Localized } from "@/lib/domain/types";

export const LANGS: Lang[] = ["fr", "ar", "darija", "en"];

export const L = (fr: string, ar: string, darija: string, en: string): Localized => ({
  fr,
  ar,
  darija,
  en,
});

export const LANG_LABEL: Record<Lang, string> = {
  fr: "Français",
  ar: "العربية",
  darija: "Darija",
  en: "English",
};

export const LANG_SHORT: Record<Lang, string> = {
  fr: "FR",
  ar: "ع",
  darija: "D",
  en: "EN",
};

export const SPEECH_LANG: Record<Lang, string> = {
  fr: "fr-MA",
  ar: "ar-MA",
  darija: "ar-MA",
  en: "en-US",
};

export const isRtl = (lang: Lang) => lang === "ar";

export function dirOf(lang: Lang): "rtl" | "ltr" {
  return isRtl(lang) ? "rtl" : "ltr";
}

export function pick(value: Localized, lang: Lang): string {
  return value[lang] || value.fr;
}

export function fill(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (_, key) =>
    vars[key] === undefined ? `{${key}}` : String(vars[key]),
  );
}
