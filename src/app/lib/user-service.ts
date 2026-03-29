import type { RitualData } from "../context/RitualContext";
import type { RitualRecord } from "./ritual-service";
import { getUserFacingErrorMessage } from "./errors";
import { supabase } from "./supabase";

export interface UserProfileData {
  id: string;
  email: string;
  fullName: string;
  likesReceived: number;
}

export interface UserDashboard {
  profile: UserProfileData;
  rituals: {
    own: RitualRecord[];
    favorites: RitualRecord[];
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
    throw new Error("No hay sesión activa.");
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  };
}

async function readUserServiceError(response: Response, fallback: string) {
  try {
    const text = await response.text();

    if (!text) {
      return fallback;
    }

    try {
      const parsed = JSON.parse(text) as {
        error?: string;
        detail?: string | { message?: string };
        message?: string;
      };

      const detail =
        typeof parsed.detail === "string" ? parsed.detail : parsed.detail?.message;

      return getUserFacingErrorMessage(
        parsed.error || parsed.message || detail || text,
        fallback,
      );
    } catch {
      return getUserFacingErrorMessage(text, fallback);
    }
  } catch {
    return fallback;
  }
}

export async function getUserDashboard(): Promise<UserDashboard | null> {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) return null;

  const response = await fetch(`${apiBaseUrl}/me/dashboard`, {
    headers: await getAuthHeaders(),
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error("No se pudo cargar tu cuenta.");
  }

  return response.json();
}

export async function updateProfile(fullName: string): Promise<UserProfileData> {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) {
    throw new Error("No hay backend configurado para guardar el perfil.");
  }

  const response = await fetch(`${apiBaseUrl}/me/profile`, {
    method: "PATCH",
    headers: await getAuthHeaders(),
    body: JSON.stringify({ fullName }),
  });

  if (!response.ok) {
    throw new Error("No se pudo guardar tu nombre.");
  }

  const data = await response.json();
  return data.profile;
}

export async function favoriteRitual(ritualId: string) {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) {
    throw new Error("No hay backend configurado para guardar favoritos.");
  }

  const response = await fetch(`${apiBaseUrl}/rituals/${ritualId}/favorite`, {
    method: "POST",
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(await readUserServiceError(response, "No se pudo guardar el ritual."));
  }

  return response.json();
}

export async function unfavoriteRitual(ritualId: string) {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) {
    throw new Error("No hay backend configurado para quitar favoritos.");
  }

  const response = await fetch(`${apiBaseUrl}/rituals/${ritualId}/favorite`, {
    method: "DELETE",
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      await readUserServiceError(response, "No se pudo quitar el ritual de guardados."),
    );
  }

  return response.json();
}

export async function deleteOwnRitual(ritualId: string) {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) {
    throw new Error("No hay backend configurado para borrar rituales.");
  }

  const response = await fetch(`${apiBaseUrl}/rituals/${ritualId}`, {
    method: "DELETE",
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || "No se pudo borrar el ritual.");
  }

  return response.json();
}

export async function likeRitual(ritualId: string) {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) {
    throw new Error("No hay backend configurado para registrar likes.");
  }

  const response = await fetch(`${apiBaseUrl}/rituals/${ritualId}/like`, {
    method: "POST",
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || "No se pudo registrar el me gusta.");
  }

  return response.json();
}

export async function unlikeRitual(ritualId: string) {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) {
    throw new Error("No hay backend configurado para quitar likes.");
  }

  const response = await fetch(`${apiBaseUrl}/rituals/${ritualId}/like`, {
    method: "DELETE",
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("No se pudo quitar el me gusta.");
  }

  return response.json();
}

export function ritualRecordToRitualData(ritual: RitualRecord): RitualData {
  return {
    ritualId: ritual.ritualId,
    ritualType: ritual.ritualType || "",
    simpleMode: true,
    intention: ritual.intention || "",
    intentionCategory: "",
    energy: ritual.energy || "",
    duration: ritual.duration || 10,
    intensity: ritual.intensity || "",
    element: ritual.element || "",
    aiRitual: ritual.ritual,
    guidedSession: ritual.guidedSession,
    guidedAudio: ritual.guidedAudio,
    anchor: ritual.anchor || "",
  };
}
