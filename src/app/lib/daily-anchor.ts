export type DailyAnchorType = "inicio" | "momento" | "cierre";
export type DailyAnchorStatus = "completed" | "current" | "available" | "locked";

export interface DailyAnchorStepContent {
  text?: string;       // inicioDraft o cierreDraft
  feeling?: string;    // id del sentimiento seleccionado
  alignment?: string;  // id de alineación (solo momento)
}

export interface DailyAnchorStep {
  id: DailyAnchorType;
  label: string;
  shortLabel: string;
  description: string;
  prompt: string;
  status: DailyAnchorStatus;
}

export interface DailyAnchorJourney {
  dateKey: string;
  completedCount: number;
  currentStep: DailyAnchorType | null;
  nextCopy: string;
  helperCopy: string;
  steps: DailyAnchorStep[];
}

interface StoredDailyAnchorState {
  steps: DailyAnchorType[];
  content?: Partial<Record<DailyAnchorType, DailyAnchorStepContent>>;
  updatedAt: string;
}

const DAILY_ANCHOR_STORAGE_KEY = "rituales_daily_anchor_v1";

const STEP_DEFINITIONS: Omit<DailyAnchorStep, "status">[] = [
  {
    id: "inicio",
    label: "Ancla de Inicio",
    shortLabel: "Inicio",
    description: "Abrí el día con una intención simple y concreta.",
    prompt: "Definí cómo querés entrar en este día.",
  },
  {
    id: "momento",
    label: "Ancla de Momento",
    shortLabel: "Momento",
    description: "Volvé a tu centro cuando el día ya esté en movimiento.",
    prompt: "Registrá qué necesitás sostener ahora.",
  },
  {
    id: "cierre",
    label: "Ancla de Cierre",
    shortLabel: "Cierre",
    description: "Cerrá con perspectiva lo que el día te dejó.",
    prompt: "Nombrá qué querés integrar o soltar antes de cerrar.",
  },
];

function getOrderedCompletedSteps(steps: DailyAnchorType[]) {
  const unique = Array.from(new Set(steps));
  let orderedPrefixCount = 0;

  for (const step of STEP_DEFINITIONS) {
    if (unique.includes(step.id)) {
      orderedPrefixCount += 1;
      continue;
    }
    break;
  }

  return STEP_DEFINITIONS.slice(0, orderedPrefixCount).map((step) => step.id);
}

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function readStorage(): Record<string, StoredDailyAnchorState> {
  try {
    const raw = localStorage.getItem(DAILY_ANCHOR_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, StoredDailyAnchorState>;
  } catch {
    return {};
  }
}

function writeStorage(data: Record<string, StoredDailyAnchorState>) {
  try {
    localStorage.setItem(DAILY_ANCHOR_STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

function hasStepContent(content?: DailyAnchorStepContent) {
  if (!content) return false;
  return Boolean(content.text?.trim() || content.feeling || content.alignment);
}

export function resetDailyAnchorJourney(date = new Date()) {
  const dateKey = getDateKey(date);
  const all = readStorage();
  delete all[dateKey];
  writeStorage(all);
}

export function syncDailyAnchorContentFromRemote(
  content: Partial<Record<DailyAnchorType, DailyAnchorStepContent>>,
  date = new Date(),
) {
  const dateKey = getDateKey(date);
  const remoteSteps = getOrderedCompletedSteps(
    STEP_DEFINITIONS
      .filter((step) => hasStepContent(content[step.id]))
      .map((step) => step.id),
  );

  const all = readStorage();
  const existing = all[dateKey];
  const currentSerialized = JSON.stringify(existing ?? null);

  if (!remoteSteps.length) {
    if (!existing) {
      return false;
    }

    delete all[dateKey];
    writeStorage(all);
    return true;
  }

  const nextState: StoredDailyAnchorState = {
    steps: remoteSteps,
    content,
    updatedAt: new Date().toISOString(),
  };
  const nextSerialized = JSON.stringify(nextState);

  if (currentSerialized === nextSerialized) {
    return false;
  }

  all[dateKey] = nextState;
  writeStorage(all);
  return true;
}

export function completeDailyAnchorStep(
  step: DailyAnchorType,
  content?: DailyAnchorStepContent,
  date = new Date(),
) {
  const dateKey = getDateKey(date);
  const all = readStorage();
  const existing = getOrderedCompletedSteps(all[dateKey]?.steps ?? []);
  const expectedNextStep = STEP_DEFINITIONS[existing.length]?.id;

  if (step === expectedNextStep && !existing.includes(step)) {
    const existingContent = all[dateKey]?.content ?? {};
    all[dateKey] = {
      steps: [...existing, step],
      content: { ...existingContent, ...(content ? { [step]: content } : {}) },
      updatedAt: new Date().toISOString(),
    };
    writeStorage(all);
  }
}

export function getDailyAnchorContent(
  date = new Date(),
): Partial<Record<DailyAnchorType, DailyAnchorStepContent>> {
  const dateKey = getDateKey(date);
  return readStorage()[dateKey]?.content ?? {};
}

export function getDailyAnchorJourney(date = new Date()): DailyAnchorJourney {
  const dateKey = getDateKey(date);
  const storedSteps = getOrderedCompletedSteps(readStorage()[dateKey]?.steps ?? []);
  const completedCount = storedSteps.length;
  const currentIndex =
    completedCount >= STEP_DEFINITIONS.length ? -1 : completedCount;

  const steps = STEP_DEFINITIONS.map((step, index) => {
    let status: DailyAnchorStatus = "locked";

    if (storedSteps.includes(step.id)) {
      status = "completed";
    } else if (index === currentIndex) {
      status = "current";
    }

    return {
      ...step,
      status,
    };
  });

  const currentStep = currentIndex > -1 ? STEP_DEFINITIONS[currentIndex].id : null;

  if (completedCount >= STEP_DEFINITIONS.length) {
    return {
      dateKey,
      completedCount,
      currentStep: null,
      nextCopy: "Tu recorrido de hoy ya quedó completo.",
      helperCopy: "Volvé más tarde si querés repasar tu día o empezar uno nuevo mañana.",
      steps,
    };
  }

  const currentDefinition = STEP_DEFINITIONS[currentIndex];
  const nextCopy =
    completedCount === 0
      ? "Empezá tu Diario de Anclas con una señal para hoy."
      : completedCount === 1
      ? "Tu inicio ya está marcado. Seguí con el momento del día."
      : "Ya recorriste casi todo el día. Cerralo con una última ancla.";

  return {
    dateKey,
    completedCount,
    currentStep,
    nextCopy,
    helperCopy: currentDefinition.prompt,
    steps,
  };
}
