"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  FileCheck2,
  FileText,
  FolderOpen,
  ReceiptText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useActivePlan, useSession } from "@/components/providers/session-provider";
import { Badge, Button, EmptyState, ProgressBar, Skeleton } from "@/components/ui";
import { CASES, CHAT, COMMON, STATUS_LABEL, t } from "@/lib/copy";
import { cn, formatDate, formatRelativeDays } from "@/lib/format";

export default function CasesPage() {
  const { snapshot, loading, lang } = useSession();
  const activePlan = useActivePlan();
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  const cases = useMemo(
    () =>
      (snapshot?.cases ?? []).filter((item) =>
        filter === "all" ? true : filter === "active" ? item.status === "EXECUTING" : item.status === "COMPLETED",
      ),
    [snapshot?.cases, filter],
  );

  if (loading || !snapshot) {
    return (
      <div className="container-page py-6">
        <Skeleton className="h-40 rounded-4xl" />
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-56 rounded-4xl" />
          <Skeleton className="h-56 rounded-4xl" />
        </div>
      </div>
    );
  }

  const completed = snapshot.cases.filter((item) => item.status === "COMPLETED").length;
  const open = snapshot.cases.filter((item) => item.status === "EXECUTING").length;
  const deadline = snapshot.lifeEvents.find((event) => event.id === "new_baby")?.nextDeadline;

  return (
    <div className="container-page py-6 sm:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-emerald">{t(CASES.eyebrow, lang)}</p>
          <h1 className="display-title mt-2 text-[clamp(2rem,4vw,3.1rem)]">{t(CASES.title, lang)}</h1>
          <p className="mt-2 max-w-2xl text-[0.84rem] leading-6 text-muted">{t(CASES.lead, lang)}</p>
        </div>
        <Link href="/chat">
          <Button variant="outline">
            <Sparkles className="size-4" />
            {t(COMMON.open, lang)} · {t(CHAT.title, lang)}
          </Button>
        </Link>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-tour="cases-overview">
        {[
          { label: t(CASES.eyebrow, lang), value: snapshot.cases.length, icon: FolderOpen, tone: "bg-mint-soft text-forest" },
          { label: t(COMMON.executing, lang), value: open, icon: Clock3, tone: "bg-gold-soft text-[#7d5a16]" },
          { label: t(COMMON.completed, lang), value: completed, icon: Check, tone: "bg-lime-soft text-[#4c5e12]" },
          { label: t(CASES.receiptTitle, lang), value: snapshot.receipts.length, icon: ReceiptText, tone: "bg-cream-deep/70 text-ink-soft" },
        ].map((stat) => {
          const StatIcon = stat.icon;
          return (
            <div key={stat.label} className="surface flex items-center gap-3 p-4">
              <span className={cn("flex size-9 items-center justify-center rounded-xl", stat.tone)}>
                <StatIcon className="size-4" />
              </span>
              <div>
                <p className="font-display text-[1.5rem] leading-none text-forest-deep">{stat.value}</p>
                <p className="mt-1 text-[0.55rem] font-semibold uppercase tracking-[0.08em] text-muted">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {deadline ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-coral/20 bg-coral-soft/40 px-4 py-3">
          <p className="flex items-center gap-2 text-[0.68rem] font-semibold text-[#7a331f]">
            <CalendarDays className="size-4" />
            {t(COMMON.deadline, lang)} · {formatDate(deadline, lang)} · {formatRelativeDays(deadline, snapshot.demoNow, lang)}
          </p>
          <Link href="/chat" className="inline-flex items-center gap-1 text-[0.62rem] font-bold text-[#9d3d25] hover:underline">
            {t(CASES.emptyCta, lang)}
            <ArrowRight className="size-3 rtl:rotate-180" />
          </Link>
        </div>
      ) : null}

      {snapshot.cases.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<FolderOpen className="size-5" />}
            title={t(CASES.emptyTitle, lang)}
            body={t(CASES.emptyLead, lang)}
            action={<Link href="/chat"><Button>{t(CASES.emptyCta, lang)}<ArrowRight className="size-3.5 rtl:rotate-180" /></Button></Link>}
          />
          {activePlan ? (
            <div className="mx-auto mt-4 max-w-xl rounded-3xl border border-gold/25 bg-gold-soft/30 p-4">
              <p className="text-[0.55rem] font-bold uppercase tracking-[0.1em] text-[#7d5a16]">{t(CHAT.planAttached, lang)}</p>
              <p className="mt-1 font-display text-[1.2rem] text-forest-deep">{activePlan.title[lang] || activePlan.title.fr}</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-[0.6rem] text-muted">{activePlan.actions.length} {t(COMMON.services, lang)} · {t(STATUS_LABEL[activePlan.status], lang)}</p>
                <Link href="/chat" className="inline-flex items-center gap-1 text-[0.62rem] font-bold text-emerald hover:underline">
                  {t(CHAT.confirmRun, lang)}
                  <ChevronRight className="size-3 rtl:rotate-180" />
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <>
          <div className="mt-6 flex items-center justify-between gap-3">
            <h2 className="font-display text-[1.45rem] tracking-[-0.02em] text-forest-deep">{t(CASES.eyebrow, lang)}</h2>
            <div className="flex gap-1 rounded-2xl border border-line-soft bg-paper-soft p-1">
              {([
                ["all", COMMON.all],
                ["active", COMMON.executing],
                ["completed", COMMON.completed],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-[0.68rem] font-semibold transition-colors",
                    filter === value ? "bg-forest text-paper" : "text-muted hover:text-ink",
                  )}
                >
                  {t(label, lang)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {cases.length === 0 ? (
              <EmptyState className="lg:col-span-2" icon={<FolderOpen className="size-5" />} title={t(CASES.notFound, lang)} />
            ) : (
              cases.map((caseFile) => {
                const done = caseFile.actions.filter((action) => action.status === "DONE").length;
                const progress = caseFile.actions.length > 0 ? (done / caseFile.actions.length) * 100 : 0;
                const receipt = snapshot.receipts.find((item) => item.id === caseFile.receiptId);
                return (
                  <Link
                    key={caseFile.id}
                    href={`/cases/${caseFile.id}`}
                    className="group surface flex flex-col p-5 transition-all hover:-translate-y-0.5 hover:border-forest/20 hover:shadow-lift"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl", caseFile.status === "COMPLETED" ? "bg-mint text-forest" : "bg-gold-soft text-[#7d5a16]")}>
                          <FileCheck2 className="size-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-mono text-[0.52rem] font-bold uppercase tracking-[0.08em] text-muted">{caseFile.reference}</p>
                          <h3 className="mt-1 truncate font-display text-[1.25rem] tracking-[-0.02em] text-forest-deep">{caseFile.title[lang] || caseFile.title.fr}</h3>
                        </div>
                      </div>
                      <Badge tone={caseFile.status === "COMPLETED" ? "emerald" : "gold"} dot>{t(STATUS_LABEL[caseFile.status], lang)}</Badge>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-[0.58rem]">
                        <span className="text-muted">{done}/{caseFile.actions.length} {t(CASES.servicesDone, lang)}</span>
                        <span className="font-mono text-muted/60">{Math.round(progress)}%</span>
                      </div>
                      <ProgressBar value={progress} className="mt-1.5" tone={caseFile.status === "COMPLETED" ? "emerald" : "lime"} />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[0.55rem] text-muted">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="size-2.5" />
                        {t(CASES.opened, lang)} {formatDate(caseFile.openedAt, lang)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <FileText className="size-2.5" />
                        {caseFile.documentIds.length} {t(CASES.documentsGenerated, lang)}
                      </span>
                      {receipt ? (
                        <span className="inline-flex items-center gap-1 text-emerald">
                          <ReceiptText className="size-2.5" />
                          {receipt.code}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-auto flex items-center justify-between border-t border-line-soft pt-3">
                      <p className="flex items-center gap-1 text-[0.55rem] text-muted">
                        <ShieldCheck className="size-3 text-emerald" />
                        {t(COMMON.consent, lang)} · {t(COMMON.audit, lang)}
                      </p>
                      <span className="inline-flex items-center gap-0.5 text-[0.62rem] font-bold text-forest">
                        {t(CASES.openCase, lang)}
                        <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </>
      )}

      <p className="mt-6 flex items-start justify-center gap-2 text-center text-[0.58rem] leading-4 text-muted/70">
        <ShieldCheck className="mt-0.5 size-3 shrink-0" />
        {t(COMMON.simulatedData, lang)}
      </p>
    </div>
  );
}
