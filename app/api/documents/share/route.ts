import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, json, sessionFrom } from "@/lib/api/session";
import { addAudit, nextRef, toSnapshot } from "@/lib/domain/store";
import { DEMO_NOW } from "@/lib/domain/seed";
import { L } from "@/lib/i18n";
import type { ConsentRecord, ConsentScope } from "@/lib/domain/types";

export const dynamic = "force-dynamic";

const RECIPIENTS: Record<
  string,
  { label: ReturnType<typeof L>; purpose: ReturnType<typeof L>; scopes: ConsentScope[] }
> = {
  cnss: {
    label: L("CNSS — TAAWIDATY", "الصندوق الوطني للضمان الاجتماعي — تعويضاتي", "CNSS — TAAWIDATY", "CNSS — TAAWIDATY"),
    purpose: L(
      "Verify the family file for dependent registration and benefits.",
      "التحقق من الملف العائلي لتسجيل التابع والتعويضات.",
      "Vérifier dossier dyal l famille l tasjil w les allocations.",
      "Verify the family file for dependent registration and benefits.",
    ),
    scopes: ["read:cnss", "read:identity"],
  },
  commune: {
    label: L("Commune de Laâyoune", "جماعة العيون", "Commune dyal Laâyoune", "Laâyoune commune"),
    purpose: L(
      "Verify civil-status evidence for the birth declaration.",
      "التحقق من أدلة الحالة المدنية للتصريح بالولادة.",
      "Vérifier preuves dyal l 7ala lmadaniya l tasri7.",
      "Verify civil-status evidence for the birth declaration.",
    ),
    scopes: ["read:civil_status", "read:identity"],
  },
  bank: {
    label: L("Bank — direct deposit", "البنك — الإيداع المباشر", "Banque — dépôt direct", "Bank — direct deposit"),
    purpose: L(
      "Verify identity before activating the benefit direct deposit.",
      "التحقق من الهوية قبل تفعيل الإيداع المباشر للتعويض.",
      "Vérifier hwiya 9bel activation dyal dépôt direct.",
      "Verify identity before activating the benefit direct deposit.",
    ),
    scopes: ["read:identity"],
  },
  school: {
    label: L("École / crèche", "المدرسة / الحضانة", "École / crèche", "School / nursery"),
    purpose: L(
      "Verify the child's civil status for enrolment.",
      "التحقق من الحالة المدنية للطفل للتسجيل.",
      "Vérifier l 7ala lmadaniya dyal l wlid l inscription.",
      "Verify the child's civil status for enrolment.",
    ),
    scopes: ["read:civil_status"],
  },
  hospital: {
    label: L("Centre de santé Laâyoune", "مركز الصحة بالعيون", "Centre de santé Laâyoune", "Laâyoune health centre"),
    purpose: L(
      "Verify the vaccination record and book the next visit.",
      "التحقق من دفتر التلقيح وحجز الموعد القادم.",
      "Vérifier carnet dyal vaccination w 7jjez visite jaya.",
      "Verify the vaccination record and book the next visit.",
    ),
    scopes: ["read:identity", "book:health"],
  },
};

const schema = z.object({
  documentId: z.string().min(1),
  recipient: z.string().min(1),
  days: z.number().int().min(1).max(30).default(7),
});

function addDays(iso: string, days: number): string {
  const date = new Date(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

export async function POST(request: NextRequest) {
  const session = sessionFrom(request);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_JSON", 400);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return apiError("INVALID_REQUEST", 422);

  const document = session.documents.find((item) => item.id === parsed.data.documentId);
  if (!document) return apiError("DOCUMENT_NOT_FOUND", 404);

  const recipient = RECIPIENTS[parsed.data.recipient];
  if (!recipient) return apiError("UNKNOWN_RECIPIENT", 422);

  const label = recipient.label.fr;
  if (!document.sharedWith?.includes(label)) {
    document.sharedWith = [...(document.sharedWith ?? []), label];
  }

  const consent: ConsentRecord = {
    id: `consent-doc-${session.consents.length + 1}-${Math.random().toString(36).slice(2, 5)}`,
    reference: nextRef(session, "CONSENT"),
    recipient: recipient.label,
    scopes: recipient.scopes,
    grantedAt: DEMO_NOW,
    expiresAt: addDays(DEMO_NOW, parsed.data.days),
    status: "ACTIVE",
    purpose: recipient.purpose,
    documentId: document.id,
    recipientId: parsed.data.recipient,
  };
  session.consents.unshift(consent);

  addAudit(session, {
    actor: "citizen",
    action: "document.shared",
    code: "DOC-SHARE",
    detail: L(
      `Document "${document.title.fr}" shared with ${recipient.label.fr} for ${parsed.data.days} days. Consent ${consent.reference}.`,
      `تمت مشاركة الوثيقة «${document.title.ar}» مع ${recipient.label.ar} لمدة ${parsed.data.days} أيام. الموافقة ${consent.reference}.`,
      `Document "${document.title.darija}" tpartagea m3a ${recipient.label.darija} l ${parsed.data.days} iyam. Consent ${consent.reference}.`,
      `Document "${document.title.en}" shared with ${recipient.label.en} for ${parsed.data.days} days. Consent ${consent.reference}.`,
    ),
  });

  return json({ snapshot: toSnapshot(session), consent });
}
