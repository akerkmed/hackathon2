import type { NextRequest } from "next/server";
import { json, sessionFrom } from "@/lib/api/session";
import { toSnapshot } from "@/lib/domain/store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = sessionFrom(request);
  return json(toSnapshot(session));
}
