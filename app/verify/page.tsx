import type { Metadata } from "next";
import { VerifyIndex } from "@/components/verify/public-verify";

export const metadata: Metadata = {
  title: "Verify a receipt",
  description: "Check a M3ak orchestration receipt: holder, case, line items and SHA-256 hash.",
};

export default function VerifyPage() {
  return <VerifyIndex />;
}
