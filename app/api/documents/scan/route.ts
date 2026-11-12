import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { json, sessionFrom } from "@/lib/api/session";
import { addAudit, toSnapshot } from "@/lib/domain/store";
import { DEMO_NOW } from "@/lib/domain/seed";
import { L } from "@/lib/i18n";
import type { VaultDocument } from "@/lib/domain/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FIELDS = [
  { label: "Nom de l'enfant", value: "Adam Benali" },
  { label: "Date et heure", value: "07/11/2026 · 04:42" },
  { label: "Mère", value: "Yasmine Benali · CNIE BK 482 913" },
  { label: "Établissement", value: "Hôpital Régional de Laâyoune" },
  { label: "Médecin", value: "Dr. S. Amrani" },
];

export async function POST(request: NextRequest) {
  const session = sessionFrom(request);
  const existing = session.documents.find((document) => document.id === "doc-hospital-birth");

  if (existing) {
    return json({ snapshot: toSnapshot(session), document: existing, fields: FIELDS, duplicate: true });
  }

  const hash = createHash("sha256")
    .update(`hospital-birth-${session.id}`)
    .digest("hex")
    .slice(0, 10)
    .toUpperCase();

  const document: VaultDocument = {
    id: "doc-hospital-birth",
    type: "OTHER",
    holderId: "cit-adam",
    title: L(
      "Hospital birth certificate",
      "شهادة الولادة من المستشفى",
      "Chahada dyal l wilada mn l hopital",
      "Hospital birth certificate",
    ),
    subtitle: L(
      "Hôpital Régional de Laâyoune · scanné aujourd'hui",
      "المستشفى الجهوي بالعيون · مُسحت اليوم",
      "Hôpital Régional dyal Laâyoune · scanée l youm",
      "Laâyoune Regional Hospital · scanned today",
    ),
    status: "VERIFIED",
    issuedAt: "2026-11-07",
    authority: "Hôpital Régional de Laâyoune",
    reference: `HOP-2026-${hash.slice(0, 4)}`,
    credentialHash: hash,
    icon: "file-check",
    sharedWith: [],
  };

  session.documents.unshift(document);
  session.metrics = {
    ...session.metrics,
    documents: session.metrics.documents + 1,
    verifiedDocuments: session.metrics.verifiedDocuments + 1,
  };

  addAudit(session, {
    actor: "citizen",
    action: "document.scanned",
    code: "DOC-SCAN",
    detail: L(
      "Hospital birth certificate scanned, OCR-verified and added to Adam's file.",
      "تم مسح شهادة الولادة والتحقق منها وإضافتها إلى ملف آدم.",
      "Chahada dyal l hopital tscannat, tverifat w tzadet f dossier dyal Adam.",
      "Hospital birth certificate scanned, OCR-verified and added to Adam's file.",
    ),
  });

  return json({ snapshot: toSnapshot(session), document, fields: FIELDS, duplicate: false, scannedAt: DEMO_NOW });
}
