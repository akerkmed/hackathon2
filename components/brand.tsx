import Link from "next/link";
import { cn } from "@/lib/format";

export function BrandMark({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" | "lime" }) {
  const bg = tone === "light" ? "bg-paper" : tone === "lime" ? "bg-lime" : "bg-forest";
  const fg = tone === "light" ? "text-forest" : tone === "lime" ? "text-forest-deep" : "text-lime";
  return (
    <span className={cn("relative inline-flex size-9 items-center justify-center rounded-[0.7rem] shadow-sm", bg, fg, className)}>
      <svg viewBox="0 0 32 32" className="size-5" fill="none" aria-hidden>
        <path d="M6 25V9l10 9 10-9v16" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-gold" aria-hidden />
    </span>
  );
}

export function Brand({
  href = "/",
  tone = "dark",
  compact = false,
  className,
}: {
  href?: string;
  tone?: "dark" | "light" | "lime";
  compact?: boolean;
  className?: string;
}) {
  const text = tone === "light" ? "text-paper" : "text-forest-deep";
  const sub = tone === "light" ? "text-paper/55" : "text-muted";
  const label = tone === "light" ? "bg-paper/10 text-paper/75" : "bg-forest/6 text-forest";
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5", className)} aria-label="M3ak home">
      <BrandMark tone={tone} />
      <span className="flex flex-col leading-none">
        <span className={cn("flex items-baseline gap-1.5", text)}>
          <span className="font-display text-[1.55rem] font-semibold tracking-[-0.045em]">M3ak</span>
          <span className="font-arabic text-[0.86rem] font-medium opacity-70">معك</span>
        </span>
        {!compact ? (
          <span className={cn("mt-1 hidden text-[0.58rem] font-bold uppercase tracking-[0.18em] sm:block", sub)}>
            Life, handled
          </span>
        ) : null}
      </span>
      <span className={cn("ml-1 hidden rounded-full px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider lg:inline", label)}>
        demo
      </span>
    </Link>
  );
}
