"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, Sun, X } from "lucide-react";
import type { Lang } from "@/lib/domain/types";
import { COMMON, LANDING, t } from "@/lib/copy";
import { Brand, BrandMark } from "@/components/brand";
import { Button } from "@/components/ui";
import { LanguageMenu, applyDocumentLang } from "@/components/language-menu";
import { PresentationButton } from "@/components/presentation/presentation-provider";
import { LandingHero } from "@/components/landing/hero";
import { FinalCta, ProblemSection, StatsStrip, SystemSection } from "@/components/landing/sections";
import { OutcomeSection, QuoteSection, TrustSection } from "@/components/landing/trust";
import { cn } from "@/lib/format";

export function LandingPage() {
  const [lang, setLang] = useState<Lang>("fr");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("m3ak.lang");
    if (stored === "ar" || stored === "darija" || stored === "en" || stored === "fr") {
      setLang(stored);
      applyDocumentLang(stored);
    }
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const changeLang = (next: Lang) => {
    setLang(next);
    window.localStorage.setItem("m3ak.lang", next);
    applyDocumentLang(next);
  };

  return (
    <div className="min-h-dvh overflow-x-hidden sahara-wash">
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          scrolled ? "border-b border-line/70 bg-cream/90 shadow-[0_8px_30px_-24px_rgba(10,34,44,0.4)] backdrop-blur-xl" : "bg-transparent",
        )}
      >
        <div className="saharan-rule opacity-60" aria-hidden />
        <div className="container-page flex h-18 items-center gap-4">
          <Brand />
          <nav className="ml-auto hidden items-center gap-7 md:flex" aria-label="Landing navigation">
            <a href="#product" className="text-[0.78rem] font-semibold text-ink-soft transition-colors hover:text-forest">
              {t(LANDING.navProduct, lang)}
            </a>
            <a href="#system" className="text-[0.78rem] font-semibold text-ink-soft transition-colors hover:text-forest">
              {t(LANDING.navTrust, lang)}
            </a>
            <Link href="/sources" className="text-[0.78rem] font-semibold text-ink-soft transition-colors hover:text-forest">
              {t(LANDING.navSources, lang)}
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <PresentationButton lang={lang} className="hidden lg:inline-flex" />
            <LanguageMenu lang={lang} onChange={changeLang} />
            <Link href="/space" className="hidden sm:block">
              <Button size="sm" className="gap-1.5">
                {t(COMMON.openDemo, lang)}
                <ArrowRight className="size-3.5 rtl:rotate-180" />
              </Button>
            </Link>
            <button
              onClick={() => setMobileOpen((open) => !open)}
              className="inline-flex size-9 items-center justify-center rounded-full border border-line bg-paper/70 text-ink-soft md:hidden"
              aria-label="Menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </div>
        {mobileOpen ? (
          <div className="border-t border-line/70 bg-paper px-5 pb-5 pt-3 md:hidden animate-fade-in">
            <div className="flex flex-col gap-1">
              {[
                { href: "#product", label: t(LANDING.navProduct, lang) },
                { href: "#system", label: t(LANDING.navTrust, lang) },
                { href: "#trust", label: "Trust" },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-[0.85rem] font-semibold text-ink-soft hover:bg-cream"
                >
                  {item.label}
                </a>
              ))}
              <Link href="/sources" onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-2.5 text-[0.85rem] font-semibold text-ink-soft hover:bg-cream">
                {t(LANDING.navSources, lang)}
              </Link>
              <div onClick={() => setMobileOpen(false)}>
                <PresentationButton lang={lang} size="md" className="mt-2 w-full" />
              </div>
              <Link href="/space" onClick={() => setMobileOpen(false)} className="mt-2">
                <Button className="w-full">
                  {t(COMMON.openDemo, lang)}
                  <ArrowRight className="size-4 rtl:rotate-180" />
                </Button>
              </Link>
            </div>
          </div>
        ) : null}
      </header>

      <main>
        <LandingHero lang={lang} />
        <StatsStrip lang={lang} />
        <ProblemSection lang={lang} />
        <SystemSection lang={lang} />
        <OutcomeSection lang={lang} />
        <TrustSection lang={lang} />
        <QuoteSection lang={lang} />
        <FinalCta lang={lang} />
      </main>

      <footer className="relative border-t border-line/70 bg-paper/60">
        <div className="saharan-rule absolute inset-x-0 top-0 opacity-45" aria-hidden />
        <div className="container-page py-12">
          <div className="grid gap-10 md:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
            <div>
              <Brand />
              <p className="mt-4 max-w-xs text-[0.74rem] leading-6 text-muted">{t(LANDING.footerNote, lang)}</p>
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-2.5 py-1 text-[0.6rem] font-semibold text-muted">
                <Sun className="size-3 text-gold" />
                {t(COMMON.madeIn, lang)}
              </div>
            </div>
            <div>
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.15em] text-muted/70">{t(LANDING.footerProduct, lang)}</p>
              <div className="mt-3 flex flex-col gap-2 text-[0.76rem] font-medium text-ink-soft">
                <a href="#product" className="hover:text-forest">{t(LANDING.navProduct, lang)}</a>
                <a href="#system" className="hover:text-forest">{t(LANDING.navTrust, lang)}</a>
                <Link href="/space" className="hover:text-forest">{t(LANDING.footerLive, lang)}</Link>
              </div>
            </div>
            <div>
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.15em] text-muted/70">{t(LANDING.footerTrust, lang)}</p>
              <div className="mt-3 flex flex-col gap-2 text-[0.76rem] font-medium text-ink-soft">
                <a href="#trust" className="hover:text-forest">{t(LANDING.navTrust, lang)}</a>
                <Link href="/sources" className="hover:text-forest">{t(LANDING.footerSources, lang)}</Link>
                <Link href="/verify" className="hover:text-forest">{t(LANDING.navVerify, lang)}</Link>
              </div>
            </div>
            <div className="rounded-3xl border border-line-soft bg-paper p-5">
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.15em] text-muted/70">{t(COMMON.demo, lang)}</p>
              <p className="mt-2 font-display text-[1.3rem] leading-tight text-forest-deep">{t(COMMON.tagline, lang)}</p>
              <Link href="/space" className="mt-3 inline-flex items-center gap-1.5 text-[0.72rem] font-bold text-emerald hover:underline">
                {t(LANDING.finalCta, lang)}
                <ArrowRight className="size-3 rtl:rotate-180" />
              </Link>
            </div>
          </div>
          <div className="mt-10 flex flex-col gap-3 border-t border-line/70 pt-5 text-[0.62rem] text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 M3ak · {t(COMMON.simulated, lang)}</p>
            <p className="max-w-2xl text-pretty">{t(COMMON.simulatedData, lang)}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
