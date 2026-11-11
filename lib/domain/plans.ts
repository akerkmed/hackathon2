import { L, fill } from "@/lib/i18n";
import { formatMoney } from "@/lib/format";
import {
  benefitsForEvent,
  lifeEventById,
  serviceById,
  servicesForEvent,
} from "@/lib/domain/catalog";
import { sourceById } from "@/lib/domain/sources";
import { addAudit, type Session } from "@/lib/domain/store";
import type {
  ConsentScope,
  Lang,
  LifeEventId,
  Localized,
  Plan,
  PlanAction,
  ServiceDef,
  Source,
  TraceStep,
} from "@/lib/domain/types";

const DURATIONS: Partial<Record<LifeEventId, Localized>> = {
  new_baby: L("~30 jours de bout en bout", "حوالي 30 يوماً إجمالاً", "~30 youm b l kamel", "~30 days end-to-end"),
  moving: L("~2 semaines de bout en bout", "حوالي أسبوعين إجمالاً", "~2 simanat b l kamel", "~2 weeks end-to-end"),
  job_loss: L("~6 semaines de bout en bout", "حوالي 6 أسابيع إجمالاً", "~6 simanat b l kamel", "~6 weeks end-to-end"),
  retirement: L("~60 jours de bout en bout", "حوالي 60 يوماً إجمالاً", "~60 youm b l kamel", "~60 days end-to-end"),
  business: L("~2 semaines jusqu'à la facture", "حوالي أسبوعين للفوترة", "~2 simanat bach tfacturi", "~2 weeks to invoice"),
  studies: L("~6 semaines jusqu'au visa", "حوالي 6 أسابيع للتأشيرة", "~6 simanat l visa", "~6 weeks to visa"),
};

const summaryLocalized = (
  count: number,
  totalCost: number,
  oneOff: number,
  monthly: number,
): Localized => {
  const cost = {
    fr: formatMoney(totalCost, "fr"),
    ar: formatMoney(totalCost, "ar"),
    darija: formatMoney(totalCost, "darija"),
    en: formatMoney(totalCost, "en"),
  };
  const unlocked = {
    fr: formatMoney(oneOff, "fr"),
    ar: formatMoney(oneOff, "ar"),
    darija: formatMoney(oneOff, "darija"),
    en: formatMoney(oneOff, "en"),
  };
  const monthlyText = monthly
    ? {
        fr: ` + ${formatMoney(monthly, "fr")}/mois`,
        ar: ` + ${formatMoney(monthly, "ar")}/شهر`,
        darija: ` + ${formatMoney(monthly, "darija")}/chher`,
        en: ` + ${formatMoney(monthly, "en")}/mo`,
      }
    : { fr: "", ar: "", darija: "", en: "" };
  return {
    fr: `${count} services · ${cost.fr} de frais · ${unlocked.fr} débloqués${monthlyText.fr}`,
    ar: `${count} خدمات · ${cost.ar} رسوم · ${unlocked.ar} مسترجعة${monthlyText.ar}`,
    darija: `${count} services · ${cost.darija} frais · ${unlocked.darija} mftouhin${monthlyText.darija}`,
    en: `${count} services · ${cost.en} in fees · ${unlocked.en} unlocked${monthlyText.en}`,
  };
};

const toAction = (service: ServiceDef): PlanAction => ({
  id: service.id,
  serviceId: service.id,
  title: service.title,
  short: service.short,
  description: service.description,
  authority: service.authority,
  authorityLabel: service.authorityLabel,
  category: service.category,
  icon: service.icon,
  status: "PENDING",
  dependsOn: service.dependsOn,
  fee: service.fee,
  benefitOneOff: service.benefitOneOff ?? 0,
  benefitMonthly: service.benefitMonthly ?? 0,
  scope: service.scope,
  sourceIds: service.sourceIds,
  ruleIds: service.ruleIds,
  outputs: service.outputs,
  reason: service.reason,
  duration: service.duration,
  deadline: service.deadline,
});

export function buildPlan(session: Session, eventId: LifeEventId): Plan {
  const event = lifeEventById(eventId);
  if (!event) throw new Error(`Unknown life event: ${eventId}`);
  const services = servicesForEvent(eventId);
  if (services.length === 0) throw new Error(`No services for ${eventId}`);

  session.planSeq += 1;
  const actions = services.map(toAction);
  const totalCost = actions.reduce((sum, action) => sum + action.fee, 0);
  const benefitOneOff = actions.reduce((sum, action) => sum + action.benefitOneOff, 0);
  const benefitMonthly = actions.reduce((sum, action) => sum + action.benefitMonthly, 0);
  const sourceIds = Array.from(new Set(actions.flatMap((action) => action.sourceIds)));
  const sources = sourceIds
    .map((id) => sourceById(id))
    .filter((source): source is Source => Boolean(source));
  const ruleIds = Array.from(new Set(actions.flatMap((action) => action.ruleIds)));
  const excluded = benefitsForEvent(eventId).filter((b) => b.status === "NOT_ELIGIBLE").length;

  const trace: TraceStep[] = [
    {
      id: "tr-intent",
      code: "intent.detected",
      params: { event: eventId, confidence: 0.98 },
      tone: "pass",
    },
    {
      id: "tr-context",
      code: "context.verified",
      params: { docs: session.metrics.verifiedDocuments, people: session.household.length },
      tone: "pass",
    },
    {
      id: "tr-rules",
      code: "rules.matched",
      params: { count: ruleIds.length },
      tone: "pass",
    },
    {
      id: "tr-benefits",
      code: "benefits.found",
      params: {
        oneOff: benefitOneOff,
        monthly: benefitMonthly,
        excluded,
      },
      tone: "info",
    },
    {
      id: "tr-plan",
      code: "plan.built",
      params: { actions: actions.length, cost: totalCost },
      tone: "pass",
    },
    {
      id: "tr-consent",
      code: "guardrail.consent",
      tone: "warn",
    },
    {
      id: "tr-model",
      code: "guardrail.model",
      tone: "pass",
    },
  ];

  const plan: Plan = {
    id: `PLAN-${eventId.toUpperCase().replace(/_/g, "")}-${String(session.planSeq).padStart(3, "0")}`,
    lifeEventId: eventId,
    title: event.title,
    summary: summaryLocalized(actions.length, totalCost, benefitOneOff, benefitMonthly),
    actions,
    status: "AWAITING_CONFIRMATION",
    totalCost,
    benefitOneOff,
    benefitMonthly,
    duration: DURATIONS[eventId] ?? L("Quelques semaines", "بضعة أسابيع", "Chi simanat", "A few weeks"),
    sources,
    trace,
    createdAt: session.createdAt,
  };

  session.plans.unshift(plan);
  session.activePlanId = plan.id;
  addAudit(session, {
    actor: "agent",
    action: "plan.created",
    code: "PLAN-CREATE",
    detail: L(
      `Plan ${plan.id} construit avec ${actions.length} services et ${ruleIds.length} règles de politique.`,
      `تم بناء الخطة ${plan.id} بـ${actions.length} خدمات و${ruleIds.length} قواعد سياسات.`,
      `Plan ${plan.id} tbenna b ${actions.length} services w ${ruleIds.length} règles.`,
      `Plan ${plan.id} built with ${actions.length} services and ${ruleIds.length} policy rules.`,
    ),
  });

  return plan;
}

export function requiredScopes(plan: Plan): ConsentScope[] {
  return Array.from(new Set(plan.actions.flatMap((action) => action.scope)));
}

export function validatePlan(
  session: Session,
  planId: string,
  grantedScopes: ConsentScope[],
): { ok: true; plan: Plan } | { ok: false; error: string } {
  const plan = session.plans.find((item) => item.id === planId);
  if (!plan) return { ok: false, error: "PLAN_NOT_FOUND" };
  if (plan.status === "COMPLETED") return { ok: true, plan };
  if (plan.status === "CANCELLED") return { ok: false, error: "PLAN_CANCELLED" };
  if (plan.status === "EXECUTING") return { ok: false, error: "PLAN_ALREADY_EXECUTING" };
  if (plan.status !== "AWAITING_CONFIRMATION") return { ok: false, error: "PLAN_NOT_CONFIRMABLE" };

  const needed = requiredScopes(plan);
  const missing = needed.filter((scope) => !grantedScopes.includes(scope));
  if (missing.length > 0) return { ok: false, error: "CONSENT_REQUIRED" };

  // Recompute the plan from the catalog; the client never gets to set amounts.
  let recomputedCost = 0;
  let recomputedOneOff = 0;
  let recomputedMonthly = 0;
  for (const action of plan.actions) {
    const service = serviceById(action.serviceId);
    if (!service) return { ok: false, error: "UNKNOWN_SERVICE" };
    if (service.lifeEventId !== plan.lifeEventId) return { ok: false, error: "SERVICE_MISMATCH" };
    recomputedCost += service.fee;
    recomputedOneOff += service.benefitOneOff ?? 0;
    recomputedMonthly += service.benefitMonthly ?? 0;
  }
  if (
    plan.totalCost !== recomputedCost ||
    plan.benefitOneOff !== recomputedOneOff ||
    plan.benefitMonthly !== recomputedMonthly
  ) {
    return { ok: false, error: "AMOUNT_TAMPERING_BLOCKED" };
  }

  return { ok: true, plan };
}

export function cancelPlan(session: Session, planId: string): Plan | undefined {
  const plan = session.plans.find((item) => item.id === planId);
  if (!plan || plan.status !== "AWAITING_CONFIRMATION") return undefined;
  plan.status = "CANCELLED";
  if (session.activePlanId === plan.id) session.activePlanId = undefined;
  addAudit(session, {
    actor: "citizen",
    action: "plan.cancelled",
    code: "PLAN-CANCEL",
    detail: L(
      `Plan ${plan.id} annulé avant exécution. Aucune mutation effectuée.`,
      `أُلغيت الخطة ${plan.id} قبل التنفيذ. لم يحدث أي تغيير.`,
      `Plan ${plan.id} tlghat 9bel l execution. Ma w9e3ch ay taghyir.`,
      `Plan ${plan.id} cancelled before execution. No mutation occurred.`,
    ),
  });
  return plan;
}

export function localizedSummary(plan: Plan, lang: Lang): string {
  return fill(plan.summary[lang] || plan.summary.fr, {});
}
