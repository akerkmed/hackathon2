"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  ActionEvent,
  AgentReply,
  ConsentScope,
  Lang,
  Plan,
  Receipt,
  Snapshot,
  VaultDocument,
} from "@/lib/domain/types";
import { SPEECH_LANG, isRtl } from "@/lib/i18n";
import { COMMON, t } from "@/lib/copy";

const SESSION_KEY = "m3ak.session.id";
const LANG_KEY = "m3ak.lang";
const VOICE_KEY = "m3ak.voice";
const BIG_TEXT_KEY = "m3ak.bigText";

export type ToastTone = "success" | "error" | "info" | "warning";
export interface Toast {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
}

export interface ScanResult {
  id: string;
  title: string;
  status: string;
  fields: { label: string; value: string }[];
}

interface SessionContextValue {
  snapshot: Snapshot | null;
  loading: boolean;
  error: string | null;
  lang: Lang;
  setLang: (lang: Lang) => void;
  bigText: boolean;
  toggleBigText: () => void;
  voiceOutput: boolean;
  toggleVoiceOutput: () => void;
  speak: (text: string, lang: Lang) => void;
  stopSpeaking: () => void;
  refresh: () => Promise<Snapshot | null>;
  sendMessage: (text: string) => Promise<AgentReply | null>;
  executePlan: (
    planId: string,
    scopes: ConsentScope[],
    handlers?: {
      speed?: number;
      onEvent?: (event: ActionEvent) => void;
    },
  ) => Promise<{ ok: boolean; receipt?: Receipt }>;
  cancelPlan: (planId: string) => Promise<boolean>;
  scanBenefits: () => Promise<void>;
  scanningBenefits: boolean;
  scanDocument: () => Promise<ScanResult | null>;
  shareDocument: (documentId: string, recipient: string, days: number) => Promise<boolean>;
  revokeConsent: (consentId: string) => Promise<boolean>;
  requestHandoff: () => Promise<{ id: string; queue: number } | null>;
  resetDemo: () => Promise<void>;
  toasts: Toast[];
  pushToast: (toast: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

function readSessionId(): string {
  if (typeof window === "undefined") return "m3ak-demo";
  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const id = `demo-${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem(SESSION_KEY, id);
  return id;
}

function readLang(): Lang {
  if (typeof window === "undefined") return "fr";
  const stored = window.localStorage.getItem(LANG_KEY);
  return stored === "ar" || stored === "darija" || stored === "en" || stored === "fr" ? stored : "fr";
}

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = (data as { error?: string }).error || `HTTP ${response.status}`;
    throw new Error(message);
  }
  return data as T;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLangState] = useState<Lang>("fr");
  const [bigText, setBigText] = useState(false);
  const [voiceOutput, setVoiceOutput] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [scanningBenefits, setScanningBenefits] = useState(false);
  const sessionIdRef = useRef<string>("m3ak-demo");
  const initialized = useRef(false);
  const langRef = useRef<Lang>("fr");
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const pushToast = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
      setToasts((current) => [...current.slice(-2), { ...toast, id }]);
      const timer = setTimeout(() => dismissToast(id), toast.tone === "error" ? 6500 : 4600);
      timers.current.set(id, timer);
    },
    [dismissToast],
  );

  const applyLang = useCallback((next: Lang) => {
    setLangState(next);
    langRef.current = next;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LANG_KEY, next);
    }
  }, []);

  const headers = useCallback(
    () => ({
      "Content-Type": "application/json",
      "x-m3ak-session": sessionIdRef.current,
    }),
    [],
  );

  const refresh = useCallback(async (): Promise<Snapshot | null> => {
    try {
      const response = await fetch("/api/state", {
        headers: { "x-m3ak-session": sessionIdRef.current },
        cache: "no-store",
      });
      const data = await parseJson<Snapshot>(response);
      setSnapshot(data);
      setError(null);
      return data;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "STATE_ERROR");
      return null;
    }
  }, []);

  const sendMessage = useCallback(
    async (text: string): Promise<AgentReply | null> => {
      const trimmed = text.trim();
      if (!trimmed) return null;
      const optimistic = {
        id: `optimistic-${Date.now()}`,
        role: "user" as const,
        text: trimmed,
        lang: langRef.current,
        at: new Date().toISOString(),
      };
      setSnapshot((current) => (current ? { ...current, messages: [...current.messages, optimistic] } : current));
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({ message: trimmed, lang: langRef.current }),
        });
        const reply = await parseJson<AgentReply>(response);
        setSnapshot(reply.state);
        return reply;
      } catch (cause) {
        pushToast({
          tone: "error",
          title: t(COMMON.error, langRef.current),
          description: cause instanceof Error ? cause.message : undefined,
        });
        await refresh();
        return null;
      }
    },
    [headers, pushToast, refresh],
  );

  const executePlan = useCallback(
    async (
      planId: string,
      scopes: ConsentScope[],
      handlers?: { speed?: number; onEvent?: (event: ActionEvent) => void },
    ): Promise<{ ok: boolean; receipt?: Receipt }> => {
      try {
        const response = await fetch(`/api/plans/${encodeURIComponent(planId)}/execute`, {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({ scopes, speed: handlers?.speed ?? 380, lang: langRef.current }),
        });
        if (!response.ok || !response.body) {
          const data = await response.json().catch(() => ({}));
          throw new Error((data as { error?: string }).error || `HTTP ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let receipt: Receipt | undefined;

        const consume = (line: string) => {
          if (!line.trim()) return;
          let parsed: { type?: string; event?: ActionEvent; snapshot?: Snapshot; receipt?: Receipt; error?: string };
          try {
            parsed = JSON.parse(line);
          } catch {
            return;
          }
          if (parsed.type === "snapshot" && parsed.snapshot) {
            setSnapshot(parsed.snapshot);
          } else if (parsed.type === "receipt" && parsed.receipt) {
            receipt = parsed.receipt;
          } else if (parsed.type === "error") {
            throw new Error(parsed.error || "EXECUTION_ERROR");
          } else if (parsed.type && parsed.type !== "done" && "event" in parsed && parsed.event) {
            const event = parsed.event;
            handlers?.onEvent?.(event);
            setSnapshot((current) => {
              if (!current) return current;
              return {
                ...current,
                plans: current.plans.map((plan) => (plan.id === event.plan.id ? event.plan : plan)),
              };
            });
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) consume(line);
        }
        if (buffer.trim()) consume(buffer);

        const fresh = await refresh();
        const found = fresh?.receipts.find((item) => item.planId === planId);
        const finalReceipt = receipt ?? found;
        if (finalReceipt) window.localStorage.setItem("m3ak.lastReceipt", finalReceipt.code);
        return { ok: true, receipt: finalReceipt };
      } catch (cause) {
        pushToast({
          tone: "error",
          title: t(COMMON.error, langRef.current),
          description: cause instanceof Error ? cause.message : undefined,
        });
        await refresh();
        return { ok: false };
      }
    },
    [headers, pushToast, refresh],
  );

  const cancelPlan = useCallback(
    async (planId: string) => {
      try {
        const response = await fetch(`/api/plans/${encodeURIComponent(planId)}/cancel`, {
          method: "POST",
          headers: headers(),
        });
        const data = await parseJson<{ snapshot: Snapshot }>(response);
        setSnapshot(data.snapshot);
        return true;
      } catch (cause) {
        pushToast({
          tone: "error",
          title: t(COMMON.error, langRef.current),
          description: cause instanceof Error ? cause.message : undefined,
        });
        return false;
      }
    },
    [headers, pushToast],
  );

  const scanBenefits = useCallback(async () => {
    setScanningBenefits(true);
    try {
      const [response] = await Promise.all([
        fetch("/api/benefits/scan", { method: "POST", headers: headers() }),
        new Promise((resolve) => setTimeout(resolve, 1300)),
      ]);
      const data = await parseJson<{ snapshot: Snapshot; found: number; excluded: number }>(response);
      setSnapshot(data.snapshot);
      pushToast({
        tone: "success",
        title: t(COMMON.done, langRef.current),
        description:
          langRef.current === "fr"
            ? `${data.found} droits confirmés · ${data.excluded} exclus pour éviter le double-droit.`
            : `${data.found} droits · ${data.excluded} exclus.`,
      });
    } catch (cause) {
      pushToast({
        tone: "error",
        title: t(COMMON.error, langRef.current),
        description: cause instanceof Error ? cause.message : undefined,
      });
    } finally {
      setScanningBenefits(false);
    }
  }, [headers, pushToast]);

  const scanDocument = useCallback(async (): Promise<ScanResult | null> => {
    try {
      const [response] = await Promise.all([
        fetch("/api/documents/scan", { method: "POST", headers: headers() }),
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]);
      const data = await parseJson<{ snapshot: Snapshot; document: VaultDocument; fields: ScanResult["fields"] }>(response);
      setSnapshot(data.snapshot);
      return {
        id: data.document.id,
        title: data.document.title[langRef.current] || data.document.title.fr,
        status: data.document.status,
        fields: data.fields,
      };
    } catch (cause) {
      pushToast({
        tone: "error",
        title: t(COMMON.error, langRef.current),
        description: cause instanceof Error ? cause.message : undefined,
      });
      return null;
    }
  }, [headers, pushToast]);

  const shareDocument = useCallback(
    async (documentId: string, recipient: string, days: number) => {
      try {
        const response = await fetch("/api/documents/share", {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({ documentId, recipient, days }),
        });
        const data = await parseJson<{ snapshot: Snapshot }>(response);
        setSnapshot(data.snapshot);
        return true;
      } catch (cause) {
        pushToast({
          tone: "error",
          title: t(COMMON.error, langRef.current),
          description: cause instanceof Error ? cause.message : undefined,
        });
        return false;
      }
    },
    [headers, pushToast],
  );

  const revokeConsent = useCallback(
    async (consentId: string) => {
      try {
        const response = await fetch(`/api/consents/${encodeURIComponent(consentId)}/revoke`, {
          method: "POST",
          headers: headers(),
        });
        const data = await parseJson<{ snapshot: Snapshot }>(response);
        setSnapshot(data.snapshot);
        return true;
      } catch (cause) {
        pushToast({
          tone: "error",
          title: t(COMMON.error, langRef.current),
          description: cause instanceof Error ? cause.message : undefined,
        });
        return false;
      }
    },
    [headers, pushToast],
  );

  const requestHandoff = useCallback(async () => {
    try {
      const response = await fetch("/api/handoff", { method: "POST", headers: headers() });
      const data = await parseJson<{ handoff: { id: string; queue: number } }>(response);
      return data.handoff;
    } catch (cause) {
      pushToast({
        tone: "error",
        title: t(COMMON.error, langRef.current),
        description: cause instanceof Error ? cause.message : undefined,
      });
      return null;
    }
  }, [headers, pushToast]);

  const resetDemo = useCallback(async () => {
    setLoading(true);
    try {
      await fetch("/api/reset", { method: "POST", headers: headers() });
      const init = await fetch("/api/chat", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ init: true, lang: langRef.current }),
      });
      const reply = await parseJson<AgentReply>(init);
      setSnapshot(reply.state);
      setError(null);
      pushToast({ tone: "success", title: t(COMMON.resetDone, langRef.current) });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "RESET_ERROR");
    } finally {
      setLoading(false);
    }
  }, [headers, pushToast]);

  const setLang = useCallback((next: Lang) => applyLang(next), [applyLang]);

  const toggleBigText = useCallback(() => {
    setBigText((current) => {
      const next = !current;
      window.localStorage.setItem(BIG_TEXT_KEY, String(next));
      document.documentElement.dataset.bigText = String(next);
      return next;
    });
  }, []);

  const toggleVoiceOutput = useCallback(() => {
    setVoiceOutput((current) => {
      const next = !current;
      window.localStorage.setItem(VOICE_KEY, String(next));
      if (!next && typeof window !== "undefined") window.speechSynthesis?.cancel();
      return next;
    });
  }, []);

  const speak = useCallback((text: string, messageLang: Lang) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = SPEECH_LANG[messageLang] ?? "fr-MA";
    utterance.rate = 1.02;
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find((voice) => voice.lang === utterance.lang) ?? voices.find((voice) => voice.lang.startsWith(messageLang === "en" ? "en" : messageLang === "ar" || messageLang === "darija" ? "ar" : "fr"));
    if (match) utterance.voice = match;
    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const storedLang = readLang();
    applyLang(storedLang);
    const storedBig = window.localStorage.getItem(BIG_TEXT_KEY) === "true";
    setBigText(storedBig);
    document.documentElement.dataset.bigText = String(storedBig);
    setVoiceOutput(window.localStorage.getItem(VOICE_KEY) === "true");
    sessionIdRef.current = readSessionId();

    const bootstrap = async () => {
      try {
        const state = await refresh();
        if (!state) return;
        if (state.messages.length === 0) {
          const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-m3ak-session": sessionIdRef.current,
            },
            body: JSON.stringify({ init: true, lang: storedLang }),
          });
          const reply = await parseJson<AgentReply>(response);
          setSnapshot(reply.state);
        }
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "BOOTSTRAP_ERROR");
      } finally {
        setLoading(false);
      }
    };
    void bootstrap();
  }, [applyLang, refresh]);

  useEffect(() => {
    const direction = isRtl(lang) ? "rtl" : "ltr";
    document.documentElement.lang = lang === "darija" ? "ar-MA" : lang;
    document.documentElement.dir = direction;
  }, [lang]);

  useEffect(() => {
    return () => {
      for (const timer of timers.current.values()) clearTimeout(timer);
    };
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      snapshot,
      loading,
      error,
      lang,
      setLang,
      bigText,
      toggleBigText,
      voiceOutput,
      toggleVoiceOutput,
      speak,
      stopSpeaking,
      refresh,
      sendMessage,
      executePlan,
      cancelPlan,
      scanBenefits,
      scanningBenefits,
      scanDocument,
      shareDocument,
      revokeConsent,
      requestHandoff,
      resetDemo,
      toasts,
      pushToast,
      dismissToast,
    }),
    [
      snapshot,
      loading,
      error,
      lang,
      setLang,
      bigText,
      toggleBigText,
      voiceOutput,
      toggleVoiceOutput,
      speak,
      stopSpeaking,
      refresh,
      sendMessage,
      executePlan,
      cancelPlan,
      scanBenefits,
      scanningBenefits,
      scanDocument,
      shareDocument,
      revokeConsent,
      requestHandoff,
      resetDemo,
      toasts,
      pushToast,
      dismissToast,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used inside SessionProvider");
  return context;
}

export function useActivePlan(): Plan | undefined {
  const { snapshot } = useSession();
  if (!snapshot) return undefined;
  return (
    snapshot.plans.find((plan) => plan.id === snapshot.activePlanId) ??
    snapshot.plans.find((plan) => plan.status === "AWAITING_CONFIRMATION") ??
    snapshot.plans[0]
  );
}
