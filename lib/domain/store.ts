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
  return session;
}

export function ensureSession(id: string): Session {
  const existing = sessions.get(id);
  if (existing) return existing;
  return createSession(id);
}

export function resetSession(id: string): Session {
  sessions.delete(id);
  return createSession(id);
}

export function getSessionById(id: string): Session | undefined {
  return sessions.get(id);
}

export function allSessions(): Session[] {
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
}

export function findReceipt(code: string): { receipt: Receipt; citizenName: string } | undefined {
  return receiptRegistry.get(code);
}

export function toSnapshot(session: Session): Snapshot {
  return {
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
}
