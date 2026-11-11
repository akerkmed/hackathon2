import type { NextRequest } from "next/server";
import { apiError, json, sessionFrom } from "@/lib/api/session";
import { cancelPlan } from "@/lib/domain/plans";
import { toSnapshot } from "@/lib/domain/store";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = sessionFrom(request);
  const { id } = await params;
  const plan = cancelPlan(session, id);
  if (!plan) return apiError("PLAN_NOT_CANCELLABLE", 409);
  return json({ plan, snapshot: toSnapshot(session) });
}
