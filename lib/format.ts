import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Lang, Localized } from "@/lib/domain/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function initials(first: string, last: string): string {
  return `${first.slice(0, 1)}${last.slice(0, 1)}`.toUpperCase();
}

const MONTHS: Record<Lang, string[]> = {
  fr: ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."],
  ar: ["يناير", "فبراير", "مارس", "أبريل", "ماي", "يونيو", "يوليوز", "غشت", "شتنبر", "أكتوبر", "نونبر", "دجنبر"],
  darija: ["yanayer", "febrayer", "mars", "abril", "mai", "yonyo", "yolyoz", "ghust", "shutanbir", "oktobar", "nowembar", "dujenbir"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

const MONTHS_LONG: Record<Lang, string[]> = {
  fr: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
  ar: ["يناير", "فبراير", "مارس", "أبريل", "ماي", "يونيو", "يوليوز", "غشت", "شتنبر", "أكتوبر", "نونبر", "دجنبر"],
  darija: ["yanayer", "febrayer", "mars", "abril", "mai", "yonyo", "yolyoz", "ghust", "shutanbir", "oktobar", "nowembar", "dujenbir"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};

const WEEKDAYS: Record<Lang, string[]> = {
  fr: ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"],
  ar: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
  darija: ["l7ed", "tnin", "tlat", "larb3", "khmis", "jm3a", "sebt"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};

/** Date-only values are parsed at noon UTC so the calendar day never shifts. */
export function parseDate(value: string): Date {
  if (value.length === 10) return new Date(`${value}T12:00:00.000Z`);
  return new Date(value);
}

export function dateParts(value: string): { y: number; m: number; d: number } {
  const date = parseDate(value);
  return { y: date.getUTCFullYear(), m: date.getUTCMonth(), d: date.getUTCDate() };
}

export function formatDate(value: string, lang: Lang, withYear = true): string {
  const { y, m, d } = dateParts(value);
  const month = MONTHS[lang][m] ?? MONTHS.fr[m];
  return withYear ? `${d} ${month} ${y}` : `${d} ${month}`;
}

export function formatDateLong(value: string, lang: Lang): string {
  const date = parseDate(value);
  const weekday = WEEKDAYS[lang][date.getUTCDay()] ?? WEEKDAYS.fr[date.getUTCDay()];
  const { y, m, d } = dateParts(value);
  const month = MONTHS_LONG[lang][m] ?? MONTHS_LONG.fr[m];
  if (lang === "en") return `${weekday}, ${d} ${month} ${y}`;
  return `${weekday} ${d} ${month} ${y}`;
}

export function formatMonthYear(value: string, lang: Lang): string {
  const { y, m } = dateParts(value);
  if (lang === "ar") return `${MONTHS_LONG.ar[m]} ${y}`;
  return `${MONTHS_LONG[lang][m]} ${y}`;
}

export function daysUntil(value: string, now: string): number {
  const targetParts = dateParts(value);
  const currentParts = dateParts(now);
  const target = Date.UTC(targetParts.y, targetParts.m, targetParts.d);
  const current = Date.UTC(currentParts.y, currentParts.m, currentParts.d);
  return Math.round((target - current) / 86_400_000);
}

export function formatRelativeDays(value: string, now: string, lang: Lang): string {
  const days = daysUntil(value, now);
  if (days === 0) return { fr: "aujourd'hui", ar: "اليوم", darija: "l youm", en: "today" }[lang];
  if (days === 1) return { fr: "demain", ar: "غداً", darija: "ghadda", en: "tomorrow" }[lang];
  if (days > 1) {
    return {
      fr: `dans ${days} jours`,
      ar: `خلال ${days} يوماً`,
      darija: `f ${days} youm`,
      en: `in ${days} days`,
    }[lang];
  }
  return {
    fr: `en retard de ${Math.abs(days)} j`,
    ar: `متأخر بـ ${Math.abs(days)} أيام`,
    darija: `m3etla b ${Math.abs(days)} youm`,
    en: `${Math.abs(days)} days overdue`,
  }[lang];
}

export function formatMoney(amount: number, lang: Lang): string {
  const rounded = Math.round(amount);
  const raw = Math.abs(rounded).toLocaleString("en-US");
  const grouped = raw.replace(/,/g, lang === "en" ? "," : lang === "ar" ? "\u00A0" : " ");
  const sign = rounded < 0 ? "−" : "";
  if (lang === "ar") return `${sign}${grouped} درهم`;
  if (lang === "en") return `MAD ${sign}${grouped}`;
  return `${sign}${grouped} DH`;
}

export function formatCadence(cadence: string, lang: Lang): string {
  switch (cadence) {
    case "MONTHLY":
      return { fr: "/mois", ar: "/شهر", darija: "/chher", en: "/mo" }[lang];
    case "ANNUAL":
      return { fr: "/an", ar: "/سنة", darija: "/3am", en: "/yr" }[lang];
    case "COVERAGE":
      return { fr: "couvert", ar: "مغطى", darija: "mghatti", en: "covered" }[lang];
    default:
      return { fr: "une fois", ar: "مرة واحدة", darija: "mera wa7da", en: "one-off" }[lang];
  }
}

export function localized(value: Localized, lang: Lang): string {
  return value[lang] || value.fr;
}

export function truncate(text: string, length: number): string {
  return text.length > length ? `${text.slice(0, length - 1)}…` : text;
}

export function maskName(name: string): string {
  const parts = name.split(" ");
  return parts.map((part, i) => (i === 0 ? part : `${part.slice(0, 1)}.`)).join(" ");
}
