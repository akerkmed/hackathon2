import type { NextRequest } from "next/server";
import { apiError, json, sessionFrom } from "@/lib/api/session";
import { addAudit, toSnapshot } from "@/lib/domain/store";
import { DEMO_NOW } from "@/lib/domain/seed";
import { L } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = sessionFrom(request);
  const { id } = await params;
  const consent = session.consents.find((item) => item.id === id);
  if (!consent) return apiError("CONSENT_NOT_FOUND", 404);
  if (consent.status !== "ACTIVE") return apiError("CONSENT_ALREADY_CLOSED", 409);

  consent.status = "REVOKED";
  consent.expiresAt = DEMO_NOW;

  if (consent.documentId) {
    const document = session.documents.find((item) => item.id === consent.documentId);
    if (document?.sharedWith) {
      document.sharedWith = document.sharedWith.filter((name) => name !== consent.recipient.fr);
      if (document.sharedWith.length === 0) document.sharedWith = undefined;
    }
  }

  addAudit(session, {
    actor: "citizen",
    action: "consent.revoked",
    code: "CONSENT-REVOKE",
    detail: L(
      `Consent ${consent.reference} revoked. Access for ${consent.recipient.fr} is cut immediately.`,
      `تم إلغاء الموافقة ${consent.reference}. تم قطع وصول ${consent.recipient.ar} فوراً.`,
      `Consent ${consent.reference} rvoqué. Accès dyal ${consent.recipient.darija} t9ta3 direct.`,
      `Consent ${consent.reference} revoked. Access for ${consent.recipient.en} is cut immediately.`,
    ),
  });

  return json({ snapshot: toSnapshot(session), consent });
}
