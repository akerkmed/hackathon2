import type { NextRequest } from "next/server";
import { json, sessionFrom } from "@/lib/api/session";
import { addAudit, toSnapshot } from "@/lib/domain/store";
import { L } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = sessionFrom(request);
  const eligible = session.benefits.filter((benefit) => benefit.status === "ELIGIBLE");
  const applied = session.benefits.filter((benefit) => benefit.status === "APPLIED");
  const excluded = session.benefits.filter((benefit) => benefit.status === "NOT_ELIGIBLE");
  const oneOff = [...eligible, ...applied]
    .filter((benefit) => benefit.cadence === "ONE_OFF")
    .reduce((sum, benefit) => sum + benefit.amount, 0);
  const monthly = [...eligible, ...applied]
    .filter((benefit) => benefit.cadence === "MONTHLY")
    .reduce((sum, benefit) => sum + benefit.amount, 0);

  session.metrics = {
    ...session.metrics,
    benefitsFound: Math.max(session.metrics.benefitsFound, oneOff + monthly * 12),
  };

  addAudit(session, {
    actor: "policy",
    action: "benefits.scanned",
    code: "BEN-SCAN",
    detail: L(
      `${eligible.length + applied.length} benefits confirmed and ${excluded.length} excluded to avoid double-claiming. First-year value recomputed: ${oneOff + monthly * 12} DH.`,
      `${eligible.length + applied.length} تعويضات مؤكدة و${excluded.length} مستبعدة لتجنب الازدواجية. القيمة السنوية: ${oneOff + monthly * 12} درهم.`,
      `${eligible.length + applied.length} benefits confirmés w ${excluded.length} exclus bach ma ykounch double claim. Valeur dyal l 3am: ${oneOff + monthly * 12} DH.`,
      `${eligible.length + applied.length} benefits confirmed and ${excluded.length} excluded to avoid double-claiming. First-year value recomputed: ${oneOff + monthly * 12} DH.`,
    ),
  });

  return json({
    snapshot: toSnapshot(session),
    found: eligible.length + applied.length,
    excluded: excluded.length,
    oneOff,
    monthly,
    yearly: oneOff + monthly * 12,
  });
}
