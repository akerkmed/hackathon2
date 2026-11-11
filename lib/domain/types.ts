export type Lang = "fr" | "ar" | "darija" | "en";

export type Localized = Record<Lang, string>;

export type IconName =
  | "baby"
  | "file"
  | "file-check"
  | "shield"
  | "wallet"
  | "coins"
  | "stethoscope"
  | "home"
  | "briefcase"
  | "graduation"
  | "landmark"
  | "fingerprint"
  | "map-pin"
  | "calendar"
  | "heart"
  | "sparkles"
  | "receipt"
  | "users"
  | "passport"
  | "building"
  | "zap"
  | "arrow";

export type LifeEventId =
  | "new_baby"
  | "moving"
  | "job_loss"
  | "retirement"
  | "business"
  | "studies";

export type ServiceCategory =
  | "civil"
  | "social"
  | "health"
  | "finance"
  | "identity"
  | "tax"
  | "education"
  | "mobility"
  | "business";

export type ConsentScope =
  | "read:identity"
  | "write:identity"
  | "read:civil_status"
  | "write:civil_status"
  | "read:cnss"
  | "write:cnss"
  | "read:tax"
  | "write:tax"
  | "read:education"
  | "write:education"
  | "book:health"
  | "pay:fees"
  | "write:utilities";

export type ActionStatus = "PENDING" | "RUNNING" | "DONE" | "SKIPPED" | "FAILED";

export type PlanStatus =
  | "AWAITING_CONFIRMATION"
  | "EXECUTING"
  | "COMPLETED"
  | "PARTIAL"
  | "CANCELLED";

export type CaseStatus = "EXECUTING" | "COMPLETED" | "PARTIAL" | "CANCELLED";

export type BenefitStatus = "ELIGIBLE" | "APPLIED" | "NOT_ELIGIBLE" | "UPCOMING";

export type BenefitCadence = "ONE_OFF" | "MONTHLY" | "ANNUAL" | "COVERAGE";

export type DocumentStatus = "VERIFIED" | "PENDING" | "EXPIRING" | "EXPIRED" | "ORDERED";

export type Relation = "SELF" | "SPOUSE" | "CHILD" | "PARENT";

export interface Source {
  id: string;
  label: Localized;
  authority: string;
  url: string;
  checkedAt: string;
}

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  fullNameAr: string;
  relation: Relation;
  birthDate: string;
  sex: "F" | "M";
  cnie?: string;
  cnieExpiry?: string;
  cnss?: string;
  amo?: string;
  job?: string;
  employer?: string;
  verified: boolean;
  avatarTone: string;
  note?: Localized;
}

export interface Citizen {
  id: string;
  firstName: string;
  lastName: string;
  fullNameAr: string;
  birthDate: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  cnie: string;
  cnieExpiry: string;
  cnss: string;
  cnssSince: string;
  amo: string;
  employer: string;
  job: string;
  salary: number;
  identityVerifiedAt: string;
  preferredLang: Lang;
}

export interface VaultDocument {
  id: string;
  type:
    | "CNIE"
    | "LIVRET"
    | "CNSS"
    | "MATERNITY"
    | "BIRTH_CERTIFICATE"
    | "VACCINATION"
    | "ADDRESS_PROOF"
    | "OTHER";
  holderId: string;
  title: Localized;
  subtitle: Localized;
  status: DocumentStatus;
  issuedAt?: string;
  expiresAt?: string;
  authority: string;
  reference: string;
  credentialHash: string;
  icon: IconName;
  sharedWith?: string[];
}

export interface Benefit {
  id: string;
  title: Localized;
  short: Localized;
  amount: number;
  cadence: BenefitCadence;
  status: BenefitStatus;
  reason: Localized;
  sourceId: string;
  serviceId?: string;
  ruleId: string;
  estimate?: boolean;
}

export interface LifeEventState {
  id: LifeEventId;
  title: Localized;
  tagline: Localized;
  icon: IconName;
  status: "ACTIVE" | "PLANNING" | "FUTURE" | "DONE";
  triggeredAt?: string;
  nextDeadline?: string;
  serviceIds: string[];
  tone: string;
}

export interface ServiceResultTemplate {
  referencePrefix: string;
  detail: Localized;
  documentType?: VaultDocument["type"];
  documentTitle?: Localized;
  documentSubtitle?: Localized;
}

export interface AppointmentTemplate {
  place: Localized;
  date: string;
  time: string;
  label: Localized;
}

export interface ServiceDef {
  id: string;
  lifeEventId: LifeEventId;
  title: Localized;
  short: Localized;
  description: Localized;
  authority: string;
  authorityLabel: Localized;
  category: ServiceCategory;
  icon: IconName;
  fee: number;
  benefitOneOff?: number;
  benefitMonthly?: number;
  duration: Localized;
  deadline?: string;
  dependsOn: string[];
  requiredDocs: Localized[];
  outputs: Localized;
  scope: ConsentScope[];
  sourceIds: string[];
  ruleIds: string[];
  reason: Localized;
  appointment?: AppointmentTemplate;
  result: ServiceResultTemplate;
}

export interface LifeEventDef {
  id: LifeEventId;
  title: Localized;
  tagline: Localized;
  description: Localized;
  icon: IconName;
  personaStory: Localized;
  serviceIds: string[];
  triggerKeywords: string[];
  tone: string;
}

export interface ActionResult {
  reference: string;
  detail: Localized;
  at: string;
  appointment?: AppointmentTemplate;
  code?: string;
  amount?: number;
  documentId?: string;
}

export interface PlanAction {
  id: string;
  serviceId: string;
  title: Localized;
  short: Localized;
  description: Localized;
  authority: string;
  authorityLabel: Localized;
  category: ServiceCategory;
  icon: IconName;
  status: ActionStatus;
  dependsOn: string[];
  fee: number;
  benefitOneOff: number;
  benefitMonthly: number;
  scope: ConsentScope[];
  sourceIds: string[];
  ruleIds: string[];
  outputs: Localized;
  reason: Localized;
  duration: Localized;
  deadline?: string;
  result?: ActionResult;
}

export interface TraceStep {
  id: string;
  code: string;
  params?: Record<string, string | number>;
  tone?: "pass" | "warn" | "block" | "info";
  at?: string;
}

export interface Plan {
  id: string;
  lifeEventId: LifeEventId;
  title: Localized;
  summary: Localized;
  actions: PlanAction[];
  status: PlanStatus;
  totalCost: number;
  benefitOneOff: number;
  benefitMonthly: number;
  duration: Localized;
  sources: Source[];
  trace: TraceStep[];
  createdAt: string;
  executedAt?: string;
  caseId?: string;
  receiptId?: string;
  reference?: string;
}

export interface CaseTimelineEvent {
  id: string;
  at: string;
  label: Localized;
  detail?: Localized;
  done: boolean;
  kind: "detected" | "plan" | "consent" | "action" | "done";
}

export interface CaseFile {
  id: string;
  reference: string;
  planId: string;
  lifeEventId: LifeEventId;
  title: Localized;
  status: CaseStatus;
  openedAt: string;
  completedAt?: string;
  actions: PlanAction[];
  documentIds: string[];
  receiptId?: string;
  timeline: CaseTimelineEvent[];
}

export interface Receipt {
  id: string;
  code: string;
  caseId: string;
  planId: string;
  issuedAt: string;
  citizenName: string;
  items: { label: Localized; amount: number }[];
  total: number;
  benefitOneOff: number;
  benefitMonthly: number;
  hash: string;
  status: "VALID";
}

export interface ConsentRecord {
  id: string;
  reference: string;
  recipient: Localized;
  scopes: ConsentScope[];
  grantedAt: string;
  expiresAt: string;
  status: "ACTIVE" | "REVOKED" | "EXPIRED";
  planId?: string;
  purpose: Localized;
  documentId?: string;
  recipientId?: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: "citizen" | "agent" | "policy" | "executor" | "system";
  action: string;
  detail?: Localized;
  code?: string;
}

export interface Metrics {
  documents: number;
  verifiedDocuments: number;
  casesOpen: number;
  casesCompleted: number;
  actionsAutomated: number;
  benefitsFound: number;
  benefitsUnlocked: number;
  monthlyUnlocked: number;
  costPaid: number;
  timeSavedHours: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  lang: Lang;
  at: string;
  planId?: string;
  kind?: "text" | "plan" | "blocked" | "handoff" | "receipt";
  trace?: TraceStep[];
  sources?: string[];
}

export interface Snapshot {
  sessionId: string;
  demoNow: string;
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
  activePlanId?: string;
  messages: ChatMessage[];
}

export interface ActionEvent {
  id: string;
  at: string;
  type:
    | "plan_started"
    | "action_started"
    | "action_done"
    | "action_skipped"
    | "plan_completed"
    | "plan_failed";
  actionId?: string;
  serviceId?: string;
  label: Localized;
  detail?: Localized;
  status: ActionStatus;
  progress: number;
  plan: Plan;
}

export interface AgentReply {
  message: ChatMessage;
  planId?: string;
  executePlanId?: string;
  suggestions: string[];
  state: Snapshot;
}
