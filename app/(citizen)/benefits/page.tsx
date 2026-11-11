"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Calculator,
  ChevronRight,
  Coins,
  ExternalLink,
  HeartPulse,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useActivePlan, useSession } from "@/components/providers/session-provider";
import { Badge, Button, EmptyState, Skeleton } from "@/components/ui";
import { Icon } from "@/components/icon";
import { BENEFITS, CHAT, COMMON, STATUS_LABEL, t } from "@/lib/copy";
import { benefitsForEvent, lifeEventById, servicesForEvent, serviceById } from "@/lib/domain/catalog";
import { sourceById } from "@/lib/domain/sources";
import type { Benefit, BenefitStatus, Lang } from "@/lib/domain/types";
import { cn, formatCadence, formatDate, formatMoney } from "@/lib/format";

type Filter = "all" | "eligible" | "applied" | "excluded";

const BABY_BENEFIT_IDS = new Set(benefitsForEvent("new_baby").map((benefit) => benefit.id));

export default function BenefitsPage() {
  const { snapshot, loading, lang, scanBenefits, scanningBenefits, sendMessage, pushToast } = useSession();
  const router = useRouter();
  const plan = useActivePlan();
  const [filter, setFilter] = useState<Filter>("all");
  const [preparing, setPreparing] = useState<string | null>(null);

  const babyBenefits = useMemo(
    () => (snapshot?.benefits ?? []).filter((benefit) => BABY_BENEFIT_IDS.has(benefit.id)),
    [snapshot?.benefits],
  );

  if (loading || !snapshot) {
    return (
      <div className="container-page py-6">
        <Skeleton className="h-48 rounded-4xl" />
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-72 rounded-4xl" />
          <Skeleton className="h-72 rounded-4xl" />
        </div>
      </div>
    );
  }

  const open = babyBenefits.filter((benefit) => benefit.status === "ELIGIBLE" || benefit.status === "APPLIED");
  const oneOff = open.filter((benefit) => benefit.cadence === "ONE_OFF").reduce((sum, benefit) => sum + benefit.amount, 0);
  const monthly = open.filter((benefit) => benefit.cadence === "MONTHLY").reduce((sum, benefit) => sum + benefit.amount, 0);
  const yearly = oneOff + monthly * 12;
  const fees = plan?.totalCost ?? 0;
  const net = yearly - fees;

  const filtered = babyBenefits.filter((benefit) => {
    if (filter === "all") return true;
    if (filter === "eligible") return benefit.status === "ELIGIBLE";
    if (filter === "applied") return benefit.status === "APPLIED";
    return benefit.status === "NOT_ELIGIBLE";
  });

  const prepareEvent = async (eventId: string, title: string) => {
    const event = lifeEventById(eventId as Parameters<typeof lifeEventById>[0]);
    if (!event) return;
    setPreparing(eventId);
    const reply = await sendMessage(`${title} ${event.triggerKeywords.slice(0, 4).join(" ")}`);
    setPreparing(null);
    if (reply?.planId) {
      router.push("/chat");
    } else {
      pushToast({ tone: "warning", title: t(COMMON.error, lang) });
    }
  };

  const futureEvents = snapshot.lifeEvents.filter((event) => event.id !== "new_baby");

  return (
    <div className="container-page py-6 sm:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-emerald">{t(BENEFITS.eyebrow, lang)}</p>
          <h1 className="display-title mt-2 max-w-3xl text-[clamp(2rem,4vw,3.1rem)]">{t(BENEFITS.title, lang)}</h1>
          <p className="mt-2 max-w-2xl text-[0.84rem] leading-6 text-muted">{t(BENEFITS.lead, lang)}</p>
        </div>
        <Button onClick={() => void scanBenefits()} loading={scanningBenefits} variant="outline">
          <ScanSearch className="size-4" />
          {scanningBenefits ? t(BENEFITS.scanning, lang) : t(BENEFITS.scan, lang)}
        </Button>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <section className="relative overflow-hidden rounded-4xl bg-forest p-6 text-paper shadow-lift sm:p-8 noise" data-tour="benefits-summary">
          <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-lime/20 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-24 left-1/4 size-56 rounded-full bg-emerald/30 blur-3xl" aria-hidden />
          <div className="relative">
            <div className="flex items-center justify-between">
              <p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-lime/80">{t(BENEFITS.yearlyTitle, lang)}</p>
              <span className="flex size-9 items-center justify-center rounded-xl bg-paper/10 text-lime">
                <Wallet className="size-4" />
              </span>
            </div>
            <p className="mt-5 font-display text-[clamp(3rem,7vw,5.2rem)] leading-none tracking-[-0.045em]">{formatMoney(yearly, lang)}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-lime px-3 py-1.5 text-[0.72rem] font-bold text-forest-deep">
                {formatMoney(oneOff, lang)}
                <span className="text-[0.55rem] font-semibold text-forest/60">{t(BENEFITS.oneOffLabel, lang)}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-paper/20 bg-paper/5 px-3 py-1.5 text-[0.72rem] font-bold text-paper">
                {formatMoney(monthly, lang)}
                <span className="text-[0.55rem] font-medium text-paper/55">{t(BENEFITS.monthlyLabel, lang)}</span>
              </span>
            </div>
            <div className="mt-6 grid gap-2 sm:grid-cols-3">
              {[
                { label: t(BENEFITS.oneOffLabel, lang), value: formatMoney(oneOff, lang) },
                { label: t(BENEFITS.monthlyLabel, lang), value: formatMoney(monthly, lang) },
                { label: t(BENEFITS.feesLabel, lang), value: formatMoney(fees, lang) },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-paper/10 bg-paper/5 px-3 py-2.5">
                  <p className="text-[0.5rem] font-bold uppercase tracking-[0.1em] text-paper/45">{item.label}</p>
                  <p className="mt-1 text-[0.85rem] font-bold text-paper">{item.value}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 flex items-start gap-1.5 text-[0.6rem] leading-5 text-paper/50">
              <Calculator className="mt-0.5 size-3 shrink-0 text-lime/70" />
              {t(BENEFITS.estimateNote, lang)}
            </p>
          </div>
        </section>

        <section className="surface relative overflow-hidden p-6">
          <div className="flex items-center justify-between">
            <p className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-muted">{t(BENEFITS.netLabel, lang)}</p>
            <Badge tone="emerald" dot>{open.length} {t(BENEFITS.rightsConfirmed, lang)}</Badge>
          </div>
          <p className="mt-4 font-display text-[clamp(2.3rem,4vw,3.4rem)] leading-none tracking-[-0.04em] text-forest-deep">{formatMoney(net, lang)}</p>
          <p className="mt-2 text-[0.7rem] leading-5 text-muted">
            {lang === "ar"
              ? "بعد خصم الرسوم الرسمية. المبالغ تقديرية ويعيد المحرك حسابها."
              : lang === "en"
                ? "After official fees. Amounts are estimates recomputed by the policy engine."
                : "Après frais officiels. Les montants sont des estimations recalculées par le moteur."}
          </p>

          <div className="mt-5 space-y-3">
            {[
              { label: t(BENEFITS.oneOffLabel, lang), value: oneOff, tone: "bg-forest", max: Math.max(yearly, 1) },
              { label: `${t(BENEFITS.monthlyLabel, lang)} × 12`, value: monthly * 12, tone: "bg-emerald", max: Math.max(yearly, 1) },
            ].map((row) => (
              <div key={row.label}>
                <div className="flex items-center justify-between text-[0.62rem]">
                  <span className="text-muted">{row.label}</span>
                  <span className="font-bold text-ink">{formatMoney(row.value, lang)}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-cream-deep">
                  <div className={cn("h-full rounded-full", row.tone)} style={{ width: `${Math.max(3, (row.value / row.max) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-mint bg-mint-soft/70 p-3">
            <p className="flex items-start gap-1.5 text-[0.6rem] leading-5 text-forest/80">
              <ShieldCheck className="mt-0.5 size-3 shrink-0 text-emerald" />
              {t(BENEFITS.excludedLead, lang)}
            </p>
          </div>

          <Link href="/chat" className="mt-4 block">
            <Button variant="soft" size="sm" className="w-full justify-between">
              {t(COMMON.open, lang)} · {t(CHAT.panelChat, lang)}
              <ArrowRight className="size-3.5 rtl:rotate-180" />
            </Button>
          </Link>
        </section>
      </div>

      <section className="mt-4 surface p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-emerald">{t(BENEFITS.explainerTitle, lang)}</p>
            <h2 className="mt-1 font-display text-[1.5rem] tracking-[-0.02em] text-forest-deep">{t(BENEFITS.explainerTitle, lang)}</h2>
          </div>
          <span className="hidden size-10 items-center justify-center rounded-2xl bg-gold-soft text-[#7d5a16] sm:flex">
            <Calculator className="size-4.5" />
          </span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.explainerSteps.map((step, index) => (
            <div key={step.en} className="rounded-2xl border border-line-soft bg-paper-soft/60 p-3.5">
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-lg bg-forest font-mono text-[0.55rem] font-bold text-lime">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="h-px flex-1 bg-line" />
              </div>
              <p className="mt-2.5 text-[0.68rem] leading-5 text-ink-soft">{t(step, lang)}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-[1.6rem] tracking-[-0.025em] text-forest-deep">
            {filter === "excluded" ? t(BENEFITS.excludedTitle, lang) : t(BENEFITS.activeTitle, lang)}
          </h2>
          <p className="mt-1 text-[0.7rem] text-muted">
            {babyBenefits.length} {lang === "ar" ? "حقوق تم فحصها" : lang === "en" ? "benefits scanned" : "droits analysés"}
          </p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-2xl border border-line-soft bg-paper-soft p-1">
          {([
            ["all", BENEFITS.filterAll],
            ["eligible", BENEFITS.filterEligible],
            ["applied", BENEFITS.filterApplied],
            ["excluded", BENEFITS.filterExcluded],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={cn(
                "rounded-xl px-3 py-1.5 text-[0.72rem] font-semibold transition-colors",
                filter === value ? "bg-forest text-paper" : "text-muted hover:text-ink",
              )}
            >
              {t(label, lang)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        {filtered.length === 0 ? (
          <EmptyState className="lg:col-span-2" icon={<Coins className="size-5" />} title={t(BENEFITS.emptyFilter, lang)} />
        ) : (
          filtered.map((benefit) => (
            <BenefitCard key={benefit.id} benefit={benefit} lang={lang} highlight={benefit.status === "NOT_ELIGIBLE"} />
          ))
        )}
      </div>

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-emerald">{t(BENEFITS.futureTitle, lang)}</p>
            <h2 className="mt-1 font-display text-[1.6rem] tracking-[-0.02em] text-forest-deep">{t(BENEFITS.futureTitle, lang)}</h2>
            <p className="mt-1 max-w-xl text-[0.72rem] leading-5 text-muted">{t(BENEFITS.futureLead, lang)}</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {futureEvents.map((event) => {
            const services = servicesForEvent(event.id);
            return (
              <div key={event.id} className="surface flex flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="flex size-10 items-center justify-center rounded-2xl bg-cream-deep/60 text-forest">
                    <Icon name={event.icon} className="size-4.5" />
                  </span>
                  <Badge tone="outline">{services.length} {t(BENEFITS.servicesIncluded, lang)}</Badge>
                </div>
                <h3 className="mt-3 font-display text-[1.15rem] tracking-[-0.02em] text-forest-deep">{event.title[lang] || event.title.fr}</h3>
                <p className="mt-1 line-clamp-2 text-[0.66rem] leading-5 text-muted">{event.tagline[lang] || event.tagline.fr}</p>
                <div className="mt-auto pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between"
                    onClick={() => void prepareEvent(event.id, event.title[lang] || event.title.fr)}
                    loading={preparing === event.id}
                  >
                    {t(BENEFITS.futureCta, lang)}
                    <ChevronRight className="size-3.5 rtl:rotate-180" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <p className="mt-6 flex items-start justify-center gap-2 text-center text-[0.58rem] leading-4 text-muted/70">
        <ShieldCheck className="mt-0.5 size-3 shrink-0" />
        {t(COMMON.simulatedData, lang)}
      </p>
    </div>
  );
}

const BENEFIT_ICON: Record<string, "coins" | "shield" | "stethoscope" | "heart" | "wallet"> = {
  ONE_OFF: "coins",
  MONTHLY: "wallet",
  ANNUAL: "coins",
  COVERAGE: "stethoscope",
};

function benefitStatusTone(status: BenefitStatus): "emerald" | "gold" | "coral" | "sky" | "neutral" {
  if (status === "APPLIED") return "emerald";
  if (status === "ELIGIBLE") return "gold";
  if (status === "NOT_ELIGIBLE") return "coral";
  if (status === "UPCOMING") return "sky";
  return "neutral";
}

function BenefitCard({ benefit, lang, highlight }: { benefit: Benefit; lang: Lang; highlight: boolean }) {
  const source = sourceById(benefit.sourceId);
  const service = benefit.serviceId ? serviceById(benefit.serviceId) : undefined;
  const amount =
    benefit.cadence === "COVERAGE"
      ? t(BENEFITS.covered, lang)
      : `${formatMoney(benefit.amount, lang)}${benefit.cadence === "ONE_OFF" ? " " : ""}${formatCadence(benefit.cadence, lang)}`;

  return (
    <article
      className={cn(
        "surface relative overflow-hidden p-4 sm:p-5",
        highlight ? "border-coral/20 bg-[#fffaf7]" : "",
        benefit.status === "ELIGIBLE" ? "border-gold/30" : "",
      )}
    >
      {benefit.status === "ELIGIBLE" ? <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-gold via-lime to-emerald" aria-hidden /> : null}
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-2xl",
            highlight ? "bg-coral-soft text-[#9d3d25]" : benefit.status === "APPLIED" ? "bg-mint text-forest" : "bg-gold-soft text-[#7d5a16]",
          )}
        >
          <Icon name={BENEFIT_ICON[benefit.cadence] ?? "coins"} className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-[0.85rem] font-bold leading-5 text-ink">{benefit.title[lang] || benefit.title.fr}</h3>
            <Badge tone={benefitStatusTone(benefit.status)} dot>
              {t(STATUS_LABEL[benefit.status], lang)}
            </Badge>
          </div>
          <p className="mt-1 text-[0.66rem] leading-5 text-muted">{benefit.short[lang] || benefit.short.fr}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-2 rounded-xl bg-cream/60 px-3 py-2">
        <div>
          <p className="text-[0.48rem] font-bold uppercase tracking-[0.1em] text-muted">{t(COMMON.amount, lang)}</p>
          <p className={cn("mt-0.5 font-display text-[1.3rem] leading-none tracking-[-0.02em]", highlight ? "text-[#9d3d25]" : "text-forest")}>
            {amount}
          </p>
        </div>
        {benefit.estimate ? <Badge tone="outline">{t(BENEFITS.estimate, lang)}</Badge> : null}
      </div>

      <div className="mt-3 flex items-start gap-2">
        <BadgeCheck className="mt-0.5 size-3.5 shrink-0 text-emerald" />
        <p className="text-[0.6rem] leading-5 text-ink-soft">{benefit.reason[lang] || benefit.reason.fr}</p>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line-soft pt-3">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span className="rounded-md bg-cream-deep/60 px-1.5 py-0.5 font-mono text-[0.48rem] text-muted">{benefit.ruleId}</span>
          {service ? <span className="truncate text-[0.52rem] text-muted">{service.short[lang] || service.short.fr}</span> : null}
        </div>
        {source ? (
          <a
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-1 text-[0.55rem] font-bold text-emerald hover:underline"
          >
            {t(BENEFITS.sourceLabel, lang)}
            <ExternalLink className="size-2.5" />
          </a>
        ) : null}
      </div>
    </article>
  );
}
