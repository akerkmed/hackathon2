import { L } from "@/lib/i18n";
import { BENEFITS, LIFE_EVENTS } from "@/lib/domain/catalog";
import type {
  AuditEntry,
  Benefit,
  CaseFile,
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

export const DEMO_NOW = "2026-11-10T09:00:00+01:00";

export const CITIZEN: Citizen = {
  id: "cit-yasmine",
  firstName: "Yasmine",
  lastName: "Benali",
  fullNameAr: "ياسمين بنعلي",
  birthDate: "1994-03-18",
  address: "12 Rue Ibn Battouta, Maârif, Casablanca",
  city: "Casablanca",
  phone: "+212 661 482 913",
  email: "yasmine.benali@example.ma",
  cnie: "BK 482 913",
  cnieExpiry: "2031-06-20",
  cnss: "CNSS-774 201 93",
  cnssSince: "2022-09-01",
  amo: "AMO-2026-8842",
  employer: "Studio Noun — Casablanca",
  job: "Directrice artistique",
  salary: 7800,
  identityVerifiedAt: "2026-11-10T08:42:00+01:00",
  preferredLang: "fr",
};

export const HOUSEHOLD: Person[] = [
  {
    id: "cit-yasmine",
    firstName: "Yasmine",
    lastName: "Benali",
    fullNameAr: "ياسمين بنعلي",
    relation: "SELF",
    birthDate: "1994-03-18",
    sex: "F",
    cnie: "BK 482 913",
    cnieExpiry: "2031-06-20",
    cnss: "CNSS-774 201 93",
    amo: "AMO-2026-8842",
    job: "Directrice artistique",
    employer: "Studio Noun",
    verified: true,
    avatarTone: "emerald",
  },
  {
    id: "cit-mehdi",
    firstName: "Mehdi",
    lastName: "El Fassi",
    fullNameAr: "مهدي الفاسي",
    relation: "SPOUSE",
    birthDate: "1992-07-09",
    sex: "M",
    cnie: "BE 771 204",
    cnieExpiry: "2029-12-03",
    cnss: "CNOPS-118 402",
    amo: "CNOPS-118 402",
    job: "Enseignant",
    employer: "Académie Casablanca-Settat",
    verified: true,
    avatarTone: "sky",
  },
  {
    id: "cit-adam",
    firstName: "Adam",
    lastName: "Benali",
    fullNameAr: "آدم بنعلي",
    relation: "CHILD",
    birthDate: "2026-11-07",
    sex: "M",
    verified: false,
    avatarTone: "coral",
    note: L(
      "Identité en cours d'enregistrement — 3 jours",
      "الهوية قيد التسجيل — عمره 3 أيام",
      "L hwiya katsjjel — 3 iyam",
      "Identity being registered — 3 days old",
    ),
  },
];

const hash = (value: string) => {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).toUpperCase().padStart(8, "0");
};

export const DOCUMENTS: VaultDocument[] = [
  {
    id: "doc-cnie-yasmine",
    type: "CNIE",
    holderId: "cit-yasmine",
    title: L("CNIE de Yasmine", "البطاقة الوطنية لياسمين", "CNIE dyal Yasmine", "Yasmine's CNIE"),
    subtitle: L("Carte nationale électronique", "البطاقة الوطنية الإلكترونية", "Carte nationale électronique", "National electronic ID"),
    status: "VERIFIED",
    issuedAt: "2021-06-21",
    expiresAt: "2031-06-20",
    authority: "DGSN",
    reference: "BK 482 913",
    credentialHash: hash("cnie-yasmine-2031"),
    icon: "fingerprint",
  },
  {
    id: "doc-cnie-mehdi",
    type: "CNIE",
    holderId: "cit-mehdi",
    title: L("CNIE de Mehdi", "البطاقة الوطنية لمهدي", "CNIE dyal Mehdi", "Mehdi's CNIE"),
    subtitle: L("Carte nationale électronique", "البطاقة الوطنية الإلكترونية", "Carte nationale électronique", "National electronic ID"),
    status: "VERIFIED",
    issuedAt: "2019-12-04",
    expiresAt: "2029-12-03",
    authority: "DGSN",
    reference: "BE 771 204",
    credentialHash: hash("cnie-mehdi-2029"),
    icon: "fingerprint",
  },
  {
    id: "doc-livret",
    type: "LIVRET",
    holderId: "cit-yasmine",
    title: L("Livret de famille", "دفتر الحالة المدنية", "Livret de famille", "Family record book"),
    subtitle: L("Yasmine et Mehdi — entrée d'Adam en attente", "ياسمين ومهدي — تسجيل آدم قيد الانتظار", "Yasmine & Mehdi — Adam ba9i", "Yasmine & Mehdi — Adam's entry pending"),
    status: "VERIFIED",
    issuedAt: "2021-06-12",
    authority: "Commune de Casablanca",
    reference: "LF-2021-8842",
    credentialHash: hash("livret-2021"),
    icon: "file-check",
  },
  {
    id: "doc-cnss",
    type: "CNSS",
    holderId: "cit-yasmine",
    title: L("Relevé de cotisations CNSS", "كشف اشتراكات الضمان الاجتماعي", "Relevé CNSS", "CNSS contribution statement"),
    subtitle: L("48 mois de cotisations", "48 شهراً من الاشتراكات", "48 chher dyal cotisation", "48 months of contributions"),
    status: "VERIFIED",
    issuedAt: "2026-10-01",
    expiresAt: "2027-01-01",
    authority: "CNSS",
    reference: "CNSS-774 201 93",
    credentialHash: hash("cnss-2026-10"),
    icon: "shield",
  },
  {
    id: "doc-maternity",
    type: "MATERNITY",
    holderId: "cit-yasmine",
    title: L("Attestation de congé de maternité", "شهادة إجازة الأمومة", "Attestation dyal congé maternité", "Maternity leave attestation"),
    subtitle: L("14 semaines — début le 26 octobre", "14 أسبوعاً — بدأت في 26 أكتوبر", "14 simana — bdat 26 oktobar", "14 weeks — started 26 October"),
    status: "VERIFIED",
    issuedAt: "2026-10-26",
    expiresAt: "2027-02-01",
    authority: "Studio Noun",
    reference: "MAT-2026-031",
    credentialHash: hash("maternity-2026"),
    icon: "heart",
  },
  {
    id: "doc-address",
    type: "ADDRESS_PROOF",
    holderId: "cit-yasmine",
    title: L("Justificatif de domicile", "إثبات السكن", "Justificatif dyal l adresse", "Proof of address"),
    subtitle: L("Lydec — octobre 2026", "ليديك — أكتوبر 2026", "Lydec — oktobar 2026", "Lydec — October 2026"),
    status: "VERIFIED",
    issuedAt: "2026-10-05",
    expiresAt: "2027-01-05",
    authority: "Lydec",
    reference: "LYD-2026-11804",
    credentialHash: hash("address-2026-10"),
    icon: "home",
  },
];

export const LIFE_EVENT_STATE: LifeEventState[] = LIFE_EVENTS.map((event) => ({
  id: event.id,
  title: event.title,
  tagline: event.tagline,
  icon: event.icon,
  status: event.id === "new_baby" ? "ACTIVE" : event.id === "moving" ? "PLANNING" : "FUTURE",
  triggeredAt: event.id === "new_baby" ? "2026-11-07" : undefined,
  nextDeadline: event.id === "new_baby" ? "2026-12-07" : undefined,
  serviceIds: event.serviceIds,
  tone: event.tone,
}));

export const SEED_BENEFITS: Benefit[] = BENEFITS.map((benefit) => ({
  ...benefit,
  status:
    benefit.status === "NOT_ELIGIBLE"
      ? "NOT_ELIGIBLE"
      : ["mat_indemnity", "family_allowance", "amo_baby", "free_vaccination"].includes(benefit.id)
        ? "ELIGIBLE"
        : "UPCOMING",
}));

export const SEED_METRICS: Metrics = {
  documents: DOCUMENTS.length,
  verifiedDocuments: DOCUMENTS.filter((doc) => doc.status === "VERIFIED").length,
  casesOpen: 0,
  casesCompleted: 0,
  actionsAutomated: 0,
  benefitsFound: 23200,
  benefitsUnlocked: 0,
  monthlyUnlocked: 0,
  costPaid: 0,
  timeSavedHours: 14,
};

export const SEED_AUDIT: AuditEntry[] = [
  {
    id: "aud-1",
    at: "2026-11-10T08:42:00+01:00",
    actor: "system",
    action: "identity.verified",
    code: "ID-VERIFY",
    detail: L(
      "Mon Identité Numérique a vérifié 2 titres.",
      "تم التحقق من وثيقتين عبر الهوية الرقمية.",
      "Mon Identité Numérique verifit 2 credentials.",
      "Mon Identité Numérique verified 2 credentials.",
    ),
  },
  {
    id: "aud-2",
    at: "2026-11-10T08:43:00+01:00",
    actor: "agent",
    action: "life_event.detected",
    code: "LIFE-NB",
    detail: L(
      "Nouvel enfant détecté à partir du signal d'état civil.",
      "تم اكتشاف طفل جديد من إشارة الحالة المدنية.",
      "Wlid jdid tdetecta mn signal dyal l 7ala lmadaniya.",
      "New child detected from the civil-status signal.",
    ),
  },
  {
    id: "aud-3",
    at: "2026-11-10T08:43:10+01:00",
    actor: "policy",
    action: "benefits.scanned",
    code: "BEN-4",
    detail: L(
      "4 droits éligibles, 2 correctement exclus pour éviter les doubles demandes.",
      "4 تعويضات مؤهلة، و2 مستبعدة بشكل صحيح لتجنب الازدواجية.",
      "4 benefits eligible, 2 exclus bach ma ykounch double claim.",
      "4 benefits eligible, 2 correctly excluded to avoid double-claiming.",
    ),
  },
];

export function createSeedSnapshot(
  sessionId: string,
  plans: Plan[] = [],
  cases: CaseFile[] = [],
  receipts: Receipt[] = [],
  consents: ConsentRecord[] = [],
  audit: AuditEntry[] = SEED_AUDIT,
  metrics: Metrics = SEED_METRICS,
  documents: VaultDocument[] = DOCUMENTS,
  benefits: Benefit[] = SEED_BENEFITS,
): Snapshot {
  return {
    sessionId,
    demoNow: DEMO_NOW,
    citizen: CITIZEN,
    household: HOUSEHOLD,
    documents,
    lifeEvents: LIFE_EVENT_STATE,
    benefits,
    plans,
    cases,
    receipts,
    consents,
    audit,
    metrics: {
      ...metrics,
      documents: documents.length,
      verifiedDocuments: documents.filter((doc) => doc.status === "VERIFIED").length,
    },
    messages: [],
  };
}
