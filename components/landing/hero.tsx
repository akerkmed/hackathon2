"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, Baby, Check, Clock3, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import type { Lang } from "@/lib/domain/types";
import { LANDING, COMMON, t } from "@/lib/copy";
import { Avatar, Badge, Button } from "@/components/ui";
import { PresentationButton } from "@/components/presentation/presentation-provider";
import { cn } from "@/lib/format";

const SERVICES = [
  { label: "Déclaration de naissance", ar: "التصريح بالولادة", icon: "01" },
  { label: "Acte de naissance", ar: "عقد الازدياد", icon: "02" },
  { label: "CNSS / AMO", ar: "CNSS / AMO", icon: "03" },
  { label: "Indemnité maternité", ar: "تعويض الأمومة", icon: "04" },
  { label: "Allocations familiales", ar: "التعويضات العائلية", icon: "05" },
  { label: "Première vaccination", ar: "التلقيح الأول", icon: "06" },
];

export function LandingHero({ lang }: { lang: Lang }) {
  const serviceLabel = (service: (typeof SERVICES)[number]) =>
    lang === "ar" ? service.ar : service.label;

  return (
    <section className="relative overflow-hidden pb-12 pt-28 sm:pt-32 lg:pb-24 lg:pt-40">
      <div className="pointer-events-none absolute -left-40 top-20 size-[32rem] rounded-full bg-lime/25 blur-[100px]" aria-hidden />
      <div className="pointer-events-none absolute -right-52 top-0 size-[36rem] rounded-full bg-mint/60 blur-[120px]" aria-hidden />
      <div className="container-page relative">
        <div className="grid items-center gap-14 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10">
          <div className="max-w-2xl animate-fade-up">
            <div className="eyebrow">
              {t(LANDING.eyebrow, lang)}
            </div>
            <h1 className="display-title mt-6 text-[clamp(3.15rem,7vw,5.9rem)]">
              {t(LANDING.heroTitleA, lang)}
              <span className="relative mt-1 block text-emerald">
                {t(LANDING.heroTitleB, lang)}
                <svg
                  className="absolute -bottom-2 left-0 h-3 w-[72%] text-lime"
                  viewBox="0 0 300 12"
                  fill="none"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <path d="M2 9C74 2 204 2 298 6" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.9" />
                </svg>
              </span>
            </h1>
            <p className="mt-7 max-w-xl text-pretty text-[1rem] leading-7 text-ink-soft sm:text-[1.08rem]">
              {t(LANDING.heroLead, lang)}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/space">
                <Button size="lg" className="group">
                  {t(LANDING.heroCta, lang)}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
              <a href="#system">
                <Button size="lg" variant="outline">
                  {t(LANDING.heroSecondary, lang)}
                  <ArrowUpRight className="size-4" />
                </Button>
              </a>
              <PresentationButton lang={lang} size="lg" variant="soft" />
            </div>
            <p className="mt-4 text-[0.7rem] font-medium text-muted">{t(LANDING.heroNote, lang)}</p>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line/70 pt-5">
              {["Idarati", "CNSS", "Watiqa", "DGSN", "ANSS"].map((name) => (
                <span key={name} className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-muted/70">
                  {name}
                </span>
              ))}
              <span className="text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-muted/45">
                {lang === "ar" ? "مصادر عامة" : "public sources"}
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[34rem] animate-fade-up [animation-delay:120ms]" data-tour="landing-hero-card">
            <div className="absolute -right-3 -top-5 z-20 hidden rotate-2 rounded-2xl border border-line bg-paper px-3.5 py-2 shadow-soft sm:block">
              <div className="flex items-center gap-2">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald opacity-50" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald" />
                </span>
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-forest">{t(LANDING.liveLabel, lang)}</p>
              </div>
            </div>

            <div className="relative rounded-[2.2rem] border border-line bg-paper p-5 shadow-lift sm:p-6">
              <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-lime to-transparent" aria-hidden />
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-forest text-lime">
                    <Baby className="size-6" strokeWidth={1.7} />
                  </div>
                  <div>
                    <p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-coral">{t(LANDING.liveEvent, lang)}</p>
                    <p className="mt-0.5 text-[0.7rem] font-medium text-muted">{t(LANDING.liveDate, lang)}</p>
                  </div>
                </div>
                <Badge tone="lime" dot className="hidden sm:inline-flex">
                  {lang === "ar" ? "نشط" : lang === "en" ? "Active" : "Actif"}
                </Badge>
              </div>

              <div className="mt-5 flex items-center gap-2.5 rounded-2xl bg-cream/80 p-3">
                <Avatar first="Yasmine" last="Benali" tone="emerald" size="sm" />
                <Avatar first="Mehdi" last="El Fassi" tone="sky" size="sm" className="-ml-4" />
                <Avatar first="Adam" last="Benali" tone="coral" size="sm" className="-ml-4" />
                <div className="ml-1 min-w-0">
                  <p className="truncate text-[0.7rem] font-bold text-forest">
                    {lang === "ar" ? "أسرة بنعلي" : lang === "en" ? "Benali household" : "Famille Benali"}
                  </p>
                  <p className="text-[0.6rem] text-muted">{lang === "ar" ? "الدار البيضاء · تم التحقق" : lang === "en" ? "Casablanca · verified" : "Casablanca · vérifié"}</p>
                </div>
                <span className="ml-auto flex items-center gap-1 rounded-full bg-mint px-2 py-1 text-[0.55rem] font-bold text-forest">
                  <ShieldCheck className="size-3" />
                  {lang === "ar" ? "موثق" : lang === "en" ? "Trusted" : "Vérifié"}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {SERVICES.map((service, index) => (
                  <div
                    key={service.icon}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-2.5 py-2 transition-colors",
                      index < 2 ? "border-mint bg-mint-soft" : "border-line-soft bg-paper",
                    )}
                  >
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-forest/8 text-[0.52rem] font-bold text-forest">
                      {index < 2 ? <Check className="size-3 text-emerald" /> : service.icon}
                    </span>
                    <span className="truncate text-[0.63rem] font-semibold text-ink-soft">{serviceLabel(service)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-2xl bg-forest p-4 text-paper">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[0.56rem] font-bold uppercase tracking-[0.14em] text-lime/80">{t(LANDING.liveUnlockedLabel, lang)}</p>
                    <p className="mt-1 font-display text-[1.55rem] leading-none tracking-[-0.03em] text-paper">{t(LANDING.liveUnlocked, lang)}</p>
                  </div>
                  <span className="flex size-8 items-center justify-center rounded-xl bg-paper/10 text-lime">
                    <Wallet className="size-4" />
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-4 border-t border-paper/15 pt-3 text-[0.6rem] text-paper/70">
                  <span className="flex items-center gap-1.5">
                    <Clock3 className="size-3 text-lime" />
                    {t(LANDING.liveDeadline, lang)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="size-3 text-lime" />
                    {t(LANDING.liveServices, lang)}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 rounded-xl border border-dashed border-line px-3 py-2 text-[0.62rem] text-muted">
                <span className="flex size-4 items-center justify-center rounded-full bg-lime text-forest-deep">
                  <Check className="size-2.5" />
                </span>
                {t(LANDING.liveStatus, lang)}
              </div>
            </div>

            <div className="absolute -bottom-6 -left-4 z-20 hidden w-56 -rotate-2 rounded-2xl border border-line bg-paper p-3 shadow-soft sm:block">
              <p className="text-[0.55rem] font-bold uppercase tracking-[0.12em] text-muted">{t(LANDING.liveOneConfirmation, lang)}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-full bg-lime text-forest-deep">
                  <Check className="size-3.5" strokeWidth={2.6} />
                </span>
                <span className="text-[0.65rem] font-semibold text-forest">{lang === "ar" ? "موافقة واحدة · 6 خدمات" : lang === "en" ? "One consent · 6 services" : "1 consentement · 6 services"}</span>
              </div>
            </div>

            <div className="absolute -right-4 top-1/2 z-20 hidden w-44 rotate-2 rounded-2xl border border-line bg-gold-soft p-3 shadow-soft xl:block">
              <p className="text-[0.55rem] font-bold uppercase tracking-[0.1em] text-[#7d5a16]">{lang === "ar" ? "قاعدة مطبقة" : "Policy rule"}</p>
              <p className="mt-1 text-[0.62rem] font-semibold leading-4 text-[#6f4d12]">CNSS-MAT-54D · CIVIL-30D</p>
              <p className="mt-1 text-[0.55rem] text-[#7d5a16]/70">{lang === "ar" ? "المبالغ محسوبة على الخادم" : "server-recomputed"}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
