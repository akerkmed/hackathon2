"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Copy,
  FileCheck2,
  Fingerprint,
  Landmark,
  LockKeyhole,
  QrCode,
  ReceiptText,
  ScanLine,
  Search,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { Lang, Localized, Receipt } from "@/lib/domain/types";
import { L } from "@/lib/i18n";
import { COMMON, CHAT, VERIFY_PAGE, t } from "@/lib/copy";
import { Brand, BrandMark } from "@/components/brand";
import { Badge, Button } from "@/components/ui";
import { LanguageMenu, applyDocumentLang } from "@/components/language-menu";
import { cn, formatDate, formatMoney } from "@/lib/format";

const EXTRA = {
  publicLedger: L("Registre public de démonstration", "سجل عمومي تجريبي", "Registre public dyal démo", "Public demo registry"),
  heroIndexTitle: L("Un reçu, une preuve.", "وصل واحد، دليل واحد.", "Reçu wa7ed, preuve wa7da.", "One receipt. One proof."),
  heroIndexLead: L(
    "Saisissez le code d'un reçu M3ak pour vérifier son authenticité, son contenu et son empreinte — sans appeler l'administration.",
    "أدخل رمز وصل M3ak للتحقق من أصالته ومحتواه وبصمته — دون الاتصال بالإدارة.",
    "Dkhel code dyal reçu M3ak bach tverifi l asala, l contenu w l empreinte — bla ma t3ayet l idara.",
    "Enter a M3ak receipt code to verify its authenticity, content and hash — without calling an agency.",
  ),
  codeLabel: L("Code du reçu", "رمز الوصل", "Code dyal reçu", "Receipt code"),
  lastReceipt: L("Votre dernier reçu", "آخر وصل لك", "Akher reçu dyalek", "Your last receipt"),
  openLast: L("Ouvrir mon dernier reçu", "افتح آخر وصل", "Ftah akher reçu", "Open my last receipt"),
  example: L("Essayez un code de démonstration", "جرب رمز عرض", "Jerreb code dyal démo", "Try a demo code"),
  howTitle: L("Comment la vérification fonctionne", "كيف يعمل التحقق", "Kifach kaykhdem l vérification", "How verification works"),
  howLead: L(
    "Le vérificateur ne voit que la preuve minimale : identité du bénéficiaire, dossier, montants et empreinte.",
    "المتحقق لا يرى سوى الدليل الأدنى: هوية المستفيد، الملف، المبالغ والبصمة.",
    "L vérificateur kaychouf ghir l preuve minimale: hwiya, dossier, montants w empreinte.",
    "The verifier only sees the minimal proof: holder identity, case, amounts and hash.",
  ),
  how1Title: L("Le reçu est signé", "الوصل موقّع", "Reçu msigné", "Receipt is signed"),
  how1Body: L(
    "Chaque exécution produit une empreinte SHA-256 unique liée au dossier et aux lignes facturées.",
    "كل تنفيذ ينتج بصمة SHA-256 فريدة مرتبطة بالملف والبنود.",
    "Kol exécution kat3ti empreinte SHA-256 wa7da mrbouta b dossier w lignes.",
    "Every execution produces a unique SHA-256 hash bound to the case and line items.",
  ),
  how2Title: L("Le registre répond", "السجل يجيب", "Registre kayjaweb", "Registry responds"),
  how2Body: L(
    "La page interroge le registre serveur. Un code inconnu renvoie un résultat introuvable, jamais un faux positif.",
    "الصفحة تستفسر سجل الخادم. رمز غير معروف يعطي نتيجة غير موجودة، وليس نتيجة إيجابية خاطئة.",
    "Page katse9si registre dyal serveur. Code ma m3roufch kay3ti introuvable, machi faux positif.",
    "The page queries the server registry. An unknown code returns not-found, never a false positive.",
  ),
  how3Title: L("Le citoyen garde la main", "المواطن يبقى المتحكم", "Citoyen kaybqa mcontrolli", "Citizen stays in control"),
  how3Body: L(
    "Le partage est limité dans le temps et révocable. La vérification ne donne aucun accès supplémentaire.",
    "المشاركة محدودة زمنياً وقابلة للإلغاء. التحقق لا يمنح أي وصول إضافي.",
    "Partage m7doud f l wa9t w kayn9ed ytlgha. Vérification ma kat3tich accès zaid.",
    "Sharing is time-boxed and revocable. Verification grants no extra access.",
  ),
  signedBy: L("Émis et scellé par le moteur M3ak", "صادر ومختوم من محرك M3ak", "Sader w mokhtoum mn moteur M3ak", "Issued and sealed by the M3ak engine"),
  notOfficial: L("Document de démonstration · non officiel", "وثيقة تجريبية · غير رسمية", "Document démo · machi officiel", "Demo document · not official"),
  benefitsVerified: L("Droits confirmés par le registre", "حقوق مؤكدة من السجل", "Droits confirmés mn registre", "Benefits confirmed by registry"),
  oneOff: L("Versement unique", "دفعة واحدة", "Versement wa7ed", "One-off"),
  monthly: L("Mensuel", "شهري", "Chahri", "Monthly"),
  noFees: L("Aucun frais sur ce reçu.", "لا رسوم على هذا الوصل.", "Ma kaynch frais f had reçu.", "No fees on this receipt."),
  copyHash: L("Copier l'empreinte", "انسخ البصمة", "Copier empreinte", "Copy hash"),
  copied: L("Copié", "تم النسخ", "Tcopié", "Copied"),
  verifyCode: L("Vérifier ce code", "تحقق من هذا الرمز", "Verifi had code", "Verify this code"),
  integrity: L("Intégrité vérifiée", "السلامة محققة", "Intégrité mverifiée", "Integrity verified"),
  searchTitle: L("Vérifier un reçu M3ak", "تحقق من وصل M3ak", "Verifi reçu M3ak", "Verify a M3ak receipt"),
  searchLead: L(
    "Collez le code imprimé sur un reçu ou scannez son QR. Aucune connexion n'est requise.",
    "الصق الرمز المطبوع على الوصل أو امسح رمز QR. لا حاجة لتسجيل الدخول.",
    "Lse9 code li mktoub f reçu wla scan QR. Ma khassch login.",
    "Paste the code printed on a receipt or scan its QR. No login required.",
  ),
  invalidTitle: L("Ce reçu n'existe pas dans le registre", "هذا الوصل غير موجود في السجل", "Had reçu ma kaynch f registre", "This receipt is not in the registry"),
  invalidHelp: L(
    "Vérifiez les majuscules et les tirets, ou scannez à nouveau le QR. Un reçu annulé ne peut pas être validé.",
    "تحقق من الأحرف الكبيرة والشرطات، أو امسح QR مرة أخرى. الوصل الملغى لا يمكن التحقق منه.",
    "Verifi l majuscules w tirets, wla scan QR 3awtani. Reçu annulé ma yemkench ytverifa.",
    "Check capitals and dashes, or rescan the QR. A cancelled receipt cannot be validated.",
  ),
  demoNotice: L(
    "Cette page fait partie d'un prototype indépendant. Les reçus sont simulés, ne constituent pas des documents officiels et ne prouvent aucun droit réel.",
    "هذه الصفحة جزء من نموذج مستقل. الوصولات محاكاة وليست وثائق رسمية ولا تثبت أي حق حقيقي.",
    "Had page jouj mn prototype indépendant. Reçus simulés, machi documents officiels w ma kayweriwch 7a9 7a9i9i.",
    "This page is part of an independent prototype. Receipts are simulated, are not official documents and prove no real entitlement.",
  ),
};

const RECEIPT_CODE = /^M3AK-[A-Z0-9]{4}-[A-Z0-9]{4}$/i;

function usePublicLang() {
  const [lang, setLang] = useState<Lang>("fr");
  useEffect(() => {
    const stored = window.localStorage.getItem("m3ak.lang");
    if (stored === "ar" || stored === "darija" || stored === "en" || stored === "fr") {
      setLang(stored);
      applyDocumentLang(stored);
    }
  }, []);
  const change = (next: Lang) => {
    setLang(next);
    window.localStorage.setItem("m3ak.lang", next);
    applyDocumentLang(next);
  };
  return { lang, change };
}

export function VerifyHeader({ lang, onChange }: { lang: Lang; onChange: (lang: Lang) => void }) {
  return (
    <header className="border-b border-line-soft bg-cream/85 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center gap-3">
        <Brand href="/" />
        <span className="hidden items-center gap-1.5 rounded-full border border-mint bg-mint-soft/70 px-2.5 py-1 text-[0.55rem] font-bold uppercase tracking-[0.1em] text-emerald sm:inline-flex">
          <ShieldCheck className="size-3" />
          {t(EXTRA.publicLedger, lang)}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <LanguageMenu lang={lang} onChange={onChange} />
          <Link href="/" className="hidden sm:block">
            <Button size="sm" variant="ghost" className="text-muted">
              <ArrowLeft className="size-3.5 rtl:rotate-180" />
              {t(VERIFY_PAGE.backHome, lang)}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function VerifyFooter({ lang }: { lang: Lang }) {
  return (
    <footer className="mt-12 border-t border-line-soft bg-paper-soft/50">
      <div className="container-page flex flex-wrap items-center justify-between gap-3 py-6">
        <div className="flex items-center gap-2.5">
          <BrandMark className="size-8 rounded-xl" />
          <div>
            <p className="font-display text-[0.95rem] leading-none text-forest-deep">M3ak · معك</p>
            <p className="mt-1 text-[0.52rem] font-semibold uppercase tracking-[0.12em] text-muted">{t(EXTRA.notOfficial, lang)}</p>
          </div>
        </div>
        <p className="max-w-xl text-[0.55rem] leading-4 text-muted/70">{t(EXTRA.demoNotice, lang)}</p>
      </div>
    </footer>
  );
}

export function VerifyIndex() {
  const { lang, change } = usePublicLang();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [lastReceipt, setLastReceipt] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("m3ak.lastReceipt");
    if (stored) setLastReceipt(stored);
  }, []);

  const submit = (value?: string) => {
    const candidate = (value ?? code).trim().toUpperCase();
    if (!RECEIPT_CODE.test(candidate)) {
      setError(true);
      return;
    }
    setError(false);
    router.push(`/verify/${encodeURIComponent(candidate)}`);
  };

  return (
    <div className="min-h-dvh bg-cream">
      <VerifyHeader lang={lang} onChange={change} />
      <main className="container-page py-10 sm:py-14">
        <div className="mx-auto max-w-5xl">
          <div className="grid items-start gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-mint bg-mint-soft/70 px-3 py-1.5 text-[0.58rem] font-bold uppercase tracking-[0.12em] text-emerald">
                <BadgeCheck className="size-3.5" />
                {t(CHAT.verifyPublic, lang)}
              </span>
              <h1 className="display-title mt-5 text-[clamp(2.4rem,5.5vw,4rem)]">{t(EXTRA.heroIndexTitle, lang)}</h1>
              <p className="mt-3 max-w-xl text-[0.86rem] leading-7 text-muted">{t(EXTRA.heroIndexLead, lang)}</p>

              <div className="mt-6 surface p-4 sm:p-5">
                <label htmlFor="receipt-code" className="text-[0.58rem] font-bold uppercase tracking-[0.12em] text-muted">
                  {t(EXTRA.codeLabel, lang)}
                </label>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted/60" />
                    <input
                      id="receipt-code"
                      value={code}
                      onChange={(event) => {
                        setCode(event.target.value.toUpperCase());
                        setError(false);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") submit();
                      }}
                      placeholder="M3AK-XXXX-XXXX"
                      className={cn(
                        "h-12 w-full rounded-xl border bg-paper ps-9 pe-3 font-mono text-[0.82rem] font-semibold tracking-wide text-forest outline-none transition-colors placeholder:font-sans placeholder:text-[0.72rem] placeholder:font-normal placeholder:tracking-normal placeholder:text-muted/50",
                        error ? "border-coral/60 focus:border-coral" : "border-line focus:border-forest/40",
                      )}
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </div>
                  <Button size="lg" onClick={() => submit()} disabled={!code.trim()}>
                    <ScanLine className="size-4" />
                    {t(VERIFY_PAGE.check, lang)}
                  </Button>
                </div>
                {error ? (
                  <p className="mt-2 text-[0.62rem] font-semibold text-[#9d3d25]">{t(VERIFY_PAGE.invalidLead, lang)}</p>
                ) : (
                  <p className="mt-2 flex items-center gap-1.5 text-[0.56rem] text-muted/70">
                    <LockKeyhole className="size-2.5" />
                    {t(EXTRA.searchLead, lang)}
                  </p>
                )}

                {lastReceipt ? (
                  <button
                    onClick={() => submit(lastReceipt)}
                    className="mt-4 flex w-full items-center gap-2.5 rounded-xl border border-mint bg-mint-soft/50 px-3 py-2.5 text-start transition-colors hover:border-emerald/40"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-forest text-lime">
                      <ReceiptText className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.55rem] font-bold uppercase tracking-[0.08em] text-emerald">{t(EXTRA.lastReceipt, lang)}</span>
                      <span className="mt-0.5 block truncate font-mono text-[0.68rem] font-bold text-forest">{lastReceipt}</span>
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-emerald rtl:rotate-180" />
                  </button>
                ) : (
                  <p className="mt-4 flex items-center gap-1.5 text-[0.55rem] text-muted/60">
                    <Sparkles className="size-3 text-gold" />
                    {t(EXTRA.example, lang)} · M3AK-XXXX-XXXX
                  </p>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-[0.58rem] font-semibold text-muted">
                <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-emerald" />SHA-256</span>
                <span className="inline-flex items-center gap-1.5"><Clock3 className="size-3.5 text-emerald" />{t(VERIFY_PAGE.issuedAt, lang)}</span>
                <span className="inline-flex items-center gap-1.5"><Fingerprint className="size-3.5 text-emerald" />{t(EXTRA.integrity, lang)}</span>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-4xl bg-forest p-6 text-paper shadow-lift sm:p-7 noise" data-tour="verify-card">
              <div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-lime/20 blur-3xl" aria-hidden />
              <div className="pointer-events-none absolute -bottom-20 -left-10 size-44 rounded-full bg-emerald/40 blur-3xl" aria-hidden />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-paper/10 text-lime">
                    <QrCode className="size-5" />
                  </span>
                  <Badge tone="lime" dot>{t(CHAT.receiptValid, lang)}</Badge>
                </div>
                <p className="mt-5 text-[0.58rem] font-bold uppercase tracking-[0.16em] text-lime/75">{t(CHAT.receiptTitle, lang)}</p>
                <p className="mt-2 font-display text-[2rem] leading-none tracking-[-0.03em]">M3AK-••••-••••</p>
                <div className="mt-5 rounded-2xl bg-paper p-4 text-forest">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-mint-soft text-emerald">
                      <CheckCircle2 className="size-5" />
                    </span>
                    <div>
                      <p className="text-[0.7rem] font-bold">{t(EXTRA.signedBy, lang)}</p>
                      <p className="mt-0.5 text-[0.55rem] text-muted">{t(EXTRA.notOfficial, lang)}</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {[VERIFY_PAGE.holder, VERIFY_PAGE.caseRef, VERIFY_PAGE.hash].map((item, index) => (
                      <div key={item.en} className="flex items-center justify-between gap-3">
                        <span className="text-[0.56rem] text-muted">{t(item, lang)}</span>
                        <span className={cn("rounded bg-cream px-2 py-0.5", index === 2 ? "font-mono text-[0.48rem]" : "text-[0.56rem] font-bold")}>
                          {index === 0 ? "Yasmine B." : index === 1 ? "M3AK-CASE-•••" : "a3f9…c21d"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="mt-4 flex items-start gap-1.5 text-[0.55rem] leading-4 text-paper/45">
                  <LockKeyhole className="mt-0.5 size-3 shrink-0" />
                  {t(VERIFY_PAGE.disclaimer, lang)}
                </p>
              </div>
            </div>
          </div>

          <section className="mt-10">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-emerald">{t(EXTRA.publicLedger, lang)}</p>
                <h2 className="mt-1 font-display text-[1.7rem] tracking-[-0.025em] text-forest-deep">{t(EXTRA.howTitle, lang)}</h2>
                <p className="mt-1 max-w-2xl text-[0.72rem] leading-5 text-muted">{t(EXTRA.howLead, lang)}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {[
                { icon: ReceiptText, title: EXTRA.how1Title, body: EXTRA.how1Body },
                { icon: Landmark, title: EXTRA.how2Title, body: EXTRA.how2Body },
                { icon: ShieldCheck, title: EXTRA.how3Title, body: EXTRA.how3Body },
              ].map((step, index) => {
                const StepIcon = step.icon;
                return (
                  <div key={step.title.en} className="surface p-4 sm:p-5">
                    <div className="flex items-center justify-between">
                      <span className="flex size-10 items-center justify-center rounded-2xl bg-mint-soft text-forest">
                        <StepIcon className="size-4.5" />
                      </span>
                      <span className="font-mono text-[0.55rem] font-bold text-muted/40">{String(index + 1).padStart(2, "0")}</span>
                    </div>
                    <p className="mt-3 text-[0.78rem] font-bold text-forest-deep">{t(step.title, lang)}</p>
                    <p className="mt-1 text-[0.64rem] leading-5 text-muted">{t(step.body, lang)}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line-soft bg-paper-soft/60 px-4 py-3">
            <p className="flex items-center gap-2 text-[0.6rem] text-muted">
              <ClipboardCheck className="size-3.5 text-emerald" />
              {t(VERIFY_PAGE.disclaimer, lang)}
            </p>
            <Link href="/chat" className="inline-flex items-center gap-1 text-[0.62rem] font-bold text-emerald hover:underline">
              {t(COMMON.openDemo, lang)}
              <ArrowRight className="size-3 rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </main>
      <VerifyFooter lang={lang} />
    </div>
  );
}

export function VerifyDetail({ receipt, citizenName }: { receipt: Receipt; citizenName: string }) {
  const { lang, change } = usePublicLang();
  const [origin, setOrigin] = useState("https://m3ak.ma");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const copyHash = async () => {
    try {
      await navigator.clipboard.writeText(receipt.hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="min-h-dvh bg-cream">
      <VerifyHeader lang={lang} onChange={change} />
      <main className="container-page py-8 sm:py-12">
        <div className="mx-auto max-w-4xl">
          <Link href="/verify" className="inline-flex items-center gap-1.5 text-[0.62rem] font-semibold text-muted transition-colors hover:text-forest">
            <ArrowLeft className="size-3.5 rtl:rotate-180" />
            {t(VERIFY_PAGE.verifyAnother, lang)}
          </Link>

          <div className="mt-4 flex flex-col gap-4 rounded-4xl border border-mint bg-gradient-to-br from-mint-soft/70 via-paper to-paper p-5 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-7 noise">
            <div className="flex items-start gap-4">
              <span className="relative flex size-14 shrink-0 items-center justify-center rounded-3xl bg-forest text-lime">
                <CheckCircle2 className="size-7" />
                <span className="absolute -right-0.5 -top-0.5 size-3.5 rounded-full border-2 border-paper bg-emerald" aria-hidden />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-[clamp(1.8rem,4vw,2.7rem)] leading-none tracking-[-0.03em] text-forest-deep">
                    {t(VERIFY_PAGE.valid, lang)}
                  </h1>
                  <Badge tone="emerald" dot>{receipt.status}</Badge>
                </div>
                <p className="mt-2 max-w-xl text-[0.74rem] leading-6 text-muted">{t(VERIFY_PAGE.validLead, lang)}</p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col">
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-mint bg-paper px-3 py-2 text-[0.58rem] font-semibold text-forest">
                <ShieldCheck className="size-3.5 text-emerald" />
                {t(EXTRA.integrity, lang)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-paper px-3 py-2 text-[0.58rem] font-mono text-muted">
                SHA-256
              </span>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <section className="overflow-hidden rounded-4xl border border-line-soft bg-forest text-paper shadow-card">
              <div className="flex items-center justify-between gap-2 border-b border-paper/10 px-5 py-4">
                <div>
                  <p className="text-[0.52rem] font-bold uppercase tracking-[0.16em] text-lime/75">{t(EXTRA.publicLedger, lang)}</p>
                  <p className="mt-1 font-mono text-[0.95rem] font-bold tracking-wide">{receipt.code}</p>
                </div>
                <ReceiptText className="size-5 text-lime/80" />
              </div>
              <div className="flex flex-col items-center gap-3 px-5 py-6">
                <div className="rounded-3xl border border-paper/15 bg-white p-3">
                  <QRCodeSVG value={`${origin}/verify/${receipt.code}`} size={148} fgColor="#123c4a" bgColor="#ffffff" level="M" />
                </div>
                <p className="text-center text-[0.55rem] leading-4 text-paper/50">{t(CHAT.receiptLead, lang)}</p>
              </div>
              <div className="border-t border-paper/10 px-5 py-3">
                <p className="text-[0.48rem] font-bold uppercase tracking-[0.12em] text-paper/35">{t(EXTRA.signedBy, lang)}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <BrandMark tone="lime" className="size-7 rounded-lg" />
                    <span className="font-display text-[1rem] text-paper">M3ak</span>
                  </div>
                  <span className="rounded-full bg-paper/10 px-2 py-1 text-[0.5rem] font-bold uppercase tracking-[0.08em] text-lime">{t(VERIFY_PAGE.valid, lang)}</span>
                </div>
              </div>
            </section>

            <section className="surface p-5 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-[1.35rem] tracking-[-0.02em] text-forest-deep">{t(VERIFY_PAGE.lineItems, lang)}</h2>
                <Badge tone="outline">{receipt.items.length} {t(receipt.items.length === 1 ? COMMON.service : COMMON.services, lang)}</Badge>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {[
                  { label: t(VERIFY_PAGE.holder, lang), value: citizenName },
                  { label: t(VERIFY_PAGE.issuedAt, lang), value: formatDate(receipt.issuedAt, lang) },
                  { label: t(VERIFY_PAGE.caseRef, lang), value: receipt.caseId, mono: true },
                  { label: t(VERIFY_PAGE.issuer, lang), value: "M3ak" },
                ].map((field) => (
                  <div key={field.label} className="rounded-xl bg-cream/70 px-3 py-2">
                    <p className="text-[0.46rem] font-bold uppercase tracking-[0.08em] text-muted">{field.label}</p>
                    <p className={cn("mt-1 truncate text-[0.64rem] font-bold text-forest", field.mono && "font-mono text-[0.58rem]")}>{field.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-line-soft">
                <div className="flex items-center justify-between bg-paper-soft px-3 py-2 text-[0.48rem] font-bold uppercase tracking-[0.1em] text-muted">
                  <span>{t(VERIFY_PAGE.lineItems, lang)}</span>
                  <span>{t(COMMON.total, lang)}</span>
                </div>
                <div className="divide-y divide-line-soft/60">
                  {receipt.items.length === 0 ? (
                    <p className="px-3 py-5 text-center text-[0.62rem] text-muted">{t(EXTRA.noFees, lang)}</p>
                  ) : (
                    receipt.items.map((item) => (
                      <div key={item.label.fr} className="flex items-center justify-between gap-3 px-3 py-2.5 text-[0.64rem]">
                        <span className="flex min-w-0 items-center gap-2">
                          <Check className="size-3 shrink-0 text-emerald" />
                          <span className="truncate text-ink-soft">{item.label[lang] || item.label.fr}</span>
                        </span>
                        <span className="shrink-0 font-bold text-forest">{formatMoney(item.amount, lang)}</span>
                      </div>
                    ))
                  )}
                  <div className="flex items-center justify-between bg-mint-soft/40 px-3 py-2.5 text-[0.68rem]">
                    <span className="font-bold text-forest">{t(COMMON.total, lang)}</span>
                    <span className="font-display text-[1.1rem] font-bold text-forest">{formatMoney(receipt.total, lang)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-mint bg-mint-soft/50 p-3">
                <p className="flex items-center gap-1.5 text-[0.55rem] font-bold uppercase tracking-[0.1em] text-emerald">
                  <Wallet className="size-3.5" />
                  {t(EXTRA.benefitsVerified, lang)}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-paper px-2.5 py-2">
                    <p className="text-[0.46rem] font-bold uppercase tracking-[0.08em] text-muted">{t(EXTRA.oneOff, lang)}</p>
                    <p className="mt-0.5 font-display text-[1.05rem] leading-none text-forest">{formatMoney(receipt.benefitOneOff, lang)}</p>
                  </div>
                  <div className="rounded-xl bg-paper px-2.5 py-2">
                    <p className="text-[0.46rem] font-bold uppercase tracking-[0.08em] text-muted">{t(EXTRA.monthly, lang)}</p>
                    <p className="mt-0.5 font-display text-[1.05rem] leading-none text-forest">{formatMoney(receipt.benefitMonthly, lang)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-line bg-paper-soft/60 px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[0.46rem] font-bold uppercase tracking-[0.1em] text-muted">{t(VERIFY_PAGE.hash, lang)}</p>
                  <button onClick={() => void copyHash()} className="inline-flex items-center gap-1 text-[0.5rem] font-bold text-emerald hover:underline">
                    {copied ? <Check className="size-2.5" /> : <Copy className="size-2.5" />}
                    {copied ? t(EXTRA.copied, lang) : t(EXTRA.copyHash, lang)}
                  </button>
                </div>
                <p className="mt-1.5 break-all font-mono text-[0.55rem] leading-4 text-forest">{receipt.hash}</p>
              </div>
            </section>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { icon: Fingerprint, value: t(EXTRA.how1Title, lang), label: t(CHAT.receiptHash, lang) },
              { icon: FileCheck2, value: receipt.caseId, label: t(VERIFY_PAGE.caseRef, lang) },
              { icon: Clock3, value: formatDate(receipt.issuedAt, lang), label: t(VERIFY_PAGE.issuedAt, lang) },
            ].map((item) => {
              const ItemIcon = item.icon;
              return (
                <div key={item.label} className="surface flex items-center gap-3 p-3.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-mint-soft text-forest">
                    <ItemIcon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[0.58rem] font-bold text-forest">{item.value}</p>
                    <p className="mt-0.5 text-[0.5rem] font-semibold uppercase tracking-[0.08em] text-muted">{item.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line-soft bg-paper-soft/60 px-4 py-3">
            <p className="flex max-w-2xl items-start gap-2 text-[0.56rem] leading-5 text-muted">
              <LockKeyhole className="mt-0.5 size-3 shrink-0" />
              {t(VERIFY_PAGE.disclaimer, lang)}
            </p>
            <div className="flex gap-2">
              <Link href="/verify">
                <Button size="sm" variant="outline">
                  {t(VERIFY_PAGE.verifyAnother, lang)}
                  <ChevronRight className="size-3 rtl:rotate-180" />
                </Button>
              </Link>
              <Link href="/chat" className="hidden sm:block">
                <Button size="sm" variant="ghost" className="text-emerald">
                  {t(COMMON.openDemo, lang)}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
      <VerifyFooter lang={lang} />
    </div>
  );
}

export function VerifyNotFound({ code }: { code: string }) {
  const { lang, change } = usePublicLang();
  const router = useRouter();
  const [candidate, setCandidate] = useState(code);
  const [checking, setChecking] = useState(false);

  const submit = () => {
    const value = candidate.trim().toUpperCase();
    if (!value) return;
    setChecking(true);
    router.push(`/verify/${encodeURIComponent(value)}`);
  };

  return (
    <div className="min-h-dvh bg-cream">
      <VerifyHeader lang={lang} onChange={change} />
      <main className="container-page py-12 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-coral-soft text-[#9d3d25]">
            <Search className="size-7" />
          </span>
          <h1 className="display-title mt-5 text-[clamp(2rem,4.5vw,3rem)]">{t(EXTRA.invalidTitle, lang)}</h1>
          <p className="mt-3 text-[0.8rem] leading-6 text-muted">{t(VERIFY_PAGE.invalidLead, lang)}</p>
          <p className="mt-1.5 text-[0.66rem] leading-5 text-muted/70">{t(EXTRA.invalidHelp, lang)}</p>

          <div className="mx-auto mt-7 max-w-md surface p-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={candidate}
                onChange={(event) => setCandidate(event.target.value.toUpperCase())}
                onKeyDown={(event) => {
                  if (event.key === "Enter") submit();
                }}
                placeholder="M3AK-XXXX-XXXX"
                aria-label={t(EXTRA.codeLabel, lang)}
                className="h-11 flex-1 rounded-xl border border-line bg-paper px-3 font-mono text-[0.78rem] font-semibold tracking-wide text-forest outline-none transition-colors placeholder:font-sans placeholder:text-[0.7rem] placeholder:font-normal placeholder:tracking-normal placeholder:text-muted/50 focus:border-forest/40"
                autoComplete="off"
                spellCheck={false}
              />
              <Button size="md" onClick={submit} loading={checking} disabled={!candidate.trim()}>
                {t(VERIFY_PAGE.check, lang)}
              </Button>
            </div>
            <Link href="/verify" className="mt-3 inline-flex items-center gap-1 text-[0.6rem] font-bold text-emerald hover:underline">
              {t(VERIFY_PAGE.verifyAnother, lang)}
              <ArrowRight className="size-3 rtl:rotate-180" />
            </Link>
          </div>

          <div className="mx-auto mt-8 flex max-w-lg items-start gap-2.5 rounded-2xl border border-line-soft bg-paper-soft/60 px-4 py-3 text-start">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald" />
            <p className="text-[0.6rem] leading-5 text-muted">{t(EXTRA.demoNotice, lang)}</p>
          </div>
        </div>
      </main>
      <VerifyFooter lang={lang} />
    </div>
  );
}

export type { Localized };
