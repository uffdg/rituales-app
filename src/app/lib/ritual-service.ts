import type {
  AIRitual,
  GuidedAudioState,
  RitualData,
} from "../context/RitualContext";
import { AI_RITUALS, ELEMENTS, ENERGIES, RITUAL_TYPES } from "../data/rituals";
import { getUserFacingErrorMessage } from "./errors";
import { supabase } from "./supabase";

export interface GuidedSessionSegment {
  id: string;
  kind: "intro" | "personalized" | "ambient" | "closing";
  label: string;
  durationSeconds: number;
  text?: string;
  isReusable?: boolean;
}

export interface GuidedSessionPlan {
  targetDurationMinutes: number;
  soundscape: "deep-night" | "soft-water" | "earth-hum";
  segments: GuidedSessionSegment[];
  personalizedScript: string;
  notes: string;
  locale?: string;
  dialect?: string;
}

export interface RitualGenerationResult {
  ritualId?: string;
  ritual: AIRitual;
  guidedSession: GuidedSessionPlan;
  guidedAudio?: GuidedAudioState;
}

export interface RitualRecord extends RitualGenerationResult {
  ritualType?: string;
  intention?: string;
  energy?: string;
  element?: string;
  intensity?: string;
  duration?: number;
  anchor?: string;
  author?: string;
  createdAt?: string;
  userId?: string | null;
  likesCount?: number;
  likedByViewer?: boolean;
  favoritedByViewer?: boolean;
  isPublic?: boolean;
}

interface BackendAudioResponse {
  audioUrl?: string;
  status?: string;
  provider?: string;
  voice?: string;
  model?: string;
}

export const DEFAULT_ELEVENLABS_VOICE_ID = "El3gkPAhMU9R5biL3rtU";

function normalizeLookupValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function resolveCatalogId(
  value: string | undefined,
  source: Array<{ id: string; label: string }>,
  fallback = "",
) {
  if (!value) return fallback;

  const normalized = normalizeLookupValue(value);
  const match = source.find(
    (item) =>
      normalizeLookupValue(item.id) === normalized ||
      normalizeLookupValue(item.label) === normalized,
  );

  return match?.id || fallback;
}

function resolveCatalogRitualId(candidate: unknown) {
  if (typeof candidate !== "string" || !candidate.trim()) {
    return undefined;
  }

  const trimmed = candidate.trim();
  return /^\d+$/.test(trimmed) ? undefined : trimmed;
}

function normalizeText(text: string) {
  return text.trim().replace(/\s+/g, " ");
}

function sanitizeForSpeech(text: string) {
  return normalizeText(text)
    .replace(/[“”«»"]/g, "")
    .replace(/[(){}\[\]]/g, "")
    .replace(/\s*[:;]\s*/g, ". ")
    .replace(/\s*[—–-]\s*/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildSpeechSeed(text: string) {
  let hash = 0;

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }

  return hash || 1;
}

function buildPersonalizedScript(ritual: AIRitual, input: RitualData) {
  const spokenSections = [
    input.intention
      ? `Tu intención para este momento es ${sanitizeForSpeech(input.intention)}.`
      : "",
    ritual.opening ? sanitizeForSpeech(ritual.opening) : "",
    ritual.symbolicAction
      ? `Ahora, muy despacio, ${sanitizeForSpeech(ritual.symbolicAction)}`
      : "",
    ritual.closing ? `Y para cerrar, ${sanitizeForSpeech(ritual.closing)}` : "",
    input.anchor ? `Quedate con este anclaje: ${sanitizeForSpeech(input.anchor)}.` : "",
  ];

  return [
    ...spokenSections,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function deriveGuidedSession(input: RitualData, ritual: AIRitual): GuidedSessionPlan {
  const targetSeconds = input.duration * 60;
  const introSeconds = input.duration >= 20 ? 55 : input.duration >= 10 ? 45 : 35;
  const closingSeconds = input.duration >= 20 ? 40 : 30;
  const personalizedSeconds = input.duration >= 20 ? 85 : input.duration >= 10 ? 65 : 45;
  const ambientSeconds = Math.max(
    targetSeconds - introSeconds - closingSeconds - personalizedSeconds,
    60,
  );

  const personalizedScript = buildPersonalizedScript(ritual, input);
  const soundscape =
    input.energy === "calma"
      ? "soft-water"
      : input.energy === "poder"
        ? "earth-hum"
        : "deep-night";

  return {
    targetDurationMinutes: input.duration,
    soundscape,
    locale: "castellano",
    dialect: "rioplatense argentino de Buenos Aires",
    personalizedScript,
    notes:
      "La intro y el cierre pueden reutilizarse para todos los rituales. El bloque personalizado es el único que debería sintetizarse con TTS premium. El tono debe sonar en castellano rioplatense, argentino, de Buenos Aires, y sostener exactamente la duración elegida.",
    segments: [
      {
        id: "intro-universal",
        kind: "intro",
        label: "Inicio universal",
        durationSeconds: introSeconds,
        isReusable: true,
        text: "Cerrá los ojos. Respirá profundo. No hace falta resolver todo ahora. Solo entrá en este momento.",
      },
      {
        id: "middle-personalized",
        kind: "personalized",
        label: "Centro personalizado",
        durationSeconds: personalizedSeconds,
        text: personalizedScript,
      },
      {
        id: `ambient-${input.duration}`,
        kind: "ambient",
        label: "Capa binaural",
        durationSeconds: ambientSeconds,
        isReusable: true,
      },
      {
        id: "closing-universal",
        kind: "closing",
        label: "Cierre universal",
        durationSeconds: closingSeconds,
        isReusable: true,
        text: "Volvé despacio. Quedate con una sola palabra. Llevá esta intención con vos.",
      },
    ],
  };
}

export function ritualCardToRitualData(ritual: {
  id?: string;
  ritualId?: string;
  type?: string;
  typeId?: string;
  intention?: string;
  energy?: string;
  duration?: number;
  intensity?: string;
  element?: string;
  aiRitual?: AIRitual;
  guidedSession?: GuidedSessionPlan;
  guidedAudio?: GuidedAudioState;
  anchor?: string;
}): RitualData {
  return {
    ritualId: resolveCatalogRitualId(ritual.ritualId || ritual.id),
    ritualType: ritual.typeId || resolveCatalogId(ritual.type, RITUAL_TYPES),
    simpleMode: true,
    intention: ritual.intention || "",
    intentionCategory: "",
    energy: resolveCatalogId(ritual.energy, ENERGIES, ritual.energy || ""),
    duration: ritual.duration || 10,
    intensity: normalizeLookupValue(ritual.intensity || ""),
    element: resolveCatalogId(ritual.element, ELEMENTS, ritual.element || ""),
    aiRitual: ritual.aiRitual || {
      title: "",
      opening: "",
      symbolicAction: "",
      closing: "",
    },
    guidedSession: ritual.guidedSession,
    guidedAudio: ritual.guidedAudio,
    anchor: ritual.anchor || "",
  };
}

function buildMockRitual(input: RitualData): RitualGenerationResult {
  const base = AI_RITUALS[input.ritualType] || AI_RITUALS.default;
  const ritual: AIRitual = {
    title: base.title,
    opening: base.opening,
    symbolicAction: base.symbolicAction,
    closing: base.closing,
  };

  return {
    ritualId: `mock-${Date.now()}`,
    ritual,
    guidedSession: deriveGuidedSession(input, ritual),
    guidedAudio: {
      status: "idle",
    },
  };
}

function getApiBaseUrl() {
  return import.meta.env.VITE_RITUALES_API_BASE_URL?.replace(/\/$/, "") || "";
}

async function getAuthHeaders() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return {};
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
  };
}

async function readErrorMessage(response: Response, fallback: string) {
  try {
    const text = await response.text();

    if (!text) {
      return fallback;
    }

    try {
      const parsed = JSON.parse(text) as { error?: string; detail?: { message?: string } };
      return getUserFacingErrorMessage(parsed.error || parsed.detail?.message || text, fallback);
    } catch {
      return getUserFacingErrorMessage(text, fallback);
    }
  } catch {
    return fallback;
  }
}

export async function generateRitual(input: RitualData, userId?: string): Promise<RitualGenerationResult> {
  const apiBaseUrl = getApiBaseUrl();

  if (!apiBaseUrl) {
    return new Promise((resolve) => {
      window.setTimeout(() => resolve(buildMockRitual(input)), 1200);
    });
  }

  const authHeaders = await getAuthHeaders();
  const response = await fetch(`${apiBaseUrl}/rituals/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify({ ...input, userId }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "No se pudo generar el ritual desde el backend."));
  }

  return response.json();
}

export async function renderGuidedAudio(args: {
  ritualId?: string;
  guidedSession: GuidedSessionPlan;
  voice: string;
  model: string;
  responseFormat: string;
}) {
  const apiBaseUrl = getApiBaseUrl();

  if (apiBaseUrl && args.ritualId) {
    const authHeaders = await getAuthHeaders();
    const response = await fetch(`${apiBaseUrl}/rituals/${args.ritualId}/render-audio`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({
        voice: args.voice,
        model: args.model,
        responseFormat: args.responseFormat,
        guidedSession: args.guidedSession,
      }),
    });

    if (!response.ok) {
      throw new Error(
        await readErrorMessage(response, "No se pudo renderizar el audio guiado desde el backend."),
      );
    }

    return (await response.json()) as BackendAudioResponse;
  }

  const previewText = [
    args.guidedSession.segments.find((segment) => segment.kind === "intro")?.text,
    args.guidedSession.personalizedScript,
    args.guidedSession.segments.find((segment) => segment.kind === "closing")?.text,
  ]
    .filter(Boolean)
    .map((segment) => sanitizeForSpeech(segment as string))
    .join("\n\n");

  const voiceId =
    args.voice ||
    import.meta.env.VITE_ELEVENLABS_VOICE_ID ||
    DEFAULT_ELEVENLABS_VOICE_ID;

  const seed = buildSpeechSeed(`${voiceId}:${previewText}`);

  const response = await fetch("/api/audio/speech", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      voice_id: voiceId,
      text: previewText,
      language_code: "es",
      dialect_hint: args.guidedSession.dialect || "rioplatense argentino de Buenos Aires",
      output_format: "mp3_44100_128",
      seed,
      apply_text_normalization: "auto",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(getUserFacingErrorMessage(errorText, "No se pudo generar el preview del audio guiado."));
  }

  const voiceBlob = await response.blob();

  return {
    blob: voiceBlob,
    status: "preview",
  };
}

export async function reframeIntention(text: string): Promise<string | null> {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) return null;

  const authHeaders = await getAuthHeaders();
  const response = await fetch(`${apiBaseUrl}/rituals/reframe-intention`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  return data.reframed || null;
}

export async function getRitualById(id: string): Promise<RitualRecord | null> {
  const apiBaseUrl = getApiBaseUrl();

  if (!apiBaseUrl || id === "nuevo" || id === "publico") {
    return null;
  }

  const authHeaders = await getAuthHeaders();
  const response = await fetch(`${apiBaseUrl}/rituals/${id}`, {
    headers: authHeaders,
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("No se pudo cargar el ritual.");
  }

  return response.json();
}

export async function getPublicRituals(): Promise<RitualRecord[]> {
  const apiBaseUrl = getApiBaseUrl();

  if (!apiBaseUrl) {
    return [];
  }

  const response = await fetch(`${apiBaseUrl}/rituals/public`);

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return data.rituals || [];
}

export async function publishRitualToCommunity(ritualId: string, showName: boolean) {
  const apiBaseUrl = getApiBaseUrl();

  if (!apiBaseUrl) {
    throw new Error("No hay backend configurado para compartir en comunidad.");
  }

  const authHeaders = await getAuthHeaders();
  const response = await fetch(`${apiBaseUrl}/rituals/${ritualId}/publish`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify({ showName }),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "No se pudo publicar tu ritual en comunidad."));
  }

  return response.json();
}
