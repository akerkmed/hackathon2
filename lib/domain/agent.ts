import { L, fill } from "@/lib/i18n";
import { daysUntil, formatDate, formatMoney } from "@/lib/format";
import { buildPlan, cancelPlan } from "@/lib/domain/plans";
import { addAudit, toSnapshot, type Session } from "@/lib/domain/store";
import { DEMO_NOW } from "@/lib/domain/seed";
import { lifeEventById } from "@/lib/domain/catalog";
import type {
  AgentReply,
  ChatMessage,
  Lang,
  LifeEventId,
  Localized,
  Plan,
  TraceStep,
} from "@/lib/domain/types";

type Intent =
  | "init"
  | "new_baby"
  | "moving"
  | "job_loss"
  | "retirement"
  | "business"
  | "studies"
  | "benefits"
  | "status"
  | "documents"
  | "human"
  | "confirm"
  | "cancel"
  | "why"
  | "help"
  | "thanks"
  | "adversarial"
  | "profile"
  | "unknown";

const SUG = {
  confirm: L("Confirmer le plan", "أكد الخطة", "Akked l plan", "Confirm the plan"),
  why: L("Pourquoi ces services ?", "لماذا هذه الخدمات؟", "3lach had l services?", "Why these services?"),
  money: L("Montrez-moi les montants", "أرني المبالغ", "Warni l flous", "Show me the money"),
  human: L("Parler à un humain", "التحدث مع موظف", "Hder m3a chi 7ed bachari", "Talk to a human"),
  benefits: L("Vérifier mes droits", "تحقق من تعويضاتي", "Checki les benefits dyaly", "Check my benefits"),
  status: L("Où en est mon dossier ?", "أين وصل ملفي؟", "Fin wsel dossier dyaly?", "Where is my case?"),
  documents: L("Ouvrir mon coffre", "افتح خزانة وثائقي", "Ftah l coffre dyaly", "Open my vault"),
  show: L("Montrez-moi ce que vous savez faire", "أرني ما يمكنك فعله", "Warni chno t9der dir", "Show me what you can do"),
  case: L("Ouvrir mon dossier", "افتح ملفي", "Ftah dossier dyaly", "Open my case"),
  continue: L("Continuer avec M3ak", "المتابعة مع M3ak", "Kemmel m3a M3ak", "Continue with M3ak"),
  next: L("Et ensuite ?", "ما التالي؟", "Chno l jay?", "What's next?"),
  baby: L("Un nouvel enfant", "طفل جديد", "Wlid jdid", "A new baby"),
  moving: L("Déménagement", "تغيير السكن", "Nqel l dar", "Moving home"),
  job: L("Perte d'emploi", "فقدان العمل", "Tle9t l khedma", "Losing a job"),
  retirement: L("Retraite", "التقاعد", "Retraite", "Retiring"),
  business: L("Créer une entreprise", "بدء مشروع", "Bda project", "Starting a business"),
  studies: L("Étudier à l'étranger", "الدراسة بالخارج", "L 9raya l barra", "Studying abroad"),
  sources: L("Afficher les sources", "أرني المصادر", "Warni les sources", "Show the sources"),
  receipt: L("Partager le reçu", "شارك الوصل", "Share l reçu", "Share the receipt"),
} as const;

const sug = (keys: (keyof typeof SUG)[], lang: Lang): string[] =>
  keys.map((key) => SUG[key][lang]);

const msgId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const AMT = (value: number): Localized => ({
  fr: formatMoney(value, "fr"),
  ar: formatMoney(value, "ar"),
  darija: formatMoney(value, "darija"),
  en: formatMoney(value, "en"),
});

const fillLocalized = (
  value: Localized,
  vars: Record<Lang, Record<string, string>>,
): Localized => ({
  fr: fill(value.fr, vars.fr),
  ar: fill(value.ar, vars.ar),
  darija: fill(value.darija, vars.darija),
  en: fill(value.en, vars.en),
});

const normalize = (text: string): string =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const hasAny = (text: string, words: string[]): number =>
  words.reduce((count, word) => (text.includes(word) ? count + 1 : count), 0);

const ARABIC_RE = /[\u0600-\u06FF]/;

const DARIJA_MARKERS = [
  "3ndi", "3la", "3lach", "3afak", "bghit", "bghiti", "khassni", "khsni", "wakha", "safi",
  "mabrouk", "mebrouk", "daba", "dyal", "dyali", "dyalek", "kayn", "kayna", "chno", "chnowa",
  "fin", "mzyan", "bla", "ghadi", "bach", "m3a", "m3ak", "hna", "tzad", "wlid", "chher",
  "flous", "khedma", "tle9t", "nqel", "9raya", "wjjed", "verifi", "sre7", "sejjel",
];

const FRENCH_MARKERS = [
  "je", "mon", "ma", "mes", "les", "des", "une", "un", "le", "la", "du", "de", "naissance",
  "passeport", "combien", "comment", "bonjour", "merci", "oui", "non", "dossier", "besoin",
  "aider", "renouveler", "demande", "allocations", "bebe", "enfant", "travail", "sante",
];

const ENGLISH_MARKERS = [
  "the", "my", "i", "need", "how", "what", "baby", "help", "please", "thanks", "yes", "no",
  "case", "status", "benefits", "money", "document", "moving", "job", "retirement", "study",
];

export function detectLang(text: string, fallback: Lang): Lang {
  if (ARABIC_RE.test(text)) return "ar";
  const normalized = normalize(text);
  const darija = hasAny(normalized, DARIJA_MARKERS);
  const french = hasAny(normalized, FRENCH_MARKERS);
  const english = hasAny(normalized, ENGLISH_MARKERS);
  if (darija > 0 && darija >= french) return "darija";
  if (english > french + 1) return "en";
  if (french > 0) return "fr";
  if (darija > 0) return "darija";
  return fallback;
}

const ADVERSARIAL = [
  "ignore", "system prompt", "bypass", "without consent", "sans confirmation", "sans accord",
  "transfer", "virement", "50000", "50 000", "hack", "prompt injection", "donne moi",
  "تجاهل", "تحويل", "حول", "بدون موافقة", "بدون تأكيد", "اخترق",
];

const EVENT_KEYWORDS: Record<LifeEventId, string[]> = {
  new_baby: [
    "baby", "bebe", "newborn", "naissance", "accouche", "accouchement", "mabrouk", "mebrouk",
    "ولد", "مولود", "ولادة", "بيبي", "رضيع", "طفل", "وليد", "مبروك", "wlid", "wilada", "tzad",
    "sghir", "enfant",
  ],
  moving: [
    "move", "moving", "demenage", "adresse", "relocation", "نقل", "سكن", "عنوان", "rabat",
    "nqel", "dar jdida", "emménage",
  ],
  job_loss: [
    "job", "unemployed", "unemployment", "chomage", "licencie", "lost my job", "باطل",
    "شوماج", "فقدت العمل", "khedma", "tle9t", "perte d emploi",
  ],
  retirement: ["retirement", "retired", "retraite", "pension", "تقاعد", "معاش", "retraite"],
  business: [
    "business", "entreprise", "societe", "auto entrepreneur", "startup", "مقاولة", "شركة",
    "مشروع", "project", "ompic", "registre de commerce",
  ],
  studies: [
    "study", "studies", "etudier", "bourse", "scholarship", "visa", "passeport", "passport",
    "دراسة", "منحة", "فيزا", "جواز", "9raya",
  ],
};

function detectIntent(text: string, hasPlan: boolean): Intent {
  const n = normalize(text);
  if (hasAny(n, ADVERSARIAL) > 0) return "adversarial";
  if (
    hasAny(n, ["human", "agent", "conseiller", "advisor", "بشري", "موظف", "3ayt", "call", "support"]) > 0
  )
    return "human";
  if (
    hasAny(n, ["cancel", "annule", "stop", "arrete", "لا", "الغاء", "الغاء", "وقff", "ma bghitch"]) > 0 ||
    /^(non|no|la|لا)$/.test(n)
  )
    return "cancel";
  if (
    hasPlan &&
    (hasAny(n, ["oui", "yes", "wakha", "d accord", "ok", "go", "confirme", "execute", "sir", "dir", "نعم", "أكد", "موافق", "يلا", "دير"]) > 0 ||
      /^(oui|yes|ok|go|wakha|نعم|يلا)$/.test(n))
  )
    return "confirm";
  if (hasAny(n, ["why", "pourquoi", "3lach", "علاش", "لماذا", "explain", "explique", "شرح"]) > 0)
    return "why";
  if (
    hasAny(n, ["benefit", "allocation", "aide", "argent", "money", "finance", "دعم", "تعويض", "منحة", "فلوس", "بحة"]) > 0
  )
    return "benefits";
  if (
    hasAny(n, ["status", "suivi", "where", "case", "dossier", "فين", "وصل", "حالة", "ملف", "track", "statut"]) > 0
  )
    return "status";
  if (
    hasAny(n, ["document", "cnie", "acte", "wallet", "vault", "وثيقة", "بطاقة", "دفتر", "coffre", "documents"]) > 0
  )
    return "documents";
  if (
    hasAny(n, ["profile", "donnees", "data", "المعلومات", "بياناتي", "my info", "mon profil"]) > 0
  )
    return "profile";
  const eventScores = (Object.keys(EVENT_KEYWORDS) as LifeEventId[])
    .map((event) => ({ event, score: hasAny(n, EVENT_KEYWORDS[event]) }))
    .sort((a, b) => b.score - a.score);
  if (eventScores[0] && eventScores[0].score > 0) return eventScores[0].event;
  if (
    hasAny(n, ["bonjour", "salam", "hello", "hi", "help", "aide", "chno", "what can you do", "مرحبا", "سلام", "مساعدة", "bonsoir"]) > 0
  )
    return "help";
  if (hasAny(n, ["merci", "thanks", "chokran", "شكرا", "safi", "thank you"]) > 0) return "thanks";
  return "unknown";
}

function pushMessage(session: Session, message: ChatMessage): void {
  session.messages.push(message);
  if (session.messages.length > 60) session.messages.splice(0, session.messages.length - 60);
}

function baseTrace(plan: Plan): TraceStep[] {
  return plan.trace;
}

function findAwaitingPlan(session: Session): Plan | undefined {
  return session.plans.find((plan) => plan.status === "AWAITING_CONFIRMATION");
}

function findPlan(session: Session, eventId: LifeEventId): Plan | undefined {
  return session.plans.find((plan) => plan.lifeEventId === eventId);
}

function attachedPlanFor(session: Session, eventId: LifeEventId): Plan | undefined {
  const existing = findPlan(session, eventId);
  if (existing && existing.status !== "CANCELLED") return existing;
  return buildPlan(session, eventId);
}

function planReply(plan: Plan, lang: Lang): Localized {
  const cost = AMT(plan.totalCost);
  const oneOff = AMT(plan.benefitOneOff);
  const monthly = AMT(plan.benefitMonthly);
  const event = lifeEventById(plan.lifeEventId);
  const title = event?.title ?? plan.title;
  if (plan.benefitOneOff > 0 || plan.benefitMonthly > 0) {
    return L(
      `J'ai préparé un plan pour « ${title.fr} » : ${plan.actions.length} services, ${cost.fr} de frais, ${oneOff.fr} débloqués${plan.benefitMonthly > 0 ? ` plus ${monthly.fr}/mois` : ""}. Le moteur de règles a calculé chaque montant. Vérifiez-le, puis confirmez une seule fois.`,
      `أعددت خطة واحدة لـ«${title.ar}»: ${plan.actions.length} خدمات، ${cost.ar} رسوم، ${oneOff.ar} مسترجعة${plan.benefitMonthly > 0 ? ` زائد ${monthly.ar} شهرياً` : ""}. محرك السياسات هو من حسب كل مبلغ. راجعها ثم أكد مرة واحدة.`,
      `Wjjedt lik plan wa7ed l «${title.darija}»: ${plan.actions.length} services, ${cost.darija} frais, ${oneOff.darija} mftouhin${plan.benefitMonthly > 0 ? ` + ${monthly.darija}/chher` : ""}. L policy engine howa li 7seb kol montant. Chouf l plan w akked mera wa7da.`,
      `I prepared one plan for “${title.en}”: ${plan.actions.length} services, ${cost.en} in fees, ${oneOff.en} unlocked${plan.benefitMonthly > 0 ? ` plus ${monthly.en}/month` : ""}. The policy engine calculated every amount. Review it, then confirm once.`,
    );
  }
  return L(
    `J'ai préparé un plan pour « ${title.fr} » : ${plan.actions.length} services, ${cost.fr} de frais. Chaque étape est ordonnée selon ses dépendances. Vérifiez-le, puis confirmez une seule fois.`,
    `أعددت خطة واحدة لـ«${title.ar}»: ${plan.actions.length} خدمات، ${cost.ar} رسوم. كل خطوة مرتبة حسب التبعيات. راجعها ثم أكد مرة واحدة.`,
    `Wjjedt lik plan wa7ed l «${title.darija}»: ${plan.actions.length} services, ${cost.darija} frais. Kol khatwa mrattba 7sab les dépendances. Chouf l plan w akked mera wa7da.`,
    `I prepared one plan for “${title.en}”: ${plan.actions.length} services, ${cost.en} in fees. Each step is sequenced by dependency. Review it, then confirm once.`,
  );
}

function initReply(session: Session, lang: Lang): { text: Localized; plan: Plan } {
  const existing = findPlan(session, "new_baby");
  const plan = existing && existing.status !== "CANCELLED" ? existing : buildPlan(session, "new_baby");
  if (plan.status === "COMPLETED") {
    return {
      plan,
      text: L(
        `C'est fait, Yasmine. Les six services d'Adam sont terminés : il est inscrit, son acte est commandé, sa vaccination est réservée, et 19 600 DH + 300 DH/mois sont ouverts. Votre dossier et votre reçu signé sont prêts.`,
        `تم كل شيء، ياسمين. خدمات آدم الست مكتملة: تم تسجيله، طُلب عقده، حُجز تلقيحه، و19,600 درهم + 300 درهم شهرياً مفتوحة. ملفك ووصلك الموقّع جاهزان.`,
        `Safi, Yasmine. 6 services dyal Adam kmmlo: msejjel, l acte mcommandé, vaccination m7jouza, w 19 600 DH + 300 DH/chher mftouhin. Dossier w reçu signé wajdin.`,
        `Done, Yasmine. Adam's six services are complete: he is registered, his certificate is ordered, his vaccination is booked, and 19,600 DH + 300 DH/month are open. Your case and signed receipt are ready.`,
      ),
    };
  }
  return {
    plan,
    text: L(
      `Salam Yasmine. Mabrouk pour Adam ! 🎉\n\nJ'ai vérifié votre dossier : 6 services restent, dont la déclaration de naissance avant le 7 décembre. J'ai trouvé 19 600 DH d'indemnité de maternité et 300 DH/mois d'allocations familiales.\n\nJ'ai préparé un plan. Les montants viennent du moteur de règles, pas du modèle. Vérifiez tout avant de confirmer.`,
      `مرحباً ياسمين. مبروك على آدم! 🎉\n\nراجعت ملفك: بقيت 6 خدمات، منها التصريح بالولادة قبل 7 دجنبر. وجدت 19,600 درهم تعويض الأمومة و300 درهم شهرياً تعويضات عائلية.\n\nأعددت لك خطة واحدة. المبالغ محسوبة من محرك القواعد، وليس من النموذج. راجع كل شيء قبل التأكيد.`,
      `Salam Yasmine. Mabrouk 3la Adam! 🎉\n\nVerifit l dossier dyalek: ba9i 6 services, menhom l tasri7 b l wilada 9bel 7 dujenbir. L9it 19 600 DH dyal indemnité maternité w 300 DH/chher allocations familiales.\n\nWjjedt lik plan wa7ed. Les montants m7soubin b l policy engine, machi b l AI. Chouf kolchi 9bel ma t'akked.`,
      `Hello Yasmine. Congratulations on Adam! 🎉\n\nI checked your file: 6 services remain, including the birth declaration due by 7 December. I found 19,600 DH in maternity indemnity and 300 DH/month in family allowances.\n\nI prepared one plan. The amounts come from the policy engine, not the model. Review everything before you confirm.`,
    ),
  };
}

export function handleInit(session: Session, uiLang: Lang): AgentReply {
  const { text, plan } = initReply(session, uiLang);
  const message: ChatMessage = {
    id: msgId("msg"),
    role: "assistant",
    text: text[uiLang] || text.fr,
    lang: uiLang,
    at: DEMO_NOW,
    planId: plan.id,
    kind: plan.status === "COMPLETED" ? "receipt" : "plan",
    trace: baseTrace(plan),
  };
  pushMessage(session, message);
  addAudit(session, {
    actor: "agent",
    action: "session.started",
    code: "SESSION-START",
    detail: L(
      "Message d'accueil proactif généré à partir du dossier vérifié du citoyen.",
      "تم إنشاء ترحيب استباقي من ملف المواطن المحقق.",
      "Greeting proactive tgenereja mn dossier li mverifa.",
      "Proactive greeting generated from the citizen's verified file.",
    ),
  });
  return {
    message,
    planId: plan.id,
    suggestions: plan.status === "COMPLETED" ? sug(["case", "receipt", "next"], uiLang) : sug(["confirm", "why", "money", "human"], uiLang),
    state: toSnapshot(session),
  };
}

export function handleMessage(session: Session, raw: string, uiLang: Lang): AgentReply {
  const text = raw.trim();
  const lang = detectLang(text, uiLang);
  const intent = detectIntent(text, Boolean(findAwaitingPlan(session)));

  const userMessage: ChatMessage = {
    id: msgId("usr"),
    role: "user",
    text,
    lang,
    at: DEMO_NOW,
  };
  pushMessage(session, userMessage);

  const reply = (options: {
    localized: Localized;
    planId?: string;
    executePlanId?: string;
    suggestions?: string[];
    trace?: TraceStep[];
    kind?: ChatMessage["kind"];
    sources?: string[];
  }): AgentReply => {
    const message: ChatMessage = {
      id: msgId("msg"),
      role: "assistant",
      text: options.localized[lang] || options.localized.fr,
      lang,
      at: DEMO_NOW,
      planId: options.planId,
      kind: options.kind ?? "text",
      trace: options.trace,
      sources: options.sources,
    };
    pushMessage(session, message);
    return {
      message,
      planId: options.planId,
      executePlanId: options.executePlanId,
      suggestions: options.suggestions ?? [],
      state: toSnapshot(session),
    };
  };

  const active = findAwaitingPlan(session);

  if (intent === "adversarial") {
    addAudit(session, {
      actor: "policy",
      action: "guardrail.blocked",
      code: "GUARDRAIL-BLOCK",
      detail: L(
        "La demande visait un paiement non vérifié ou un contournement du consentement. Bloquée avant toute sélection d'outil.",
        "طلب موجه دفعاً غير محقق أو تجاوز الموافقة. تم الحظر قبل اختيار أي أداة.",
        "Prompt tlob paiement ma mverifach wla bypass dyal consent. Tblokka 9bel ma ttkhtar ay tool.",
        "Prompt asked for an unverified payment or a consent bypass. Blocked before any tool was selected.",
      ),
    });
    const trace: TraceStep[] = [
      { id: "tr-block", code: "guardrail.blocked", tone: "block" },
      { id: "tr-model", code: "guardrail.model", tone: "pass" },
    ];
    return reply({
      localized: L(
        "Je ne peux pas faire cela. Je n'ai pas d'outil de paiement libre, je ne peux pas modifier des frais et je ne peux pas agir sans votre consentement explicite. La demande a été bloquée et inscrite au journal d'audit.\n\nCe que je peux faire : vérifier une procédure, calculer vos droits, préparer un plan et exécuter uniquement les services que vous confirmez.",
        "لا يمكنني فعل ذلك. ليس لدي أداة دفع حرة، ولا يمكنني تغيير رسوم، ولا التصرف دون موافقتك الصريحة. تم حظر الطلب وتسجيله في سجل التدقيق.\n\nما يمكنني فعله: التحقق من إجراء، حساب حقوقك، إعداد خطة، وتنفيذ الخدمات التي تؤكدها فقط.",
        "Ma n9derch ndir had chi. Ma 3ndich tool dyal paiement 7or, ma n9derch nbeddel chi frais, w ma n9derch ndir walou bla consent dyalek. L demande tblokat w tsjjlat f l audit log.\n\nLi n9der ndir: nverifi procédure, n7seb 7ou9ou9ek, nwjjed plan, w n'exécuti ghir les services li t'akked.",
        "I can't do that. I have no free-form payment tool, I cannot change a fee, and I cannot act without your explicit consent. The request was blocked and written to the audit log.\n\nWhat I can do: verify a procedure, calculate your entitlements, prepare a plan, and execute only the services you confirm.",
      ),
      kind: "blocked",
      trace,
      suggestions: sug(["show", "human"], lang),
    });
  }

  if (intent === "human") {
    const ticket =
      session.handoff ??
      (session.handoff = {
        id: `TICKET-${String(session.audit.length + 1).padStart(3, "0")}`,
        queue: 2,
        at: DEMO_NOW,
      });
    addAudit(session, {
      actor: "agent",
      action: "handoff.created",
      code: "HANDOFF",
      detail: L(
        `Transfert chaleureux vers un conseiller humain, ticket ${ticket.id}. Contexte complet joint.`,
        `تحويل دافئ إلى مستشار بشري، التذكرة ${ticket.id}. السياق الكامل مرفق.`,
        `Handoff dafi l conseiller bachari, ticket ${ticket.id}. L contexte kamel mrefeq.`,
        `Warm handoff to a human adviser, ticket ${ticket.id}. Full context attached.`,
      ),
    });
    return reply({
      localized: L(
        `Je vous transfère à un conseiller humain. Votre dossier, votre plan et vos sources vous accompagnent, pour que vous ne répétiez rien.\n\nTicket ${ticket.id} · position ${ticket.queue} · attente estimée 4 min.\n\nVous pouvez continuer à me parler pendant l'attente.`,
        `أحوّلك إلى مستشار بشري. ملفك وخطتك ومصادرك تنتقل معك، لذلك لن تكرر شيئاً.\n\nالتذكرة ${ticket.id} · الترتيب ${ticket.queue} · الانتظار المتوقع 4 دقائق.\n\nيمكنك متابعة الحديث معي أثناء الانتظار.`,
        `Ghadi n7wwlek l chi conseiller bachari. Dossier, plan w sources kaymchiw m3ak, donc ma ghadi t3awed walou.\n\nTicket ${ticket.id} · position ${ticket.queue} · attente estimée 4 min.\n\nT9der tkemmel theder m3aya mnta ntaya.`,
        `I'm handing you to a human adviser. Your file, plan and sources go with you, so you won't repeat anything.\n\nTicket ${ticket.id} · queue position ${ticket.queue} · estimated wait 4 min.\n\nYou can keep talking to me while you wait.`,
      ),
      kind: "handoff",
      trace: [{ id: "tr-handoff", code: "handoff.created", tone: "info" }],
      suggestions: sug(["continue", "case"], lang),
    });
  }

  if (intent === "cancel") {
    if (!active) {
      return reply({
        localized: L(
          "Aucun plan n'attend de confirmation. Rien n'a été exécuté. Dites-moi ce dont vous avez besoin et j'en préparerai un nouveau.",
          "لا توجد خطة في انتظار التأكيد. لم يُنفّذ أي شيء. أخبرني بما تحتاجه وسأعدّ خطة جديدة.",
          "Ma kaynch plan katsenna confirmation. Ma tdar walou. Goul liya chno bghiti w nwjjed lik plan jdid.",
          "There is no plan waiting for confirmation. Nothing was executed. Tell me what you need and I'll prepare a new one.",
        ),
        suggestions: sug(["show", "human"], lang),
      });
    }
    cancelPlan(session, active.id);
    return reply({
      localized: L(
        "Plan annulé. Aucune action n'a été exécutée et aucun frais n'a été facturé. Vous pouvez le relancer quand vous voulez.",
        "أُلغيت الخطة. لم يُنفّذ أي إجراء ولم تُحصّل أي رسوم. يمكنك إعادة تشغيلها متى أردت.",
        "Plan tlgha. Ma tdar ay action w ma tkhelles ay frais. T9der t3awed tch3lo mli bghiti.",
        "Plan cancelled. No action was executed and no fee was charged. You can relaunch it whenever you want.",
      ),
      trace: [{ id: "tr-cancel", code: "plan.cancelled", tone: "warn" }],
      suggestions: sug(["show", "human"], lang),
    });
  }

  if (intent === "confirm" && active) {
    return reply({
      localized: L(
        `Parfait. Je lance les ${active.actions.length} services dans l'ordre des dépendances. Vous pouvez suivre chaque étape en direct dans le panneau d'orchestration.\n\nVotre consentement a été enregistré. Aucune action ne s'exécute avant ce point.`,
        `ممتاز. أبدأ ${active.actions.length} خدمات حسب ترتيب التبعيات. يمكنك متابعة كل خطوة مباشرة في لوحة التنفيذ.\n\nتم تسجيل موافقتك. لا يُنفّذ أي إجراء قبل هذه اللحظة.`,
        `Mezyan. Ghadi nbda ${active.actions.length} services b l ordre dyal les dépendances. T9der ttab3 kol khatwa live f l orchestration.\n\nConsent dyalek tsjjel. Ma kayn ay action 9bel had l moment.`,
        `Perfect. I'm starting the ${active.actions.length} services in dependency order. You can follow every step live in the orchestration panel.\n\nYour consent has been recorded. No action runs before this point.`,
      ),
      planId: active.id,
      executePlanId: active.id,
      suggestions: [],
      trace: active.trace,
    });
  }

  if (intent === "why" && active) {
    return reply({
      localized: L(
        `Voici la logique, étape par étape :\n\n• La déclaration de naissance est obligatoire dans les 30 jours (décret 2.22.04, article 40).\n• L'acte de naissance est la clé du dossier CNSS : sans lui, pas d'AMO ni d'allocations familiales.\n• L'indemnité de maternité dépend de l'inscription de l'enfant et de 54 jours de cotisations.\n• La prime de 2 000 DH du Soutien social direct n'est pas cumulable avec les prestations familiales CNSS, donc je l'ai exclue au lieu de la doubler.\n\nChaque montant est recalculé côté serveur. Ouvrez « Trace » pour voir les règles et sources exactes.`,
        `إليك المنطق خطوة بخطوة:\n\n• التصريح بالولادة إلزامي خلال 30 يوماً (المرسوم 2.22.04، المادة 40).\n• عقد الازدياد هو مفتاح ملف الضمان الاجتماعي: بدونه لا تغطية صحية ولا تعويضات عائلية.\n• تعويض الأمومة يعتمد على تسجيل الطفل و54 يوماً من الاشتراكات.\n• منحة الدعم الاجتماعي المباشر (2,000 درهم) لا تُجمع مع تعويضات CNSS، لذلك استبعدتها بدلاً من الازدواجية.\n\nكل مبلغ يُعاد حسابه على الخادم. افتح «التتبع» لرؤية القواعد والمصادر.`,
        `Hada l logique khatwa b khatwa:\n\n• Tasri7 b l wilada obligatoire f 30 youm (Décret 2.22.04, article 40).\n• L acte dyal l wilada howa l mfta7 dyal dossier CNSS: bla bih ma kaynch AMO wla allocations.\n• Indemnité maternité kat3tamed 3la tasjil dyal l wlid w 54 youm cotisation.\n• Prime ASD dyal 2 000 DH ma katjme3ch m3a allocations CNSS, donc excluditha 3iwed double claim.\n\nKol montant kayt7seb f l server. Ftah «Trace» bach tchouf les règles w sources.`,
        `Here is the logic, step by step:\n\n• The birth declaration is mandatory within 30 days (Decree 2.22.04, article 40).\n• The birth certificate is the key that unlocks the CNSS file: without it, no AMO and no family allowance.\n• The maternity indemnity depends on the child's registration and 54 days of contributions.\n• The 2,000 DH Direct Social Support grant does not stack with CNSS family benefits, so I excluded it instead of double-claiming.\n\nEvery amount is recalculated server-side. Open “Trace” to see the exact rules and sources.`,
      ),
      planId: active.id,
      suggestions: sug(["money", "human"], lang),
      trace: active.trace,
    });
  }

  if (intent === "benefits") {
    const eligible = session.benefits.filter((benefit) => benefit.status === "ELIGIBLE");
    const applied = session.benefits.filter((benefit) => benefit.status === "APPLIED");
    const excluded = session.benefits.filter((benefit) => benefit.status === "NOT_ELIGIBLE");
    const oneOff = [...eligible, ...applied]
      .filter((benefit) => benefit.cadence === "ONE_OFF")
      .reduce((sum, benefit) => sum + benefit.amount, 0);
    const monthly = [...eligible, ...applied]
      .filter((benefit) => benefit.cadence === "MONTHLY")
      .reduce((sum, benefit) => sum + benefit.amount, 0);
    const total = oneOff + monthly * 12;
    const top = [...eligible, ...applied].slice(0, 3);
    const lines = top
      .map((benefit) => {
        const amount = AMT(benefit.amount);
        return `• ${benefit.title[lang]} — ${amount[lang]}${benefit.cadence === "MONTHLY" ? `/${lang === "ar" ? "شهر" : "mois"}` : ""}`;
      })
      .join("\n");
    return reply({
      localized: L(
        `J'ai analysé votre dossier. ${eligible.length + applied.length} droits sont ouverts ou éligibles${excluded.length ? `, et ${excluded.length} exclus pour éviter les doubles demandes` : ""}.\n\n${lines}\n\nValeur sur la première année : ${AMT(total).fr}. ${applied.length ? "Certains sont déjà appliqués." : active ? "Confirmez le plan pour les ouvrir." : "Demandez-moi de préparer le plan."}`,
        `راجعت ملفك. ${eligible.length + applied.length} تعويضات مفتوحة أو مؤهلة${excluded.length ? `، و${excluded.length} مستبعدة لتجنب الازدواجية` : ""}.\n\n${lines}\n\nالقيمة في السنة الأولى: ${AMT(total).ar}. ${applied.length ? "بعضها مطبق بالفعل." : active ? "أكد الخطة لفتحها." : "اطلب مني إعداد الخطة."}`,
        `Verifit l dossier dyalek. ${eligible.length + applied.length} benefits mftouhin wla eligible${excluded.length ? `, w ${excluded.length} exclus bach ma ykounch double claim` : ""}.\n\n${lines}\n\nValeur l 3am l ouel: ${AMT(total).darija}. ${applied.length ? "Ba3dhom deja appliqué." : active ? "Akked l plan bach tftahhom." : "Goul liya nwjjed l plan."}`,
        `I scanned your file. ${eligible.length + applied.length} benefits are open or eligible${excluded.length ? `, and ${excluded.length} excluded to avoid double-claiming` : ""}.\n\n${lines}\n\nFirst-year value: ${AMT(total).en}. ${applied.length ? "Some are already applied." : active ? "Confirm the plan to open them." : "Ask me to prepare the plan."}`,
      ),
      planId: active?.id,
      suggestions: active ? sug(["confirm", "why", "human"], lang) : sug(["show", "human"], lang),
      trace: [
        { id: "tr-benefits", code: "benefits.found", params: { oneOff, monthly, excluded: excluded.length }, tone: "info" },
        { id: "tr-model", code: "guardrail.model", tone: "pass" },
      ],
      sources: eligible.map((benefit) => benefit.sourceId),
    });
  }

  if (intent === "status") {
    const latestCase = session.cases[0];
    const plan = active ?? session.plans[0];
    if (latestCase) {
      return reply({
        localized: L(
          `Votre dernier dossier ${latestCase.reference} est ${latestCase.status === "COMPLETED" ? "terminé" : "en cours"}. ${latestCase.actions.filter((action) => action.status === "DONE").length}/${latestCase.actions.length} services effectués.${latestCase.receiptId ? ` Le reçu et le journal d'audit sont prêts.` : ""}`,
          `ملفك الأخير ${latestCase.reference} ${latestCase.status === "COMPLETED" ? "مكتمل" : "قيد المعالجة"}. تم إنجاز ${latestCase.actions.filter((action) => action.status === "DONE").length}/${latestCase.actions.length} خدمات.${latestCase.receiptId ? " الوصل وسجل التدقيق جاهزان." : ""}`,
          `Dossier dyalek l akher ${latestCase.reference} ${latestCase.status === "COMPLETED" ? "kmmel" : "f l traitement"}. ${latestCase.actions.filter((action) => action.status === "DONE").length}/${latestCase.actions.length} services tdaro.${latestCase.receiptId ? " Reçu w audit log wajdin." : ""}`,
          `Your latest case ${latestCase.reference} is ${latestCase.status === "COMPLETED" ? "completed" : "in progress"}. ${latestCase.actions.filter((action) => action.status === "DONE").length}/${latestCase.actions.length} services done.${latestCase.receiptId ? " Receipt and audit log are ready." : ""}`,
        ),
        planId: plan?.id,
        suggestions: sug(["case", "receipt", "human"], lang),
        trace: [{ id: "tr-status", code: "context.verified", params: { docs: session.metrics.verifiedDocuments, people: session.household.length }, tone: "pass" }],
      });
    }
    if (plan) {
      return reply({
        localized: L(
          `Votre plan ${plan.id} est prêt et attend votre confirmation. ${plan.actions.length} services, ${AMT(plan.totalCost).fr} de frais. Rien n'a encore été exécuté.`,
          `خطتك ${plan.id} جاهزة وفي انتظار التأكيد. ${plan.actions.length} خدمات، ${AMT(plan.totalCost).ar} رسوم. لم يُنفّذ أي شيء بعد.`,
          `Plan dyalek ${plan.id} wajed w kaysenna confirmation. ${plan.actions.length} services, ${AMT(plan.totalCost).darija} frais. Ma tdar walou ba9i.`,
          `Your plan ${plan.id} is ready and waiting for confirmation. ${plan.actions.length} services, ${AMT(plan.totalCost).en} in fees. Nothing has been executed yet.`,
        ),
        planId: plan.id,
        suggestions: sug(["confirm", "why", "human"], lang),
        trace: plan.trace,
      });
    }
    return reply({
      localized: L(
        "Aucun dossier ouvert pour l'instant. Je peux préparer un plan pour un nouvel enfant, un déménagement, une perte d'emploi, la retraite, une entreprise ou des études.",
        "لا يوجد ملف مفتوح بعد. يمكنني إعداد خطة لطفل جديد، انتقال، فقدان عمل، تقاعد، مشروع أو دراسة.",
        "Ma kaynch dossier mftou7 ba9i. N9der nwjjed plan l wlid jdid, nqla, perte d'emploi, retraite, project wla 9raya.",
        "No open case yet. I can prepare a plan for a new baby, a move, a job loss, retirement, a business or studies.",
      ),
      suggestions: sug(["baby", "moving", "job", "retirement"], lang),
    });
  }

  if (intent === "documents") {
    const verified = session.documents.filter((doc) => doc.status === "VERIFIED").length;
    const pending = session.documents.filter((doc) => doc.status !== "VERIFIED");
    return reply({
      localized: L(
        `Votre coffre contient ${session.documents.length} documents, ${verified} vérifiés.${pending.length ? ` En attente : ${pending.map((doc) => doc.title[lang]).join(", ")}.` : ""}\n\nL'acte de naissance et le carnet de vaccination seront ajoutés automatiquement à l'exécution du plan.`,
        `خزانتك تحتوي على ${session.documents.length} وثائق، ${verified} محققة.${pending.length ? ` قيد الانتظار: ${pending.map((doc) => doc.title[lang]).join("، ")}.` : ""}\n\nسيُضاف عقد الازدياد ودفتر التلقيح تلقائياً عند تنفيذ الخطة.`,
        `L coffre dyalek fih ${session.documents.length} documents, ${verified} mverifiyin.${pending.length ? ` Ba9i: ${pending.map((doc) => doc.title[lang]).join(", ")}.` : ""}\n\nL acte w carnet dyal vaccination ghadi ytzado automatiquement mli l plan ytdar.`,
        `Your vault has ${session.documents.length} documents, ${verified} verified.${pending.length ? ` Pending: ${pending.map((doc) => doc.title[lang]).join(", ")}.` : ""}\n\nThe birth certificate and vaccination record will be added automatically when the plan runs.`,
      ),
      planId: active?.id,
      suggestions: sug(["status", "human"], lang),
    });
  }

  if (intent === "profile") {
    const c = session.citizen;
    return reply({
      localized: L(
        `Je connais ${c.firstName} ${c.lastName}, ${c.address}. ${session.household.length} personnes dans le foyer, ${session.documents.filter((doc) => doc.status === "VERIFIED").length} titres vérifiés, CNSS actif depuis ${c.cnssSince.slice(0, 4)}.\n\nJe n'utilise que le minimum de données nécessaire au service demandé. Vous pouvez ouvrir le registre des consentements dans votre coffre.`,
        `أعرف ${c.firstName} ${c.lastName}، ${c.address}. ${session.household.length} أفراد في الأسرة، ${session.documents.filter((doc) => doc.status === "VERIFIED").length} وثائق محققة، الضمان الاجتماعي نشط منذ ${c.cnssSince.slice(0, 4)}.\n\nأستخدم فقط الحد الأدنى من البيانات اللازمة للخدمة. يمكنك فتح سجل الموافقات في خزانتك.`,
        `N3ref ${c.firstName} ${c.lastName}, ${c.address}. ${session.household.length} personnes f l famille, ${session.documents.filter((doc) => doc.status === "VERIFIED").length} credentials mverifiyin, CNSS active mn ${c.cnssSince.slice(0, 4)}.\n\nKansta3mel ghir l minimum dyal data li khass l service. Ftah l consent ledger f l coffre.`,
        `I know ${c.firstName} ${c.lastName}, ${c.address}. ${session.household.length} people in the household, ${session.documents.filter((doc) => doc.status === "VERIFIED").length} verified credentials, CNSS active since ${c.cnssSince.slice(0, 4)}.\n\nI only use the minimum data needed for the service you ask about. You can open the consent ledger in your vault.`,
      ),
      suggestions: sug(["documents", "human"], lang),
    });
  }

  if (intent === "thanks") {
    return reply({
      localized: L(
        "Avec plaisir. Je reste là si vous avez besoin d'autre chose — et je vous rappellerai avant l'échéance de déclaration du 7 décembre.",
        "بكل سرور. سأبقى هنا إن احتجت أي شيء آخر — وسأذكرك قبل أجل 7 دجنبر للتصريح بالولادة.",
        "B kol sourour. Ghadi nbqa hna ila 7tajti chi 7aja — w ghadi nfekkrek 9bel deadline dyal 7 dujenbir.",
        "With pleasure. I'll stay here if you need anything else — and I'll remind you before the 7 December declaration deadline.",
      ),
      suggestions: sug(["status", "next"], lang),
    });
  }

  if (
    intent === "new_baby" ||
    intent === "moving" ||
    intent === "job_loss" ||
    intent === "retirement" ||
    intent === "business" ||
    intent === "studies"
  ) {
    const eventId = intent as LifeEventId;
    const existing = findPlan(session, eventId);
    if (existing?.status === "COMPLETED") {
      return reply({
        localized: L(
          `Le plan « ${existing.title.fr} » est déjà terminé. Votre dossier ${existing.caseId} et votre reçu signé sont disponibles. Si quelque chose a changé, je peux ouvrir un nouveau suivi.`,
          `خطة «${existing.title.ar}» مكتملة بالفعل. ملفك ${existing.caseId} ووصلك الموقّع متاحان. إذا تغير شيء، يمكنني فتح متابعة جديدة.`,
          `Plan «${existing.title.darija}» deja kmmel. Dossier ${existing.caseId} w reçu signé dyalek wajdin. Ila tbeddel chi 7aja, n9der nftah suivi jdid.`,
          `The ${existing.title.en} plan is already complete. Your case ${existing.caseId} and signed receipt are available. If something changed, I can open a new follow-up.`,
        ),
        planId: existing.id,
        suggestions: sug(["case", "next", "human"], lang),
        trace: existing.trace,
      });
    }
    const plan = existing && existing.status === "AWAITING_CONFIRMATION" ? existing : attachedPlanFor(session, eventId);
    if (!plan) {
      return reply({
        localized: L(
          "Je n'ai pas pu préparer ce plan automatiquement. Je vous transfère à un conseiller avec votre contexte, pour que rien ne soit perdu.",
          "لم أتمكن من إعداد هذه الخطة تلقائياً. أحوّلك إلى مستشار مع سياقك، حتى لا يضيع أي شيء.",
          "Ma 9dertch nwjjed had l plan automatiquement. Ghadi n7wwlek l chi conseiller m3a contexte dyalek, bach ma ydi3ch walou.",
          "I couldn't prepare this plan automatically. I'm handing you to an adviser with your context, so nothing is lost.",
        ),
        suggestions: sug(["human", "next"], lang),
      });
    }
    return reply({
      localized: planReply(plan, lang),
      planId: plan.id,
      suggestions: sug(["confirm", "why", "money", "human"], lang),
      trace: plan.trace,
    });
  }

  if (intent === "help") {
    return reply({
      localized: L(
        "Je suis M3ak, votre agent de services publics. Je peux gérer un nouvel enfant, un déménagement, une perte d'emploi, la retraite, la création d'une entreprise ou des études à l'étranger.\n\nJe vérifie votre dossier, calcule vos droits, prépare un plan et n'exécute qu'après votre confirmation.",
        "أنا M3ak، وكيل خدماتك العمومية. يمكنني معالجة طفل جديد، انتقال، فقدان عمل، تقاعد، بدء مشروع، أو الدراسة بالخارج.\n\nأتحقق من ملفك، أحسب حقوقك، أعد خطة واحدة، ولا أنفذ إلا بعد تأكيدك.",
        "Ana M3ak, l agent dyal les services publics. N9der n3awnek f wlid jdid, nqla, perte d'emploi, retraite, project jdid, wla 9raya l barra.\n\nKanverifi dossier dyalek, kan7seb 7ou9ou9ek, kanwjjed plan wa7ed, w kan'exécuti ghir mn ba3d confirmation dyalek.",
        "I'm M3ak, your public-services agent. I can handle a new baby, a move, a job loss, retirement, starting a business, or studying abroad.\n\nI verify your file, calculate what you're entitled to, prepare one plan, and execute only after your confirmation.",
      ),
      suggestions: sug(["baby", "moving", "job", "retirement", "business", "studies"], lang),
      trace: [
        { id: "tr-help", code: "intent.help", tone: "info" },
        { id: "tr-model", code: "guardrail.model", tone: "pass" },
      ],
    });
  }

  // Unknown: be useful, never invent a procedure.
  const event = lifeEventById("new_baby");
  const deadline = event ? daysUntil("2026-12-07", DEMO_NOW) : 0;
  return reply({
    localized: L(
      `Je ne suis pas sûr d'avoir compris. Je ne devine pas les procédures — je travaille uniquement à partir de règles vérifiées et de votre dossier.\n\nEssayez : « Je viens d'avoir un bébé », « Je déménage à Rabat », « J'ai perdu mon emploi », « Je prends ma retraite » ou « Où en est mon dossier ? ». Il vous reste ${deadline} jours pour déclarer la naissance d'Adam (${formatDate("2026-12-07", "fr")}).`,
      `لست متأكداً من فهم ذلك. لا أخمن الإجراءات — أعمل فقط بقواعد محققة وملفك.\n\nجرّب: «رزقت بطفل»، «أنتقل إلى الرباط»، «فقدت عملي»، «سأتقاعد»، أو «أين وصل ملفي؟». ما زال لديك ${deadline} يوماً للتصريح بولادة آدم (${formatDate("2026-12-07", "ar")}).`,
      `Ma t'akkadtsch fhemt. Ma kan5arrerch les procédures — kankhdem ghir b règles mverifiyin w dossier dyalek.\n\nJarreb: «3ndi baby», «Ghadi nqel l Rabat», «Tle9t l khedma», «Ghadi nta9a3ed», wla «Fin wsel dossier dyaly?». Ba9i 3ndek ${deadline} youm l tasri7 b l wilada dyal Adam (${formatDate("2026-12-07", "darija")}).`,
      `I'm not sure I understood that. I don't guess procedures — I only work from verified rules and your file.\n\nTry: “I just had a baby”, “I'm moving to Rabat”, “I lost my job”, “I'm retiring”, or “Where is my case?”. You still have ${deadline} days for Adam's birth declaration (${formatDate("2026-12-07", "en")}).`,
    ),
    suggestions: sug(["baby", "moving", "job", "human"], lang),
    trace: [{ id: "tr-fallback", code: "intent.fallback", tone: "warn" }],
  });
}
