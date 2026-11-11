import { createHash } from "node:crypto";
import { fill, L } from "@/lib/i18n";
import { formatMoney } from "@/lib/format";
import { serviceById } from "@/lib/domain/catalog";
import { requiredScopes, validatePlan } from "@/lib/domain/plans";
import { addAudit, nextRef, registerReceipt, type Session } from "@/lib/domain/store";
import { DEMO_NOW } from "@/lib/domain/seed";
import type {
  ActionEvent,
  ActionResult,
  CaseFile,
  CaseTimelineEvent,
  ConsentRecord,
  ConsentScope,
  Lang,
  Localized,
  Plan,
  Receipt,
  VaultDocument,
} from "@/lib/domain/types";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

type FillValue = string | number | Localized;

const varsFor = (vars: Record<string, FillValue>, lang: Lang): Record<string, string | number> =>
  Object.fromEntries(
    Object.entries(vars).map(([key, value]) => [
      key,
      typeof value === "object" ? value[lang] || value.fr : value,
    ]),
  );

const fillLocalized = (
  value: Localized,
  vars: Record<string, FillValue>,
): Localized => ({
  fr: fill(value.fr, varsFor(vars, "fr")),
  ar: fill(value.ar, varsFor(vars, "ar")),
  darija: fill(value.darija, varsFor(vars, "darija")),
  en: fill(value.en, varsFor(vars, "en")),
});

const addDays = (iso: string, days: number): string => {
  const date = new Date(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
};

const docIcon = (type: VaultDocument["type"]): VaultDocument["icon"] => {
  switch (type) {
    case "CNIE":
      return "fingerprint";
    case "LIVRET":
    case "BIRTH_CERTIFICATE":
      return "file";
    case "CNSS":
      return "shield";
    case "MATERNITY":
      return "heart";
    case "VACCINATION":
      return "stethoscope";
    case "ADDRESS_PROOF":
      return "home";
    default:
      return "file";
  }
};

const docStatus = (serviceId: string): VaultDocument["status"] => {
  if (serviceId === "birth_certificate") return "ORDERED";
  if (serviceId === "vaccination") return "PENDING";
  return "VERIFIED";
};

function createCase(session: Session, plan: Plan): CaseFile {
  const reference = nextRef(session, "CASE");
  const timeline: CaseTimelineEvent[] = [
    {
      id: `tl-${reference}-1`,
      at: DEMO_NOW,
      label: plan.title,
      detail: plan.summary,
      done: true,
      kind: "detected",
    },
    {
      id: `tl-${reference}-2`,
      at: DEMO_NOW,
      label: {
        fr: "Plan préparé et vérifié",
        ar: "تم إعداد الخطة والتحقق منها",
        darija: "Plan twjjed w tverifa",
        en: "Plan prepared and checked",
      },
      detail: {
        fr: "Montants recalculés par le moteur de règles ; 0 chiffre produit par le modèle.",
        ar: "أُعيد حساب المبالغ بواسطة محرك السياسات؛ 0 أرقام من النموذج.",
        darija: "Les montants t7esbo f l policy engine; 0 chiffres mn l model.",
        en: "Amounts recomputed by the policy engine; 0 model-authored figures.",
      },
      done: true,
      kind: "plan",
    },
    {
      id: `tl-${reference}-3`,
      at: DEMO_NOW,
      label: {
        fr: "Consentement du citoyen enregistré",
        ar: "تم تسجيل موافقة المواطن",
        darija: "L consent dyal l citoyen msejjel",
        en: "Citizen consent recorded",
      },
      done: true,
      kind: "consent",
    },
  ];
  const caseFile: CaseFile = {
    id: reference,
    reference,
    planId: plan.id,
    lifeEventId: plan.lifeEventId,
    title: plan.title,
    status: "EXECUTING",
    openedAt: DEMO_NOW,
    actions: plan.actions,
    documentIds: [],
    timeline,
  };
  session.cases.unshift(caseFile);
  return caseFile;
}

function hashReceipt(payload: unknown): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex").toUpperCase();
}

function createReceipt(session: Session, plan: Plan, caseFile: CaseFile): Receipt {
  const items = plan.actions
    .filter((action) => action.fee > 0)
    .map((action) => ({ label: action.title, amount: action.fee }));
  const issuedAt = DEMO_NOW;
  const draft = {
    caseId: caseFile.id,
    planId: plan.id,
    issuedAt,
    citizenName: `${session.citizen.firstName} ${session.citizen.lastName}`,
    items,
    total: plan.totalCost,
    benefitOneOff: plan.benefitOneOff,
    benefitMonthly: plan.benefitMonthly,
  };
  const hash = hashReceipt(draft).slice(0, 24);
  const code = `M3AK-${hash.slice(0, 4)}-${hash.slice(4, 8)}`;
  const receipt: Receipt = {
    id: `RCP-${hash.slice(0, 8)}`,
    code,
    caseId: caseFile.id,
    planId: plan.id,
    issuedAt,
    citizenName: `${session.citizen.firstName} ${session.citizen.lastName}`,
    items,
    total: plan.totalCost,
    benefitOneOff: plan.benefitOneOff,
    benefitMonthly: plan.benefitMonthly,
    hash,
    status: "VALID",
  };
  session.receipts.unshift(receipt);
  registerReceipt(receipt, `${session.citizen.firstName} ${session.citizen.lastName}`);
  return receipt;
}

function applyResult(
  session: Session,
  plan: Plan,
  caseFile: CaseFile,
  action: Plan["actions"][number],
): ActionResult {
  const service = serviceById(action.serviceId);
  if (!service) throw new Error(`Unknown service: ${action.serviceId}`);
  const reference = nextRef(session, service.result.referencePrefix);
  const amount = action.benefitOneOff || action.benefitMonthly || action.fee || 0;
  const amountLabel: Localized = {
    fr: formatMoney(amount, "fr"),
    ar: formatMoney(amount, "ar"),
    darija: formatMoney(amount, "darija"),
    en: formatMoney(amount, "en"),
  };
  const detail = fillLocalized(service.result.detail, { ref: reference, amount: amountLabel });
  const result: ActionResult = {
    reference,
    detail,
    at: DEMO_NOW,
    appointment: service.appointment,
    amount: amount || undefined,
  };

  if (service.result.documentType && service.result.documentTitle && service.result.documentSubtitle) {
    const documentId = `doc-${action.serviceId}-${session.refSeq}`;
    const holderId =
      service.lifeEventId === "new_baby" &&
      ["birth_certificate", "cnss_dependent", "vaccination"].includes(service.id)
        ? "cit-adam"
        : service.id === "cnss_maternity"
          ? "cit-yasmine"
          : "cit-yasmine";
    const document: VaultDocument = {
      id: documentId,
      type: service.result.documentType,
      holderId,
      title: service.result.documentTitle,
      subtitle: service.result.documentSubtitle,
      status: docStatus(service.id),
      issuedAt: DEMO_NOW.slice(0, 10),
      expiresAt: service.result.documentType === "VACCINATION" ? undefined : "2027-11-10",
      authority: service.authority,
      reference,
      credentialHash: hashReceipt({ reference, service: service.id, holderId }).slice(0, 8),
      icon: docIcon(service.result.documentType),
    };
    if (!session.documents.some((doc) => doc.id === documentId)) {
      session.documents.unshift(document);
    }
    if (!caseFile.documentIds.includes(documentId)) caseFile.documentIds.push(documentId);
    result.documentId = documentId;
  }

  action.result = result;

  for (const benefit of session.benefits) {
    if (benefit.serviceId === service.id && benefit.status === "ELIGIBLE") {
      benefit.status = "APPLIED";
    }
  }

  caseFile.timeline.push({
    id: `tl-${caseFile.id}-${action.serviceId}`,
    at: DEMO_NOW,
    label: action.title,
    detail,
    done: true,
    kind: "action",
  });

  if (service.appointment) {
    caseFile.timeline.push({
      id: `tl-${caseFile.id}-${action.serviceId}-appt`,
      at: DEMO_NOW,
      label: service.appointment.label,
      detail: service.appointment.place,
      done: true,
      kind: "action",
    });
  }

  addAudit(session, {
    actor: "executor",
    action: "service.executed",
    code: service.id,
    detail: L(
      `Service ${service.id} exécuté par le moteur déterministe. Référence ${reference}.`,
      `تم تنفيذ الخدمة ${service.id} عبر المنفذ الحتمي. المرجع ${reference}.`,
      `Service ${service.id} texecuta via l executor déterministe. Référence ${reference}.`,
      `Service ${service.id} executed through the deterministic executor. Reference ${reference}.`,
    ),
  });

  return result;
}

export interface ExecutionResult {
  plan: Plan;
  caseFile: CaseFile;
  receipt: Receipt;
}

export async function executePlan(
  session: Session,
  planId: string,
  grantedScopes: ConsentScope[],
  speed: number,
  emit: (event: ActionEvent) => void,
  uiLang: Lang = "fr",
): Promise<ExecutionResult> {
  const validation = validatePlan(session, planId, grantedScopes);
  if (!validation.ok) {
    throw new Error(validation.error);
  }
  const plan = validation.plan;

  if (plan.status === "COMPLETED") {
    const caseFile = session.cases.find((item) => item.id === plan.caseId);
    const receipt = session.receipts.find((item) => item.id === plan.receiptId);
    if (!caseFile || !receipt) throw new Error("COMPLETED_PLAN_MISSING_EVIDENCE");
    emit({
      id: `ev-${Date.now()}-done`,
      at: DEMO_NOW,
      type: "plan_completed",
      label: plan.title,
      status: "DONE",
      progress: 100,
      plan,
    });
    return { plan, caseFile, receipt };
  }

  plan.status = "EXECUTING";
  const caseFile = createCase(session, plan);
  plan.caseId = caseFile.id;

  const consent: ConsentRecord = {
    id: `consent-${session.consents.length + 1}`,
    reference: nextRef(session, "CONSENT"),
    recipient: L(
      `${plan.actions.length} services publics via M3ak`,
      `${plan.actions.length} خدمات عمومية عبر M3ak`,
      `${plan.actions.length} services publics via M3ak`,
      `${plan.actions.length} public services via M3ak`,
    ),
    scopes: requiredScopes(plan),
    grantedAt: DEMO_NOW,
    expiresAt: addDays(DEMO_NOW, 30),
    status: "ACTIVE",
    planId: plan.id,
    purpose: L(
      `Exécuter le plan d'événement de vie « ${plan.title.fr} » après confirmation explicite.`,
      `تنفيذ خطة الحدث "${plan.title.ar}" بعد تأكيد صريح.`,
      `Exécuter l plan dyal "${plan.title.darija}" mn ba3d confirmation sari7a.`,
      `Execute the life-event plan "${plan.title.en}" after explicit confirmation.`,
    ),
  };
  session.consents.unshift(consent);

  addAudit(session, {
    actor: "citizen",
    action: "consent.granted",
    code: "CONSENT-GRANT",
    detail: L(
      `Consentement ${consent.reference} accordé pour ${consent.scopes.length} périmètres.`,
      `تم منح الموافقة ${consent.reference} لـ${consent.scopes.length} نطاقات.`,
      `Consent ${consent.reference} mna7 l ${consent.scopes.length} scopes.`,
      `Consent ${consent.reference} granted for ${consent.scopes.length} scopes.`,
    ),
  });

  const total = plan.actions.length;
  const completed = () => plan.actions.filter((action) => action.status === "DONE").length;
  const emitEvent = (
    type: ActionEvent["type"],
    status: ActionEvent["status"],
    label: Localized,
    actionId?: string,
    serviceId?: string,
    detail?: Localized,
  ) => {
    emit({
      id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      at: DEMO_NOW,
      type,
      actionId,
      serviceId,
      label,
      detail,
      status,
      progress: Math.round((completed() / total) * 100),
      plan,
    });
  };

  emitEvent("plan_started", "RUNNING", plan.title);
  if (speed > 0) await wait(Math.min(420, speed));

  try {
    const pending = new Set(plan.actions.map((action) => action.id));
    while (pending.size > 0) {
      const ready = plan.actions.filter(
        (action) =>
          pending.has(action.id) &&
          action.dependsOn.every((dep) => {
            const parent = plan.actions.find((item) => item.id === dep);
            return !parent || parent.status === "DONE";
          }),
      );
      if (ready.length === 0) {
        for (const action of plan.actions.filter((item) => pending.has(item.id))) {
          action.status = "FAILED";
          pending.delete(action.id);
          emitEvent("plan_failed", "FAILED", action.title, action.id, action.serviceId);
        }
        break;
      }

      for (const action of ready) {
        action.status = "RUNNING";
        emitEvent("action_started", "RUNNING", action.title, action.id, action.serviceId);
      }
      if (speed > 0) await wait(speed);

      for (const action of ready) {
        applyResult(session, plan, caseFile, action);
        action.status = "DONE";
        pending.delete(action.id);
        emitEvent(
          "action_done",
          "DONE",
          action.title,
          action.id,
          action.serviceId,
          action.result?.detail,
        );
      }
      if (speed > 0) await wait(Math.min(260, speed));
    }

    const allDone = plan.actions.every((action) => action.status === "DONE");
    plan.status = allDone ? "COMPLETED" : "PARTIAL";
    plan.executedAt = DEMO_NOW;
    plan.reference = caseFile.reference;
    caseFile.status = allDone ? "COMPLETED" : "PARTIAL";
    caseFile.completedAt = DEMO_NOW;
    session.activePlanId = undefined;

    const receipt = createReceipt(session, plan, caseFile);
    plan.receiptId = receipt.id;
    caseFile.receiptId = receipt.id;

    const doneText: Localized = {
      fr: `C'est fait. ${plan.actions.length} services exécutés · dossier ${caseFile.reference} · reçu signé ${receipt.code}. Tous les documents sont dans votre coffre.`,
      ar: `تم. ${plan.actions.length} خدمات منفّذة · الملف ${caseFile.reference} · وصل موقّع ${receipt.code}. كل الوثائق في خزانتك.`,
      darija: `Safi. ${plan.actions.length} services texecutaw · dossier ${caseFile.reference} · reçu signé ${receipt.code}. Kolchi f l coffre dyalek.`,
      en: `Done. ${plan.actions.length} services executed · case ${caseFile.reference} · signed receipt ${receipt.code}. All documents are in your vault.`,
    };
    session.messages.push({
      id: `msg-receipt-${receipt.hash.slice(0, 8)}`,
      role: "assistant",
      text: doneText[uiLang] || doneText.fr,
      lang: uiLang,
      at: DEMO_NOW,
      planId: plan.id,
      kind: "receipt",
      trace: [{ id: "tr-done", code: "plan.completed", tone: "pass" }],
    });

    caseFile.timeline.push({
      id: `tl-${caseFile.id}-done`,
      at: DEMO_NOW,
      label: L(
        "Dossier terminé",
        "اكتمل الملف",
        "Dossier kmmel",
        "Case completed",
      ),
      detail: L(
        `${plan.actions.length} services exécutés. Reçu signé ${receipt.code}.`,
        `تم تنفيذ ${plan.actions.length} خدمات. وصل موقّع ${receipt.code}.`,
        `${plan.actions.length} services texecutaw. Reçu signé ${receipt.code}.`,
        `${plan.actions.length} services executed. Signed receipt ${receipt.code}.`,
      ),
      done: true,
      kind: "done",
    });

    const applied = session.benefits.filter((benefit) => benefit.status === "APPLIED");
    session.metrics = {
      ...session.metrics,
      actionsAutomated: session.metrics.actionsAutomated + plan.actions.length,
      benefitsUnlocked:
        applied.reduce(
          (sum, benefit) =>
            sum +
            (benefit.cadence === "MONTHLY" ? benefit.amount * 12 : benefit.amount),
          0,
        ),
      monthlyUnlocked: applied
        .filter((benefit) => benefit.cadence === "MONTHLY")
        .reduce((sum, benefit) => sum + benefit.amount, 0),
      costPaid: session.metrics.costPaid + plan.totalCost,
      casesOpen: session.cases.filter((item) => item.status === "EXECUTING").length,
      casesCompleted: session.cases.filter((item) => item.status === "COMPLETED").length,
      timeSavedHours: session.metrics.timeSavedHours + plan.actions.length * 2,
    };

    const event = session.lifeEvents.find((item) => item.id === plan.lifeEventId);
    if (event) {
      event.status = "DONE";
      event.nextDeadline = undefined;
    }

    addAudit(session, {
      actor: "executor",
      action: "plan.completed",
      code: "PLAN-DONE",
      detail: L(
        `Plan ${plan.id} terminé. ${plan.actions.length} services exécutés, reçu ${receipt.code}.`,
        `اكتملت الخطة ${plan.id}. تم تنفيذ ${plan.actions.length} خدمات، الوصل ${receipt.code}.`,
        `Plan ${plan.id} kmmel. ${plan.actions.length} services texecutaw, reçu ${receipt.code}.`,
        `Plan ${plan.id} completed. ${plan.actions.length} services executed, receipt ${receipt.code}.`,
      ),
    });

    emitEvent("plan_completed", "DONE", plan.title);
    return { plan, caseFile, receipt };
  } catch (error) {
    plan.status = "PARTIAL";
    caseFile.status = "PARTIAL";
    session.activePlanId = undefined;
    addAudit(session, {
      actor: "executor",
      action: "plan.failed",
      code: "PLAN-FAILED",
      detail: L(
        `Échec du plan ${plan.id} : ${String(error)}`,
        `فشلت الخطة ${plan.id}: ${String(error)}`,
        `Plan ${plan.id} fchel: ${String(error)}`,
        `Plan ${plan.id} failed: ${String(error)}`,
      ),
    });
    emitEvent("plan_failed", "FAILED", plan.title);
    throw error;
  }
}

export { wait };
