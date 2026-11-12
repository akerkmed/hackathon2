import { cn } from "@/lib/format";

/**
 * Layered Sahara horizon with a low sun. Drawn with currentColor so it can be
 * tinted per surface (sand on light panels, gold on the dark ones).
 */
export function DuneHorizon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 320"
      fill="none"
      preserveAspectRatio="none"
      aria-hidden
      className={cn("pointer-events-none", className)}
    >
      <circle cx="1120" cy="76" r="50" fill="currentColor" opacity="0.3" />
      <circle cx="1120" cy="76" r="82" stroke="currentColor" strokeOpacity="0.16" />
      <path
        d="M0 216C150 188 280 196 420 228C570 262 710 266 858 230C1006 194 1150 184 1290 210C1350 222 1400 228 1440 226V320H0V216Z"
        fill="currentColor"
        opacity="0.35"
      />
      <path
        d="M0 264C180 238 320 246 470 276C620 306 770 302 925 270C1080 238 1235 236 1440 272V320H0V264Z"
        fill="currentColor"
        opacity="0.55"
      />
    </svg>
  );
}

/** Eight-point Saharan star used as a quiet ornamental mark. */
export function SaharanStar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn("pointer-events-none", className)}>
      <path
        d="M12 1.6l2.35 8.05L22.4 12l-8.05 2.35L12 22.4l-2.35-8.05L1.6 12l8.05-2.35L12 1.6Z"
        fill="currentColor"
      />
    </svg>
  );
}
