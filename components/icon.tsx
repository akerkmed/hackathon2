"use client";

import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Baby,
  BookUser,
  Briefcase,
  Building2,
  CalendarDays,
  Coins,
  FileCheck2,
  FileText,
  Fingerprint,
  GraduationCap,
  Heart,
  Home,
  Landmark,
  MapPin,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import type { IconName } from "@/lib/domain/types";
import { cn } from "@/lib/format";

const MAP: Record<IconName, LucideIcon> = {
  baby: Baby,
  file: FileText,
  "file-check": FileCheck2,
  shield: ShieldCheck,
  wallet: Wallet,
  coins: Coins,
  stethoscope: Stethoscope,
  home: Home,
  briefcase: Briefcase,
  graduation: GraduationCap,
  landmark: Landmark,
  fingerprint: Fingerprint,
  "map-pin": MapPin,
  calendar: CalendarDays,
  heart: Heart,
  sparkles: Sparkles,
  receipt: ReceiptText,
  users: Users,
  passport: BookUser,
  building: Building2,
  zap: Zap,
  arrow: ArrowRight,
};

export function Icon({
  name,
  className,
  strokeWidth = 1.75,
}: {
  name: IconName;
  className?: string;
  strokeWidth?: number;
}) {
  const Component = MAP[name] ?? Sparkles;
  return <Component className={cn("size-5", className)} strokeWidth={strokeWidth} aria-hidden />;
}
