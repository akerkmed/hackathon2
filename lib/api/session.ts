import { NextResponse, type NextRequest } from "next/server";
import { ensureSession, type Session } from "@/lib/domain/store";

export const SESSION_HEADER = "x-m3ak-session";

export function sessionFrom(request: NextRequest): Session {
  const raw = request.headers.get(SESSION_HEADER) || "m3ak-demo";
  const id = raw.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64) || "m3ak-demo";
  return ensureSession(id);
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}
