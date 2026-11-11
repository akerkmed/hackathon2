"use client";

import { ArrowRight, ArrowUpRight, Check, Coins, KeyRound, QrCode, ShieldCheck, Smartphone, Users, X } from "lucide-react";
import type { Lang } from "@/lib/domain/types";
import { LANDING, t } from "@/lib/copy";
import { Button } from "@/components/ui";
import { cn, formatMoney } from "@/lib/format";

const FEATURE_ICONS = [Users, Coins, ShieldCheck, KeyRound, QrCode, Smartphone];

export function StatsStrip({ lang }: { lang: Lang }) {
  const stats = [
    { value: "6", label: t(LANDING.numberServices, lang) },
    { value: "5", label: t(LANDING.numberAgencies, lang) },
    { value: formatMoney(23_200, lang), label: t(LANDING.numberValue, lang) },
    { value: "0", label: lang === "ar" ? "استمارة مطلوبة" : lang === "en" ? "forms required" : "formulaire requis" },
  ];
  return (
    <section className="border-y border-line/70 bg-paper/55">
      <div className="container-page grid grid-cols-2 divide-x divide-line/60 md:grid-cols-4">
        {stats.map((stat, index) => (
          <div key={stat.label} className={cn("px-5 py-6 text-center md:py-7", index % 2 === 0 ? "border-l-0" : "")}>
            <p className="font-display text-[1.8rem] leading-none tracking-[-0.03em] text-forest-deep md:text-[2.1rem]">{stat.value}</p>
            <p className="mt-1.5 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-muted">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ProblemSection({ lang }: { lang: Lang }) {
  return (
    <section className="relative py-20 sm:py-28" id="product">
      <div className="container-page">
        <div className="mx-auto max-w-3xl text-center">
          <span className="eyebrow justify-center">{t(LANDING.problemEyebrow, lang)}</span>
          <h2 className="display-title mt-5 text-balance text-[clamp(2.2rem,4.5vw,3.6rem)]">{t(LANDING.problemTitle, lang)}</h2>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-[0.95rem] leading-7 text-muted">{t(LANDING.problemLead, lang)}</p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          <div className="surface p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <span className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-coral">{t(LANDING.oldWay, lang)}</span>
              <span className="rounded-full bg-coral-soft px-2.5 py-1 text-[0.58rem] font-bold text-[#9d3d25]">31 {lang === "ar" ? "يوماً" : lang === "en" ? "days" : "jours"}</span>
            </div>
            <ul className="mt-5 space-y-3">
              {LANDING.oldSteps.map((step) => (
                <li key={step.fr} className="flex items-center gap-3 rounded-xl bg-cream/60 px-3 py-2.5 text-[0.8rem] text-ink-soft">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-coral-soft text-[#9d3d25]">
                    <X className="size-3" strokeWidth={2.5} />
                  </span>
                  {t(step, lang)}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex items-center justify-between border-t border-line/70 pt-4">
              <span className="text-[0.66rem] text-muted">{lang === "ar" ? "تجربة المستخدم الحالية" : lang === "en" ? "Current experience" : "Expérience actuelle"}</span>
              <span className="text-[0.7rem] font-bold text-coral">31 {lang === "ar" ? "يوماً" : lang === "en" ? "days" : "jours"}</span>
            </div>
          </div>

          <div className="mx-auto flex size-10 items-center justify-center rounded-full border border-line bg-paper text-forest shadow-soft lg:rotate-0">
            <ArrowRight className="size-4 rtl:rotate-180" />
          </div>

          <div className="relative overflow-hidden rounded-4xl bg-forest p-6 text-paper shadow-lift noise sm:p-8" data-tour="landing-problem-new">
            <div className="absolute -right-16 -top-16 size-52 rounded-full bg-lime/15 blur-2xl" aria-hidden />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-lime">{t(LANDING.newWay, lang)}</span>
                <span className="rounded-full bg-lime px-2.5 py-1 text-[0.58rem] font-bold text-forest-deep">M3ak</span>
              </div>
              <ul className="mt-5 space-y-3">
                {LANDING.newSteps.map((step) => (
                  <li key={step.fr} className="flex items-center gap-3 rounded-xl bg-paper/8 px-3 py-2.5 text-[0.8rem] text-paper/85">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-lime text-forest-deep">
                      <Check className="size-3" strokeWidth={2.7} />
                    </span>
                    {t(step, lang)}
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex items-center justify-between border-t border-paper/15 pt-4">
                <span className="text-[0.66rem] text-paper/55">{lang === "ar" ? "التنفيذ مع M3ak" : lang === "en" ? "The M3ak run" : "L'exécution M3ak"}</span>
                <span className="text-[0.7rem] font-bold text-lime">1 {lang === "ar" ? "تأكيد" : lang === "en" ? "confirmation" : "confirmation"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SystemSection({ lang }: { lang: Lang }) {
  return (
    <section className="relative overflow-hidden bg-paper-soft/65 py-20 sm:py-28" id="system">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-line to-transparent" aria-hidden />
      <div className="container-page">
        <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <span className="eyebrow">{t(LANDING.systemEyebrow, lang)}</span>
            <h2 className="display-title mt-5 text-balance text-[clamp(2.2rem,4.4vw,3.5rem)]">{t(LANDING.systemTitle, lang)}</h2>
            <p className="mt-5 max-w-lg text-pretty text-[0.92rem] leading-7 text-muted">{t(LANDING.systemLead, lang)}</p>
            <a href="/sources" className="mt-7 inline-flex items-center gap-2 text-[0.78rem] font-bold text-emerald hover:underline">
              {lang === "ar" ? "شاهد المصادر والقواعد" : lang === "en" ? "See sources & rules" : "Voir les sources & règles"}
              <ArrowUpRight className="size-3.5" />
            </a>
            <div className="mt-8 rounded-2xl border border-line bg-paper p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald" />
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-forest">Model proposes · policy disposes</p>
              </div>
              <p className="mt-2 text-[0.7rem] leading-5 text-muted">
                {lang === "ar"
                  ? "النموذج اللغوي يفهم ويصوغ. الأرقام والإجراءات تأتي من كتالوج محكوم."
                  : lang === "en"
                    ? "The language model understands and narrates. Figures and actions come from a governed catalog."
                    : "Le modèle linguistique comprend et raconte. Les chiffres et les actions viennent d'un catalogue gouverné."}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2" data-tour="landing-system-grid">
            {LANDING.features.map((feature, index) => {
              const FeatureIcon = FEATURE_ICONS[index] ?? Check;
              return (
                <article
                  key={feature.title.fr}
                  className={cn(
                    "group relative overflow-hidden rounded-3xl border border-line-soft bg-paper p-5 shadow-card transition-transform duration-300 hover:-translate-y-1",
                    index === 0 && "sm:col-span-2 sm:p-6",
                  )}
                >
                  <div className="flex items-start justify-between">
                    <span className="flex size-10 items-center justify-center rounded-2xl bg-mint-soft text-forest transition-colors group-hover:bg-lime group-hover:text-forest-deep">
                      <FeatureIcon className="size-5" strokeWidth={1.7} />
                    </span>
                    <span className="font-display text-[0.85rem] italic text-muted/45">0{index + 1}</span>
                  </div>
                  <h3 className="mt-4 font-display text-[1.25rem] leading-tight text-forest-deep">{t(feature.title, lang)}</h3>
                  <p className="mt-2 text-[0.78rem] leading-6 text-muted">{t(feature.body, lang)}</p>
                  {index === 0 ? (
                    <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line/60 pt-4">
                      {["Yasmine", "Mehdi", "Adam"].map((name) => (
                        <span key={name} className="rounded-full bg-cream px-2.5 py-1 text-[0.62rem] font-semibold text-ink-soft">
                          {name}
                        </span>
                      ))}
                      <span className="rounded-full bg-mint px-2.5 py-1 text-[0.62rem] font-semibold text-forest">6 {t(LANDING.numberServices, lang)}</span>
                      <span className="rounded-full bg-gold-soft px-2.5 py-1 text-[0.62rem] font-semibold text-[#7d5a16]">2 {lang === "ar" ? "مستبعدة" : lang === "en" ? "excluded" : "exclus"}</span>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export function FinalCta({ lang }: { lang: Lang }) {
  return (
    <section className="container-page py-16 sm:py-20" data-tour="landing-final">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-lime px-6 py-14 text-center sm:px-12 sm:py-20 noise">
        <div className="pointer-events-none absolute -left-20 -top-20 size-64 rounded-full bg-paper/40 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-24 -right-16 size-72 rounded-full bg-emerald/15 blur-3xl" aria-hidden />
        <div className="relative mx-auto max-w-3xl">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-forest/60">M3ak · معك</p>
          <h2 className="display-title mt-4 text-balance text-[clamp(2.4rem,5.4vw,4.4rem)] text-forest-deep">{t(LANDING.finalTitle, lang)}</h2>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-[0.95rem] leading-7 text-forest/75">{t(LANDING.finalLead, lang)}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href="/space">
              <Button size="lg" className="bg-forest-deep text-paper hover:bg-black">
                {t(LANDING.finalCta, lang)}
                <ArrowRight className="size-4 rtl:rotate-180" />
              </Button>
            </a>
            <a href="/sources">
              <Button size="lg" variant="outline" className="border-forest/25 bg-lime/40 text-forest hover:bg-lime/60">
                {t(LANDING.navSources, lang)}
              </Button>
            </a>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-forest/15 pt-5 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-forest/55">
            <span className="flex items-center gap-1.5"><Check className="size-3" /> {lang === "ar" ? "بيانات محاكاة" : lang === "en" ? "Simulated data" : "Données simulées"}</span>
            <span className="flex items-center gap-1.5"><Check className="size-3" /> {lang === "ar" ? "بدون تسجيل" : lang === "en" ? "No sign-up" : "Sans inscription"}</span>
            <span className="flex items-center gap-1.5"><Check className="size-3" /> {lang === "ar" ? "3 دقائق" : lang === "en" ? "3 minutes" : "3 minutes"}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
