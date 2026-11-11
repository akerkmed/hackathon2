import type { NextRequest } from "next/server";
import { json, sessionFrom } from "@/lib/api/session";
import { addAudit, toSnapshot } from "@/lib/domain/store";
import { DEMO_NOW } from "@/lib/domain/seed";
import { L } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = sessionFrom(request);
  const handoff =
    session.handoff ??
    (session.handoff = {
      id: `TICKET-${String(session.audit.length + 1).padStart(3, "0")}`,
      queue: 2,
      at: DEMO_NOW,
    });

  addAudit(session, {
    actor: "agent",
    action: "handoff.created",
    code: "HANDOFF",
    detail: L(
      `Warm handoff to a human adviser, ticket ${handoff.id}. Full context attached.`,
      `تحويل دافئ إلى مستشار بشري، التذكرة ${handoff.id}. السياق الكامل مرفق.`,
      `Handoff dafi l conseiller bachari, ticket ${handoff.id}. Contexte kamel mrefeq.`,
      `Warm handoff to a human adviser, ticket ${handoff.id}. Full context attached.`,
    ),
  });

  return json({ handoff, snapshot: toSnapshot(session) });
}
