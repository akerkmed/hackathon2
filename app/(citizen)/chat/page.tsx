"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ExternalLink,
  FileText,
  Headphones,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  ReceiptText,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Square,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import type { ActionEvent, Lang, Plan, Receipt } from "@/lib/domain/types";
import { useActivePlan, useSession } from "@/components/providers/session-provider";
import { Avatar, Badge, Button, EmptyState, Modal, ProgressBar, Skeleton, Segmented } from "@/components/ui";
import { BrandMark } from "@/components/brand";
import { Icon } from "@/components/icon";
import {
  ActionStatusIcon,
  ExecutionProgress,
  MoneyTriplet,
  PlanActionRow,
  PlanCompactCard,
  ReceiptCard,
  ScopeChips,
  TraceList,
} from "@/components/plan-view";
import { CHAT, COMMON, STATUS_LABEL, t } from "@/lib/copy";
import { cn, formatDate, formatMoney } from "@/lib/format";

type PanelTab = "plan" | "live" | "trust";
type MobileView = "chat" | "panel";

interface RecognitionResultLike {
  0?: { transcript: string };
}

interface RecognitionEventLike {
  results: ArrayLike<RecognitionResultLike>;
}

interface RecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: RecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

type RecognitionConstructor = new () => RecognitionLike;

function recognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const scope = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

function speechLocale(lang: Lang): string {
  if (lang === "en") return "en-US";
  if (lang === "ar" || lang === "darija") return "ar-MA";
  return "fr-FR";
}

function clock(value: string, lang: Lang): string {
  const locale = lang === "ar" ? "ar-MA" : lang === "en" ? "en-GB" : "fr-MA";
  return new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export default function ChatPage() {
  const {
    snapshot,
    loading,
    lang,
    sendMessage,
    executePlan,
    cancelPlan,
    pushToast,
    voiceOutput,
    toggleVoiceOutput,
    speak,
    stopSpeaking,
  } = useSession();
  const plan = useActivePlan();

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [panelTab, setPanelTab] = useState<PanelTab>("plan");
  const [mobileView, setMobileView] = useState<MobileView>("chat");
  const [consentPlanId, setConsentPlanId] = useState<string | null>(null);
  const [events, setEvents] = useState<ActionEvent[]>([]);
  const [receiptState, setReceiptState] = useState<Receipt | undefined>();
  const [running, setRunning] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const threadRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const lastSpoken = useRef<string | null>(null);

  const messages = snapshot?.messages ?? [];
  const consentPlan = snapshot?.plans.find((item) => item.id === consentPlanId);
  const receipt =
    receiptState && (!plan || receiptState.planId === plan.id)
      ? receiptState
      : snapshot?.receipts.find((item) => item.planId === plan?.id);
  const planCase = snapshot?.cases.find((item) => item.planId === plan?.id);

  const defaultSuggestions = useMemo(() => CHAT.quickPrompts.map((item) => t(item, lang)), [lang]);
  const visibleSuggestions = suggestions.length > 0 ? suggestions : defaultSuggestions;
  const progress = events.length > 0 ? events[events.length - 1].progress : 0;
  const scopeCount = consentPlan ? new Set(consentPlan.actions.flatMap((action) => action.scope)).size : 0;

  useEffect(() => {
    const node = threadRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [messages.length, sending, listening]);

  useEffect(() => {
    setEvents([]);
    setReceiptState(undefined);
    setPanelTab("plan");
    setConsentPlanId(null);
  }, [plan?.id]);

  useEffect(() => {
    setSuggestions([]);
  }, [lang]);

  useEffect(() => {
    if (!voiceOutput || messages.length === 0) return;
    const latest = [...messages].reverse().find((message) => message.role === "assistant");
    if (!latest || latest.id === lastSpoken.current) return;
    lastSpoken.current = latest.id;
    speak(latest.text, latest.lang);
  }, [messages, voiceOutput, speak]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
  }, []);

  const submit = async (value?: string) => {
    const text = (value ?? draft).trim();
    if (!text || sending || running) return;
    setDraft("");
    setSending(true);
    const reply = await sendMessage(text);
    setSending(false);
    if (!reply) return;
    setSuggestions(reply.suggestions);
    if (reply.message.kind === "blocked") {
      pushToast({ tone: "warning", title: t(CHAT.blockedTitle, lang), description: t(CHAT.blockedNote, lang) });
    }
    if (reply.executePlanId) {
      setConsentPlanId(reply.executePlanId);
      setPanelTab("plan");
      setMobileView("panel");
    } else if (reply.planId) {
      setPanelTab("plan");
    }
  };

  const runConsentPlan = async () => {
    if (!consentPlan || running) return;
    const scopes = Array.from(new Set(consentPlan.actions.flatMap((action) => action.scope)));
    setRunning(true);
    setEvents([]);
    setReceiptState(undefined);
    setConsentPlanId(null);
    setPanelTab("live");
    setMobileView("panel");
    const result = await executePlan(consentPlan.id, scopes, {
      speed: 520,
      onEvent: (event) => setEvents((current) => [...current, event]),
    });
    setRunning(false);
    if (result.ok) {
      setReceiptState(result.receipt);
      setPanelTab("live");
      pushToast({
        tone: "success",
        title: t(CHAT.executionComplete, lang),
        description: result.receipt?.code,
      });
    } else {
      pushToast({ tone: "error", title: t(CHAT.errorRun, lang) });
    }
  };

  const cancelActivePlan = async () => {
    if (!plan || cancelling) return;
    setCancelling(true);
    const ok = await cancelPlan(plan.id);
    setCancelling(false);
    if (ok) {
      setConsentPlanId(null);
      setPanelTab("plan");
      pushToast({ tone: "info", title: t(CHAT.cancelled, lang) });
    }
  };

  const testGuardrail = () => {
    void submit(t(CHAT.riskPrompt, lang));
    pushToast({ tone: "warning", title: t(CHAT.riskToast, lang) });
  };

  const askHuman = () => {
    void submit(t(COMMON.human, lang));
  };

  const toggleListening = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const Constructor = recognitionConstructor();
    if (!Constructor) {
      pushToast({ tone: "warning", title: t(CHAT.voiceUnsupported, lang) });
      return;
    }
    const recognition = new Constructor();
    recognition.lang = speechLocale(lang);
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let transcript = "";
      for (let index = 0; index < event.results.length; index += 1) {
        transcript += event.results[index]?.[0]?.transcript ?? "";
      }
      setDraft(transcript);
    };
    recognition.onerror = () => {
      setListening(false);
      pushToast({ tone: "error", title: t(CHAT.voiceDenied, lang) });
    };
    recognition.onend = () => setListening(false);
    try {
      recognition.start();
      recognitionRef.current = recognition;
      setListening(true);
    } catch {
      pushToast({ tone: "error", title: t(CHAT.voiceDenied, lang) });
    }
  };

  const toggleVoice = () => {
    if (voiceOutput) stopSpeaking();
    toggleVoiceOutput();
    pushToast({ tone: "info", title: voiceOutput ? t(CHAT.speakOff, lang) : t(CHAT.speakOn, lang) });
  };

  if (loading || !snapshot) {
    return (
      <div className="container-page py-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_28rem]">
          <Skeleton className="h-[70dvh] rounded-4xl" />
          <Skeleton className="hidden h-[70dvh] rounded-4xl lg:block" />
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-4 sm:py-5">
      <div className="mb-3 flex items-center gap-2 lg:hidden">
        <Segmented
          className="w-full"
          options={[
            { value: "chat", label: `${t(CHAT.panelChat, lang)} · ${messages.length}` },
            { value: "panel", label: t(CHAT.panelPlan, lang), count: plan?.actions.length },
          ]}
          value={mobileView}
          onChange={(value) => setMobileView(value as MobileView)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_27rem] xl:grid-cols-[minmax(0,1fr)_29.5rem]">
        <section
          className={cn(
            "flex h-[calc(100dvh-10.5rem)] min-h-[560px] flex-col overflow-hidden rounded-4xl border border-line-soft bg-paper shadow-card",
            "lg:h-[calc(100dvh-6.5rem)]",
            mobileView === "panel" && "hidden lg:flex",
          )}
          data-tour="chat-thread"
        >
          <header className="flex items-center gap-3 border-b border-line-soft bg-paper-soft/55 px-4 py-3">
            <div className="relative shrink-0">
              <BrandMark className="size-10 rounded-2xl" />
              <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-paper bg-emerald" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="truncate font-display text-[1.15rem] tracking-[-0.02em] text-forest-deep">{t(CHAT.title, lang)}</h1>
                <Badge tone="emerald" className="hidden px-2 py-0.5 text-[0.52rem] sm:inline-flex">
                  <span className="size-1.5 rounded-full bg-emerald" />
                  {t(COMMON.active, lang)}
                </Badge>
              </div>
              <p className="truncate text-[0.6rem] text-muted">{t(CHAT.online, lang)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={askHuman}
                className="hidden size-9 items-center justify-center rounded-full border border-line bg-paper text-ink-soft transition-colors hover:border-forest/30 hover:text-forest sm:inline-flex"
                title={t(CHAT.humanCta, lang)}
                aria-label={t(CHAT.humanCta, lang)}
              >
                <Headphones className="size-4" />
              </button>
              <button
                onClick={testGuardrail}
                className="hidden size-9 items-center justify-center rounded-full border border-line bg-paper text-ink-soft transition-colors hover:border-coral/40 hover:text-[#9d3d25] sm:inline-flex"
                title={t(CHAT.guardrailCta, lang)}
                aria-label={t(CHAT.guardrailCta, lang)}
              >
                <ShieldAlert className="size-4" />
              </button>
              <button
                onClick={toggleVoice}
                className={cn(
                  "inline-flex size-9 items-center justify-center rounded-full border transition-colors",
                  voiceOutput
                    ? "border-forest bg-forest text-lime"
                    : "border-line bg-paper text-ink-soft hover:border-forest/30",
                )}
                title={voiceOutput ? t(CHAT.speakOn, lang) : t(CHAT.speakOff, lang)}
                aria-label={voiceOutput ? t(CHAT.speakOn, lang) : t(CHAT.speakOff, lang)}
                aria-pressed={voiceOutput}
              >
                {voiceOutput ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
              </button>
              <button
                onClick={() => setMobileView("panel")}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-forest px-3 text-[0.65rem] font-bold text-paper lg:hidden"
              >
                <FileText className="size-3.5 text-lime" />
                {plan?.actions.length ?? 0}
              </button>
            </div>
          </header>

          <div ref={threadRef} className="flex-1 overflow-y-auto px-4 py-5 sm:px-5">
            <div className="mx-auto max-w-3xl space-y-4">
              {messages.length === 0 ? (
                <EmptyState
                  icon={<Sparkles className="size-5" />}
                  title={t(CHAT.emptyTitle, lang)}
                  body={t(CHAT.emptyLead, lang)}
                  className="border-line/80 bg-paper-soft/40"
                />
              ) : (
                messages.map((message) => {
                  const isUser = message.role === "user";
                  const messagePlan = snapshot.plans.find((item) => item.id === message.planId);
                  const special = message.kind === "blocked" || message.kind === "handoff" || message.kind === "receipt";
                  return (
                    <div key={message.id} className={cn("flex gap-2.5", isUser ? "flex-row-reverse" : "")}>
                      {!isUser ? (
                        <BrandMark className="mt-0.5 size-8 shrink-0 rounded-xl" />
                      ) : (
                        <Avatar first={snapshot.citizen.firstName} last={snapshot.citizen.lastName} tone="emerald" size="sm" className="mt-0.5 size-8" />
                      )}
                      <div className={cn("flex min-w-0 max-w-[86%] flex-col", isUser ? "items-end" : "items-start")}>
                        <div
                          className={cn(
                            "whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-[0.8rem] leading-6",
                            isUser
                              ? "rounded-tr-md bg-forest text-paper shadow-[0_12px_24px_-20px_rgba(8,38,48,0.9)]"
                              : "rounded-tl-md border border-line-soft bg-paper-soft text-ink-soft",
                            message.kind === "blocked" && "border-coral/30 bg-coral-soft/60 text-[#7a331f]",
                            message.kind === "handoff" && "border-sky/30 bg-sky-soft/70 text-[#295567]",
                          )}
                        >
                          {message.kind === "blocked" ? (
                            <span className="mb-1.5 flex items-center gap-1.5 text-[0.55rem] font-bold uppercase tracking-[0.1em] text-[#9d3d25]">
                              <ShieldAlert className="size-3.5" />
                              {t(CHAT.blockedTitle, lang)}
                            </span>
                          ) : null}
                          {message.kind === "handoff" ? (
                            <span className="mb-1.5 flex items-center gap-1.5 text-[0.55rem] font-bold uppercase tracking-[0.1em] text-[#336379]">
                              <Headphones className="size-3.5" />
                              {t(CHAT.handoffTitle, lang)}
                            </span>
                          ) : null}
                          {message.kind === "receipt" ? (
                            <span className="mb-1.5 flex items-center gap-1.5 text-[0.55rem] font-bold uppercase tracking-[0.1em] text-emerald">
                              <ReceiptText className="size-3.5" />
                              {t(CHAT.receiptReady, lang)}
                            </span>
                          ) : null}
                          {message.text}
                        </div>

                        {messagePlan && message.kind !== "receipt" ? (
                          <div className="mt-2 w-full min-w-[15rem] max-w-sm">
                            <PlanCompactCard
                              plan={messagePlan}
                              lang={lang}
                              onOpen={() => {
                                setPanelTab("plan");
                                setMobileView("panel");
                              }}
                            />
                          </div>
                        ) : null}

                        {message.kind === "receipt" && messagePlan ? (
                          <div className="mt-2 w-full min-w-[15rem] max-w-sm rounded-2xl border border-mint bg-mint-soft/60 p-3">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <p className="text-[0.52rem] font-bold uppercase tracking-[0.1em] text-emerald">{t(CHAT.receiptTitle, lang)}</p>
                                <p className="mt-0.5 font-mono text-[0.72rem] font-bold text-forest">{receipt?.code ?? messagePlan.receiptId}</p>
                              </div>
                              <Button size="sm" variant="soft" onClick={() => { setPanelTab("live"); setMobileView("panel"); }}>
                                {t(COMMON.open, lang)}
                                <ChevronRight className="size-3 rtl:rotate-180" />
                              </Button>
                            </div>
                          </div>
                        ) : null}

                        <div className={cn("mt-1 flex items-center gap-2 text-[0.52rem] text-muted/60", isUser && "flex-row-reverse")}>
                          <span>{clock(message.at, lang)}</span>
                          {!isUser && !special ? (
                            <button
                              onClick={() => speak(message.text, message.lang)}
                              className="inline-flex items-center gap-1 rounded-full px-1 py-0.5 transition-colors hover:bg-mint-soft hover:text-forest"
                              title={t(CHAT.listenMessage, lang)}
                            >
                              <Volume2 className="size-2.5" />
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {sending ? (
                <div className="flex gap-2.5">
                  <BrandMark className="mt-0.5 size-8 shrink-0 rounded-xl" />
                  <div className="flex items-center gap-2 rounded-2xl rounded-tl-md border border-line-soft bg-paper-soft px-3.5 py-2.5">
                    <span className="flex gap-1">
                      <span className="size-1.5 animate-bounce rounded-full bg-emerald [animation-delay:-0.2s]" />
                      <span className="size-1.5 animate-bounce rounded-full bg-emerald [animation-delay:-0.1s]" />
                      <span className="size-1.5 animate-bounce rounded-full bg-emerald" />
                    </span>
                    <span className="text-[0.66rem] font-medium text-muted">{t(CHAT.thinking, lang)}</span>
                  </div>
                </div>
              ) : null}

              {listening ? (
                <div className="flex items-center justify-center gap-2 rounded-2xl border border-coral/20 bg-coral-soft/40 px-4 py-2 text-[0.65rem] font-semibold text-[#9d3d25]">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-coral opacity-60" />
                    <span className="relative inline-flex size-2 rounded-full bg-coral" />
                  </span>
                  {t(CHAT.listening, lang)}
                </div>
              ) : null}
            </div>
          </div>

          <div className="border-t border-line-soft bg-paper px-3 pb-3 pt-2.5 sm:px-4">
            <div className="mx-auto max-w-3xl">
              {visibleSuggestions.length > 0 ? (
                <div className="mb-2 flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
                  {visibleSuggestions.slice(0, 5).map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => void submit(suggestion)}
                      disabled={sending || running}
                      className="shrink-0 rounded-full border border-line bg-paper-soft px-2.5 py-1 text-[0.62rem] font-semibold text-ink-soft transition-all hover:border-forest/30 hover:bg-mint-soft hover:text-forest disabled:opacity-40"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="rounded-2xl border border-line bg-paper-soft/70 p-1.5 transition-colors focus-within:border-forest/35 focus-within:bg-paper">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void submit();
                    }
                  }}
                  rows={1}
                  placeholder={t(CHAT.placeholder, lang)}
                  className="max-h-28 min-h-9 w-full resize-none bg-transparent px-2.5 py-1.5 text-[0.82rem] text-ink outline-none placeholder:text-muted/70"
                  aria-label={t(CHAT.placeholder, lang)}
                />
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 pl-0.5">
                    <button
                      onClick={toggleListening}
                      className={cn(
                        "inline-flex size-8 items-center justify-center rounded-xl transition-colors",
                        listening ? "bg-coral text-paper" : "text-muted hover:bg-mint-soft hover:text-forest",
                      )}
                      title={listening ? t(CHAT.voiceStop, lang) : t(CHAT.voiceStart, lang)}
                      aria-label={listening ? t(CHAT.voiceStop, lang) : t(CHAT.voiceStart, lang)}
                      aria-pressed={listening}
                    >
                      {listening ? <Square className="size-3.5" /> : <Mic className="size-4" />}
                    </button>
                    <button
                      onClick={testGuardrail}
                      className="inline-flex h-8 items-center gap-1 rounded-xl px-2 text-[0.58rem] font-bold text-muted transition-colors hover:bg-coral-soft/60 hover:text-[#9d3d25] sm:hidden"
                    >
                      <ShieldAlert className="size-3.5" />
                    </button>
                    <span className="hidden items-center gap-1 pl-1 text-[0.52rem] text-muted/60 sm:flex">
                      <MicOff className="size-2.5" />
                      {t(CHAT.voiceHint, lang)}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => void submit()}
                    disabled={!draft.trim() || sending || running}
                    loading={sending}
                  >
                    {!sending ? <Send className="size-3.5 rtl:rotate-180" /> : null}
                    {t(CHAT.send, lang)}
                  </Button>
                </div>
              </div>
              <p className="mt-1.5 flex items-center justify-center gap-1.5 text-center text-[0.52rem] text-muted/55">
                <ShieldCheck className="size-2.5" />
                {t(CHAT.sessionNote, lang)}
              </p>
            </div>
          </div>
        </section>

        <aside
          className={cn(
            "h-[calc(100dvh-7.5rem)] min-h-[560px] flex-col overflow-hidden rounded-4xl border border-line-soft bg-paper shadow-card",
            "lg:sticky lg:top-[4.75rem] lg:flex lg:h-[calc(100dvh-6.5rem)]",
            mobileView === "chat" ? "hidden lg:flex" : "flex",
          )}
        >
          <div className="flex items-center gap-2 border-b border-line-soft bg-paper-soft/55 px-3 py-2.5">
            <Segmented
              className="flex-1 border-0 bg-transparent p-0"
              options={[
                { value: "plan", label: t(CHAT.tabPlan, lang) },
                { value: "live", label: t(CHAT.tabLive, lang), count: events.length || undefined },
                { value: "trust", label: t(CHAT.tabTrust, lang) },
              ]}
              value={panelTab}
              onChange={(value) => setPanelTab(value as PanelTab)}
            />
            <button
              onClick={() => setMobileView("chat")}
              className="inline-flex size-8 items-center justify-center rounded-full text-muted hover:bg-cream lg:hidden"
              aria-label={t(COMMON.close, lang)}
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {panelTab === "plan" ? (
              <PlanPanel
                plan={plan}
                receipt={receipt}
                lang={lang}
                citizenName={`${snapshot.citizen.firstName} ${snapshot.citizen.lastName}`}
                running={running}
                cancelling={cancelling}
                caseReference={planCase?.reference}
                onRun={() => {
                  if (!plan) return;
                  setConsentPlanId(plan.id);
                }}
                onCancel={() => void cancelActivePlan()}
                onOpenCase={() => {
                  if (planCase) window.location.href = `/cases/${planCase.id}`;
                }}
                onOpenLive={() => setPanelTab("live")}
                onNewPlan={() => void submit(t(CHAT.newPlan, lang))}
              />
            ) : null}

            {panelTab === "live" ? (
              <LivePanel
                plan={plan}
                receipt={receipt}
                events={events}
                progress={progress}
                running={running}
                lang={lang}
                citizenName={`${snapshot.citizen.firstName} ${snapshot.citizen.lastName}`}
                caseId={planCase?.id}
                caseReference={planCase?.reference}
                onOpenCase={() => {
                  if (planCase) window.location.href = `/cases/${planCase.id}`;
                }}
              />
            ) : null}

            {panelTab === "trust" ? (
              <TrustPanel
                plan={plan}
                lang={lang}
                audit={snapshot.audit}
                onGuardrail={testGuardrail}
                onHuman={askHuman}
              />
            ) : null}
          </div>
        </aside>
      </div>

      <Modal
        open={Boolean(consentPlan)}
        onClose={() => setConsentPlanId(null)}
        title={
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-mint-soft text-forest">
              <ShieldCheck className="size-5" />
            </span>
            <div>
              <p className="font-display text-[1.4rem] leading-tight tracking-[-0.02em] text-forest-deep">{t(CHAT.runTitle, lang)}</p>
              <p className="mt-0.5 text-[0.62rem] text-muted">{t(CHAT.runDuration, lang)}</p>
            </div>
          </div>
        }
        footer={
          consentPlan ? (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[0.58rem] leading-4 text-muted">{t(CHAT.consentRunHint, lang)}</p>
              <div className="flex gap-2 sm:shrink-0">
                <Button variant="outline" size="sm" onClick={() => setConsentPlanId(null)} disabled={running}>
                  {t(CHAT.runCancel, lang)}
                </Button>
                <Button size="sm" onClick={() => void runConsentPlan()} loading={running}>
                  <ShieldCheck className="size-3.5" />
                  {t(CHAT.runConfirmCount, lang, { count: consentPlan.actions.length })}
                </Button>
              </div>
            </div>
          ) : null
        }
      >
        {consentPlan ? (
          <div className="space-y-4">
            <p className="text-[0.78rem] leading-6 text-ink-soft">{t(CHAT.runLead, lang)}</p>

            <div className="rounded-2xl border border-line-soft bg-paper-soft p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[0.55rem] font-bold uppercase tracking-[0.12em] text-muted">{t(CHAT.planPanel, lang)}</p>
                  <p className="mt-1 font-display text-[1.1rem] text-forest-deep">{consentPlan.title[lang] || consentPlan.title.fr}</p>
                </div>
                <Badge tone="gold" dot>{t(STATUS_LABEL[consentPlan.status], lang)}</Badge>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-paper px-2.5 py-2">
                  <p className="text-[0.48rem] font-bold uppercase tracking-[0.08em] text-muted">{t(COMMON.services, lang)}</p>
                  <p className="mt-0.5 font-display text-[1.05rem] text-forest-deep">{consentPlan.actions.length}</p>
                </div>
                <div className="rounded-xl bg-paper px-2.5 py-2">
                  <p className="text-[0.48rem] font-bold uppercase tracking-[0.08em] text-muted">{t(CHAT.totalFees, lang)}</p>
                  <p className="mt-0.5 font-display text-[1.05rem] text-forest-deep">{formatMoney(consentPlan.totalCost, lang)}</p>
                </div>
                <div className="rounded-xl bg-mint-soft px-2.5 py-2">
                  <p className="text-[0.48rem] font-bold uppercase tracking-[0.08em] text-emerald">{t(CHAT.benefitsUnlocked, lang)}</p>
                  <p className="mt-0.5 font-display text-[1.05rem] text-forest">{formatMoney(consentPlan.benefitOneOff, lang)}</p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-muted">{t(CHAT.runScopes, lang)}</p>
                <span className="text-[0.55rem] font-semibold text-emerald">{scopeCount} {t(CHAT.planScopeCount, lang)}</span>
              </div>
              <div className="mt-2">
                <ScopeChips scopes={consentPlan.actions.flatMap((action) => action.scope)} lang={lang} />
              </div>
              <p className="mt-2 text-[0.58rem] leading-4 text-muted">{t(CHAT.consentScopeNote, lang)}</p>
            </div>

            <div>
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-muted">{t(CHAT.consentWho, lang)}</p>
              <div className="mt-2 space-y-1.5">
                {Array.from(new Map(consentPlan.actions.map((action) => [action.authority, action])).values()).map((action) => (
                  <div key={action.authority} className="flex items-center gap-2 rounded-xl border border-line-soft bg-paper-soft px-2.5 py-2">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-cream-deep/70 text-ink-soft">
                      <Icon name={action.icon} className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.65rem] font-bold text-ink">{action.authorityLabel[lang] || action.authorityLabel.fr}</p>
                      <p className="truncate text-[0.52rem] text-muted">{action.short[lang] || action.short.fr}</p>
                    </div>
                    <Check className="size-3.5 text-emerald" />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-xl border border-gold/25 bg-gold-soft/60 px-3 py-2.5">
              <Clock3 className="mt-0.5 size-3.5 shrink-0 text-[#7d5a16]" />
              <p className="text-[0.6rem] leading-5 text-[#7d5a16]">{t(CHAT.runHint, lang)}</p>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}


function PlanPanel({
  plan,
  receipt,
  lang,
  citizenName,
  running,
  cancelling,
  caseReference,
  onRun,
  onCancel,
  onOpenCase,
  onOpenLive,
  onNewPlan,
}: {
  plan?: Plan;
  receipt?: Receipt;
  lang: Lang;
  citizenName: string;
  running: boolean;
  cancelling: boolean;
  caseReference?: string;
  onRun: () => void;
  onCancel: () => void;
  onOpenCase: () => void;
  onOpenLive: () => void;
  onNewPlan: () => void;
}) {
  if (!plan) {
    return (
      <div className="p-4">
        <EmptyState
          icon={<Sparkles className="size-5" />}
          title={t(CHAT.emptyTitle, lang)}
          body={t(CHAT.emptyLead, lang)}
          className="border-line/80"
        />
      </div>
    );
  }

  const done = plan.actions.filter((action) => action.status === "DONE").length;
  const progress = plan.actions.length > 0 ? (done / plan.actions.length) * 100 : 0;
  const uniqueScopes = Array.from(new Set(plan.actions.flatMap((action) => action.scope)));
  const uniqueRules = Array.from(new Set(plan.actions.flatMap((action) => action.ruleIds)));

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-forest text-lime">
            <Icon name={plan.actions[0]?.icon ?? "sparkles"} className="size-4.5" />
          </span>
          <div className="min-w-0">
            <p className="text-[0.52rem] font-bold uppercase tracking-[0.14em] text-muted">{t(CHAT.planPanel, lang)}</p>
            <h2 className="mt-1 font-display text-[1.25rem] leading-6 tracking-[-0.02em] text-forest-deep">
              {plan.title[lang] || plan.title.fr}
            </h2>
          </div>
        </div>
        <Badge tone={plan.status === "COMPLETED" ? "emerald" : plan.status === "CANCELLED" ? "coral" : plan.status === "EXECUTING" ? "gold" : "gold"} dot>
          {t(STATUS_LABEL[plan.status], lang)}
        </Badge>
      </div>

      <p className="mt-3 text-[0.7rem] leading-5 text-muted">{plan.summary[lang] || plan.summary.fr}</p>

      <div className="mt-3">
        <MoneyTriplet plan={plan} lang={lang} compact />
      </div>

      <div className="mt-3 rounded-2xl border border-line-soft bg-paper-soft p-3">
        <div className="flex items-center justify-between text-[0.6rem]">
          <span className="font-bold text-forest">{t(CHAT.progress, lang)}</span>
          <span className="font-mono text-muted">{done}/{plan.actions.length}</span>
        </div>
        <ProgressBar value={progress} className="mt-2" />
        <div className="mt-2 flex items-center justify-between text-[0.55rem] text-muted">
          <span>{t(COMMON.duration, lang)} · {plan.duration[lang] || plan.duration.fr}</span>
          <span>{plan.sources.length} {t(CHAT.sourcesCount, lang)} · {uniqueRules.length} {t(CHAT.rulesCount, lang)}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-muted">{t(CHAT.actionsCount, lang)}</p>
        <button onClick={onOpenLive} className="inline-flex items-center gap-0.5 text-[0.58rem] font-bold text-emerald hover:underline">
          {t(CHAT.tabLive, lang)}
          <ChevronRight className="size-2.5 rtl:rotate-180" />
        </button>
      </div>

      <div className="mt-1 divide-y divide-line-soft/60">
        {plan.actions.map((action, index) => (
          <PlanActionRow key={action.id} action={action} lang={lang} plan={plan} index={index} />
        ))}
      </div>

      <div className="mt-4">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-muted">{t(CHAT.runScopes, lang)}</p>
        <div className="mt-2">
          <ScopeChips scopes={uniqueScopes} lang={lang} max={6} />
        </div>
      </div>

      {plan.status === "AWAITING_CONFIRMATION" ? (
        <div className="mt-4 rounded-2xl border border-gold/25 bg-gold-soft/40 p-3">
          <p className="text-[0.62rem] font-semibold leading-4 text-[#6b4a0f]">{t(CHAT.planWaiting, lang)}</p>
          <div className="mt-2.5 grid gap-2">
            <Button size="sm" onClick={onRun} className="w-full justify-between">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="size-3.5" />
                {t(CHAT.confirmRun, lang)}
              </span>
              <ArrowRight className="size-3.5 rtl:rotate-180" />
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancel} loading={cancelling} className="w-full text-muted hover:text-[#9d3d25]">
              {t(CHAT.cancelPlan, lang)}
            </Button>
          </div>
        </div>
      ) : null}

      {plan.status === "EXECUTING" ? (
        <div className="mt-4">
          <div className="rounded-2xl border border-line-soft bg-paper-soft p-3">
            <div className="flex items-center gap-2 text-[0.64rem] font-bold text-forest">
              <Loader2 className="size-3.5 animate-spin text-emerald" />
              {running ? t(CHAT.executingTitle, lang) : t(CHAT.stepRunning, lang)}
            </div>
            <p className="mt-1 text-[0.58rem] text-muted">{t(CHAT.executingLead, lang)}</p>
          </div>
        </div>
      ) : null}

      {plan.status === "COMPLETED" ? (
        <div className="mt-4 space-y-3">
          {receipt ? <ReceiptCard receipt={receipt} lang={lang} citizenName={citizenName} compact /> : null}
          <div className="grid gap-2">
            {caseReference ? (
              <Button size="sm" onClick={onOpenCase} className="w-full justify-between">
                <span className="inline-flex items-center gap-1.5">
                  <FileText className="size-3.5" />
                  {t(CHAT.viewCase, lang)} · {caseReference}
                </span>
                <ArrowRight className="size-3.5 rtl:rotate-180" />
              </Button>
            ) : null}
            {receipt ? (
              <Link href={`/verify/${receipt.code}`} className="w-full">
                <Button size="sm" variant="outline" className="w-full justify-between">
                  <span className="inline-flex items-center gap-1.5">
                    <ExternalLink className="size-3.5" />
                    {t(CHAT.verifyPublic, lang)}
                  </span>
                  <ChevronRight className="size-3.5 rtl:rotate-180" />
                </Button>
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      {plan.status === "CANCELLED" ? (
        <div className="mt-4 rounded-2xl border border-coral/20 bg-coral-soft/40 p-3">
          <p className="text-[0.64rem] font-semibold leading-5 text-[#7a331f]">{t(CHAT.cancelledHint, lang)}</p>
          <Button size="sm" variant="outline" className="mt-2.5 w-full" onClick={onNewPlan}>
            <Sparkles className="size-3.5" />
            {t(CHAT.newPlan, lang)}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function LivePanel({
  plan,
  receipt,
  events,
  progress,
  running,
  lang,
  citizenName,
  caseId,
  caseReference,
  onOpenCase,
}: {
  plan?: Plan;
  receipt?: Receipt;
  events: ActionEvent[];
  progress: number;
  running: boolean;
  lang: Lang;
  citizenName: string;
  caseId?: string;
  caseReference?: string;
  onOpenCase: () => void;
}) {
  const latest = events[events.length - 1];
  const completed = plan?.status === "COMPLETED";

  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[0.52rem] font-bold uppercase tracking-[0.14em] text-muted">{t(CHAT.livePanel, lang)}</p>
          <h2 className="mt-1 font-display text-[1.25rem] tracking-[-0.02em] text-forest-deep">
            {completed ? t(CHAT.executionComplete, lang) : running ? t(CHAT.executingTitle, lang) : t(CHAT.liveWaitingTitle, lang)}
          </h2>
        </div>
        <span className={cn("relative flex size-3", running && "mt-0.5")}>
          {running ? <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald opacity-60" /> : null}
          <span className={cn("relative inline-flex size-3 rounded-full", running ? "bg-emerald" : completed ? "bg-emerald" : "bg-cream-deep")} />
        </span>
      </div>

      {plan ? (
        <div className="mt-3">
          <ExecutionProgress plan={plan} lang={lang} progress={completed ? 100 : progress} />
        </div>
      ) : null}

      {completed && receipt ? (
        <div className="mt-3 space-y-3">
          <div className="rounded-2xl border border-mint bg-mint-soft/70 p-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald" />
              <p className="text-[0.68rem] font-bold text-forest">{t(CHAT.completeTitle, lang)}</p>
            </div>
            <p className="mt-1 text-[0.62rem] leading-5 text-forest/75">
              {t(CHAT.liveSuccessLead, lang, { count: plan?.actions.length ?? 0 })}
            </p>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-paper px-2.5 py-2">
                <p className="text-[0.48rem] font-bold uppercase tracking-[0.08em] text-muted">{t(CHAT.caseReference, lang)}</p>
                <p className="mt-0.5 truncate font-mono text-[0.6rem] font-bold text-forest">{caseReference ?? receipt.caseId}</p>
              </div>
              <div className="rounded-xl bg-paper px-2.5 py-2">
                <p className="text-[0.48rem] font-bold uppercase tracking-[0.08em] text-muted">{t(CHAT.receiptHash, lang)}</p>
                <p className="mt-0.5 truncate font-mono text-[0.6rem] font-bold text-forest">{receipt.code}</p>
              </div>
            </div>
          </div>

          <ReceiptCard receipt={receipt} lang={lang} citizenName={citizenName} compact />

          <div className="grid gap-2">
            {caseId ? (
              <Button size="sm" onClick={onOpenCase} className="w-full justify-between">
                <span className="inline-flex items-center gap-1.5">
                  <FileText className="size-3.5" />
                  {t(CHAT.viewCase, lang)}
                </span>
                <ArrowRight className="size-3.5 rtl:rotate-180" />
              </Button>
            ) : null}
            <Link href={`/verify/${receipt.code}`} className="w-full">
              <Button size="sm" variant="outline" className="w-full justify-between">
                <span className="inline-flex items-center gap-1.5">
                  <ExternalLink className="size-3.5" />
                  {t(CHAT.verifyPublic, lang)}
                </span>
                <ChevronRight className="size-3.5 rtl:rotate-180" />
              </Button>
            </Link>
          </div>
        </div>
      ) : null}

      {events.length > 0 ? (
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-muted">{t(CHAT.liveLogTitle, lang)}</p>
            <span className="text-[0.55rem] font-semibold text-emerald">{events.length} {t(CHAT.liveEvents, lang)}</span>
          </div>
          <p className="mt-1 text-[0.55rem] leading-4 text-muted">{t(CHAT.liveLogLead, lang)}</p>
          <div className="mt-2 space-y-1.5">
            {events.map((event) => {
              const tone =
                event.type === "plan_failed"
                  ? "border-coral/25 bg-coral-soft/35"
                  : event.type === "plan_completed"
                    ? "border-mint bg-mint-soft/60"
                    : event.type === "action_done"
                      ? "border-line-soft bg-paper-soft"
                      : "border-gold/20 bg-gold-soft/30";
              return (
                <div key={event.id} className={cn("flex items-start gap-2 rounded-xl border px-2.5 py-2", tone)}>
                  <span className="mt-0.5">
                    {event.type === "action_started" && running ? (
                      <Loader2 className="size-3.5 animate-spin text-[#7d5a16]" />
                    ) : event.type === "plan_failed" ? (
                      <AlertTriangle className="size-3.5 text-[#9d3d25]" />
                    ) : event.type === "plan_completed" ? (
                      <CheckCircle2 className="size-3.5 text-emerald" />
                    ) : (
                      <Check className="size-3.5 text-emerald" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.64rem] font-semibold leading-4 text-ink-soft">{event.label[lang] || event.label.fr}</p>
                    {event.detail ? <p className="mt-0.5 text-[0.55rem] leading-4 text-muted">{event.detail[lang] || event.detail.fr}</p> : null}
                  </div>
                  <span className="shrink-0 font-mono text-[0.48rem] text-muted/50">{Math.round(event.progress)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {!events.length && !completed ? (
        <div className="mt-4 rounded-2xl border border-dashed border-line bg-paper-soft/50 p-4">
          <p className="text-[0.7rem] font-semibold leading-5 text-ink-soft">{t(CHAT.liveWaitingLead, lang)}</p>
          <div className="mt-3 space-y-2">
            {[
              { icon: ShieldCheck, text: t(CHAT.runTitle, lang) },
              { icon: Loader2, text: t(CHAT.executingLead, lang) },
              { icon: ReceiptText, text: t(CHAT.receiptLead, lang) },
            ].map((step, index) => {
              const StepIcon = step.icon;
              return (
                <div key={step.text} className="flex items-start gap-2">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-cream-deep/70 font-mono text-[0.55rem] font-bold text-muted">
                    {index + 1}
                  </span>
                  <div className="flex items-start gap-1.5">
                    <StepIcon className="mt-0.5 size-3 shrink-0 text-emerald" />
                    <p className="text-[0.58rem] leading-4 text-muted">{step.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {latest && running ? (
        <div className="mt-3 rounded-xl bg-cream/70 px-3 py-2">
          <p className="text-[0.55rem] text-muted">
            {t(COMMON.now, lang)} · {latest.label[lang] || latest.label.fr}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function TrustPanel({
  plan,
  lang,
  audit,
  onGuardrail,
  onHuman,
}: {
  plan?: Plan;
  lang: Lang;
  audit: { id: string; at: string; actor: string; action: string; code?: string }[];
  onGuardrail: () => void;
  onHuman: () => void;
}) {
  const sources = plan?.sources ?? [];
  const rules = plan ? Array.from(new Set(plan.actions.flatMap((action) => action.ruleIds))) : [];
  const recent = audit.slice(0, 7);

  return (
    <div className="p-4">
      <p className="text-[0.52rem] font-bold uppercase tracking-[0.14em] text-muted">{t(CHAT.trustPanel, lang)}</p>
      <h2 className="mt-1 font-display text-[1.25rem] tracking-[-0.02em] text-forest-deep">{t(CHAT.traceTitle, lang)}</h2>
      <p className="mt-1 text-[0.62rem] leading-5 text-muted">{t(CHAT.traceLead, lang)}</p>

      <div className="mt-3 flex items-start gap-2 rounded-xl border border-mint bg-mint-soft/50 px-3 py-2.5">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-emerald" />
        <p className="text-[0.58rem] leading-5 text-forest/80">{t(CHAT.trustNote, lang)}</p>
      </div>

      {plan ? (
        <>
          <div className="mt-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-muted">{t(CHAT.traceTitle, lang)}</p>
              <span className="text-[0.52rem] font-mono text-muted/60">{plan.trace.length} {t(COMMON.steps, lang)}</span>
            </div>
            <div className="mt-1.5 rounded-xl border border-line-soft bg-paper-soft p-1.5">
              <TraceList trace={plan.trace} lang={lang} dense />
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-muted">{t(CHAT.rulesTitle, lang)}</p>
              <span className="text-[0.52rem] font-semibold text-emerald">{rules.length}</span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {rules.map((rule) => (
                <span key={rule} className="rounded-lg border border-line bg-paper-soft px-2 py-1 font-mono text-[0.5rem] text-ink-soft">
                  {rule}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-muted">{t(CHAT.sourcesTitle, lang)}</p>
              <span className="text-[0.52rem] font-semibold text-emerald">{sources.length}</span>
            </div>
            <div className="mt-1.5 space-y-1.5">
              {sources.map((source) => (
                <a
                  key={source.id}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-start gap-2 rounded-xl border border-line-soft bg-paper-soft px-2.5 py-2 transition-colors hover:border-forest/25 hover:bg-mint-soft/35"
                >
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-cream-deep/70 text-forest">
                    <ShieldCheck className="size-3" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.6rem] font-semibold leading-4 text-ink-soft">{source.label[lang] || source.label.fr}</p>
                    <p className="mt-0.5 text-[0.5rem] text-muted">
                      {source.authority} · {t(CHAT.sourcesCount, lang)} · {formatDate(source.checkedAt, lang)}
                    </p>
                  </div>
                  <ExternalLink className="mt-0.5 size-3 shrink-0 text-muted/50 transition-colors group-hover:text-emerald" />
                </a>
              ))}
            </div>
          </div>
        </>
      ) : null}

      <div className="mt-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-muted">{t(CHAT.auditTitle, lang)}</p>
          <span className="text-[0.52rem] font-mono text-muted/60">{audit.length}</span>
        </div>
        <div className="mt-1.5 max-h-48 space-y-1 overflow-y-auto rounded-xl border border-line-soft bg-paper-soft p-1.5">
          {recent.length === 0 ? (
            <p className="px-2 py-2 text-[0.55rem] text-muted">{t(CHAT.auditEmpty, lang)}</p>
          ) : (
            recent.map((entry) => (
              <div key={entry.id} className="flex items-center gap-2 rounded-lg px-1.5 py-1">
                <span
                  className={cn(
                    "size-1.5 shrink-0 rounded-full",
                    entry.actor === "policy" || entry.actor === "executor" ? "bg-emerald" : entry.actor === "citizen" ? "bg-gold" : "bg-sky",
                  )}
                />
                <p className="min-w-0 flex-1 truncate text-[0.55rem] text-ink-soft">{entry.action.replace(/[._]/g, " ")}</p>
                <span className="shrink-0 font-mono text-[0.46rem] text-muted/50">{formatDate(entry.at, lang, false)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        <Button variant="outline" size="sm" onClick={onGuardrail} className="w-full justify-between">
          <span className="inline-flex items-center gap-1.5">
            <ShieldAlert className="size-3.5 text-[#9d3d25]" />
            {t(CHAT.riskDemo, lang)}
          </span>
          <ChevronRight className="size-3.5 rtl:rotate-180" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onHuman} className="w-full justify-between text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Headphones className="size-3.5" />
            {t(CHAT.humanCta, lang)}
          </span>
          <ChevronRight className="size-3.5 rtl:rotate-180" />
        </Button>
        <Link href="/sources" className="w-full">
          <Button variant="ghost" size="sm" className="w-full justify-between text-emerald">
            {t(CHAT.openFullLedger, lang)}
            <ArrowRight className="size-3.5 rtl:rotate-180" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
