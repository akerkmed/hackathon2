"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Circle,
  Clock3,
  Copy,
  ExternalLink,
  Loader2,
  ReceiptText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { Lang, Plan, PlanAction, Receipt, TraceStep } from "@/lib/domain/types";
import { formatDate, formatMoney } from "@/lib/format";
import { CHAT, COMMON, SCOPE_LABEL, t, traceLabel } from "@/lib/copy";
import { Badge, Button, ProgressBar } from "@/components/ui";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/format";

const ACTION_TONE: Record<PlanAction["status"], string> = {
  PENDING: "text-muted",
  RUNNING: "text-gold",
  DONE: "text-emerald",
  SKIPPED: "text-muted",
  FAILED: "text-coral",
};

export function ActionStatusIcon({ status, className }: { status: PlanAction["status"]; className?: string }) {
  if (status === "DONE") {
    return (
      <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full bg-mint text-forest", className)}>
        <Check className="size-3.5" strokeWidth={2.6} />
      </span>
    );
  }
  if (status === "RUNNING") {
    return (
      <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full bg-gold-soft text-[#7d5a16]", className)}>
        <Loader2 className="size-3.5 animate-spin" strokeWidth={2.4} />
      </span>
    );
  }
  if (status === "FAILED") {
    return (
      <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full bg-coral-soft text-[#9d3d25]", className)}>
        <AlertTriangle className="size-3.5" />
      </span>
    );
  }
  return (
    <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full border border-line bg-paper text-muted", className)}>
      <Circle className="size-2.5" strokeWidth={2.5} />
    </span>
  );
}

export function PlanActionRow({
  action,
  lang,
  plan,
  index,
  dense = false,
}: {
  action: PlanAction;
  lang: Lang;
  plan?: Plan;
  index?: number;
  dense?: boolean;
}) {
  const deps = action.dependsOn
    .map((id) => plan?.actions.find((item) => item.id === id)?.short[lang] ?? id)
    .filter(Boolean);

  return (
    <div
      className={cn(
        "group relative flex gap-3 rounded-2xl border border-transparent p-2.5 transition-colors hover:border-line-soft hover:bg-cream/40",
        dense ? "py-2" : "",
      )}
    >
      <div className="relative flex flex-col items-center">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl",
            action.status === "DONE" ? "bg-mint text-forest" : action.status === "RUNNING" ? "bg-gold-soft text-[#7d5a16]" : "bg-cream-deep/70 text-ink-soft",
          )}
        >
          <Icon name={action.icon} className="size-4" />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {typeof index === "number" ? (
                <span className="font-mono text-[0.55rem] font-bold text-muted/50">{String(index + 1).padStart(2, "0")}</span>
              ) : null}
              <p className={cn("truncate text-[0.78rem] font-bold", ACTION_TONE[action.status], action.status === "PENDING" && "text-ink")}>
                {action.short[lang] || action.short.fr}
              </p>
            </div>
            <p className="mt-0.5 truncate text-[0.6rem] text-muted">{action.authorityLabel[lang] || action.authorityLabel.fr}</p>
          </div>
          <ActionStatusIcon status={action.status} />
        </div>
        {!dense ? (
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.58rem] text-muted">
            {action.fee > 0 ? <span className="font-semibold text-ink-soft">{formatMoney(action.fee, lang)}</span> : <span>{t(COMMON.free, lang)}</span>}
            {action.benefitOneOff > 0 ? <span className="font-semibold text-emerald">+ {formatMoney(action.benefitOneOff, lang)}</span> : null}
            {action.benefitMonthly > 0 ? <span className="font-semibold text-emerald">+ {formatMoney(action.benefitMonthly, lang)}{t(COMMON.perMonth, lang)}</span> : null}
            {deps.length > 0 ? <span className="truncate">{t(CHAT.dependsOn, lang)}: {deps.join(", ")}</span> : null}
          </div>
        ) : null}
        {action.result && !dense ? (
          <p className="mt-1 rounded-lg bg-mint-soft px-2 py-1 text-[0.58rem] leading-4 text-forest">
            {action.result.detail[lang] || action.result.detail.fr}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function MoneyTriplet({ plan, lang, compact = false }: { plan: Plan; lang: Lang; compact?: boolean }) {
  return (
    <div className={cn("grid gap-2", compact ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-3")}>
      <div className={cn("rounded-xl border border-line-soft bg-paper-soft px-3 py-2", compact && "px-2 py-1.5")}>
        <p className="text-[0.52rem] font-bold uppercase tracking-[0.1em] text-muted">{t(CHAT.totalFees, lang)}</p>
        <p className={cn("mt-0.5 font-display tracking-[-0.02em] text-forest-deep", compact ? "text-[0.95rem]" : "text-[1.15rem]")}>{formatMoney(plan.totalCost, lang)}</p>
      </div>
      <div className={cn("rounded-xl border border-mint bg-mint-soft px-3 py-2", compact && "px-2 py-1.5")}>
        <p className="text-[0.52rem] font-bold uppercase tracking-[0.1em] text-emerald">{t(CHAT.benefitsUnlocked, lang)}</p>
        <p className={cn("mt-0.5 font-display tracking-[-0.02em] text-forest", compact ? "text-[0.95rem]" : "text-[1.15rem]")}>{formatMoney(plan.benefitOneOff, lang)}</p>
      </div>
      <div className={cn("col-span-2 rounded-xl border border-gold/25 bg-gold-soft px-3 py-2 sm:col-span-1", compact && "col-span-1 px-2 py-1.5")}>
        <p className="text-[0.52rem] font-bold uppercase tracking-[0.1em] text-[#7d5a16]">{t(COMMON.perMonth, lang)}</p>
        <p className={cn("mt-0.5 font-display tracking-[-0.02em] text-[#6b4a0f]", compact ? "text-[0.95rem]" : "text-[1.15rem]")}>{formatMoney(plan.benefitMonthly, lang)}<span className="text-[0.55rem] font-sans font-bold text-[#7d5a16]/60">{t(COMMON.perMonth, lang)}</span></p>
      </div>
    </div>
  );
}

export function PlanCompactCard({
  plan,
  lang,
  onOpen,
}: {
  plan: Plan;
  lang: Lang;
  onOpen?: () => void;
}) {
  const done = plan.actions.filter((action) => action.status === "DONE").length;
  return (
    <button onClick={onOpen} className="w-full rounded-2xl border border-line-soft bg-paper-soft p-3.5 text-left transition-all hover:border-forest/25 hover:shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-forest text-lime">
            <Sparkles className="size-3.5" />
          </span>
          <p className="text-[0.7rem] font-bold text-forest">{t(CHAT.planAttached, lang)}</p>
        </div>
        <span className="text-[0.58rem] font-semibold text-muted">{done}/{plan.actions.length}</span>
      </div>
      <div className="mt-2.5">
        <p className="text-[0.72rem] font-bold text-ink">{plan.title[lang] || plan.title.fr}</p>
        <p className="mt-1 text-[0.62rem] leading-4 text-muted">{plan.summary[lang] || plan.summary.fr}</p>
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[0.58rem] text-emerald">
          <ShieldCheck className="size-3" />
          {plan.sources.length} {t(CHAT.sourcesCount, lang)} · {Array.from(new Set(plan.actions.flatMap((action) => action.ruleIds))).length} {t(CHAT.rulesCount, lang)}
        </div>
        <span className="inline-flex items-center gap-0.5 text-[0.62rem] font-bold text-forest">
          {t(COMMON.open, lang)}
          <ChevronRight className="size-3 rtl:rotate-180" />
        </span>
      </div>
    </button>
  );
}

export function TraceList({ trace, lang, dense = false }: { trace: TraceStep[]; lang: Lang; dense?: boolean }) {
  return (
    <div className={cn("space-y-1", dense && "space-y-0.5")}>
      {trace.map((step, index) => {
        const tone =
          step.tone === "block"
            ? "bg-coral-soft text-[#9d3d25]"
            : step.tone === "warn"
              ? "bg-gold-soft text-[#7d5a16]"
              : step.tone === "info"
                ? "bg-sky-soft text-[#336379]"
                : "bg-mint text-forest";
        const params = step.params
          ? Object.entries(step.params)
              .map(([key, value]) => `${key}=${value}`)
              .join(" · ")
          : undefined;
        return (
          <div key={step.id} className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-cream/50">
            <span className="font-mono text-[0.5rem] text-muted/50">{String(index + 1).padStart(2, "0")}</span>
            <span className={cn("flex size-5 items-center justify-center rounded-md", tone)}>
              {step.tone === "block" ? <AlertTriangle className="size-3" /> : step.tone === "warn" ? <Clock3 className="size-3" /> : <Check className="size-3" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.62rem] font-semibold text-ink-soft">{traceLabel(step.code, lang)}</p>
              {params && !dense ? <p className="truncate font-mono text-[0.5rem] text-muted/60">{params}</p> : null}
            </div>
            <span className="font-mono text-[0.48rem] uppercase text-muted/45">{step.code.split(".")[0]}</span>
          </div>
        );
      })}
    </div>
  );
}

export function ScopeChips({ scopes, lang, max }: { scopes: string[]; lang: Lang; max?: number }) {
  const unique = Array.from(new Set(scopes));
  const shown = max ? unique.slice(0, max) : unique;
  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((scope) => (
        <span key={scope} className="rounded-lg border border-line bg-paper px-2 py-1 text-[0.55rem] font-semibold text-ink-soft">
          {SCOPE_LABEL[scope] ? t(SCOPE_LABEL[scope], lang) : scope}
        </span>
      ))}
      {max && unique.length > max ? <span className="rounded-lg bg-cream px-2 py-1 text-[0.55rem] font-bold text-muted">+{unique.length - max}</span> : null}
    </div>
  );
}

export function ReceiptCard({
  receipt,
  lang,
  citizenName,
  compact = false,
}: {
  receipt: Receipt;
  lang: Lang;
  citizenName: string;
  compact?: boolean;
}) {
  const [origin, setOrigin] = useState("https://m3ak.ma");
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);
  const verifyUrl = `${origin}/verify/${receipt.code}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(receipt.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={cn("overflow-hidden rounded-3xl border border-line bg-paper shadow-card", compact ? "" : "sm:rounded-4xl")}>
      <div className="flex items-center justify-between gap-3 bg-forest px-5 py-4 text-paper">
        <div>
          <p className="text-[0.55rem] font-bold uppercase tracking-[0.16em] text-lime/80">{t(CHAT.receiptTitle, lang)}</p>
          <p className="mt-0.5 font-mono text-[0.95rem] font-bold tracking-wide text-paper">{receipt.code}</p>
        </div>
        <Badge tone="lime" dot>{t(CHAT.receiptValid, lang)}</Badge>
      </div>

      <div className={cn("grid gap-4 p-4 sm:p-5", !compact && "sm:grid-cols-[auto_1fr]")}>
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-2xl border border-line bg-white p-2">
            <QRCodeSVG value={verifyUrl} size={compact ? 86 : 112} fgColor="#123c4a" bgColor="#ffffff" level="M" />
          </div>
          <button onClick={copy} className="inline-flex items-center gap-1 text-[0.58rem] font-bold text-emerald hover:underline">
            {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
            {copied ? t(COMMON.copied, lang) : receipt.code}
          </button>
        </div>

        <div className="min-w-0">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-cream/70 px-2.5 py-2">
              <p className="text-[0.5rem] font-bold uppercase tracking-[0.1em] text-muted">{t(CHAT.caseReference, lang)}</p>
              <p className="mt-0.5 truncate font-mono text-[0.65rem] font-bold text-forest">{receipt.caseId}</p>
            </div>
            <div className="rounded-xl bg-cream/70 px-2.5 py-2">
              <p className="text-[0.5rem] font-bold uppercase tracking-[0.1em] text-muted">{t(COMMON.issued, lang)}</p>
              <p className="mt-0.5 text-[0.65rem] font-bold text-forest">{formatDate(receipt.issuedAt, lang)}</p>
            </div>
          </div>

          <div className="mt-2 space-y-1 rounded-xl border border-line-soft p-2.5">
            {receipt.items.length === 0 ? (
              <p className="text-[0.6rem] text-muted">{lang === "ar" ? "لا رسوم" : lang === "en" ? "No fees" : "Aucun frais"}</p>
            ) : (
              receipt.items.map((item) => (
                <div key={item.label.fr} className="flex items-center justify-between gap-2 text-[0.62rem]">
                  <span className="truncate text-muted">{item.label[lang] || item.label.fr}</span>
                  <span className="font-semibold text-ink">{formatMoney(item.amount, lang)}</span>
                </div>
              ))
            )}
            <div className="mt-1 flex items-center justify-between border-t border-line-soft pt-1 text-[0.62rem]">
              <span className="font-semibold text-ink">{t(COMMON.total, lang)}</span>
              <span className="font-bold text-forest">{formatMoney(receipt.total, lang)}</span>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2 text-[0.58rem]">
            <span className="truncate font-mono text-muted/70">{receipt.hash.slice(0, 22)}…</span>
            <Link href={`/verify/${receipt.code}`} className="inline-flex shrink-0 items-center gap-1 font-bold text-emerald hover:underline">
              {t(CHAT.openVerify, lang)}
              <ExternalLink className="size-2.5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-line-soft bg-paper-soft/60 px-5 py-3">
        <p className="flex items-center gap-1.5 text-[0.58rem] text-muted">
          <ReceiptText className="size-3 text-emerald" />
          {citizenName}
        </p>
        <p className="text-[0.55rem] font-mono text-muted/60">SHA-256</p>
      </div>
    </div>
  );
}

export function ExecutionProgress({
  plan,
  lang,
  progress,
}: {
  plan: Plan;
  lang: Lang;
  progress: number;
}) {
  const done = plan.actions.filter((action) => action.status === "DONE").length;
  return (
    <div className="rounded-2xl border border-line-soft bg-paper p-3">
      <div className="flex items-center justify-between text-[0.62rem]">
        <span className="font-bold text-forest">{t(CHAT.progress, lang)}</span>
        <span className="font-mono text-muted">{Math.round(progress)}%</span>
      </div>
      <ProgressBar value={progress} className="mt-2" />
      <p className="mt-1.5 text-[0.55rem] text-muted">{done}/{plan.actions.length} {t(COMMON.services, lang)}</p>
    </div>
  );
}
