import type {
  AIRitual,
  GuidedAudioState,
  RitualData,
} from "../context/RitualContext";
import { AI_RITUALS } from "../data/rituals";

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
}

export interface RitualGenerationResult {
  ritualId?: string;
  ritual: AIRitual;
  guidedSession: GuidedSessionPlan;
  guidedAudio?: GuidedAudioState;
}

export interface RitualRecord extends RitualGenerationResult {
  intention?: string;
  energy?: string;
  element?: string;
  intensity?: string;
  duration?: number;
  anchor?: string;
  author?: string;
}

interface BackendAudioResponse {
  audioUrl?: string;
  status?: string;
  provider?: string;
  voice?: string;
  model?: string;
}

function normalizeText(text: string) {
  return text.trim().replace(/\s+/g, " ");
}

function buildPersonalizedScript(ritual: AIRitual, input: RitualData) {
  const durationLine =
    input.duration >= 20
      ? "Hoy quédate sin apuro. No hace falta resolverlo todo de una vez."
      : input.duration >= 10
        ? "Quédate en este momento con suavidad y atención."
        : "Toma este momento breve como un punto de regreso.";

  return [
    `Tu intención para este momento es: ${normalizeText(input.intention)}.`,
    ritual.opening,
    durationLine,
    ritual.symbolicAction,
    ritual.closing,
  ]
    .filter(Boolean)
    .join(" ");
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
    personalizedScript,
    notes:
      "La intro y el cierre pueden reutilizarse para todos los rituales. El bloque personalizado es el único que debería sintetizarse con TTS premium.",
    segments: [
      {
        id: "intro-universal",
        kind: "intro",
        label: "Inicio universal",
        durationSeconds: introSeconds,
        isReusable: true,
        text: "Cierra los ojos. Respira profundo. No hace falta resolver todo ahora. Solo entra en este momento.",
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
        text: "Vuelve despacio. Quédate con una sola palabra. Lleva esta intención contigo.",
      },
    ],
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

export async function generateRitual(input: RitualData): Promise<RitualGenerationResult> {
  const apiBaseUrl = getApiBaseUrl();

  if (!apiBaseUrl) {
    return new Promise((resolve) => {
      window.setTimeout(() => resolve(buildMockRitual(input)), 1200);
    });
  }

  const response = await fetch(`${apiBaseUrl}/rituals/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("No se pudo generar el ritual desde el backend.");
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
    const response = await fetch(`${apiBaseUrl}/rituals/${args.ritualId}/render-audio`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        voice: args.voice,
        model: args.model,
        responseFormat: args.responseFormat,
        guidedSession: args.guidedSession,
      }),
    });

    if (!response.ok) {
      throw new Error("No se pudo renderizar el audio guiado desde el backend.");
    }

    return (await response.json()) as BackendAudioResponse;
  }

  const previewText = [
    args.guidedSession.segments.find((segment) => segment.kind === "intro")?.text,
    args.guidedSession.personalizedScript,
    args.guidedSession.segments.find((segment) => segment.kind === "closing")?.text,
  ]
    .filter(Boolean)
    .join(" ");

  const voiceId =
    args.voice ||
    import.meta.env.VITE_ELEVENLABS_VOICE_ID ||
    "EXAVITQu4vr4xnSDxMaL";

  const response = await fetch("/api/audio/speech", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      voice_id: voiceId,
      text: previewText,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "No se pudo generar el preview del audio guiado.");
  }

  return {
    blob: await response.blob(),
    status: "preview",
  };
}

export async function getRitualById(id: string): Promise<RitualRecord | null> {
  const apiBaseUrl = getApiBaseUrl();

  if (!apiBaseUrl || id === "nuevo" || id === "publico") {
    return null;
  }

  const response = await fetch(`${apiBaseUrl}/rituals/${id}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("No se pudo cargar el ritual.");
  }

  return response.json();
}
