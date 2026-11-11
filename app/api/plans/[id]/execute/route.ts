import type { NextRequest } from "next/server";
import { z } from "zod";
import { apiError, sessionFrom } from "@/lib/api/session";
import { executePlan } from "@/lib/domain/executor";
import { validatePlan } from "@/lib/domain/plans";
import { toSnapshot } from "@/lib/domain/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const schema = z.object({
  scopes: z.array(z.string()).default([]),
  speed: z.number().min(0).max(900).default(380),
  lang: z.enum(["fr", "ar", "darija", "en"]).default("fr"),
});

const SCOPE_ENUM = [
  "read:identity",
  "write:identity",
  "read:civil_status",
  "write:civil_status",
  "read:cnss",
  "write:cnss",
  "read:tax",
  "write:tax",
  "read:education",
  "write:education",
  "book:health",
  "pay:fees",
  "write:utilities",
] as const;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = sessionFrom(request);
  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return apiError("INVALID_REQUEST", 422);

  const scopes = parsed.data.scopes.filter((scope): scope is (typeof SCOPE_ENUM)[number] =>
    (SCOPE_ENUM as readonly string[]).includes(scope),
  );

  const validation = validatePlan(session, id, scopes);
  if (!validation.ok) {
    const status = validation.error === "PLAN_NOT_FOUND" ? 404 : 409;
    return apiError(validation.error, status);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (payload: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`${JSON.stringify(payload)}\n`));
      };

      try {
        const result = await executePlan(session, id, scopes, parsed.data.speed, (event) => {
          send({ type: "event", event });
        }, parsed.data.lang);
        send({ type: "receipt", receipt: result.receipt });
        send({ type: "snapshot", snapshot: toSnapshot(session) });
        send({ type: "done" });
      } catch (error) {
        send({
          type: "error",
          error: error instanceof Error ? error.message : "EXECUTION_FAILED",
        });
      } finally {
        closed = true;
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
