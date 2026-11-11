import { L } from "@/lib/i18n";
import type { Localized } from "@/lib/domain/types";

export type TourPlacement = "auto" | "top" | "bottom" | "left" | "right";

export interface TourStep {
  id: string;
  path: string;
  target: string;
  placement: TourPlacement;
  duration: number;
  chapter: Localized;
  title: Localized;
  body: Localized;
}

export const PRESENTATION = {
  label: L("Mode présentation", "وضع العرض", "Mode présentation", "Presentation mode"),
  start: L("Lancer la présentation", "ابدأ العرض", "Lancer l présentation", "Start presentation"),
  startShort: L("Présentation", "عرض", "Présentation", "Tour"),
  hint: L("Visite guidée automatique · 90 s", "جولة تلقائية · 90 ثانية", "Visite guidée auto · 90 s", "Automated walkthrough · 90 sec"),
  presenting: L("Visite guidée", "جولة موجهة", "Visite guidée", "Guided walkthrough"),
  preparing: L("Préparation de la scène…", "جارٍ تحضير المشهد…", "Kanwjjed l scène…", "Preparing the scene…"),
  step: L("Étape", "الخطوة", "Khatwa", "Step"),
  of: L("sur", "من", "mn", "of"),
  previous: L("Précédent", "السابق", "Li 9bel", "Previous"),
  next: L("Suivant", "التالي", "L jay", "Next"),
  pause: L("Mettre en pause", "إيقاف مؤقت", "Pause", "Pause"),
  resume: L("Reprendre", "متابعة", "Kemmel", "Resume"),
  exit: L("Quitter la présentation", "الخروج من العرض", "Kherj mn l présentation", "Exit presentation"),
  skip: L("Passer", "تخطي", "Skip", "Skip"),
  finish: L("Terminer", "إنهاء", "Kemmel", "Finish"),
  loading: L("Chargement de la scène…", "جارٍ تحميل المشهد…", "Kancharge l scène…", "Loading scene…"),
  clickToAdvance: L("Cliquez pour continuer", "انقر للمتابعة", "Klic bach tkemmel", "Click to continue"),
  keys: L(
    "Espace pause · ← → naviguer · Échap quitter",
    "مسافة إيقاف · ← → تنقل · Esc خروج",
    "Space pause · ← → naviguer · Esc kherj",
    "Space pause · ← → navigate · Esc exit",
  ),
  doneTitle: L("Tout le parcours, en 90 secondes.", "كل المسار في 90 ثانية.", "Kol l parcours f 90 seconde.", "The whole loop, in 90 seconds."),
  doneBody: L(
    "Vous avez vu la thèse, l'espace de Yasmine, l'agent, les droits, le coffre, les dossiers, les sources et la vérification publique. La démo est prête quand vous l'êtes.",
    "رأيت الفكرة، مساحة ياسمين، الوكيل، الحقوق، الخزانة، الملفات، المصادر والتحقق العمومي. العرض جاهز عندما تكون جاهزاً.",
    "Chafti l thèse, espace dyal Yasmine, l agent, droits, coffre, dossiers, sources w vérification publique. L démo wajda melli tkoun wajed.",
    "You've seen the thesis, Yasmine's space, the agent, benefits, the vault, cases, sources and public verification. The demo is ready when you are.",
  ),
  replay: L("Revoir la présentation", "إعادة العرض", "3awed l présentation", "Replay the tour"),
  explore: L("Explorer la démo", "استكشف العرض", "Explorer l démo", "Explore the demo"),
} satisfies Record<string, Localized>;

export const TOUR_STEPS: TourStep[] = [
  {
    id: "landing-hero",
    path: "/",
    target: '[data-tour="landing-hero-card"]',
    placement: "left",
    duration: 7800,
    chapter: L("Le produit", "المنتج", "Le produit", "The product"),
    title: L(
      "Un événement de vie. Toutes les administrations.",
      "حدث حياة واحد. كل الإدارات.",
      "Événement wa7ed. Kol l administrations.",
      "One life event. Every agency.",
    ),
    body: L(
      "Adam a trois jours. M3ak détecte six services dans cinq institutions et 23 200 DH de droits la première année — avant qu'un seul formulaire soit rempli.",
      "آدم عمره ثلاثة أيام. يكتشف M3ak ست خدمات في خمس مؤسسات و23,200 درهم من الحقوق في السنة الأولى — قبل ملء أي استمارة.",
      "Adam 3ndo 3 iyam. M3ak kaydetecti 6 services f 5 institutions w 23 200 DH dyal droits f l 3am l ouel — 9bel ma t3mmer ay formulaire.",
      "Adam is three days old. M3ak detects six services across five institutions and 23,200 DH in first-year benefits — before a single form is filled.",
    ),
  },
  {
    id: "landing-shift",
    path: "/",
    target: '[data-tour="landing-problem-new"]',
    placement: "left",
    duration: 6800,
    chapter: L("Le déclic", "التحول", "L déclic", "The shift"),
    title: L(
      "De l'administration à l'événement de vie.",
      "من الإدارة إلى حدث الحياة.",
      "Mn administration l événement de vie.",
      "From agencies to life events.",
    ),
    body: L(
      "L'ancien chemin : 31 jours, 4 déplacements, 17 documents recopiés. Le nouveau : une conversation, un consentement explicite, six services orchestrés.",
      "الطريق القديم: 31 يوماً، 4 تنقلات، 17 وثيقة يُعاد نسخها. الجديد: محادثة واحدة، موافقة صريحة، ست خدمات منظمة.",
      "Triq l 9dima: 31 youm, 4 déplacements, 17 documents. L jdida: conversation wa7da, consent sari7, 6 services orchestrés.",
      "The old path: 31 days, four trips and 17 documents re-entered. The new one: one conversation, one explicit consent and six orchestrated services.",
    ),
  },
  {
    id: "landing-engine",
    path: "/",
    target: '[data-tour="landing-system-grid"]',
    placement: "left",
    duration: 7200,
    chapter: L("Le moteur", "المحرك", "L moteur", "The engine"),
    title: L(
      "Le modèle raconte. Le moteur de politiques décide.",
      "النموذج يروي. محرك السياسات يقرر.",
      "L model kay7ki. L policy engine kayqarrer.",
      "The model narrates. The policy engine decides.",
    ),
    body: L(
      "22 sources publiques et 29 règles pilotent chaque service, frais et droit. Aucun montant n'est inventé par le modèle.",
      "22 مصدراً عمومياً و29 قاعدة تحكم كل خدمة ورسوم وحق. لا مبلغ يلفقه النموذج.",
      "22 sources publiques w 29 règles kaydirou kol service, frais w droit. Ma kaynch montant mn l model.",
      "22 public sources and 29 rules drive every service, fee and benefit. No amount is invented by the model.",
    ),
  },
  {
    id: "landing-trust",
    path: "/",
    target: '[data-tour="landing-trust-log"]',
    placement: "right",
    duration: 7200,
    chapter: L("La confiance", "الثقة", "La confiance", "Trust"),
    title: L(
      "Le consentement avant l'action.",
      "الموافقة قبل الإجراء.",
      "Consent 9bel l action.",
      "Consent before action.",
    ),
    body: L(
      "Des scopes exacts, une expiration et une révocation en un clic. Chaque étape est tracée et chaque exécution finit par un reçu signé.",
      "نطاقات دقيقة، انتهاء وإلغاء بنقرة واحدة. كل خطوة موثقة وكل تنفيذ ينتهي بوصل موقّع.",
      "Scopes exacts, expiration w révocation b klic wa7ed. Kol khatwa mtrackya w kol exécution katkemmel b reçu msigné.",
      "Exact scopes, expiry and one-click revocation. Every step is traced, and every run ends with a signed receipt.",
    ),
  },
  {
    id: "space-overview",
    path: "/space",
    target: '[data-tour="space-overview"]',
    placement: "right",
    duration: 7200,
    chapter: L("L'espace de Yasmine", "مساحة ياسمين", "Espace dyal Yasmine", "Yasmine's space"),
    title: L(
      "Un cockpit familial, pas un portail.",
      "قمرة قيادة للأسرة، لا بوابة.",
      "Cockpit dyal l famille, machi portail.",
      "A family cockpit, not a portal.",
    ),
    body: L(
      "L'événement actif, l'échéance de 30 jours, les six services et l'argent trouvé sont réunis dans une seule vue.",
      "الحدث النشط، أجل 30 يوماً، الخدمات الست والمبالغ المكتشفة في عرض واحد.",
      "L événement actif, deadline dyal 30 youm, 6 services w l argent m9loub f wa7ed vue.",
      "The active event, the 30-day deadline, the six services and the money found are all in one view.",
    ),
  },
  {
    id: "space-plan",
    path: "/space",
    target: '[data-tour="space-plan"]',
    placement: "right",
    duration: 7200,
    chapter: L("Le plan", "الخطة", "L plan", "The plan"),
    title: L(
      "Six services séquencés avant tout consentement.",
      "ست خدمات مرتبة قبل أي موافقة.",
      "6 services mseqenciyin 9bel ay consent.",
      "Six services sequenced before consent.",
    ),
    body: L(
      "Chaque action montre son autorité, ses dépendances, ses frais et son statut. Rien ne s'exécute tant que Yasmine n'a pas confirmé.",
      "كل إجراء يعرض جهته وتبعياته ورسومه وحالته. لا شيء يُنفّذ قبل تأكيد ياسمين.",
      "Kol action katwri authority, dépendances, frais w statut. Walou kaytexecuta 9bel confirmation dyal Yasmine.",
      "Every action shows its authority, dependencies, fee and status. Nothing runs until Yasmine confirms.",
    ),
  },
  {
    id: "chat-agent",
    path: "/chat",
    target: '[data-tour="chat-thread"]',
    placement: "right",
    duration: 7400,
    chapter: L("L'agent", "الوكيل", "L agent", "The agent"),
    title: L(
      "La conversation ouvre le dossier.",
      "المحادثة تفتح الملف.",
      "Conversation katfta7 dossier.",
      "The conversation opens the case.",
    ),
    body: L(
      "Le message d'accueil est proactif : Adam, six services, l'échéance et les montants. Le panneau latéral garde les scopes et les sources à portée de regard.",
      "رسالة الترحيب استباقية: آدم، ست خدمات، الأجل والمبالغ. اللوحة الجانبية تعرض النطاقات والمصادر.",
      "Message dyal accueil proactif: Adam, 6 services, deadline w montants. Panneau dyal jneb kaywri scopes w sources.",
      "The greeting is proactive: Adam, six services, the deadline and the amounts. The side panel keeps scopes and sources in view.",
    ),
  },
  {
    id: "benefits",
    path: "/benefits",
    target: '[data-tour="benefits-summary"]',
    placement: "right",
    duration: 7200,
    chapter: L("Les droits", "الحقوق", "Les droits", "Benefits"),
    title: L(
      "Chaque dirham auquel vous avez droit.",
      "كل درهم تستحقه.",
      "Kol dirham li 3ndek l 7a9 fih.",
      "Every dirham you're owed.",
    ),
    body: L(
      "Quatre droits confirmés, deux volontairement exclus pour éviter le double-droit. Le moteur recalcule chaque montant côté serveur.",
      "أربعة حقوق مؤكدة، واثنان مستبعدان عمداً لتجنب الازدواجية. المحرك يعيد حساب كل مبلغ على الخادم.",
      "4 droits confirmés, 2 excludés b l 3ani bach ma ykounch double-droit. L moteur kay7seb kol montant f l server.",
      "Four benefits confirmed and two deliberately excluded to avoid double-claiming. The engine recomputes every amount server-side.",
    ),
  },
  {
    id: "documents",
    path: "/documents",
    target: '[data-tour="documents-security"]',
    placement: "bottom",
    duration: 7200,
    chapter: L("Les preuves", "الأدلة", "Les preuves", "Evidence"),
    title: L(
      "Les preuves restent sous votre contrôle.",
      "الأدلة تبقى تحت سيطرتك.",
      "Preuves baqyin ta7t control dyalek.",
      "Proof stays under your control.",
    ),
    body: L(
      "Six documents vérifiés, des partages limités dans le temps et une révocation immédiate. Chaque partage crée une entrée de consentement datée.",
      "ست وثائق محققة، مشاركات محدودة زمنياً وإلغاء فوري. كل مشاركة تنشئ موافقة مؤرخة.",
      "6 documents mverifiyin, partages m7doudin f l wa9t w révocation directe. Kol partage kaycreer consent m'arra5.",
      "Six verified documents, time-boxed sharing and instant revocation. Every share creates a dated consent entry.",
    ),
  },
  {
    id: "cases",
    path: "/cases",
    target: '[data-tour="cases-overview"]',
    placement: "bottom",
    duration: 7000,
    chapter: L("La trace", "الأثر", "La trace", "The trail"),
    title: L(
      "Chaque événement laisse un dossier.",
      "كل حدث يترك ملفاً.",
      "Kol événement kaykhelli dossier.",
      "Every event leaves a case.",
    ),
    body: L(
      "Un dossier regroupe les services, les documents, le consentement, la chronologie et le reçu. Après l'exécution, tout l'événement devient une preuve auditable.",
      "الملف يجمع الخدمات والوثائق والموافقة والتسلسل والوصل. بعد التنفيذ، يصبح الحدث دليلاً قابلاً للتدقيق.",
      "Dossier kayjme3 services, documents, consent, timeline w reçu. Mn ba3d l exécution, kol l événement kaywelli preuve auditable.",
      "A case groups services, documents, consent, timeline and receipt. After execution, the whole event becomes an auditable proof.",
    ),
  },
  {
    id: "sources",
    path: "/sources",
    target: '[data-tour="sources-pipeline"]',
    placement: "bottom",
    duration: 7600,
    chapter: L("La preuve", "الإثبات", "La preuve", "The proof"),
    title: L(
      "Rien n'est inventé. Tout est citable.",
      "لا شيء ملفق. كل شيء قابل للاستشهاد.",
      "Walou mkhtar3. Kolchi citable.",
      "Nothing invented. Everything citable.",
    ),
    body: L(
      "Le chemin va de l'intention au contexte vérifié, aux règles, au consentement, à l'exécution et au reçu signé. Chaque règle renvoie à une source publique.",
      "المسار من النية إلى السياق المحقق، فالقواعد، فالموافقة، فالتنفيذ، فالوصل الموقّع. كل قاعدة تعود إلى مصدر عمومي.",
      "Triq katmchi mn intention l contexte mverifi, l règles, consent, exécution w reçu msigné. Kol règle katrje3 l source publique.",
      "The path runs from intent to verified context, policy rules, consent, execution and a signed receipt. Every rule maps to a public source.",
    ),
  },
  {
    id: "verify",
    path: "/verify",
    target: '[data-tour="verify-card"]',
    placement: "left",
    duration: 7600,
    chapter: L("La vérification publique", "التحقق العمومي", "Vérification publique", "Public verification"),
    title: L(
      "N'importe qui peut vérifier le résultat.",
      "أي شخص يمكنه التحقق من النتيجة.",
      "Ay wa7ed y9der yverifi l résultat.",
      "Anyone can check the outcome.",
    ),
    body: L(
      "Un code de reçu ouvre une preuve en lecture seule : bénéficiaire, dossier, lignes et empreinte SHA-256. Sans compte, sans appel, sans données superflues.",
      "رمز الوصل يفتح دليلاً للقراءة فقط: المستفيد، الملف، البنود وبصمة SHA-256. دون حساب أو اتصال أو بيانات زائدة.",
      "Code dyal reçu kayfta7 preuve read-only: bénéficiaire, dossier, lignes w empreinte SHA-256. Bla compte, bla call, bla data zaida.",
      "A receipt code opens a read-only proof: holder, case, line items and SHA-256 hash. No account, no phone call, no excess data.",
    ),
  },
  {
    id: "landing-close",
    path: "/",
    target: '[data-tour="landing-final"]',
    placement: "top",
    duration: 8200,
    chapter: L("La suite", "التالي", "L suite", "The close"),
    title: L(
      "La vie continue. M3ak s'occupe du reste.",
      "الحياة تستمر. M3ak يتكفل بالباقي.",
      "L 7ayat katkemmel. M3ak kaytwekel b l baqi.",
      "Life continues. M3ak handles the rest.",
    ),
    body: L(
      "Tout le parcours est là : comprendre l'événement, prouver les règles, demander le consentement, exécuter et laisser un reçu. La démo vous attend.",
      "كل المسار هنا: فهم الحدث، إثبات القواعد، طلب الموافقة، التنفيذ وترك وصل. العرض في انتظارك.",
      "Kol l parcours hna: fhem l événement, prouver règles, tleb consent, exécuter w khelli reçu. L démo katsenna.",
      "The whole loop is here: understand the event, prove the rules, ask for consent, execute and leave a receipt. The demo is ready when you are.",
    ),
  },
];
