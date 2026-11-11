"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Coins,
  Files,
  FolderOpen,
  LayoutDashboard,
  MessageSquare,
  RotateCcw,
  Type,
} from "lucide-react";
import { Brand, BrandMark } from "@/components/brand";
import { Avatar, Badge, Button } from "@/components/ui";
import { LanguageMenu } from "@/components/language-menu";
import { PresentationButton } from "@/components/presentation/presentation-provider";
import { ToastViewport } from "@/components/toast-viewport";
import { useSession } from "@/components/providers/session-provider";
import { COMMON, NAV, t } from "@/lib/copy";
import { cn } from "@/lib/format";

const NAV_ITEMS = [
  { href: "/space", key: "space" as const, icon: LayoutDashboard },
  { href: "/chat", key: "chat" as const, icon: MessageSquare },
  { href: "/benefits", key: "benefits" as const, icon: Coins },
  { href: "/documents", key: "documents" as const, icon: FolderOpen },
  { href: "/cases", key: "cases" as const, icon: Files },
  { href: "/sources", key: "sources" as const, icon: BookOpen },
];

const TITLES: Record<string, keyof typeof NAV> = {
  "/space": "space",
  "/chat": "chat",
  "/benefits": "benefits",
  "/documents": "documents",
  "/cases": "cases",
  "/sources": "sources",
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { snapshot, lang, setLang, bigText, toggleBigText, resetDemo, loading } = useSession();
  const root = `/${pathname.split("/")[1] || "space"}`;
  const titleKey = TITLES[root] ?? "space";
  const activePlan = snapshot?.plans.find((plan) => plan.id === snapshot.activePlanId);
  const openCases = snapshot?.cases.filter((item) => item.status === "EXECUTING").length ?? 0;

  return (
    <div className="min-h-dvh bg-cream">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[16.5rem] flex-col border-r border-line-soft bg-paper-soft/80 px-4 pb-4 pt-5 backdrop-blur-xl lg:flex">
        <div className="px-2">
          <Brand href="/space" />
        </div>

        <nav className="mt-8 flex flex-col gap-0.5" aria-label="Main navigation">
          <p className="mb-2 px-3 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-muted/70">
            {lang === "ar" ? "مساحتك" : lang === "en" ? "Your space" : "Votre espace"}
          </p>
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            const badge =
              item.key === "cases" && openCases > 0
                ? openCases
                : item.key === "chat" && activePlan
                  ? 1
                  : undefined;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.82rem] font-semibold transition-all",
                  active
                    ? "bg-forest text-paper shadow-[0_10px_24px_-16px_rgba(8,37,27,0.65)]"
                    : "text-ink-soft hover:bg-forest/5 hover:text-forest",
                )}
              >
                <Icon className={cn("size-[1.05rem]", active ? "text-lime" : "text-muted group-hover:text-forest")} strokeWidth={1.9} />
                <span className="flex-1">{t(NAV[item.key], lang)}</span>
                {badge ? (
                  <span
                    className={cn(
                      "flex size-4.5 items-center justify-center rounded-full text-[0.58rem] font-bold",
                      active ? "bg-lime text-forest-deep" : "bg-mint text-forest",
                    )}
                  >
                    {badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 rounded-2xl border border-line-soft bg-paper p-3.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-muted/70">
              {lang === "ar" ? "الأسرة" : lang === "en" ? "Household" : "Le foyer"}
            </p>
            <Link href="/documents" className="text-[0.62rem] font-bold text-emerald hover:underline">
              {t(COMMON.view, lang)}
            </Link>
          </div>
          <div className="mt-2.5 flex items-center">
            {(snapshot?.household ?? []).map((person, index) => (
              <Avatar
                key={person.id}
                first={person.firstName}
                last={person.lastName}
                tone={person.avatarTone}
                size="sm"
                className={cn(index > 0 && "-ml-2")}
              />
            ))}
            <div className="ml-auto text-right">
              <p className="text-[0.7rem] font-bold text-forest">Yasmine, Mehdi, Adam</p>
              <p className="text-[0.6rem] text-muted">{snapshot?.citizen.city ?? "Casablanca"}</p>
            </div>
          </div>
        </div>

        <div className="mt-auto space-y-3 pt-4">
          <div className="rounded-2xl bg-forest p-3.5 text-paper noise">
            <div className="flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-lime opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-lime" />
              </span>
              <p className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-lime">{t(COMMON.demo, lang)}</p>
            </div>
            <p className="mt-2 text-[0.72rem] leading-4.5 text-paper/80">
              {lang === "ar"
                ? "سيناريو ياسمين وآدم. كل شيء محاكى."
                : lang === "en"
                  ? "Yasmine & Adam scenario. Everything is simulated."
                  : "Scénario Yasmine & Adam. Tout est simulé."}
            </p>
            <button
              onClick={() => void resetDemo()}
              disabled={loading}
              className="mt-2.5 inline-flex items-center gap-1.5 text-[0.66rem] font-bold text-lime transition-opacity hover:opacity-75 disabled:opacity-40"
            >
              <RotateCcw className="size-3" />
              {t(COMMON.reset, lang)}
            </button>
          </div>

          <Link href="/space" className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-forest/5">
            <Avatar first="Yasmine" last="Benali" tone="emerald" size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.74rem] font-bold text-forest">Yasmine Benali</p>
              <p className="truncate text-[0.6rem] text-muted">CNIE · BK 482 913</p>
            </div>
            <Badge tone="emerald" dot className="px-2 py-0.5 text-[0.55rem]">
              {t(COMMON.verified, lang)}
            </Badge>
          </Link>
        </div>
      </aside>

      <div className="lg:pl-[16.5rem]">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line-soft bg-cream/85 px-4 backdrop-blur-xl md:px-6 lg:px-8">
          <Link href="/space" className="lg:hidden" aria-label="M3ak">
            <BrandMark />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-[0.95rem] font-bold tracking-[-0.01em] text-forest-deep">{t(NAV[titleKey], lang)}</h1>
              <span className="hidden rounded-full border border-line bg-paper/70 px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-[0.1em] text-muted sm:inline">
                {t(COMMON.demoData, lang)}
              </span>
            </div>
            <p className="hidden text-[0.65rem] text-muted sm:block">{t(COMMON.simulated, lang)} · {snapshot?.citizen.city ?? "Casablanca"}</p>
          </div>

          <PresentationButton lang={lang} className="hidden sm:inline-flex" />
          <PresentationButton lang={lang} compact className="size-9 sm:hidden" />

          <button
            onClick={toggleBigText}
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-full border transition-colors",
              bigText ? "border-forest bg-forest text-lime" : "border-line bg-paper/70 text-ink-soft hover:border-forest/30",
            )}
            aria-pressed={bigText}
            aria-label={t(COMMON.bigText, lang)}
            title={t(COMMON.bigText, lang)}
          >
            <Type className="size-4" />
          </button>

          <LanguageMenu lang={lang} onChange={setLang} />

          <Button
            variant="soft"
            size="sm"
            className="hidden sm:inline-flex"
            onClick={() => void resetDemo()}
            disabled={loading}
          >
            <RotateCcw className="size-3.5" />
            {t(COMMON.reset, lang)}
          </Button>
        </header>

        <main className="pb-24 lg:pb-8">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line-soft bg-paper/95 backdrop-blur-xl lg:hidden" aria-label="Mobile navigation">
        <div className="grid grid-cols-6 px-1 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1.5">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg py-1.5 text-[0.53rem] font-bold transition-colors",
                  active ? "text-forest" : "text-muted",
                )}
              >
                <Icon className={cn("size-5", active ? "text-emerald" : "text-muted")} strokeWidth={active ? 2.3 : 1.8} />
                <span className="max-w-full truncate px-0.5">{t(NAV[item.key], lang)}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <ToastViewport />
    </div>
  );
}
