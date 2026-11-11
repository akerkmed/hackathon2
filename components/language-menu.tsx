"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Languages } from "lucide-react";
import type { Lang } from "@/lib/domain/types";
import { LANGS, LANG_LABEL, LANG_SHORT, isRtl } from "@/lib/i18n";
import { cn } from "@/lib/format";

export function applyDocumentLang(lang: Lang) {
  document.documentElement.lang = lang === "darija" ? "ar-MA" : lang;
  document.documentElement.dir = isRtl(lang) ? "rtl" : "ltr";
}

export function LanguageMenu({
  lang,
  onChange,
  tone = "dark",
  className,
  full = false,
}: {
  lang: Lang;
  onChange: (lang: Lang) => void;
  tone?: "dark" | "light";
  className?: string;
  full?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-full border px-2.5 text-[0.75rem] font-semibold transition-colors",
          tone === "light"
            ? "border-paper/20 bg-paper/10 text-paper hover:bg-paper/15"
            : "border-line bg-paper/70 text-ink-soft hover:border-forest/30 hover:bg-paper",
          full && "w-full justify-between px-3",
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Languages className="size-3.5 opacity-70" strokeWidth={2} />
        <span>{full ? LANG_LABEL[lang] : LANG_SHORT[lang]}</span>
        <ChevronDown className={cn("size-3 opacity-50 transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-48 overflow-hidden rounded-2xl border border-line-soft bg-paper p-1.5 shadow-lift animate-scale-in"
          role="listbox"
        >
          {LANGS.map((item) => (
            <button
              key={item}
              onClick={() => {
                onChange(item);
                applyDocumentLang(item);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[0.8rem] font-medium transition-colors hover:bg-mint-soft",
                item === lang ? "text-forest" : "text-ink-soft",
              )}
              role="option"
              aria-selected={item === lang}
              dir={item === "ar" ? "rtl" : "ltr"}
            >
              <span className="flex size-6 items-center justify-center rounded-lg bg-cream-deep/70 text-[0.62rem] font-bold">
                {LANG_SHORT[item]}
              </span>
              <span className="flex-1">{LANG_LABEL[item]}</span>
              {item === lang ? <Check className="size-3.5 text-emerald" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
