import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, json, sessionFrom } from "@/lib/api/session";
import { handleInit, handleMessage } from "@/lib/domain/agent";

export const dynamic = "force-dynamic";

const schema = z.object({
  message: z.string().max(2000).optional(),
  lang: z.enum(["fr", "ar", "darija", "en"]).default("fr"),
  init: z.boolean().optional(),
});

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

  if (parsed.data.init) {
    return json(handleInit(session, parsed.data.lang));
  }
  if (!parsed.data.message?.trim()) return apiError("EMPTY_MESSAGE", 422);
  return json(handleMessage(session, parsed.data.message, parsed.data.lang));
}
