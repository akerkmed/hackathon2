"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  Circle,
  Clock3,
  ExternalLink,
  FileCheck2,
  FileText,
  FolderOpen,
  MapPin,
  ReceiptText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useSession } from "@/components/providers/session-provider";
import { Badge, Button, EmptyState, Skeleton } from "@/components/ui";
import { Icon } from "@/components/icon";
import { ActionStatusIcon, ReceiptCard, TraceList } from "@/components/plan-view";
import { BENEFITS, CASES, CHAT, COMMON, STATUS_LABEL, t } from "@/lib/copy";
import type { CaseFile, Lang, VaultDocument } from "@/lib/domain/types";
import { cn, formatDate, formatMoney } from "@/lib/format";

export default function CaseDetailPage() {
  const params = useParams<{ id: string }>();
  const { snapshot, loading, lang, requestHandoff, pushToast } = useSession();
  const caseId = decodeURIComponent(params.id ?? "");
  const caseFile = snapshot?.cases.find((item) => item.id === caseId);

  if (loading || !snapshot) {
    return (
      <div className="container-page py-6">
        <Skeleton className="h-44 rounded-4xl" />
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
          <Skeleton className="h-96 rounded-4xl" />
          <Skeleton className="h-96 rounded-4xl" />
        </div>
      </div>
    );
  }

  if (!caseFile) {
    return (
      <div className="container-page py-10">
        <EmptyState
          icon={<FolderOpen className="size-5" />}
          title={t(CASES.notFound, lang)}
          body={t(CASES.lead, lang)}
          action={<Link href="/cases"><Button variant="outline">{t(CASES.back, lang)}</Button></Link>}
        />
      </div>
    );
  }

  const receipt = snapshot.receipts.find((item) => item.id === caseFile.receiptId);
  const documents = caseFile.documentIds
    .map((id) => snapshot.documents.find((document) => document.id === id))
    .filter((document): document is VaultDocument => Boolean(document));
  const done = caseFile.actions.filter((action) => action.status === "DONE").length;
  const plan = snapshot.plans.find((item) => item.id === caseFile.planId);

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
      <Link href="/cases" className="inline-flex items-center gap-1.5 text-[0.65rem] font-semibold text-muted transition-colors hover:text-forest">
        <ArrowLeft className="size-3.5 rtl:rotate-180" />
        {t(CASES.back, lang)}
      </Link>

      <section className="relative mt-3 overflow-hidden rounded-4xl border border-line-soft bg-paper p-5 shadow-card sm:p-7 noise">
        <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-lime/20 blur-3xl" aria-hidden />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <span className={cn("flex size-14 shrink-0 items-center justify-center rounded-3xl", caseFile.status === "COMPLETED" ? "bg-forest text-lime" : "bg-gold-soft text-[#7d5a16]")}>
              <FileCheck2 className="size-6" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-mono text-[0.55rem] font-bold uppercase tracking-[0.1em] text-muted">{caseFile.reference}</p>
                <Badge tone={caseFile.status === "COMPLETED" ? "emerald" : "gold"} dot>{t(STATUS_LABEL[caseFile.status], lang)}</Badge>
              </div>
              <h1 className="display-title mt-2 text-[clamp(1.9rem,4vw,2.9rem)]">{caseFile.title[lang] || caseFile.title.fr}</h1>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-[0.62rem] text-muted">
                <span className="inline-flex items-center gap-1"><CalendarDays className="size-3" />{t(CASES.opened, lang)} {formatDate(caseFile.openedAt, lang)}</span>
                {caseFile.completedAt ? <span className="inline-flex items-center gap-1"><Check className="size-3 text-emerald" />{t(CASES.closed, lang)} {formatDate(caseFile.completedAt, lang)}</span> : null}
                <span className="inline-flex items-center gap-1"><ShieldCheck className="size-3 text-emerald" />{done}/{caseFile.actions.length} {t(CASES.servicesDone, lang)}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => void handoff()}>
              {t(CHAT.humanCta, lang)}
            </Button>
            {receipt ? (
              <Link href={`/verify/${receipt.code}`}>
                <Button size="sm">
                  <ReceiptText className="size-3.5" />
                  {t(CASES.verifyReceipt, lang)}
                </Button>
              </Link>
            ) : (
              <Link href="/chat">
                <Button size="sm">
                  <Sparkles className="size-3.5" />
                  {t(CASES.emptyCta, lang)}
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-2 gap-2 border-t border-line/60 pt-4 sm:grid-cols-4">
          {[
            { label: t(CASES.caseRef, lang), value: caseFile.reference, mono: true },
            { label: t(CASES.servicesDone, lang), value: `${done}/${caseFile.actions.length}` },
            { label: t(CASES.documentsGenerated, lang), value: String(documents.length) },
            { label: t(CASES.receiptTitle, lang), value: receipt ? receipt.code : "—", mono: true },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-cream/60 px-3 py-2">
              <p className="text-[0.48rem] font-bold uppercase tracking-[0.08em] text-muted">{item.label}</p>
              <p className={cn("mt-1 truncate text-[0.68rem] font-bold text-forest", item.mono && "font-mono text-[0.6rem]")}>{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-4">
          <section className="surface p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-emerald">{t(CASES.timelineTitle, lang)}</p>
                <h2 className="mt-1 font-display text-[1.4rem] tracking-[-0.02em] text-forest-deep">{t(CASES.timelineTitle, lang)}</h2>
              </div>
              <span className="flex size-9 items-center justify-center rounded-xl bg-mint-soft text-forest">
                <Clock3 className="size-4" />
              </span>
            </div>
            <Timeline caseFile={caseFile} lang={lang} />
          </section>

          <section className="surface p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-emerald">{t(COMMON.services, lang)}</p>
                <h2 className="mt-1 font-display text-[1.4rem] tracking-[-0.02em] text-forest-deep">{t(CASES.servicesDone, lang)}</h2>
              </div>
              <span className="flex size-9 items-center justify-center rounded-xl bg-gold-soft text-[#7d5a16]">
                <FileCheck2 className="size-4" />
              </span>
            </div>
            <div className="mt-3 divide-y divide-line-soft/60">
              {caseFile.actions.map((action, index) => (
                <div key={action.id} className="py-3 first:pt-1 last:pb-0">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-cream-deep/60 text-forest">
                      <Icon name={action.icon} className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[0.5rem] text-muted/50">{String(index + 1).padStart(2, "0")}</span>
                            <p className="text-[0.76rem] font-bold text-ink">{action.short[lang] || action.short.fr}</p>
                          </div>
                          <p className="mt-0.5 text-[0.57rem] text-muted">{action.authorityLabel[lang] || action.authorityLabel.fr}</p>
                        </div>
                        <ActionStatusIcon status={action.status} />
                      </div>

                      {action.result ? (
                        <div className="mt-2 rounded-xl bg-mint-soft/60 px-3 py-2">
                          <p className="text-[0.58rem] leading-5 text-forest">{action.result.detail[lang] || action.result.detail.fr}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-paper/70 px-1.5 py-0.5 font-mono text-[0.48rem] font-bold text-forest">{action.result.reference}</span>
                            {action.result.amount ? <span className="text-[0.52rem] font-bold text-emerald">{formatMoney(action.result.amount, lang)}</span> : null}
                          </div>
                        </div>
                      ) : null}

                      {action.result?.appointment ? (
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-line-soft bg-paper-soft px-3 py-2 text-[0.58rem] text-muted">
                          <span className="inline-flex items-center gap-1 font-semibold text-ink-soft">
                            <CalendarDays className="size-3 text-emerald" />
                            {formatDate(action.result.appointment.date, lang)} · {action.result.appointment.time}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-3" />
                            {action.result.appointment.place[lang] || action.result.appointment.place.fr}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <section className="surface p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[0.58rem] font-bold uppercase tracking-[0.12em] text-muted">{t(CASES.documentsGenerated, lang)}</p>
              <span className="text-[0.55rem] font-bold text-emerald">{documents.length}</span>
            </div>
            <div className="mt-2.5 space-y-1.5">
              {documents.length === 0 ? (
                <p className="rounded-xl border border-dashed border-line px-3 py-5 text-center text-[0.58rem] text-muted">{t(CASES.noReceipt, lang)}</p>
              ) : (
                documents.map((document) => (
                  <Link key={document.id} href="/documents" className="group flex items-start gap-2 rounded-xl border border-line-soft bg-paper-soft px-2.5 py-2 transition-colors hover:border-forest/25 hover:bg-mint-soft/30">
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-mint-soft text-forest">
                      <Icon name={document.icon} className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.62rem] font-semibold text-ink-soft">{document.title[lang] || document.title.fr}</p>
                      <p className="mt-0.5 truncate font-mono text-[0.48rem] text-muted">{document.reference}</p>
                    </div>
                    <ChevronRight className="mt-1 size-3 text-muted/40" />
                  </Link>
                ))
              )}
            </div>
            <Link href="/documents" className="mt-2.5 block">
              <Button size="sm" variant="ghost" className="w-full justify-between text-emerald">
                {t(CHAT.emptyLead, lang).split(".")[0]}
                <ArrowRight className="size-3 rtl:rotate-180" />
              </Button>
            </Link>
          </section>

          <section className="surface p-4">
            <p className="text-[0.58rem] font-bold uppercase tracking-[0.12em] text-muted">{t(CASES.receiptTitle, lang)}</p>
            {receipt ? (
              <div className="mt-2.5">
                <ReceiptCard receipt={receipt} lang={lang} citizenName={`${snapshot.citizen.firstName} ${snapshot.citizen.lastName}`} compact />
              </div>
            ) : (
              <p className="mt-2 rounded-xl border border-dashed border-line px-3 py-5 text-center text-[0.58rem] text-muted">{t(CASES.noReceipt, lang)}</p>
            )}
          </section>

          {plan ? (
            <section className="surface p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.12em] text-muted">{t(CHAT.traceTitle, lang)}</p>
                <Link href="/sources" className="inline-flex items-center gap-0.5 text-[0.52rem] font-bold text-emerald hover:underline">
                  {t(CHAT.sourcesTitle, lang)}
                  <ExternalLink className="size-2.5" />
                </Link>
              </div>
              <div className="mt-2 rounded-xl border border-line-soft bg-paper-soft p-1.5">
                <TraceList trace={plan.trace} lang={lang} dense />
              </div>
            </section>
          ) : null}

          <section className="surface p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[0.58rem] font-bold uppercase tracking-[0.12em] text-muted">{t(CASES.caseAudit, lang)}</p>
              <span className="text-[0.52rem] font-mono text-muted/50">{snapshot.audit.length}</span>
            </div>
            <div className="mt-2 space-y-1">
              {snapshot.audit.slice(0, 6).map((entry) => (
                <div key={entry.id} className="flex items-center gap-2 rounded-lg px-1.5 py-1">
                  <span className={cn("size-1.5 shrink-0 rounded-full", entry.actor === "citizen" ? "bg-gold" : entry.actor === "policy" || entry.actor === "executor" ? "bg-emerald" : "bg-sky")} />
                  <p className="min-w-0 flex-1 truncate text-[0.55rem] text-ink-soft">{entry.action.replace(/[._]/g, " ")}</p>
                  <span className="shrink-0 font-mono text-[0.46rem] text-muted/50">{formatDate(entry.at, lang, false)}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="relative overflow-hidden rounded-3xl bg-forest p-4 text-paper noise">
            <div className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-lime/15 blur-2xl" aria-hidden />
            <p className="text-[0.55rem] font-bold uppercase tracking-[0.14em] text-lime/80">{t(CASES.nextTitle, lang)}</p>
            <p className="mt-2 text-[0.66rem] leading-5 text-paper/75">{t(CASES.nextLead, lang)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/chat">
                <Button size="sm" variant="lime">
                  {t(CASES.emptyCta, lang)}
                  <ArrowRight className="size-3 rtl:rotate-180" />
                </Button>
              </Link>
              <Link href="/benefits">
                <Button size="sm" variant="ghost" className="text-paper/80 hover:bg-paper/10 hover:text-paper">
                  {t(BENEFITS.eyebrow, lang)}
                </Button>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Timeline({ caseFile, lang }: { caseFile: CaseFile; lang: Lang }) {
  return (
    <div className="mt-4">
      {caseFile.timeline.map((event, index) => {
        const tone =
          event.kind === "done"
            ? "bg-forest text-lime"
            : event.kind === "consent"
              ? "bg-gold-soft text-[#7d5a16]"
              : event.kind === "action"
                ? "bg-mint text-forest"
                : "bg-cream-deep/70 text-muted";
        return (
          <div key={event.id} className="relative flex gap-3 pb-4 last:pb-0">
            {index < caseFile.timeline.length - 1 ? <span className="absolute left-[0.9rem] top-7 h-[calc(100%-1.35rem)] w-px bg-line" aria-hidden /> : null}
            <span className={cn("relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full", tone)}>
              {event.done ? <Check className="size-3.5" strokeWidth={2.5} /> : <Circle className="size-2.5" />}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-[0.68rem] font-bold text-ink">{event.label[lang] || event.label.fr}</p>
                <span className="shrink-0 font-mono text-[0.48rem] text-muted/50">{formatDate(event.at, lang, false)}</span>
              </div>
              {event.detail ? <p className="mt-0.5 text-[0.58rem] leading-4 text-muted">{event.detail[lang] || event.detail.fr}</p> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
