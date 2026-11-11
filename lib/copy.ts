import type { Lang, Localized } from "@/lib/domain/types";
import { fill } from "@/lib/i18n";
import { COMMON, ACTION_CODE_LABEL, CATEGORY_LABEL, NAV, RELATION_LABEL, SCOPE_LABEL, STATUS_LABEL } from "@/lib/copy/common";
import { LANDING } from "@/lib/copy/landing";
import { SPACE } from "@/lib/copy/space";
import { CHAT } from "@/lib/copy/chat";
import { BENEFITS, CASES, DOCUMENTS, SOURCES_PAGE, VERIFY_PAGE } from "@/lib/copy/pages";

export { COMMON, ACTION_CODE_LABEL, CATEGORY_LABEL, NAV, RELATION_LABEL, SCOPE_LABEL, STATUS_LABEL };
export { LANDING } from "@/lib/copy/landing";
export { SPACE } from "@/lib/copy/space";
export { CHAT } from "@/lib/copy/chat";
export { BENEFITS, CASES, DOCUMENTS, SOURCES_PAGE, VERIFY_PAGE } from "@/lib/copy/pages";
export { PRESENTATION, TOUR_STEPS } from "@/lib/copy/presentation";

export const COPY = {
  COMMON,
  NAV,
  LANDING,
  SPACE,
  CHAT,
  BENEFITS,
  DOCUMENTS,
  CASES,
  SOURCES_PAGE,
  VERIFY_PAGE,
};

/** Pick a localized string and interpolate simple {vars}. */
export function t(value: Localized, lang: Lang, vars?: Record<string, string | number>): string {
  const text = value[lang] || value.fr;
  return vars ? fill(text, vars) : text;
}

export function statusLabel(status: string, lang: Lang): string {
  const found = (STATUS_LABEL as Record<string, Localized>)[status];
  return found ? t(found, lang) : status;
}

export function scopeLabel(scope: string, lang: Lang): string {
  const found = (SCOPE_LABEL as Record<string, Localized>)[scope];
  return found ? t(found, lang) : scope;
}

export function relationLabel(relation: string, lang: Lang): string {
  const found = (RELATION_LABEL as Record<string, Localized>)[relation];
  return found ? t(found, lang) : relation;
}

export function categoryLabel(category: string, lang: Lang): string {
  const found = (CATEGORY_LABEL as Record<string, Localized>)[category];
  return found ? t(found, lang) : category;
}

export function traceLabel(code: string, lang: Lang): string {
  const known = ACTION_CODE_LABEL[code];
  if (known) return t(known, lang);
  const fallback: Record<string, Localized> = {
    "plan.created": { fr: "Plan créé", ar: "أُنشئت الخطة", darija: "Plan tsawb", en: "Plan created" },
    "plan.completed": { fr: "Plan terminé", ar: "اكتملت الخطة", darija: "Plan kmmel", en: "Plan completed" },
    "plan.cancelled": { fr: "Plan annulé", ar: "أُلغيت الخطة", darija: "Plan tlgha", en: "Plan cancelled" },
  };
  const value = fallback[code];
  return value ? t(value, lang) : code.replace(/[._]/g, " ");
}
