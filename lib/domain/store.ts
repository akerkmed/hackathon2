import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import {
  CITIZEN,
  DOCUMENTS,
  HOUSEHOLD,
  LIFE_EVENT_STATE,
  SEED_AUDIT,
  SEED_BENEFITS,
  SEED_METRICS,
  DEMO_NOW,
  createSeedSnapshot,
} from "@/lib/domain/seed";
import type {
  AuditEntry,
  Benefit,
  CaseFile,
  ChatMessage,
  Citizen,
  ConsentRecord,
  LifeEventState,
  Metrics,
  Person,
  Plan,
  Receipt,
  Snapshot,
  VaultDocument,
} from "@/lib/domain/types";

export interface Session {
  id: string;
  createdAt: string;
  refSeq: number;
  planSeq: number;
  citizen: Citizen;
  household: Person[];
  documents: VaultDocument[];
  lifeEvents: LifeEventState[];
  benefits: Benefit[];
  plans: Plan[];
  cases: CaseFile[];
  receipts: Receipt[];
  consents: ConsentRecord[];
  audit: AuditEntry[];
  metrics: Metrics;
  messages: ChatMessage[];
  activePlanId?: string;
  handoff?: { id: string; queue: number; at: string };
}

type Store = {
  __m3akSessions?: Map<string, Session>;
  __m3akReceipts?: Map<string, { receipt: Receipt; citizenName: string }>;
};

const store = globalThis as unknown as Store;
const sessions = (store.__m3akSessions ??= new Map<string, Session>());
const receiptRegistry = (store.__m3akReceipts ??= new Map<string, { receipt: Receipt; citizenName: string }>());

/**
 * Sessions live in memory for speed, but a dev-server restart (or a new
 * server process) used to wipe every plan while the browser kept its session
 * id. Confirming then failed with PLAN_NOT_FOUND. Mirror the demo state to a
 * temp file and rehydrate lazily so an open tab survives a restart.
 *
 * This is simulated demo data only; nothing here should be deployed as-is.
 */
const persistenceDisabled = Boolean(process.env.VITEST);
const storeFile = join(
  tmpdir(),
  `m3ak-store-${createHash("sha1").update(process.cwd()).digest("hex").slice(0, 10)}.json`,
);

type PersistedStore = {
  sessions: Session[];
  receipts: { code: string; receipt: Receipt; citizenName: string }[];
};

let hydrated = false;

function hydrate(): void {
  if (hydrated) return;
  hydrated = true;
  if (persistenceDisabled) return;
  try {
    const parsed = JSON.parse(readFileSync(storeFile, "utf8")) as Partial<PersistedStore>;
    for (const session of parsed.sessions ?? []) {
      if (session && typeof session.id === "string" && !sessions.has(session.id)) {
        sessions.set(session.id, session);
      }
    }
    for (const entry of parsed.receipts ?? []) {
      if (entry?.code && entry.receipt && !receiptRegistry.has(entry.code)) {
        receiptRegistry.set(entry.code, { receipt: entry.receipt, citizenName: entry.citizenName });
      }
    }
  } catch {
    // No persisted state yet, or the file was cleared: start fresh.
  }
}

function persist(): void {
  if (persistenceDisabled) return;
  try {
    const payload: PersistedStore = {
      // Keep the file bounded; the demo never needs a long session archive.
      sessions: Array.from(sessions.values()).slice(-60),
      receipts: Array.from(receiptRegistry, ([code, entry]) => ({ code, ...entry })).slice(-60),
    };
    mkdirSync(dirname(storeFile), { recursive: true });
    writeFileSync(storeFile, JSON.stringify(payload));
  } catch {
    // Persistence is a convenience; the in-memory demo keeps working.
  }
}

export function createSession(id: string): Session {
  const snapshot = createSeedSnapshot(id);
  const session: Session = {
    id,
    createdAt: DEMO_NOW,
    refSeq: 0,
    planSeq: 0,
    citizen: snapshot.citizen ?? CITIZEN,
    household: snapshot.household ?? HOUSEHOLD,
    documents: snapshot.documents ?? DOCUMENTS,
    lifeEvents: snapshot.lifeEvents ?? LIFE_EVENT_STATE,
    benefits: snapshot.benefits ?? SEED_BENEFITS,
    plans: [],
    cases: [],
    receipts: [],
    consents: [],
    audit: SEED_AUDIT,
    metrics: SEED_METRICS,
    messages: [],
  };
  sessions.set(id, session);
  persist();
  return session;
}

export function ensureSession(id: string): Session {
  hydrate();
  const existing = sessions.get(id);
  if (existing) return existing;
  return createSession(id);
}

export function resetSession(id: string): Session {
  sessions.delete(id);
  return createSession(id);
}

export function getSessionById(id: string): Session | undefined {
  hydrate();
  return sessions.get(id);
}

export function allSessions(): Session[] {
  hydrate();
  return Array.from(sessions.values());
}

export function nextRef(session: Session, prefix: string): string {
  session.refSeq += 1;
  return `${prefix}-2026-${String(session.refSeq).padStart(4, "0")}`;
}

export function addAudit(
  session: Session,
  entry: Omit<AuditEntry, "id" | "at"> & { at?: string },
): AuditEntry {
  const audit: AuditEntry = {
    id: `aud-${session.audit.length + 1}-${Math.random().toString(36).slice(2, 6)}`,
    at: entry.at ?? DEMO_NOW,
    actor: entry.actor,
    action: entry.action,
    detail: entry.detail,
    code: entry.code,
  };
  session.audit.unshift(audit);
  return audit;
}

export function registerReceipt(receipt: Receipt, citizenName: string): void {
  receiptRegistry.set(receipt.code, { receipt, citizenName });
  persist();
}

export function findReceipt(code: string): { receipt: Receipt; citizenName: string } | undefined {
  hydrate();
  return receiptRegistry.get(code);
}

export function toSnapshot(session: Session): Snapshot {
  const snapshot: Snapshot = {
    sessionId: session.id,
    demoNow: DEMO_NOW,
    citizen: session.citizen,
    household: session.household,
    documents: session.documents,
    lifeEvents: session.lifeEvents,
    benefits: session.benefits,
    plans: session.plans,
    cases: session.cases,
    receipts: session.receipts,
    consents: session.consents,
    audit: session.audit,
    metrics: session.metrics,
    activePlanId: session.activePlanId,
    messages: session.messages,
  };
  persist();
  return snapshot;
}
