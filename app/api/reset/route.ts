import type { NextRequest } from "next/server";
import { json, sessionFrom } from "@/lib/api/session";
import { resetSession, toSnapshot } from "@/lib/domain/store";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const current = sessionFrom(request);
  const session = resetSession(current.id);
  return json({ snapshot: toSnapshot(session) });
}
