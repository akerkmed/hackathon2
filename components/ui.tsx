"use client";

import { useEffect, type ButtonHTMLAttributes, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/format";

type Variant = "primary" | "lime" | "outline" | "ghost" | "soft" | "danger" | "dark";
type Size = "sm" | "md" | "lg" | "icon";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-forest text-paper hover:bg-forest-deep shadow-[0_12px_28px_-16px_rgba(8,38,48,0.7)]",
  lime:
    "bg-lime text-forest-deep hover:bg-[#d9a946] shadow-[0_12px_28px_-16px_rgba(120,86,20,0.5)]",
  outline: "border border-line bg-paper/60 text-ink hover:border-forest/40 hover:bg-paper",
  ghost: "text-ink-soft hover:bg-forest/6 hover:text-forest",
  soft: "bg-mint-soft text-forest hover:bg-mint",
  danger: "bg-coral-soft text-[#9d3d25] hover:bg-coral/25",
  dark: "bg-forest-deep text-paper hover:bg-black/80",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[0.8rem] gap-1.5 rounded-xl",
  md: "h-11 px-5 text-[0.875rem] gap-2 rounded-2xl",
  lg: "h-13 px-6 text-[0.95rem] gap-2.5 rounded-2xl",
  icon: "size-10 rounded-xl",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  loading,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}) {
  return (
    <button
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-semibold tracking-[-0.01em] transition-all duration-200 disabled:pointer-events-none disabled:opacity-45",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
      ) : null}
      {children}
    </button>
  );
}

type Tone = "neutral" | "emerald" | "lime" | "coral" | "gold" | "sky" | "dark" | "outline";

const TONES: Record<Tone, string> = {
  neutral: "bg-cream-deep/70 text-ink-soft border-transparent",
  emerald: "bg-mint text-forest border-mint",
  lime: "bg-lime-soft text-[#6f4f10] border-lime/60",
  coral: "bg-coral-soft text-[#9d3d25] border-coral/30",
  gold: "bg-gold-soft text-[#7d5a16] border-gold/30",
  sky: "bg-sky-soft text-[#336379] border-sky/25",
  dark: "bg-forest text-paper border-forest",
  outline: "bg-transparent text-muted border-line",
};

export function Badge({
  children,
  tone = "neutral",
  className,
  dot,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.68rem] font-bold tracking-[0.02em] whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      {dot ? <span className="size-1.5 rounded-full bg-current" aria-hidden /> : null}
      {children}
    </span>
  );
}

const AVATAR_TONES: Record<string, string> = {
  emerald: "bg-forest text-lime",
  coral: "bg-coral text-paper",
  sky: "bg-sky text-paper",
  gold: "bg-gold text-forest-deep",
  lime: "bg-lime text-forest-deep",
  mint: "bg-mint text-forest",
};

export function Avatar({
  first,
  last,
  tone = "emerald",
  size = "md",
  className,
}: {
  first: string;
  last?: string;
  tone?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizes = {
    xs: "size-7 text-[0.62rem]",
    sm: "size-9 text-[0.72rem]",
    md: "size-11 text-[0.85rem]",
    lg: "size-14 text-[1rem]",
    xl: "size-20 text-[1.3rem]",
  };
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-bold tracking-tight ring-2 ring-paper",
        AVATAR_TONES[tone] ?? AVATAR_TONES.emerald,
        sizes[size],
        className,
      )}
      aria-hidden
    >
      {`${first.slice(0, 1)}${last?.slice(0, 1) ?? ""}`.toUpperCase()}
    </span>
  );
}

export function ProgressBar({
  value,
  className,
  tone = "emerald",
}: {
  value: number;
  className?: string;
  tone?: "emerald" | "lime" | "coral";
}) {
  const colors = {
    emerald: "bg-emerald",
    lime: "bg-lime",
    coral: "bg-coral",
  };
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-cream-deep", className)}>
      <div
        className={cn("h-full rounded-full transition-all duration-700 ease-out", colors[tone])}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function ProgressRing({
  value,
  size = 76,
  stroke = 6,
  children,
  className,
}: {
  value: number;
  size?: number;
  stroke?: number;
  children?: ReactNode;
  className?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, value)) / 100) * circumference;
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-cream-deep" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-emerald transition-all duration-700"
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">{children}</span>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  variant = "center",
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  variant?: "center" | "right";
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex" role="dialog" aria-modal="true">
      <button
        className="absolute inset-0 bg-forest-deep/40 backdrop-blur-[3px] animate-fade-in"
        onClick={onClose}
        aria-label="Close"
      />
      <div
        className={cn(
          "relative z-10 m-auto flex max-h-[92dvh] w-[calc(100%-1.5rem)] max-w-xl flex-col overflow-hidden rounded-4xl border border-line-soft bg-paper shadow-lift animate-scale-in",
          variant === "right" &&
            "ml-auto mr-0 h-dvh max-h-dvh w-full max-w-xl rounded-none rounded-l-4xl",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line-soft px-6 py-5">
          <div className="min-w-0">{title}</div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close" className="-mr-1 -mt-1">
            <X className="size-5" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer ? <div className="border-t border-line-soft bg-paper-soft/60 px-6 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex flex-wrap items-center gap-1 rounded-2xl border border-line-soft bg-paper-soft p-1", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[0.78rem] font-semibold transition-colors",
            value === option.value ? "bg-forest text-paper shadow-sm" : "text-muted hover:text-ink",
          )}
        >
          {option.label}
          {option.count !== undefined ? (
            <span className={cn("rounded-full px-1.5 py-0.5 text-[0.6rem]", value === option.value ? "bg-paper/15" : "bg-cream-deep")}>
              {option.count}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-4xl border border-dashed border-line bg-paper/50 px-6 py-14 text-center", className)}>
      {icon ? <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-mint-soft text-forest">{icon}</div> : null}
      <h3 className="font-display text-2xl text-forest-deep">{title}</h3>
      {body ? <p className="mt-2 max-w-md text-sm leading-6 text-muted">{body}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}
