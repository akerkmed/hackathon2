import { NextResponse } from "next/server";
import { findReceipt } from "@/lib/domain/store";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const found = findReceipt(decodeURIComponent(code));
  if (!found) {
    return NextResponse.json({ valid: false }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  return NextResponse.json(
    {
      valid: true,
      receipt: found.receipt,
      citizenName: found.citizenName,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
