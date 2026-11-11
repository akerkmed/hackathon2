"use client";

import { useMemo, useState } from "react";
import {
  Check,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  FileCheck2,
  Fingerprint,
  KeyRound,
  LockKeyhole,
  ScanLine,
  Share2,
  ShieldCheck,
  UploadCloud,
  Users,
} from "lucide-react";
import { useSession } from "@/components/providers/session-provider";
import { Badge, Button, EmptyState, Modal, Skeleton } from "@/components/ui";
import { Icon } from "@/components/icon";
import { ScopeChips } from "@/components/plan-view";
import { COMMON, DOCUMENTS, SCOPE_LABEL, STATUS_LABEL, t } from "@/lib/copy";
import { L } from "@/lib/i18n";
import type { DocumentStatus, IconName, Lang, Localized, VaultDocument } from "@/lib/domain/types";
import { cn, formatDate } from "@/lib/format";

const HOLDERS_ALL = "all";

const RECIPIENTS: { id: string; label: Localized; purpose: Localized; icon: IconName }[] = [
  {
    id: "cnss",
    label: L("CNSS — TAAWIDATY", "الصندوق الوطني للضمان الاجتماعي — تعويضاتي", "CNSS — TAAWIDATY", "CNSS — TAAWIDATY"),
    purpose: L(
      "Vérifier le livret de famille pour l'inscription des ayants droit et les prestations.",
      "التحقق من الملف العائلي لتسجيل التابع والتعويضات.",
      "Vérifier dossier dyal l famille l tasjil w les allocations.",
      "Verify the family file for dependent registration and benefits.",
    ),
    icon: "shield",
  },
  {
    id: "commune",
    label: L("Commune de Casablanca", "جماعة الدار البيضاء", "Commune dyal Casablanca", "Casablanca commune"),
    purpose: L(
      "Vérifier les preuves d'état civil pour la déclaration de naissance.",
      "التحقق من أدلة الحالة المدنية للتصريح بالولادة.",
      "Vérifier preuves dyal l 7ala lmadaniya l tasri7.",
      "Verify civil-status evidence for the birth declaration.",
    ),
    icon: "landmark",
  },
  {
    id: "hospital",
    label: L("Centre de santé Maârif", "مركز الصحة المعاريف", "Centre de santé Maârif", "Maârif health centre"),
    purpose: L(
      "Vérifier le carnet de vaccination et réserver la prochaine visite.",
      "التحقق من دفتر التلقيح وحجز الموعد القادم.",
      "Vérifier carnet dyal vaccination w 7jjez visite jaya.",
      "Verify the vaccination record and book the next visit.",
    ),
    icon: "stethoscope",
  },
  {
    id: "school",
    label: L("École / crèche", "المدرسة / الحضانة", "École / crèche", "School / nursery"),
    purpose: L(
      "Vérifier l'état civil de l'enfant pour l'inscription.",
      "التحقق من الحالة المدنية للطفل للتسجيل.",
      "Vérifier l 7ala lmadaniya dyal l wlid l inscription.",
      "Verify the child's civil status for enrolment.",
    ),
    icon: "graduation",
  },
  {
    id: "bank",
    label: L("Banque — dépôt direct", "البنك — الإيداع المباشر", "Banque — dépôt direct", "Bank — direct deposit"),
    purpose: L(
      "Vérifier l'identité avant d'activer le versement direct des prestations.",
      "التحقق من الهوية قبل تفعيل الإيداع المباشر للتعويض.",
      "Vérifier hwiya 9bel activation dyal dépôt direct.",
      "Verify identity before activating the benefit direct deposit.",
    ),
    icon: "wallet",
  },
];

function statusTone(status: DocumentStatus): "emerald" | "gold" | "coral" | "sky" | "neutral" {
  if (status === "VERIFIED") return "emerald";
  if (status === "ORDERED") return "gold";
  if (status === "EXPIRING") return "coral";
  if (status === "PENDING") return "sky";
  return "neutral";
}

export default function DocumentsPage() {
  const {
    snapshot,
    loading,
    lang,
    scanDocument,
    shareDocument,
    revokeConsent,
    pushToast,
  } = useSession();

  const [holder, setHolder] = useState(HOLDERS_ALL);
  const [viewId, setViewId] = useState<string | null>(null);
  const [shareId, setShareId] = useState<string | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanFields, setScanFields] = useState<{ label: string; value: string }[]>([]);
  const [recipient, setRecipient] = useState("cnss");
  const [days, setDays] = useState(7);
  const [sharing, setSharing] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  const documents = snapshot?.documents ?? [];
  const selectedDocument = documents.find((document) => document.id === viewId);
  const sharingDocument = documents.find((document) => document.id === shareId);
  const holderName = (holderId: string) => {
    if (!snapshot) return holderId;
    if (snapshot.citizen.id === holderId) return `${snapshot.citizen.firstName} ${snapshot.citizen.lastName}`;
    const person = snapshot.household.find((item) => item.id === holderId);
    return person ? `${person.firstName} ${person.lastName}` : holderId;
  };

  const filtered = useMemo(
    () => documents.filter((document) => holder === HOLDERS_ALL || document.holderId === holder),
    [documents, holder],
  );

  if (loading || !snapshot) {
    return (
      <div className="container-page py-6">
        <Skeleton className="h-40 rounded-4xl" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((index) => <Skeleton key={index} className="h-64 rounded-3xl" />)}
        </div>
      </div>
    );
  }

  const activeConsents = snapshot.consents.filter((consent) => consent.status === "ACTIVE");
  const sharedCount = documents.filter((document) => (document.sharedWith?.length ?? 0) > 0).length;
  const holderOptions = [
    { id: HOLDERS_ALL, label: t(DOCUMENTS.allHolders, lang), count: documents.length },
    ...snapshot.household.map((person) => ({
      id: person.id,
      label: `${person.firstName} ${person.lastName}`,
      count: documents.filter((document) => document.holderId === person.id).length,
    })),
  ];

  const runScan = async () => {
    setScanning(true);
    const result = await scanDocument();
    setScanning(false);
    if (result) {
      setScanFields(result.fields);
      pushToast({ tone: "success", title: t(DOCUMENTS.scanSuccess, lang) });
    }
  };

  const confirmShare = async () => {
    if (!sharingDocument) return;
    setSharing(true);
    const ok = await shareDocument(sharingDocument.id, recipient, days);
    setSharing(false);
    if (ok) {
      setShareId(null);
      pushToast({ tone: "success", title: t(DOCUMENTS.shareSuccess, lang) });
    }
  };

  const revoke = async (consentId: string) => {
    setRevoking(consentId);
    const ok = await revokeConsent(consentId);
    setRevoking(null);
    if (ok) pushToast({ tone: "info", title: t(DOCUMENTS.revokeSuccess, lang) });
  };

  const openShare = (documentId: string) => {
    setViewId(null);
    setShareId(documentId);
  };

  return (
    <div className="container-page py-6 sm:py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-emerald">{t(DOCUMENTS.eyebrow, lang)}</p>
          <h1 className="display-title mt-2 max-w-3xl text-[clamp(2rem,4vw,3.1rem)]">{t(DOCUMENTS.title, lang)}</h1>
          <p className="mt-2 max-w-2xl text-[0.84rem] leading-6 text-muted">{t(DOCUMENTS.lead, lang)}</p>
        </div>
        <Button onClick={() => setScanOpen(true)}>
          <ScanLine className="size-4" />
          {t(DOCUMENTS.scanAction, lang)}
        </Button>
      </div>

      <section className="mt-6 relative overflow-hidden rounded-4xl border border-mint bg-mint-soft/60 p-5 sm:p-6 noise" data-tour="documents-security">
        <div className="pointer-events-none absolute -right-12 -top-16 size-48 rounded-full bg-lime/25 blur-3xl" aria-hidden />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-forest text-lime shadow-soft">
              <Fingerprint className="size-6" />
            </span>
            <div>
              <p className="flex items-center gap-1.5 text-[0.58rem] font-bold uppercase tracking-[0.12em] text-emerald">
                <ShieldCheck className="size-3" />
                {t(DOCUMENTS.securityTitle, lang)}
              </p>
              <p className="mt-1 text-[0.8rem] font-bold text-forest">{t(DOCUMENTS.securityLead, lang)}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <p className="font-display text-[1.6rem] leading-none text-forest">{snapshot.metrics.verifiedDocuments}</p>
              <p className="mt-1 text-[0.52rem] font-semibold uppercase tracking-[0.08em] text-muted">{t(DOCUMENTS.verifiedCount, lang)}</p>
            </div>
            <div className="h-8 w-px bg-forest/15" />
            <div>
              <p className="font-display text-[1.6rem] leading-none text-forest">{activeConsents.length}</p>
              <p className="mt-1 text-[0.52rem] font-semibold uppercase tracking-[0.08em] text-muted">{t(DOCUMENTS.activeConsents, lang)}</p>
            </div>
            <div className="hidden h-8 w-px bg-forest/15 sm:block" />
            <div className="hidden sm:block">
              <p className="font-display text-[1.6rem] leading-none text-forest">{sharedCount}</p>
              <p className="mt-1 text-[0.52rem] font-semibold uppercase tracking-[0.08em] text-muted">{t(DOCUMENTS.sharedDocs, lang)}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {holderOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => setHolder(option.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.68rem] font-semibold transition-colors",
              holder === option.id
                ? "border-forest bg-forest text-paper"
                : "border-line bg-paper-soft text-muted hover:border-forest/25 hover:text-ink",
            )}
          >
            {option.label}
            <span className={cn("rounded-full px-1.5 text-[0.52rem]", holder === option.id ? "bg-paper/15" : "bg-cream-deep")}>
              {option.count}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.length === 0 ? (
          <EmptyState
            className="sm:col-span-2 xl:col-span-3"
            icon={<FileCheck2 className="size-5" />}
            title={lang === "ar" ? "لا وثائق لهذا الشخص." : lang === "en" ? "No documents for this person." : "Aucun document pour cette personne."}
            action={<Button size="sm" onClick={() => setScanOpen(true)}>{t(DOCUMENTS.scanAction, lang)}</Button>}
          />
        ) : (
          filtered.map((document) => (
            <CredentialCard
              key={document.id}
              document={document}
              lang={lang}
              holder={holderName(document.holderId)}
              onView={() => setViewId(document.id)}
              onShare={() => openShare(document.id)}
              onDownload={() => pushToast({ tone: "info", title: t(DOCUMENTS.downloadToast, lang) })}
            />
          ))
        )}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="surface p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-emerald">{t(COMMON.consentLedger, lang)}</p>
              <h2 className="mt-1 font-display text-[1.4rem] tracking-[-0.02em] text-forest-deep">{t(DOCUMENTS.consentTitle, lang)}</h2>
              <p className="mt-1 text-[0.66rem] text-muted">{t(DOCUMENTS.consentLead, lang)}</p>
            </div>
            <span className="flex size-9 items-center justify-center rounded-xl bg-mint-soft text-forest">
              <LockKeyhole className="size-4" />
            </span>
          </div>

          <div className="mt-4 space-y-2">
            {snapshot.consents.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line px-4 py-8 text-center">
                <LockKeyhole className="mx-auto size-5 text-muted/50" />
                <p className="mt-2 text-[0.64rem] text-muted">{t(DOCUMENTS.noConsents, lang)}</p>
              </div>
            ) : (
              snapshot.consents.slice(0, 8).map((consent) => (
                <div key={consent.id} className="rounded-2xl border border-line-soft bg-paper-soft/60 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[0.72rem] font-bold text-ink">{consent.recipient[lang] || consent.recipient.fr}</p>
                      <p className="mt-0.5 text-[0.55rem] text-muted">{consent.purpose[lang] || consent.purpose.fr}</p>
                    </div>
                    <Badge tone={consent.status === "ACTIVE" ? "emerald" : "neutral"} dot>
                      {t(STATUS_LABEL[consent.status], lang)}
                    </Badge>
                  </div>
                  <div className="mt-2">
                    <ScopeChips scopes={consent.scopes} lang={lang} max={4} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-line-soft pt-2 text-[0.52rem] text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="size-2.5" />
                      {formatDate(consent.grantedAt, lang)} → {formatDate(consent.expiresAt, lang)}
                    </span>
                    {consent.status === "ACTIVE" ? (
                      <button
                        onClick={() => void revoke(consent.id)}
                        disabled={revoking === consent.id}
                        className="font-bold text-[#9d3d25] hover:underline disabled:opacity-50"
                      >
                        {t(DOCUMENTS.revokeAction, lang)}
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="surface p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-emerald">{t(DOCUMENTS.auditTitle, lang)}</p>
              <h2 className="mt-1 font-display text-[1.4rem] tracking-[-0.02em] text-forest-deep">{t(DOCUMENTS.auditTitle, lang)}</h2>
              <p className="mt-1 text-[0.66rem] text-muted">{t(DOCUMENTS.auditLead, lang)}</p>
            </div>
            <span className="flex size-9 items-center justify-center rounded-xl bg-gold-soft text-[#7d5a16]">
              <KeyRound className="size-4" />
            </span>
          </div>
          <div className="mt-4 space-y-1.5">
            {snapshot.audit.length === 0 ? (
              <p className="py-6 text-center text-[0.62rem] text-muted">{t(DOCUMENTS.noAudit, lang)}</p>
            ) : (
              snapshot.audit.slice(0, 9).map((entry) => (
                <div key={entry.id} className="flex items-start gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-cream/50">
                  <span
                    className={cn(
                      "mt-1.5 size-1.5 shrink-0 rounded-full",
                      entry.actor === "citizen" ? "bg-gold" : entry.actor === "executor" || entry.actor === "policy" ? "bg-emerald" : "bg-sky",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.62rem] font-semibold text-ink-soft">{entry.action.replace(/[._]/g, " ")}</p>
                    {entry.detail ? <p className="mt-0.5 line-clamp-2 text-[0.54rem] leading-4 text-muted">{entry.detail[lang] || entry.detail.fr}</p> : null}
                  </div>
                  <span className="shrink-0 font-mono text-[0.46rem] text-muted/50">{formatDate(entry.at, lang, false)}</span>
                </div>
              ))
            )}
          </div>
          <p className="mt-3 flex items-center gap-1.5 border-t border-line-soft pt-3 text-[0.52rem] text-muted/60">
            <ShieldCheck className="size-2.5" />
            {t(DOCUMENTS.storageNote, lang)}
          </p>
        </section>
      </div>

      <Modal
        open={Boolean(selectedDocument)}
        onClose={() => setViewId(null)}
        title={selectedDocument ? <span className="font-display text-[1.3rem] text-forest-deep">{t(DOCUMENTS.viewTitle, lang)}</span> : null}
        footer={
          selectedDocument ? (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button size="sm" variant="outline" onClick={() => pushToast({ tone: "info", title: t(DOCUMENTS.downloadToast, lang) })}>
                <Download className="size-3.5" />
                {t(COMMON.download, lang)}
              </Button>
              <Button size="sm" onClick={() => openShare(selectedDocument.id)}>
                <Share2 className="size-3.5" />
                {t(COMMON.share, lang)}
              </Button>
            </div>
          ) : null
        }
      >
        {selectedDocument ? <DocumentPreview document={selectedDocument} lang={lang} holder={holderName(selectedDocument.holderId)} /> : null}
      </Modal>

      <Modal
        open={Boolean(sharingDocument)}
        onClose={() => setShareId(null)}
        title={
          <div>
            <p className="font-display text-[1.35rem] text-forest-deep">{t(DOCUMENTS.shareTitle, lang)}</p>
            <p className="mt-1 text-[0.64rem] leading-5 text-muted">{t(DOCUMENTS.shareLead, lang)}</p>
          </div>
        }
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-1.5 text-[0.55rem] text-muted">
              <Clock3 className="size-3" />
              {days === 1 ? t(DOCUMENTS.hours24, lang) : days === 7 ? t(DOCUMENTS.days7, lang) : t(DOCUMENTS.days30, lang)}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShareId(null)}>{t(COMMON.cancel, lang)}</Button>
              <Button size="sm" onClick={() => void confirmShare()} loading={sharing}>
                <Share2 className="size-3.5" />
                {t(DOCUMENTS.shareConfirm, lang)}
              </Button>
            </div>
          </div>
        }
      >
        {sharingDocument ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 rounded-2xl border border-line-soft bg-paper-soft p-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-mint-soft text-forest">
                <Icon name={sharingDocument.icon} className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[0.72rem] font-bold text-ink">{sharingDocument.title[lang] || sharingDocument.title.fr}</p>
                <p className="truncate text-[0.55rem] text-muted">{sharingDocument.authority} · {sharingDocument.reference}</p>
              </div>
            </div>

            <div>
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.1em] text-muted">{t(DOCUMENTS.recipient, lang)}</p>
              <div className="mt-2 space-y-1.5">
                {RECIPIENTS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setRecipient(item.id)}
                    className={cn(
                      "flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors",
                      recipient === item.id ? "border-forest/35 bg-mint-soft/50" : "border-line-soft bg-paper-soft hover:border-forest/20",
                    )}
                  >
                    <span className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg", recipient === item.id ? "bg-forest text-lime" : "bg-cream-deep/70 text-muted")}>
                      <Icon name={item.icon} className="size-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.66rem] font-bold text-ink">{item.label[lang] || item.label.fr}</span>
                      <span className="mt-0.5 block text-[0.55rem] leading-4 text-muted">{item.purpose[lang] || item.purpose.fr}</span>
                    </span>
                    {recipient === item.id ? <Check className="mt-1 size-3.5 shrink-0 text-emerald" /> : null}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.1em] text-muted">{t(DOCUMENTS.duration, lang)}</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[
                  { value: 1, label: t(DOCUMENTS.hours24, lang) },
                  { value: 7, label: t(DOCUMENTS.days7, lang) },
                  { value: 30, label: t(DOCUMENTS.days30, lang) },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setDays(option.value)}
                    className={cn(
                      "rounded-xl border px-2 py-2 text-[0.62rem] font-semibold transition-colors",
                      days === option.value ? "border-forest bg-forest text-paper" : "border-line bg-paper-soft text-muted hover:text-ink",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-xl border border-gold/25 bg-gold-soft/50 px-3 py-2.5">
              <LockKeyhole className="mt-0.5 size-3.5 shrink-0 text-[#7d5a16]" />
              <p className="text-[0.58rem] leading-5 text-[#6b4a0f]">{t(DOCUMENTS.consentLead, lang)}</p>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={scanOpen}
        onClose={() => { setScanOpen(false); setScanFields([]); }}
        title={<span className="font-display text-[1.35rem] text-forest-deep">{t(DOCUMENTS.scanTitle, lang)}</span>}
        footer={
          <div className="flex items-center justify-between gap-2">
            <p className="text-[0.52rem] text-muted">{t(DOCUMENTS.uploadNote, lang)}</p>
            {scanFields.length > 0 ? (
              <Button size="sm" onClick={() => { setScanOpen(false); setScanFields([]); }}>
                {t(COMMON.done, lang)}
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => void runScan()} loading={scanning}>
                <ScanLine className="size-3.5" />
                {t(DOCUMENTS.scanDemo, lang)}
              </Button>
            )}
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-[0.72rem] leading-6 text-muted">{t(DOCUMENTS.scanLead, lang)}</p>

          {scanFields.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-line bg-paper-soft/50 px-6 py-10 text-center">
              {scanning ? (
                <>
                  <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-mint-soft text-forest">
                    <ScanLine className="size-6 animate-pulse" />
                  </span>
                  <p className="mt-3 text-[0.72rem] font-semibold text-forest">{t(DOCUMENTS.scanning, lang)}</p>
                  <div className="mx-auto mt-3 h-1.5 w-40 overflow-hidden rounded-full bg-cream-deep">
                    <div className="h-full w-2/3 animate-pulse rounded-full bg-emerald" />
                  </div>
                </>
              ) : (
                <>
                  <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-cream-deep/70 text-muted">
                    <UploadCloud className="size-6" />
                  </span>
                  <p className="mt-3 text-[0.72rem] font-semibold text-ink-soft">{t(DOCUMENTS.scanLead, lang)}</p>
                  <p className="mt-1 text-[0.55rem] text-muted">{t(DOCUMENTS.uploadNote, lang)}</p>
                </>
              )}
            </div>
          ) : (
            <div className="rounded-3xl border border-mint bg-mint-soft/50 p-4">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-full bg-forest text-lime">
                  <Check className="size-4" />
                </span>
                <div>
                  <p className="text-[0.72rem] font-bold text-forest">{t(DOCUMENTS.scanSuccess, lang)}</p>
                  <p className="text-[0.55rem] text-forest/60">{t(DOCUMENTS.uploadNote, lang)}</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-[0.55rem] font-bold uppercase tracking-[0.1em] text-emerald">{t(DOCUMENTS.extracted, lang)}</p>
                <div className="mt-2 space-y-1 rounded-xl border border-mint bg-paper p-3">
                  {scanFields.map((field) => (
                    <div key={field.label} className="flex items-start justify-between gap-3 text-[0.6rem]">
                      <span className="shrink-0 text-muted">{field.label}</span>
                      <span className="text-right font-semibold text-ink">{field.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between rounded-xl bg-cream/60 px-3 py-2">
            <p className="flex items-center gap-1.5 text-[0.56rem] text-muted">
              <ShieldCheck className="size-3 text-emerald" />
              {t(DOCUMENTS.storageNote, lang)}
            </p>
            {scanFields.length > 0 ? (
              <button onClick={() => setScanFields([])} className="text-[0.56rem] font-bold text-emerald hover:underline">
                {t(DOCUMENTS.scanAnother, lang)}
              </button>
            ) : null}
          </div>
        </div>
      </Modal>
    </div>
  );
}

function CredentialCard({
  document,
  lang,
  holder,
  onView,
  onShare,
  onDownload,
}: {
  document: VaultDocument;
  lang: Lang;
  holder: string;
  onView: () => void;
  onShare: () => void;
  onDownload: () => void;
}) {
  const shared = document.sharedWith?.length ?? 0;
  return (
    <article className="group surface flex flex-col overflow-hidden transition-all hover:-translate-y-0.5 hover:border-forest/20 hover:shadow-lift">
      <div className="flex items-start justify-between gap-2 border-b border-line-soft bg-paper-soft/60 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-10 items-center justify-center rounded-xl bg-cream-deep/70 text-forest">
            <Icon name={document.icon} className="size-4.5" />
          </span>
          <div>
            <p className="text-[0.5rem] font-bold uppercase tracking-[0.1em] text-muted">{holder}</p>
            <p className="mt-0.5 text-[0.6rem] font-semibold text-ink-soft">{document.authority}</p>
          </div>
        </div>
        <Badge tone={statusTone(document.status)} dot>{t(STATUS_LABEL[document.status], lang)}</Badge>
      </div>

      <div className="flex-1 p-4">
        <h3 className="text-[0.85rem] font-bold leading-5 text-ink">{document.title[lang] || document.title.fr}</h3>
        <p className="mt-1 text-[0.62rem] leading-4 text-muted">{document.subtitle[lang] || document.subtitle.fr}</p>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-cream/60 px-2.5 py-2">
            <p className="text-[0.48rem] font-bold uppercase tracking-[0.08em] text-muted">{t(COMMON.reference, lang)}</p>
            <p className="mt-0.5 truncate font-mono text-[0.58rem] font-bold text-forest">{document.reference}</p>
          </div>
          <div className="rounded-xl bg-cream/60 px-2.5 py-2">
            <p className="text-[0.48rem] font-bold uppercase tracking-[0.08em] text-muted">{t(DOCUMENTS.expiresOn, lang)}</p>
            <p className="mt-0.5 text-[0.58rem] font-bold text-forest">{document.expiresAt ? formatDate(document.expiresAt, lang) : "—"}</p>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between rounded-xl border border-line-soft px-2.5 py-1.5">
          <span className="truncate font-mono text-[0.5rem] text-muted/70">{document.credentialHash.slice(0, 22)}…</span>
          {shared > 0 ? <Badge tone="sky" className="px-1.5 py-0.5 text-[0.48rem]">{shared} {t(COMMON.share, lang)}</Badge> : <LockKeyhole className="size-3 text-muted/50" />}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-line-soft bg-paper-soft/50 px-3 py-2">
        <span className="text-[0.52rem] font-semibold text-emerald">
          {document.issuedAt ? `${t(COMMON.issued, lang)} ${formatDate(document.issuedAt, lang)}` : t(COMMON.verified, lang)}
        </span>
        <div className="flex items-center gap-0.5">
          <button onClick={onView} className="inline-flex size-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-mint-soft hover:text-forest" title={t(DOCUMENTS.viewTitle, lang)}>
            <Eye className="size-3.5" />
          </button>
          <button onClick={onShare} className="inline-flex size-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-mint-soft hover:text-forest" title={t(COMMON.share, lang)}>
            <Share2 className="size-3.5" />
          </button>
          <button onClick={onDownload} className="inline-flex size-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-mint-soft hover:text-forest" title={t(COMMON.download, lang)}>
            <Download className="size-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}

function DocumentPreview({ document, lang, holder }: { document: VaultDocument; lang: Lang; holder: string }) {
  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-paper via-cream/70 to-mint-soft/40 p-5">
        <div className="pointer-events-none absolute -right-10 -top-10 size-32 rounded-full border-[10px] border-forest/5" aria-hidden />
        <div className="pointer-events-none absolute -right-4 -top-4 size-20 rounded-full border border-forest/10" aria-hidden />
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-forest text-lime">
              <Icon name={document.icon} className="size-5" />
            </span>
            <div>
              <p className="text-[0.5rem] font-bold uppercase tracking-[0.12em] text-muted">{document.authority}</p>
              <p className="mt-0.5 font-display text-[1.1rem] text-forest-deep">{document.title[lang] || document.title.fr}</p>
            </div>
          </div>
          <Badge tone={statusTone(document.status)} dot>{t(STATUS_LABEL[document.status], lang)}</Badge>
        </div>
        <p className="mt-3 text-[0.66rem] leading-5 text-muted">{document.subtitle[lang] || document.subtitle.fr}</p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Field label={t(DOCUMENTS.holder, lang)} value={holder} />
          <Field label={t(COMMON.reference, lang)} value={document.reference} mono />
          <Field label={t(COMMON.issued, lang)} value={document.issuedAt ? formatDate(document.issuedAt, lang) : "—"} />
          <Field label={t(DOCUMENTS.validUntil, lang)} value={document.expiresAt ? formatDate(document.expiresAt, lang) : "—"} />
        </div>

        <div className="mt-3 rounded-xl border border-line bg-paper/70 px-3 py-2">
          <p className="text-[0.48rem] font-bold uppercase tracking-[0.1em] text-muted">{t(DOCUMENTS.credentialHash, lang)}</p>
          <p className="mt-0.5 break-all font-mono text-[0.56rem] text-forest">{document.credentialHash}</p>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-mint bg-mint-soft/50 px-3 py-2.5">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-emerald" />
        <p className="text-[0.58rem] leading-5 text-forest/80">{t(DOCUMENTS.storageNote, lang)}</p>
      </div>

      {document.sharedWith && document.sharedWith.length > 0 ? (
        <div>
          <p className="text-[0.58rem] font-bold uppercase tracking-[0.1em] text-muted">{t(DOCUMENTS.sharedWith, lang)}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {document.sharedWith.map((recipient) => (
              <Badge key={recipient} tone="sky">{recipient}</Badge>
            ))}
          </div>
        </div>
      ) : (
        <p className="flex items-center gap-1.5 text-[0.6rem] text-muted">
          <LockKeyhole className="size-3" />
          {t(DOCUMENTS.notShared, lang)}
        </p>
      )}
    </div>
  );
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl bg-paper/70 px-2.5 py-2">
      <p className="text-[0.48rem] font-bold uppercase tracking-[0.08em] text-muted">{label}</p>
      <p className={cn("mt-0.5 truncate text-[0.62rem] font-semibold text-forest", mono && "font-mono")}>{value}</p>
    </div>
  );
}
