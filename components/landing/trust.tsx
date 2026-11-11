"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, Bot, Check, Coins, Fingerprint, KeyRound, Lock, QrCode, ScanLine, ShieldCheck, Sparkles } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { Lang } from "@/lib/domain/types";
import { LANDING, COMMON, t } from "@/lib/copy";
import { Badge, Button } from "@/components/ui";
import { cn, formatMoney } from "@/lib/format";

const TRUST_ICONS = [ShieldCheck, Lock, ScanLine, Bot];

export function OutcomeSection({ lang }: { lang: Lang }) {
  return (
    <section className="relative overflow-hidden bg-forest-deep py-20 text-paper sm:py-24 noise">
      <div className="pointer-events-none absolute -left-32 top-0 size-[28rem] rounded-full bg-emerald/25 blur-[120px]" aria-hidden />
      <div className="pointer-events-none absolute -right-20 bottom-0 size-[24rem] rounded-full bg-lime/10 blur-[100px]" aria-hidden />
      <div className="container-page relative">
        <div className="grid gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <span className="eyebrow text-lime">{t(LANDING.numbersEyebrow, lang)}</span>
            <h2 className="display-title mt-5 max-w-xl text-balance text-[clamp(2.2rem,4.6vw,3.8rem)] text-paper">{t(LANDING.numbersTitle, lang)}</h2>
            <div className="mt-9 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
              {[
                { value: "6", label: t(LANDING.numberServices, lang) },
                { value: "5", label: t(LANDING.numberAgencies, lang) },
                { value: formatMoney(23_200, lang), label: t(LANDING.numberValue, lang) },
                { value: lang === "ar" ? "14 ساعة" : "14 h", label: lang === "ar" ? "وقت موفر" : lang === "en" ? "time saved" : "de temps gagné" },
              ].map((stat) => (
                <div key={stat.label} className="border-t border-paper/15 pt-3">
                  <p className="font-display text-[2rem] leading-none tracking-[-0.03em] text-lime">
                    {stat.value}
                  </p>
                  <p className="mt-1.5 text-[0.58rem] font-bold uppercase tracking-[0.12em] text-paper/50">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/space">
                <Button variant="lime" size="lg">
                  {t(LANDING.heroCta, lang)}
                  <ArrowRight className="size-4 rtl:rotate-180" />
                </Button>
              </Link>
              <Link href="/sources">
                <Button variant="ghost" size="lg" className="text-paper/75 hover:bg-paper/10 hover:text-paper">
                  {t(LANDING.navSources, lang)}
                  <ArrowRight className="size-4 rtl:rotate-180" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute -inset-4 rotate-3 rounded-[2rem] border border-paper/10" aria-hidden />
            <div className="relative -rotate-1 rounded-[1.8rem] bg-paper p-5 text-ink shadow-lift">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[0.55rem] font-bold uppercase tracking-[0.16em] text-emerald">{lang === "ar" ? "وصل موقع" : lang === "en" ? "Signed receipt" : "Reçu signé"}</p>
                  <p className="mt-1 font-display text-[1.35rem] tracking-[-0.02em] text-forest-deep">CASE-2026-0001</p>
                </div>
                <Badge tone="emerald" dot>
                  {lang === "ar" ? "صالح" : lang === "en" ? "Valid" : "Valide"}
                </Badge>
              </div>
              <div className="my-4 hairline" />
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-line bg-white p-1.5">
                  <QRCodeSVG value="https://m3ak.ma/verify/M3AK-4F2A-91C8" size={74} fgColor="#0d3a2a" bgColor="#ffffff" level="M" />
                </div>
                <div className="min-w-0">
                  <p className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-muted">M3AK-4F2A-91C8</p>
                  <p className="mt-1 text-[0.66rem] leading-4 text-muted">{lang === "ar" ? "6 خدمات · 50 درهماً رسوم" : lang === "en" ? "6 services · 50 DH fees" : "6 services · 50 DH de frais"}</p>
                  <p className="mt-1 font-mono text-[0.55rem] text-muted/70">SHA256 · 7C2A9E41…</p>
                </div>
              </div>
              <div className="mt-4 rounded-xl bg-cream p-3">
                <div className="flex items-center justify-between text-[0.66rem]">
                  <span className="text-muted">{lang === "ar" ? "تعويض الأمومة" : lang === "en" ? "Maternity indemnity" : "Indemnité maternité"}</span>
                  <span className="font-bold text-forest">{formatMoney(19_600, lang)}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[0.66rem]">
                  <span className="text-muted">{lang === "ar" ? "تعويضات عائلية" : lang === "en" ? "Family allowance" : "Allocations familiales"}</span>
                  <span className="font-bold text-forest">{formatMoney(300, lang)} / {lang === "ar" ? "شهر" : lang === "en" ? "mo" : "mois"}</span>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-[0.57rem] text-muted">
                <BadgeCheck className="size-3.5 text-emerald" />
                {lang === "ar" ? "تم التحقق من البصمة · Yasmine B." : lang === "en" ? "Hash verified · Yasmine B." : "Empreinte vérifiée · Yasmine B."}
              </div>
            </div>
            <div className="absolute -bottom-5 -left-5 hidden rotate-[-4deg] rounded-2xl border border-paper/15 bg-paper/10 px-3 py-2 backdrop-blur-md sm:block">
              <p className="flex items-center gap-1.5 text-[0.58rem] font-bold text-lime">
                <QrCode className="size-3" /> {lang === "ar" ? "تحقق عام" : lang === "en" ? "Public verification" : "Vérification publique"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function TrustSection({ lang }: { lang: Lang }) {
  return (
    <section className="container-page py-20 sm:py-28" id="trust">
      <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div>
          <span className="eyebrow">{t(LANDING.trustEyebrow, lang)}</span>
          <h2 className="display-title mt-5 text-balance text-[clamp(2.2rem,4.4vw,3.5rem)]">{t(LANDING.trustTitle, lang)}</h2>
          <p className="mt-5 text-pretty text-[0.92rem] leading-7 text-muted">{t(LANDING.trustLead, lang)}</p>

          <div className="mt-8 space-y-4">
            {LANDING.trustPoints.map((point, index) => {
              const PointIcon = TRUST_ICONS[index] ?? Check;
              return (
                <div key={point.title.fr} className="flex gap-3">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-mint-soft text-forest">
                    <PointIcon className="size-4" strokeWidth={1.8} />
                  </span>
                  <div>
                    <h3 className="text-[0.82rem] font-bold text-forest-deep">{t(point.title, lang)}</h3>
                    <p className="mt-1 text-[0.75rem] leading-5.5 text-muted">{t(point.body, lang)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="overflow-hidden rounded-4xl border border-line-soft bg-paper shadow-card" data-tour="landing-trust-log">
          <div className="flex items-center justify-between border-b border-line-soft bg-paper-soft/70 px-5 py-4">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-coral" />
              <span className="size-2 rounded-full bg-gold" />
              <span className="size-2 rounded-full bg-emerald" />
              <p className="ml-2 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted">policy-trace.log</p>
            </div>
            <Badge tone="emerald" dot>{lang === "ar" ? "مباشر" : lang === "en" ? "Live" : "Live"}</Badge>
          </div>

          <div className="space-y-1 p-4 sm:p-5">
            {[
              {
                icon: Sparkles,
                label: lang === "ar" ? "نية: طفل جديد" : lang === "en" ? "Intent: new child" : "Intention : nouveau-né",
                meta: "0.98",
                tone: "mint",
              },
              {
                icon: Fingerprint,
                label: lang === "ar" ? "السياق: 6 وثائق محققة، 3 أشخاص" : lang === "en" ? "Context: 6 verified docs, 3 people" : "Contexte : 6 documents vérifiés, 3 personnes",
                meta: "PASS",
                tone: "mint",
              },
              {
                icon: ShieldCheck,
                label: lang === "ar" ? "11 قاعدة مطبقة · 2 مستبعدتان" : lang === "en" ? "11 rules matched · 2 excluded" : "11 règles appliquées · 2 exclues",
                meta: "PASS",
                tone: "mint",
              },
              {
                icon: Coins,
                label: lang === "ar" ? "المبالغ يعاد حسابها على الخادم" : lang === "en" ? "Amounts recomputed server-side" : "Montants recalculés côté serveur",
                meta: "0 LLM",
                tone: "gold",
              },
              {
                icon: KeyRound,
                label: lang === "ar" ? "بوابة الموافقة · 10 نطاقات" : lang === "en" ? "Consent gate · 10 scopes" : "Consent gate · 10 scopes",
                meta: "WAIT",
                tone: "gold",
              },
              {
                icon: Check,
                label: lang === "ar" ? "تنفيذ حتمي · 6 محولات" : lang === "en" ? "Deterministic execution · 6 adapters" : "Exécution déterministe · 6 adaptateurs",
                meta: "READY",
                tone: "mint",
              },
              {
                icon: QrCode,
                label: lang === "ar" ? "وصل موقّع · SHA-256 + QR" : lang === "en" ? "Signed receipt · SHA-256 + QR" : "Reçu signé · SHA-256 + QR",
                meta: "SIGN",
                tone: "mint",
              },
            ].map((row, index) => {
              const RowIcon = row.icon;
              return (
                <div key={row.label} className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-cream/60">
                  <span className="w-5 text-right font-mono text-[0.55rem] text-muted/50">{String(index + 1).padStart(2, "0")}</span>
                  <span className="flex size-7 items-center justify-center rounded-lg bg-cream text-forest">
                    <RowIcon className="size-3.5" strokeWidth={1.9} />
                  </span>
                  <p className="min-w-0 flex-1 text-[0.7rem] font-medium text-ink-soft">{row.label}</p>
                  <span
                    className={cn(
                      "rounded-md px-1.5 py-0.5 font-mono text-[0.52rem] font-bold",
                      row.tone === "gold" ? "bg-gold-soft text-[#7d5a16]" : "bg-mint text-forest",
                    )}
                  >
                    {row.meta}
                  </span>
                </div>
              );
            })}

            <div className="mt-2 flex items-center gap-3 rounded-xl border border-coral/25 bg-coral-soft/70 px-2 py-2.5">
              <span className="w-5 text-right font-mono text-[0.55rem] text-coral/50">!</span>
              <span className="flex size-7 items-center justify-center rounded-lg bg-coral/15 text-[#9d3d25]">
                <Lock className="size-3.5" />
              </span>
              <p className="min-w-0 flex-1 text-[0.7rem] font-medium text-[#8f341d]">
                {lang === "ar" ? "«حوّل 50,000 درهم بدون موافقة» → محظور" : lang === "en" ? "“Transfer 50,000 DH without consent” → blocked" : "« Transfère 50 000 DH sans accord » → bloqué"}
              </p>
              <span className="rounded-md bg-coral px-1.5 py-0.5 font-mono text-[0.52rem] font-bold text-paper">BLOCK</span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-line-soft bg-paper-soft/60 px-5 py-3.5">
            <p className="text-[0.62rem] text-muted">
              {lang === "ar" ? "كل حدث في سجل التدقيق" : lang === "en" ? "Every event in the audit log" : "Chaque événement dans l'audit log"}
            </p>
            <Link href="/sources" className="inline-flex items-center gap-1 text-[0.66rem] font-bold text-emerald hover:underline">
              {t(COMMON.trace, lang)}
              <ArrowRight className="size-3 rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function QuoteSection({ lang }: { lang: Lang }) {
  return (
    <section className="container-page pb-6">
      <div className="mx-auto max-w-4xl rounded-[2.5rem] border border-line-soft bg-paper px-6 py-12 text-center shadow-card sm:px-14 sm:py-16">
        <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-lime text-forest-deep">
          <Sparkles className="size-4" />
        </span>
        <blockquote className="display-title mt-6 text-balance text-[clamp(1.7rem,3.2vw,2.7rem)] leading-[1.2] text-forest-deep">
          {t(LANDING.quote, lang)}
        </blockquote>
        <p className="mt-5 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-muted">{t(LANDING.quoteBy, lang)}</p>
      </div>
    </section>
  );
}
