"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  FileCheck2,
  HeartHandshake,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useActivePlan, useSession } from "@/components/providers/session-provider";
import { Avatar, Badge, Button, EmptyState, ProgressRing, Skeleton } from "@/components/ui";
import { Icon } from "@/components/icon";
import { PlanActionRow } from "@/components/plan-view";
import { COMMON, SPACE, STATUS_LABEL, t } from "@/lib/copy";
import { daysUntil, formatDate, formatDateLong, formatMoney } from "@/lib/format";
import { cn } from "@/lib/format";

export default function SpacePage() {
  const { snapshot, loading, lang, requestHandoff, pushToast } = useSession();
  const plan = useActivePlan();

  if (loading || !snapshot) {
    return (
      <div className="container-page py-6">
        <Skeleton className="h-64 w-full rounded-4xl" />
        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((index) => <Skeleton key={index} className="h-24 rounded-3xl" />)}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
          <Skeleton className="h-80 rounded-4xl" />
          <Skeleton className="h-80 rounded-4xl" />
        </div>
      </div>
    );
  }

  const event = snapshot.lifeEvents.find((item) => item.id === "new_baby");
  const adam = snapshot.household.find((person) => person.relation === "CHILD");
  const deadline = event?.nextDeadline ?? "2026-12-07";
  const daysLeft = daysUntil(deadline, snapshot.demoNow);
  const eligible = snapshot.benefits.filter((benefit) => benefit.status === "ELIGIBLE" || benefit.status === "APPLIED");
  const excluded = snapshot.benefits.filter((benefit) => benefit.status === "NOT_ELIGIBLE");
  const oneOff = eligible.filter((b) => b.cadence === "ONE_OFF").reduce((sum, b) => sum + b.amount, 0);
  const monthly = eligible.filter((b) => b.cadence === "MONTHLY").reduce((sum, b) => sum + b.amount, 0);
  const yearly = oneOff + monthly * 12;
  const nextAppointments = [
    { date: "2026-11-12", time: "10:30", label: t(SPACE.appointmentDeclaration, lang), place: "Commune de Casablanca — Maârif", tone: "emerald" },
    { date: "2026-11-17", time: "09:30", label: t(SPACE.appointmentVaccine, lang), place: "CSB Maârif", tone: "sky" },
    { date: "2026-11-20", time: "—", label: t(SPACE.appointmentCertificate, lang), place: "Watiqa · registered mail", tone: "gold" },
    { date: deadline, time: "—", label: t(SPACE.deadlineLabel, lang), place: "30-day legal limit", tone: "coral" },
  ];

  const handoff = async () => {
    const ticket = await requestHandoff();
    if (ticket) {
      pushToast({
        tone: "info",
        title: `${t(COMMON.human, lang)} · ${ticket.id}`,
        description: lang === "ar" ? `الترتيب ${ticket.queue} · الانتظار 4 دقائق` : lang === "en" ? `Queue ${ticket.queue} · about 4 minutes` : `File d'attente ${ticket.queue} · environ 4 minutes`,
      });
    }
  };

  return (
    <div className="container-page py-6 sm:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-emerald">{t(SPACE.demoNow, lang)}</p>
          <h1 className="display-title mt-2 text-[clamp(2rem,4vw,2.9rem)]">{t(SPACE.greeting, lang)}</h1>
          <p className="mt-2 max-w-xl text-[0.82rem] text-muted">{t(SPACE.subGreeting, lang)}</p>
        </div>
        <Link href="/chat">
          <Button variant="primary">
            <MessageSquare className="size-4" />
            {t(SPACE.openAgent, lang)}
            <ArrowRight className="size-3.5 rtl:rotate-180" />
          </Button>
        </Link>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.45fr_0.55fr]">
        <section className="relative overflow-hidden rounded-4xl border border-line-soft bg-paper p-5 shadow-card sm:p-7 noise" data-tour="space-overview">
          <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-lime/30 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 size-64 rounded-full bg-mint/60 blur-3xl" aria-hidden />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-lg">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="coral" dot>{t(SPACE.activeEvent, lang)}</Badge>
                <Badge tone="outline">{formatDate(event?.triggeredAt ?? "2026-11-07", lang)}</Badge>
              </div>
              <h2 className="display-title mt-4 text-[clamp(2.3rem,5vw,3.7rem)] text-forest-deep">
                {t(SPACE.babyTitle, lang)}
                <span className="ml-2 inline-block align-middle text-[0.9rem] font-sans font-bold text-coral">
                  {lang === "ar" ? "3 أيام" : lang === "en" ? "3 days old" : "3 jours"}
                </span>
              </h2>
              <p className="mt-3 max-w-md text-[0.82rem] leading-6 text-ink-soft">{t(SPACE.babyLead, lang)}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/chat">
                  <Button size="sm">
                    <Sparkles className="size-3.5" />
                    {t(SPACE.openAgent, lang)}
                  </Button>
                </Link>
                <Link href="/chat">
                  <Button size="sm" variant="outline">
                    {t(SPACE.reviewPlan, lang)}
                    <ChevronRight className="size-3.5 rtl:rotate-180" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-4 rounded-3xl border border-line-soft bg-paper/70 p-4 backdrop-blur-sm sm:flex-col sm:gap-2">
              <ProgressRing value={Math.max(0, Math.min(100, ((30 - daysLeft) / 30) * 100))} size={104} stroke={7}>
                <span className="font-display text-[1.9rem] leading-none tracking-[-0.03em] text-forest">{daysLeft}</span>
                <span className="text-[0.52rem] font-bold uppercase tracking-[0.1em] text-muted">{t(SPACE.daysLeft, lang)}</span>
              </ProgressRing>
              <div className="text-left sm:text-center">
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-muted">{t(SPACE.declarationDeadline, lang)}</p>
                <p className="mt-0.5 text-[0.78rem] font-bold text-forest">{formatDate(deadline, lang)}</p>
              </div>
            </div>
          </div>

          <div className="relative mt-6 grid gap-2 border-t border-line/60 pt-4 sm:grid-cols-3">
            {[
              { icon: AdamIcon, label: lang === "ar" ? "آدم مسجل كطفل" : lang === "en" ? "Adam in the household" : "Adam dans le foyer" },
              { icon: ShieldCheck, label: lang === "ar" ? "6 وثائق محققة" : lang === "en" ? "6 verified documents" : "6 documents vérifiés" },
              { icon: Sparkles, label: plan ? `${plan.actions.length} ${t(COMMON.services, lang)} · 0 ${lang === "ar" ? "استمارة" : lang === "en" ? "forms" : "formulaire"}` : t(SPACE.noCase, lang) },
            ].map((item) => {
              const ItemIcon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-2 rounded-xl bg-cream/55 px-2.5 py-2">
                  <ItemIcon className="size-3.5 text-emerald" />
                  <p className="truncate text-[0.62rem] font-semibold text-ink-soft">{item.label}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-4xl bg-forest p-5 text-paper shadow-lift sm:p-6 noise">
          <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-lime/15 blur-2xl" aria-hidden />
          <div className="relative flex h-full flex-col">
            <div className="flex items-center justify-between">
              <p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-lime/80">{t(SPACE.foundTitle, lang)}</p>
              <span className="flex size-8 items-center justify-center rounded-xl bg-paper/10 text-lime">
                <Wallet className="size-4" />
              </span>
            </div>
            <p className="mt-4 font-display text-[2.4rem] leading-none tracking-[-0.035em] text-paper">{formatMoney(oneOff, lang)}</p>
            <p className="mt-1 text-[0.68rem] text-paper/60">{t(SPACE.foundOneOff, lang)}</p>
            <div className="mt-3 inline-flex w-fit items-center gap-2 rounded-full bg-lime px-3 py-1.5">
              <span className="text-[0.82rem] font-bold text-forest-deep">{formatMoney(monthly, lang)}</span>
              <span className="text-[0.58rem] font-bold text-forest/60">{t(SPACE.monthly, lang)}</span>
              <span className="text-[0.55rem] font-medium text-forest/60">· {t(SPACE.foundMonthly, lang)}</span>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl border border-paper/15 bg-paper/5 px-3 py-2">
              <span className="text-[0.55rem] uppercase tracking-[0.1em] text-paper/50">{t(SPACE.yearlyValue, lang)}</span>
              <span className="text-[0.78rem] font-bold text-lime">{formatMoney(yearly, lang)}</span>
            </div>
            <p className="mt-3 text-[0.62rem] leading-5 text-paper/55">{t(SPACE.foundNote, lang)}</p>
            <div className="mt-auto pt-4">
              <Link href="/benefits">
                <Button variant="ghost" size="sm" className="w-full justify-between text-paper/80 hover:bg-paper/10 hover:text-paper">
                  {t(SPACE.seeBenefits, lang)}
                  <ArrowRight className="size-3.5 rtl:rotate-180" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { value: snapshot.metrics.verifiedDocuments, label: t(SPACE.statsDocs, lang), icon: FileCheck2, tone: "bg-mint-soft text-forest" },
          { value: plan?.actions.length ?? 6, label: t(SPACE.statsServices, lang), icon: Sparkles, tone: "bg-lime-soft text-[#4c5e12]" },
          { value: daysLeft, label: t(SPACE.statsDeadline, lang), icon: Clock3, tone: "bg-coral-soft text-[#9d3d25]" },
          { value: snapshot.metrics.timeSavedHours, label: t(SPACE.statsSaved, lang), icon: CalendarDays, tone: "bg-gold-soft text-[#7d5a16]" },
        ].map((stat) => {
          const StatIcon = stat.icon;
          return (
            <div key={stat.label} className="surface flex items-center gap-3 p-3.5">
              <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", stat.tone)}>
                <StatIcon className="size-4" strokeWidth={1.9} />
              </span>
              <div className="min-w-0">
                <p className="font-display text-[1.4rem] leading-none tracking-[-0.02em] text-forest-deep">{stat.value}</p>
                <p className="mt-0.5 truncate text-[0.55rem] font-semibold uppercase tracking-[0.08em] text-muted">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.45fr_0.55fr]">
        <div className="space-y-4">
          <section className="surface p-5 sm:p-6" data-tour="space-plan">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-[1.4rem] tracking-[-0.02em] text-forest-deep">{t(SPACE.planTitle, lang)}</h2>
                <p className="mt-1 text-[0.72rem] text-muted">{t(SPACE.planLead, lang)}</p>
              </div>
              <Badge tone={plan?.status === "COMPLETED" ? "emerald" : "gold"} dot>
                {plan ? t(STATUS_LABEL[plan.status], lang) : t(COMMON.awaiting, lang)}
              </Badge>
            </div>

            {plan ? (
              <>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-cream/70 px-3 py-2">
                    <p className="text-[0.5rem] font-bold uppercase tracking-[0.1em] text-muted">{t(COMMON.services, lang)}</p>
                    <p className="font-display text-[1.1rem] text-forest-deep">{plan.actions.length}</p>
                  </div>
                  <div className="rounded-xl bg-cream/70 px-3 py-2">
                    <p className="text-[0.5rem] font-bold uppercase tracking-[0.1em] text-muted">{t(COMMON.fees, lang)}</p>
                    <p className="font-display text-[1.1rem] text-forest-deep">{formatMoney(plan.totalCost, lang)}</p>
                  </div>
                  <div className="rounded-xl bg-mint-soft px-3 py-2">
                    <p className="text-[0.5rem] font-bold uppercase tracking-[0.1em] text-emerald">{t(CHAT_BENEFIT_LABEL, lang)}</p>
                    <p className="font-display text-[1.1rem] text-forest">{formatMoney(plan.benefitOneOff, lang)}</p>
                  </div>
                </div>
                <div className="mt-3 divide-y divide-line-soft/60">
                  {plan.actions.map((action, index) => (
                    <PlanActionRow key={action.id} action={action} lang={lang} plan={plan} index={index} dense />
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line/60 pt-3">
                  <p className="flex items-center gap-1.5 text-[0.6rem] text-muted">
                    <ShieldCheck className="size-3 text-emerald" />
                    {t(SPACE.trustConsent, lang)}
                  </p>
                  <Link href="/chat">
                    <Button size="sm">
                      {plan.status === "COMPLETED" ? t(SPACE.goToCase, lang) : t(SPACE.reviewPlan, lang)}
                      <ArrowRight className="size-3.5 rtl:rotate-180" />
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <EmptyState
                className="mt-4"
                icon={<Sparkles className="size-5" />}
                title={t(SPACE.noCase, lang)}
                action={<Link href="/chat"><Button size="sm">{t(SPACE.openAgent, lang)}</Button></Link>}
              />
            )}
          </section>

          <section className="surface p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-[1.4rem] tracking-[-0.02em] text-forest-deep">{t(SPACE.nextMoves, lang)}</h2>
                <p className="mt-1 text-[0.72rem] text-muted">{formatDateLong(snapshot.demoNow, lang)}</p>
              </div>
              <Badge tone="outline"><CalendarDays className="size-3" /> 4</Badge>
            </div>
            <div className="mt-4 space-y-2">
              {nextAppointments.map((appointment) => (
                <div key={appointment.label} className="flex items-center gap-3 rounded-2xl border border-transparent px-2 py-2 transition-colors hover:border-line-soft hover:bg-cream/40">
                  <div
                    className={cn(
                      "flex w-12 shrink-0 flex-col items-center rounded-xl py-1.5",
                      appointment.tone === "emerald"
                        ? "bg-mint text-forest"
                        : appointment.tone === "sky"
                          ? "bg-sky-soft text-[#336379]"
                          : appointment.tone === "gold"
                            ? "bg-gold-soft text-[#7d5a16]"
                            : "bg-coral-soft text-[#9d3d25]",
                    )}
                  >
                    <span className="text-[0.52rem] font-bold uppercase">{formatDate(appointment.date, lang, false).split(" ")[1]}</span>
                    <span className="font-display text-[1.15rem] leading-none">{formatDate(appointment.date, lang, false).split(" ")[0]}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.76rem] font-bold text-ink">{appointment.label}</p>
                    <p className="truncate text-[0.6rem] text-muted">{appointment.place}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[0.62rem] font-bold text-forest">{appointment.time}</p>
                    <p className="text-[0.52rem] text-muted">{formatRelative(appointment.date, snapshot.demoNow, lang)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <section className="surface p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-display text-[1.3rem] tracking-[-0.02em] text-forest-deep">{t(SPACE.familyTitle, lang)}</h2>
                <p className="mt-1 text-[0.68rem] leading-4.5 text-muted">{t(SPACE.familyLead, lang)}</p>
              </div>
              <span className="flex size-8 items-center justify-center rounded-xl bg-mint-soft text-forest">
                <HeartHandshake className="size-4" />
              </span>
            </div>
            <div className="mt-4 space-y-2">
              {snapshot.household.map((person, index) => (
                <div key={person.id} className="flex items-center gap-2.5">
                  <Avatar first={person.firstName} last={person.lastName} tone={person.avatarTone} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-[0.72rem] font-bold text-ink">{person.firstName} {person.lastName}</p>
                      {person.verified ? <Check className="size-3 text-emerald" /> : <span className="size-1.5 rounded-full bg-coral" />}
                    </div>
                    <p className="truncate text-[0.56rem] text-muted">
                      {person.relation === "SELF" ? "Vous" : person.relation === "SPOUSE" ? "Conjoint" : person.note?.[lang] ?? "Enfant"}
                    </p>
                  </div>
                  {index < 2 ? <span className="text-[0.5rem] font-bold uppercase tracking-[0.08em] text-muted/40">{t(SPACE.familyLink, lang)}</span> : <Badge tone="coral" className="px-2 py-0.5 text-[0.5rem]">3j</Badge>}
                </div>
              ))}
            </div>
            <Link href="/documents" className="mt-4 block">
              <Button variant="outline" size="sm" className="w-full justify-between">
                {t(SPACE.vaultTitle, lang)}
                <ArrowRight className="size-3.5 rtl:rotate-180" />
              </Button>
            </Link>
          </section>

          <section className="surface p-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-[1.3rem] tracking-[-0.02em] text-forest-deep">{t(SPACE.vaultTitle, lang)}</h2>
                <p className="mt-1 text-[0.68rem] text-muted">{t(SPACE.vaultLead, lang)}</p>
              </div>
              <Badge tone="emerald">{snapshot.metrics.verifiedDocuments}</Badge>
            </div>
            <div className="mt-3 space-y-1.5">
              {snapshot.documents.slice(0, 4).map((document) => (
                <div key={document.id} className="flex items-center gap-2 rounded-xl px-1.5 py-1.5 hover:bg-cream/40">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-cream text-forest">
                    <Icon name={document.icon} className="size-3.5" />
                  </span>
                  <p className="min-w-0 flex-1 truncate text-[0.65rem] font-semibold text-ink-soft">{document.title[lang] || document.title.fr}</p>
                  <Badge tone={document.status === "VERIFIED" ? "emerald" : "gold"} className="px-1.5 py-0.5 text-[0.48rem]">
                    {t(STATUS_LABEL[document.status], lang)}
                  </Badge>
                </div>
              ))}
            </div>
            <Link href="/documents" className="mt-3 inline-flex items-center gap-1 text-[0.64rem] font-bold text-emerald hover:underline">
              {t(SPACE.openVault, lang)}
              <ArrowRight className="size-3" />
            </Link>
          </section>

          <section className="rounded-3xl border border-line-soft bg-gold-soft/60 p-5">
            <div className="flex items-start gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-paper text-[#7d5a16]">
                <HeartHandshake className="size-4" />
              </span>
              <div>
                <h2 className="text-[0.78rem] font-bold text-[#6b4a0f]">{t(SPACE.humanTitle, lang)}</h2>
                <p className="mt-1 text-[0.65rem] leading-4.5 text-[#7d5a16]/80">{t(SPACE.humanLead, lang)}</p>
                <Button variant="outline" size="sm" className="mt-3 border-[#7d5a16]/25 bg-paper/60 text-[#6b4a0f]" onClick={() => void handoff()}>
                  {t(SPACE.talkHuman, lang)}
                  <ArrowRight className="size-3" />
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>

      <section className="mt-4 surface flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex flex-wrap items-center gap-4 text-[0.62rem] font-semibold text-muted">
          <span className="flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-emerald" /> {t(SPACE.trustPolicy, lang)}</span>
          <span className="flex items-center gap-1.5"><Check className="size-3.5 text-emerald" /> {t(SPACE.trustConsent, lang)}</span>
          <span className="flex items-center gap-1.5"><Icon name="receipt" className="size-3.5 text-emerald" /> {t(SPACE.trustAudit, lang)}</span>
        </div>
        <p className="text-[0.58rem] text-muted/60">{t(SPACE.resetHint, lang)}</p>
      </section>
    </div>
  );
}

function AdamIcon(props: Omit<React.ComponentProps<typeof Icon>, "name">) {
  return <Icon name="baby" {...props} />;
}

const CHAT_BENEFIT_LABEL = {
  fr: "Droits",
  ar: "الحقوق",
  darija: "Droits",
  en: "Benefits",
};

function formatRelative(value: string, now: string, lang: "fr" | "ar" | "darija" | "en") {
  const days = daysUntil(value, now);
  if (days === 0) return lang === "ar" ? "اليوم" : lang === "en" ? "today" : lang === "darija" ? "l youm" : "aujourd'hui";
  if (days < 0) return `${Math.abs(days)} ${lang === "ar" ? "يوم" : lang === "en" ? "d ago" : "j"}`;
  return `${days} ${lang === "ar" ? "يوم" : lang === "en" ? "days" : "j"}`;
}
