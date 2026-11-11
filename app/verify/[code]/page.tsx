import type { Metadata } from "next";
import { findReceipt } from "@/lib/domain/store";
import { VerifyDetail, VerifyNotFound } from "@/components/verify/public-verify";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const decoded = decodeURIComponent(code);
  const found = findReceipt(decoded);
  return {
    title: found ? `Receipt ${found.receipt.code}` : "Receipt not found",
    description: found
      ? `Verified M3ak demo receipt for ${found.citizenName}. Case ${found.receipt.caseId}.`
      : "This M3ak receipt code is not present in the demo registry.",
    robots: { index: false, follow: false },
  };
}

export default async function VerifyCodePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const decoded = decodeURIComponent(code);
  const found = findReceipt(decoded);

  if (!found) {
    return <VerifyNotFound code={decoded} />;
  }

  return <VerifyDetail receipt={found.receipt} citizenName={found.citizenName} />;
}
