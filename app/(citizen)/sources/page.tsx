"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  Check,
  ExternalLink,
  FileCode2,
  Filter,
  Landmark,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useSession } from "@/components/providers/session-provider";
import { Badge, Skeleton } from "@/components/ui";
import { SOURCES_PAGE, t } from "@/lib/copy";
import { SERVICES, lifeEventById } from "@/lib/domain/catalog";
import { SOURCES } from "@/lib/domain/sources";
import type { Lang, ServiceDef, Source } from "@/lib/domain/types";
import { cn, formatDate } from "@/lib/format";

type RuleEntry = {
  id: string;
  service: ServiceDef;
  source?: Source;
};

export default function SourcesPage() {
  const { lang, loading } = useSession();
  const [sourceQuery, setSourceQuery] = useState("");
  const [ruleQuery, setRuleQuery] = useState("");

  const rules = useMemo(() => {
    const map = new Map<string, RuleEntry>();
    for (const service of SERVICES) {
      for (const ruleId of service.ruleIds) {
        if (!map.has(ruleId)) {
          map.set(ruleId, { id: ruleId, service, source: SOURCES.find((source) => source.id === service.sourceIds[0]) });
        }
      }
    }
    return Array.from(map.values());
  }, []);

  const filteredRules = useMemo(() => {
    const query = ruleQuery.trim().toLowerCase();
    if (!query) return rules;
    return rules.filter((rule) => {
      const service = rule.service;
      return (
        rule.id.toLowerCase().includes(query) ||
        service.title[lang].toLowerCase().includes(query) ||
        service.short[lang].toLowerCase().includes(query) ||
        service.authority.toLowerCase().includes(query)
      );
    });
  }, [rules, ruleQuery, lang]);

  const filteredSources = useMemo(() => {
    const query = sourceQuery.trim().toLowerCase();
    if (!query) return SOURCES;
    return SOURCES.filter((source) => {
      return (
        source.label[lang].toLowerCase().includes(query) ||
        source.label.fr.toLowerCase().includes(query) ||
        source.authority.toLowerCase().includes(query) ||
        source.id.toLowerCase().includes(query)
      );
    });
  }, [sourceQuery, lang]);

  if (loading) {
    return (
      <div className="container-page py-6">
        <Skeleton className="h-40 rounded-4xl" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((index) => <Skeleton key={index} className="h-48 rounded-3xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-6 sm:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-emerald">{t(SOURCES_PAGE.eyebrow, lang)}</p>
          <h1 className="display-title mt-2 max-w-3xl text-[clamp(2rem,4vw,3.1rem)]">{t(SOURCES_PAGE.title, lang)}</h1>
          <p className="mt-2 max-w-2xl text-[0.84rem] leading-6 text-muted">{t(SOURCES_PAGE.lead, lang)}</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-mint bg-mint-soft/60 px-3 py-2">
          <ShieldCheck className="size-4 text-emerald" />
          <div>
            <p className="text-[0.55rem] font-bold uppercase tracking-[0.08em] text-emerald">{t(SOURCES_PAGE.modelAmounts, lang)}</p>
            <p className="font-display text-[1.25rem] leading-none text-forest">0</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { label: t(SOURCES_PAGE.sourceCount, lang), value: SOURCES.length, icon: Landmark, tone: "bg-mint-soft text-forest" },
          { label: t(SOURCES_PAGE.ruleCount, lang), value: rules.length, icon: Scale, tone: "bg-gold-soft text-[#7d5a16]" },
          { label: t(SOURCES_PAGE.modelAmounts, lang), value: 0, icon: Sparkles, tone: "bg-coral-soft text-[#9d3d25]" },
        ].map((stat) => {
          const StatIcon = stat.icon;
          return (
            <div key={stat.label} className="surface flex items-center gap-3 p-4">
              <span className={cn("flex size-10 items-center justify-center rounded-2xl", stat.tone)}>
                <StatIcon className="size-4.5" />
              </span>
              <div>
                <p className="font-display text-[1.7rem] leading-none text-forest-deep">{stat.value}</p>
                <p className="mt-1 text-[0.55rem] font-semibold uppercase tracking-[0.08em] text-muted">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <section className="mt-4 surface p-5 sm:p-6" data-tour="sources-pipeline">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-emerald">{t(COMMON_POLICY, lang)}</p>
            <h2 className="mt-1 font-display text-[1.5rem] tracking-[-0.025em] text-forest-deep">{t(SOURCES_PAGE.architectureTitle, lang)}</h2>
          </div>
          <span className="flex size-10 items-center justify-center rounded-2xl bg-forest text-lime">
            <FileCode2 className="size-4.5" />
          </span>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-5">
          {SOURCES_PAGE.architectureSteps.map((step, index) => (
            <div key={step.title.en} className="relative rounded-2xl border border-line-soft bg-paper-soft/60 p-3.5">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-forest font-mono text-[0.58rem] font-bold text-lime">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {index < SOURCES_PAGE.architectureSteps.length - 1 ? <ArrowRight className="ml-auto hidden size-3 text-muted/35 lg:block rtl:rotate-180" /> : null}
              </div>
              <p className="mt-2.5 text-[0.72rem] font-bold text-forest-deep">{step.title[lang]}</p>
              <p className="mt-1 text-[0.58rem] leading-5 text-muted">{step.body[lang]}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-line-soft bg-cream/50 px-3 py-2.5">
          <Badge tone="outline">{lang === "ar" ? "النموذج يروي" : lang === "en" ? "The model narrates" : "Le modèle raconte"}</Badge>
          <ArrowRight className="size-3 text-muted/40 rtl:rotate-180" />
          <Badge tone="emerald">{lang === "ar" ? "الكتالوج يثبت" : lang === "en" ? "The catalog proves" : "Le catalogue prouve"}</Badge>
          <ArrowRight className="size-3 text-muted/40 rtl:rotate-180" />
          <Badge tone="gold">{lang === "ar" ? "المنفذ يوقّع" : lang === "en" ? "The executor signs" : "L'exécuteur signe"}</Badge>
          <span className="ms-auto hidden text-[0.52rem] text-muted/60 sm:block">{t(SOURCES_PAGE.ruleSources, lang)}</span>
        </div>
      </section>

      <section className="mt-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-emerald">{t(SOURCES_PAGE.rulesTitle, lang)}</p>
            <h2 className="mt-1 font-display text-[1.6rem] tracking-[-0.02em] text-forest-deep">{t(SOURCES_PAGE.rulesTitle, lang)}</h2>
            <p className="mt-1 text-[0.7rem] leading-5 text-muted">{t(SOURCES_PAGE.rulesLead, lang)}</p>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted/60" />
            <input
              value={ruleQuery}
              onChange={(event) => setRuleQuery(event.target.value)}
              placeholder={t(SOURCES_PAGE.searchRules, lang)}
              className="h-10 w-full rounded-xl border border-line bg-paper pe-9 ps-9 text-[0.7rem] text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-forest/35"
            />
            {ruleQuery ? (
              <button onClick={() => setRuleQuery("")} className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink" aria-label={t(COMMON_CLOSE, lang)}>
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-3 overflow-hidden rounded-3xl border border-line-soft bg-paper">
          <div className="hidden grid-cols-[7rem_1.3fr_1fr_8rem] gap-3 border-b border-line-soft bg-paper-soft/70 px-4 py-2.5 text-[0.5rem] font-bold uppercase tracking-[0.1em] text-muted lg:grid">
            <span>{t(COMMON_RULE, lang)}</span>
            <span>{t(COMMON_SERVICE, lang)}</span>
            <span>{t(COMMON_AUTHORITY, lang)}</span>
            <span>{t(SOURCES_PAGE.eventLabel, lang)}</span>
          </div>
          <div className="divide-y divide-line-soft/60">
            {filteredRules.length === 0 ? (
              <p className="px-4 py-10 text-center text-[0.66rem] text-muted">{t(SOURCES_PAGE.noResults, lang)}</p>
            ) : (
              filteredRules.map((rule) => {
                const event = lifeEventById(rule.service.lifeEventId);
                return (
                  <div key={rule.id} className="grid gap-1.5 px-4 py-3 transition-colors hover:bg-cream/40 lg:grid-cols-[7rem_1.3fr_1fr_8rem] lg:items-center lg:gap-3">
                    <code className="w-fit rounded-md bg-cream-deep/60 px-1.5 py-0.5 font-mono text-[0.52rem] font-bold text-forest">{rule.id}</code>
                    <div className="min-w-0">
                      <p className="truncate text-[0.65rem] font-semibold text-ink-soft">{rule.service.short[lang] || rule.service.short.fr}</p>
                      <p className="truncate text-[0.52rem] text-muted">{rule.service.title[lang] || rule.service.title.fr}</p>
                    </div>
                    <div className="flex min-w-0 items-center gap-1.5 text-[0.55rem] text-muted">
                      {rule.source ? (
                        <a href={rule.source.url} target="_blank" rel="noreferrer" className="inline-flex min-w-0 items-center gap-1 hover:text-emerald hover:underline">
                          <span className="truncate">{rule.source.authority}</span>
                          <ExternalLink className="size-2.5 shrink-0" />
                        </a>
                      ) : (
                        <span className="truncate">{rule.service.authority}</span>
                      )}
                    </div>
                    <Badge tone="outline" className="w-fit px-1.5 py-0.5 text-[0.48rem]">{event?.title[lang] || rule.service.lifeEventId}</Badge>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-emerald">{t(SOURCES_PAGE.sourcesTitle, lang)}</p>
            <h2 className="mt-1 font-display text-[1.6rem] tracking-[-0.02em] text-forest-deep">{t(SOURCES_PAGE.sourcesTitle, lang)}</h2>
            <p className="mt-1 text-[0.7rem] leading-5 text-muted">{t(SOURCES_PAGE.sourcesLead, lang)}</p>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted/60" />
            <input
              value={sourceQuery}
              onChange={(event) => setSourceQuery(event.target.value)}
              placeholder={t(SOURCES_PAGE.searchSources, lang)}
              className="h-10 w-full rounded-xl border border-line bg-paper pe-9 ps-9 text-[0.7rem] text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-forest/35"
            />
            {sourceQuery ? (
              <button onClick={() => setSourceQuery("")} className="absolute end-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink" aria-label={t(COMMON_CLOSE, lang)}>
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredSources.length === 0 ? (
            <p className="col-span-full rounded-3xl border border-dashed border-line px-4 py-10 text-center text-[0.66rem] text-muted">{t(SOURCES_PAGE.noResults, lang)}</p>
          ) : (
            filteredSources.map((source) => (
              <a
                key={source.id}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="group surface flex items-start gap-3 p-4 transition-all hover:-translate-y-0.5 hover:border-forest/20 hover:shadow-soft"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-cream-deep/60 text-forest">
                  <Landmark className="size-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-[0.56rem] font-bold uppercase tracking-[0.08em] text-emerald">{source.authority}</p>
                    <ExternalLink className="size-2.5 shrink-0 text-muted/40 transition-colors group-hover:text-emerald" />
                  </div>
                  <p className="mt-1 text-[0.68rem] font-semibold leading-5 text-ink-soft">{source.label[lang] || source.label.fr}</p>
                  <p className="mt-1.5 text-[0.48rem] text-muted/60">{t(SOURCES_PAGE.checked, lang)} {formatDate(source.checkedAt, lang)}</p>
                </div>
              </a>
            ))
          )}
        </div>
        <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-cream/50 px-3 py-2 text-[0.56rem] leading-5 text-muted">
          <Filter className="mt-0.5 size-3 shrink-0" />
          {t(SOURCES_PAGE.sourceNote, lang)}
        </p>
      </section>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <section className="surface p-5">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-mint-soft text-forest">
              <ShieldCheck className="size-4" />
            </span>
            <div>
              <p className="text-[0.58rem] font-bold uppercase tracking-[0.12em] text-emerald">{t(SOURCES_PAGE.guardrailsTitle, lang)}</p>
              <p className="text-[0.6rem] text-muted">{t(SOURCES_PAGE.guardrailsLead, lang)}</p>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {SOURCES_PAGE.guardrails.map((guardrail, index) => (
              <div key={guardrail.en} className="flex items-start gap-2.5 rounded-xl border border-line-soft bg-paper-soft/60 px-3 py-2.5">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-mint text-forest">
                  <Check className="size-3" strokeWidth={2.5} />
                </span>
                <p className="text-[0.62rem] leading-5 text-ink-soft">{t(guardrail, lang)}</p>
                <span className="ms-auto font-mono text-[0.46rem] text-muted/40">{String(index + 1).padStart(2, "0")}</span>
              </div>
            ))}
          </div>
          <Link href="/chat" className="mt-3 inline-flex items-center gap-1 text-[0.62rem] font-bold text-emerald hover:underline">
            {t(SOURCES_PAGE.guardrailsLead, lang).split(".")[0]}
            <ArrowRight className="size-3 rtl:rotate-180" />
          </Link>
        </section>

        <section className="relative overflow-hidden rounded-4xl bg-forest p-5 text-paper sm:p-6 noise">
          <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-lime/15 blur-3xl" aria-hidden />
          <div className="relative">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-paper/10 text-lime">
              <BookOpen className="size-4.5" />
            </span>
            <h2 className="mt-4 font-display text-[1.55rem] leading-7 tracking-[-0.025em]">{t(SOURCES_PAGE.disclaimerTitle, lang)}</h2>
            <p className="mt-2 text-[0.68rem] leading-6 text-paper/65">{t(SOURCES_PAGE.disclaimerLead, lang)}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-paper/10 bg-paper/5 px-3 py-2">
                <p className="text-[0.46rem] font-bold uppercase tracking-[0.1em] text-paper/40">{t(SOURCES_PAGE.sourceCount, lang)}</p>
                <p className="mt-1 font-display text-[1.2rem] text-paper">{SOURCES.length}</p>
              </div>
              <div className="rounded-xl border border-paper/10 bg-paper/5 px-3 py-2">
                <p className="text-[0.46rem] font-bold uppercase tracking-[0.1em] text-paper/40">{t(SOURCES_PAGE.ruleCount, lang)}</p>
                <p className="mt-1 font-display text-[1.2rem] text-lime">{rules.length}</p>
              </div>
            </div>
            <p className="mt-4 flex items-start gap-1.5 text-[0.52rem] leading-4 text-paper/40">
              <Calculator className="mt-0.5 size-3 shrink-0" />
              {t(SOURCES_PAGE.sourceNote, lang)}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

const COMMON_POLICY = {
  fr: "Architecture de décision",
  ar: "هندسة القرار",
  darija: "Architecture dyal décision",
  en: "Decision architecture",
};

const COMMON_CLOSE = { fr: "Fermer", ar: "إغلاق", darija: "Sedd", en: "Close" };
const COMMON_RULE = { fr: "Règle", ar: "القاعدة", darija: "Règle", en: "Rule" };
const COMMON_SERVICE = { fr: "Service", ar: "الخدمة", darija: "Service", en: "Service" };
const COMMON_AUTHORITY = { fr: "Autorité", ar: "الجهة", darija: "Autorité", en: "Authority" };
