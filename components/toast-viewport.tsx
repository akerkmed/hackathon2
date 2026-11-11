"use client";

import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useSession, type ToastTone } from "@/components/providers/session-provider";
import { cn } from "@/lib/format";

const ICONS: Record<ToastTone, typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const TONES: Record<ToastTone, string> = {
  success: "border-emerald/25 bg-mint-soft text-forest",
  error: "border-coral/30 bg-coral-soft text-[#8f341d]",
  warning: "border-gold/30 bg-gold-soft text-[#765013]",
  info: "border-sky/25 bg-sky-soft text-[#265569]",
};

export function ToastViewport() {
  const { toasts, dismissToast } = useSession();
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(23rem,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.tone];
        return (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-2xl border px-3.5 py-3 shadow-lift backdrop-blur-sm animate-slide-in",
              TONES[toast.tone],
            )}
          >
            <Icon className="mt-0.5 size-4.5 shrink-0" strokeWidth={2} />
            <div className="min-w-0 flex-1">
              <p className="text-[0.8rem] font-bold leading-5">{toast.title}</p>
              {toast.description ? <p className="mt-0.5 text-[0.73rem] leading-5 opacity-75">{toast.description}</p> : null}
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="rounded-md p-0.5 opacity-50 transition-opacity hover:opacity-100"
              aria-label="Dismiss"
            >
              <X className="size-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
