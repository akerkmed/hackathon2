"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Presentation as PresentationIcon,
  Sparkles,
  X,
} from "lucide-react";
import type { Lang } from "@/lib/domain/types";
import { PRESENTATION, TOUR_STEPS, type TourPlacement } from "@/lib/copy/presentation";
import { t } from "@/lib/copy";
import { cn } from "@/lib/format";
import { Button } from "@/components/ui";

type Rect = { top: number; left: number; width: number; height: number };

interface PresentationContextValue {
  active: boolean;
  startPresentation: (lang?: Lang) => void;
  closePresentation: () => void;
}

const PresentationContext = createContext<PresentationContextValue | null>(null);

const EDGE = 20;
const GAP = 18;
const PAD = 26;
const CARD_WIDTH = 368;
const MIN_CARD_WIDTH = 300;
const CARD_HEIGHT_GUESS = 292;

function readStoredLang(): Lang {
  if (typeof window === "undefined") return "fr";
  const stored = window.localStorage.getItem("m3ak.lang");
  return stored === "ar" || stored === "darija" || stored === "en" || stored === "fr" ? stored : "fr";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function scrollIntoViewInstant(element: Element) {
  const root = document.documentElement;
  const previous = root.style.scrollBehavior;
  root.style.scrollBehavior = "auto";
  element.scrollIntoView({ behavior: "instant", block: "center", inline: "nearest" });
  root.style.scrollBehavior = previous;
}

function ensureVisible(element: Element) {
  const box = element.getBoundingClientRect();
  const height = window.innerHeight;
  const visible = Math.min(box.bottom, height) - Math.max(box.top, 0);
  const minVisible = Math.min(box.height * 0.5, 120);
  if (visible < minVisible) {
    scrollIntoViewInstant(element);
  }
}

function cardPosition(
  rect: Rect | null,
  placement: TourPlacement,
  width: number,
  height: number,
  cardHeight: number,
): CSSProperties | null {
  if (!rect || width < 640 || height < 480) return null;
  const fullWidth = Math.min(CARD_WIDTH, width - EDGE * 2);
  const spaceRight = width - (rect.left + rect.width);
  const spaceLeft = rect.left;
  const spaceBelow = height - (rect.top + rect.height);
  const spaceAbove = rect.top;
  const verticalNeed = cardHeight + GAP + EDGE;

  const fits = (candidate: TourPlacement, candidateWidth: number) => {
    const sideNeed = candidateWidth + GAP + EDGE;
    if (candidate === "right") return spaceRight >= sideNeed;
    if (candidate === "left") return spaceLeft >= sideNeed;
    if (candidate === "bottom") return spaceBelow >= verticalNeed;
    if (candidate === "top") return spaceAbove >= verticalNeed;
    return false;
  };

  const order: TourPlacement[] = placement === "auto" ? [] : [placement];
  order.push("right", "left", "bottom", "top");

  // Prefer a side placement with the full card width. When a tall target
  // leaves no room above or below, allow the card to narrow a little so it
  // can sit beside the spotlight instead of covering it.
  let chosen: TourPlacement | null = order.find((candidate) => fits(candidate, fullWidth)) ?? null;
  let cardWidth = fullWidth;
  if (!chosen) {
    for (const candidate of order) {
      if (candidate !== "right" && candidate !== "left") continue;
      const available = candidate === "right" ? spaceRight : spaceLeft;
      const sideWidth = Math.min(fullWidth, available - GAP - EDGE);
      if (sideWidth >= MIN_CARD_WIDTH) {
        chosen = candidate;
        cardWidth = sideWidth;
        break;
      }
    }
  }
  const chosenPlacement = chosen ?? "bottom";

  const topClamp = (value: number) => clamp(value, EDGE, height - cardHeight - EDGE);
  const leftClamp = (value: number) => clamp(value, EDGE, width - cardWidth - EDGE);
  const centeredTop = topClamp(rect.top + rect.height / 2 - cardHeight / 2);
  const centeredLeft = leftClamp(rect.left + rect.width / 2 - cardWidth / 2);

  if (chosenPlacement === "right") {
    return { left: rect.left + rect.width + GAP, top: centeredTop, width: cardWidth };
  }
  if (chosenPlacement === "left") {
    return { left: rect.left - GAP - cardWidth, top: centeredTop, width: cardWidth };
  }
  if (chosenPlacement === "top") {
    return { left: centeredLeft, top: topClamp(rect.top - GAP - cardHeight), width: cardWidth };
  }

  const below = rect.top + rect.height + GAP;
  return {
    left: centeredLeft,
    top: below + cardHeight <= height - EDGE ? below : topClamp(height - cardHeight - EDGE),
    width: cardWidth,
  };
}

function overlayPanels(rect: Rect | null, width: number, height: number) {
  if (!rect) return null;
  const top = clamp(rect.top, 0, height);
  const bottom = clamp(rect.top + rect.height, 0, height);
  const left = clamp(rect.left, 0, width);
  const right = clamp(rect.left + rect.width, 0, width);
  return {
    top: { left: 0, top: 0, width, height: top },
    bottom: { left: 0, top: bottom, width, height: Math.max(0, height - bottom) },
    left: { left: 0, top, width: left, height: Math.max(0, bottom - top) },
    right: { left: right, top, width: Math.max(0, width - right), height: Math.max(0, bottom - top) },
  };
}

export function PresentationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [finished, setFinished] = useState(false);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [lang, setLang] = useState<Lang>("fr");
  const [ready, setReady] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [cardHeight, setCardHeight] = useState(CARD_HEIGHT_GUESS);

  const targetRef = useRef<Element | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const lastFocused = useRef<HTMLElement | null>(null);
  const remainingRef = useRef<number | null>(null);

  const step = TOUR_STEPS[index];
  const total = TOUR_STEPS.length;

  const measureTarget = useCallback(() => {
    const element = targetRef.current;
    if (!element) return;
    const box = element.getBoundingClientRect();
    if (box.width < 2 || box.height < 2) {
      setRect(null);
      return;
    }
    setRect({
      top: box.top - PAD,
      left: box.left - PAD,
      width: box.width + PAD * 2,
      height: box.height + PAD * 2,
    });
  }, []);

  const closePresentation = useCallback(() => {
    setActive(false);
    setFinished(false);
    setPlaying(false);
    setReady(false);
    setRect(null);
    targetRef.current = null;
    remainingRef.current = null;
    const previous = lastFocused.current;
    if (previous && previous.isConnected) {
      window.setTimeout(() => previous.focus({ preventScroll: true }), 30);
    }
  }, []);

  const startPresentation = useCallback(
    (nextLang?: Lang) => {
      if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
        lastFocused.current = document.activeElement;
      }
      setLang(nextLang ?? readStoredLang());
      setActive(true);
      setFinished(false);
      setIndex(0);
      setPlaying(true);
      setReady(false);
      setRect(null);
      setCardHeight(CARD_HEIGHT_GUESS);
      remainingRef.current = null;
      targetRef.current = null;
      if (typeof window !== "undefined" && window.location.pathname !== TOUR_STEPS[0].path) {
        router.push(TOUR_STEPS[0].path);
      }
    },
    [router],
  );

  const goTo = useCallback(
    (next: number) => {
      if (next < 0) return;
      if (next >= TOUR_STEPS.length) {
        setFinished(true);
        setPlaying(false);
        setReady(false);
        setRect(null);
        targetRef.current = null;
        remainingRef.current = null;
        return;
      }
      setFinished(false);
      setIndex(next);
      setReady(false);
      setRect(null);
      remainingRef.current = null;
      targetRef.current = null;
    },
    [],
  );

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const previous = useCallback(() => goTo(index - 1), [goTo, index]);

  const context = useMemo<PresentationContextValue>(
    () => ({ active, startPresentation, closePresentation }),
    [active, startPresentation, closePresentation],
  );

  useEffect(() => {
    const update = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePresentation();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        next();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        previous();
        return;
      }
      if (event.key === " " || event.code === "Space") {
        const target = event.target as HTMLElement | null;
        const tag = target?.tagName;
        if (tag === "BUTTON" || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        event.preventDefault();
        if (ready && !finished) setPlaying((current) => !current);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, closePresentation, finished, next, previous, ready]);

  useEffect(() => {
    if (!active || finished) return;
    const current = TOUR_STEPS[index];
    if (!current) return;
    if (pathname !== current.path) {
      router.push(current.path);
      return;
    }

    let cancelled = false;
    let attempts = 0;
    let findTimer: ReturnType<typeof setTimeout> | undefined;
    let settleTimer: ReturnType<typeof setTimeout> | undefined;

    setReady(false);
    setRect(null);
    targetRef.current = null;

    const finishMeasuring = () => {
      if (cancelled) return;
      const element = targetRef.current;
      if (element) ensureVisible(element);
      measureTarget();
      setReady(true);
    };

    const findTarget = () => {
      if (cancelled) return;
      const element = document.querySelector(current.target);
      if (!element) {
        attempts += 1;
        if (attempts < 90) {
          findTimer = setTimeout(findTarget, 100);
        } else {
          setReady(true);
        }
        return;
      }
      targetRef.current = element;
      scrollIntoViewInstant(element);
      settleTimer = setTimeout(finishMeasuring, 60);
    };

    findTarget();

    return () => {
      cancelled = true;
      if (findTimer) clearTimeout(findTimer);
      if (settleTimer) clearTimeout(settleTimer);
    };
  }, [active, finished, index, measureTarget, pathname, router]);

  useEffect(() => {
    if (!active || finished || !ready || !targetRef.current) return;
    let frame = 0;
    const onViewportChange = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measureTarget);
    };
    const interval = setInterval(() => {
      const element = targetRef.current;
      if (element) ensureVisible(element);
      measureTarget();
    }, 400);
    document.addEventListener("scroll", onViewportChange, { capture: true, passive: true });
    window.addEventListener("resize", onViewportChange);
    measureTarget();
    return () => {
      cancelAnimationFrame(frame);
      clearInterval(interval);
      document.removeEventListener("scroll", onViewportChange, { capture: true });
      window.removeEventListener("resize", onViewportChange);
    };
  }, [active, finished, measureTarget, ready]);

  useEffect(() => {
    if (!active) return;
    const node = dialogRef.current;
    if (!node) return;
    const update = () => setCardHeight(node.offsetHeight || CARD_HEIGHT_GUESS);
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [active, finished, index, lang]);

  useEffect(() => {
    if (!active) return;
    dialogRef.current?.focus({ preventScroll: true });
  }, [active, finished, index]);

  useEffect(() => {
    remainingRef.current = null;
  }, [active, index]);

  useEffect(() => {
    if (!active || finished || !ready || !playing) return;
    const current = TOUR_STEPS[index];
    if (!current) return;
    if (remainingRef.current === null) remainingRef.current = current.duration;
    const startedAt = Date.now();
    const remaining = remainingRef.current;
    const timer = setTimeout(() => {
      remainingRef.current = null;
      goTo(index + 1);
    }, remaining);
    return () => {
      clearTimeout(timer);
      remainingRef.current = Math.max(0, remaining - (Date.now() - startedAt));
    };
  }, [active, finished, goTo, index, playing, ready]);

  const panels = overlayPanels(rect, viewport.width, viewport.height);
  const position = cardPosition(
    rect,
    step?.placement ?? "auto",
    viewport.width,
    viewport.height,
    cardHeight,
  );
  const isMobileCard = !position;

  return (
    <PresentationContext.Provider value={context}>
      <div inert={active ? true : undefined} aria-hidden={active ? true : undefined}>
        {children}
      </div>

      {active ? (
        <div dir={lang === "ar" ? "rtl" : "ltr"} className="fixed inset-0 z-[110]">
          {rect && panels ? (
            <>
              <button
                type="button"
                tabIndex={-1}
                aria-hidden="true"
                onClick={next}
                className="fixed cursor-pointer bg-forest-deep/65 backdrop-blur-[1px] transition-opacity duration-500"
                style={panels.top}
              />
              <button
                type="button"
                tabIndex={-1}
                aria-hidden="true"
                onClick={next}
                className="fixed cursor-pointer bg-forest-deep/65 backdrop-blur-[1px] transition-opacity duration-500"
                style={panels.bottom}
              />
              <button
                type="button"
                tabIndex={-1}
                aria-hidden="true"
                onClick={next}
                className="fixed cursor-pointer bg-forest-deep/65 backdrop-blur-[1px] transition-opacity duration-500"
                style={panels.left}
              />
              <button
                type="button"
                tabIndex={-1}
                aria-hidden="true"
                onClick={next}
                className="fixed cursor-pointer bg-forest-deep/65 backdrop-blur-[1px] transition-opacity duration-500"
                style={panels.right}
              />
              <button
                type="button"
                tabIndex={-1}
                aria-hidden="true"
                onClick={next}
                className="fixed cursor-pointer rounded-[1.4rem]"
                style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
              />
              <div
                className="pointer-events-none fixed rounded-[1.4rem] border-2 border-lime shadow-[0_0_0_1px_rgba(8,38,48,0.35),0_0_48px_rgba(227,173,78,0.55)] transition-all duration-500 ease-out"
                style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}
                aria-hidden
              />
            </>
          ) : (
            <div
              className="fixed inset-0 bg-forest-deep/70 backdrop-blur-[1px]"
              onClick={() => {
                if (ready && !finished) next();
              }}
              aria-hidden
            />
          )}

          {finished ? (
            <div className="fixed inset-0 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="presentation-done-title">
              <div
                ref={dialogRef}
                tabIndex={-1}
                className="w-full max-w-lg overflow-hidden rounded-[2rem] border border-paper/15 bg-forest-deep p-6 text-paper shadow-[0_40px_100px_-30px_rgba(0,0,0,0.8)] outline-none sm:p-8"
                style={{ outline: "none" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-lime text-forest-deep">
                    <Sparkles className="size-5" />
                  </span>
                  <button
                    type="button"
                    onClick={closePresentation}
                    className="inline-flex size-9 items-center justify-center rounded-full border border-paper/15 text-paper/60 transition-colors hover:bg-paper/10 hover:text-paper"
                    aria-label={t(PRESENTATION.exit, lang)}
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <p className="mt-5 text-[0.58rem] font-bold uppercase tracking-[0.16em] text-lime">{t(PRESENTATION.label, lang)}</p>
                <h2 id="presentation-done-title" className="mt-2 font-display text-[2rem] leading-[1.05] tracking-[-0.03em] text-paper">
                  {t(PRESENTATION.doneTitle, lang)}
                </h2>
                <p className="mt-3 text-[0.82rem] leading-6 text-paper/70">{t(PRESENTATION.doneBody, lang)}</p>
                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button variant="ghost" size="md" onClick={() => startPresentation(lang)} className="text-paper/70 hover:bg-paper/10 hover:text-paper">
                    {t(PRESENTATION.replay, lang)}
                  </Button>
                  <Button
                    variant="lime"
                    size="md"
                    onClick={() => {
                      closePresentation();
                      router.push("/space");
                    }}
                  >
                    {t(PRESENTATION.explore, lang)}
                    <ChevronRight className="size-4 rtl:rotate-180" />
                  </Button>
                </div>
              </div>
            </div>
          ) : step ? (
            <div
              ref={dialogRef}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-labelledby="presentation-step-title"
              aria-describedby="presentation-step-body"
              className={cn(
                "fixed z-[120] flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-[1.6rem] border border-paper/15 bg-forest-deep text-paper shadow-[0_30px_90px_-30px_rgba(0,0,0,0.85)] outline-none",
                isMobileCard ? "inset-x-4 bottom-4" : "fixed",
              )}
              style={isMobileCard ? { outline: "none" } : { ...(position ?? {}), outline: "none" }}
            >
              <div className="h-1 w-full shrink-0 overflow-hidden bg-paper/10">
                {ready ? (
                  <div
                    key={step.id}
                    className="h-full bg-lime"
                    style={{
                      animation: `tour-progress ${step.duration}ms linear forwards`,
                      animationPlayState: playing ? "running" : "paused",
                    }}
                  />
                ) : null}
              </div>

              <div className="flex items-start justify-between gap-3 px-5 pt-4">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-lime text-forest-deep">
                    <PresentationIcon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[0.55rem] font-bold uppercase tracking-[0.15em] text-lime">
                      {t(PRESENTATION.presenting, lang)}
                    </p>
                    <p className="mt-0.5 truncate text-[0.58rem] text-paper/45">{t(step.chapter, lang)}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <span dir="ltr" className="font-mono text-[0.55rem] text-paper/40">
                    {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
                  </span>
                  <button
                    type="button"
                    onClick={closePresentation}
                    className="inline-flex size-8 items-center justify-center rounded-full text-paper/50 transition-colors hover:bg-paper/10 hover:text-paper"
                    aria-label={t(PRESENTATION.exit, lang)}
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-1 pt-4">
                <h2 id="presentation-step-title" className="font-display text-[1.45rem] leading-[1.1] tracking-[-0.025em] text-paper">
                  {t(step.title, lang)}
                </h2>
                <p id="presentation-step-body" className="mt-2 text-[0.78rem] leading-6 text-paper/70">
                  {t(step.body, lang)}
                </p>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2 border-t border-paper/10 px-4 py-3">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={previous}
                    disabled={index === 0}
                    className="inline-flex size-8 items-center justify-center rounded-lg text-paper/60 transition-colors hover:bg-paper/10 hover:text-paper disabled:pointer-events-none disabled:opacity-25"
                    aria-label={t(PRESENTATION.previous, lang)}
                    title={t(PRESENTATION.previous, lang)}
                  >
                    <ChevronLeft className="size-4 rtl:rotate-180" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlaying((current) => !current)}
                    disabled={!ready}
                    className={cn(
                      "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[0.62rem] font-bold transition-colors disabled:opacity-40",
                      playing ? "bg-paper/10 text-paper/70 hover:bg-paper/15 hover:text-paper" : "bg-lime text-forest-deep hover:bg-[#d9a946]",
                    )}
                    aria-label={playing ? t(PRESENTATION.pause, lang) : t(PRESENTATION.resume, lang)}
                    aria-pressed={!playing}
                  >
                    {playing ? <Pause className="size-3" /> : <Play className="size-3" />}
                    <span className="hidden sm:inline">{playing ? t(PRESENTATION.pause, lang) : t(PRESENTATION.resume, lang)}</span>
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-lime px-3 text-[0.62rem] font-bold text-forest-deep transition-colors hover:bg-[#d9a946]"
                  >
                    <span>
                      {index === total - 1
                        ? t(PRESENTATION.finish, lang)
                        : t(PRESENTATION.next, lang)}
                    </span>
                    <ChevronRight className="size-3.5 rtl:rotate-180" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {!ready ? (
                    <span className="hidden items-center gap-1.5 text-[0.54rem] text-paper/40 md:flex">
                      <span className="size-3 animate-spin rounded-full border border-paper/25 border-t-lime" />
                      {t(PRESENTATION.preparing, lang)}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          <div className="sr-only" aria-live="polite">
            {step ? `${t(step.chapter, lang)}: ${t(step.title, lang)}. ${t(step.body, lang)}` : null}
          </div>
        </div>
      ) : null}
    </PresentationContext.Provider>
  );
}

export function usePresentation(): PresentationContextValue {
  const context = useContext(PresentationContext);
  if (!context) throw new Error("usePresentation must be used inside PresentationProvider");
  return context;
}

export function PresentationButton({
  lang,
  className,
  compact = false,
  variant = "outline",
  size = "sm",
  label,
}: {
  lang: Lang;
  className?: string;
  compact?: boolean;
  variant?: "primary" | "lime" | "outline" | "ghost" | "soft" | "danger" | "dark";
  size?: "sm" | "md" | "lg" | "icon";
  label?: string;
}) {
  const { startPresentation } = usePresentation();
  return (
    <Button
      variant={variant}
      size={compact ? "icon" : size}
      className={className}
      onClick={() => startPresentation(lang)}
      aria-label={t(PRESENTATION.start, lang)}
      title={t(PRESENTATION.start, lang)}
    >
      <PresentationIcon className="size-4" />
      {compact ? null : <span>{label ?? t(PRESENTATION.startShort, lang)}</span>}
    </Button>
  );
}
