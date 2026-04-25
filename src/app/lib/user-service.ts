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

function mapRitualRow(row: any): RitualRecord {
  return {
    ritualId: row.id,
    ritual: row.ai_ritual || { title: row.title || "", opening: "", symbolicAction: "", closing: "" },
    guidedSession: row.guided_session,
    guidedAudio: row.guided_audio || { status: "idle" },
    ritualType: row.ritual_type,
    intention: row.intention,
    energy: row.energy,
    element: row.element,
    intensity: row.intensity,
    duration: row.duration,
    anchor: row.anchor,
    createdAt: row.created_at,
    userId: row.user_id,
    isPublic: row.is_public ?? false,
    likesCount: 0,
    likedByViewer: false,
    favoritedByViewer: false,
  };
}

async function getDashboardFromSupabase(): Promise<UserDashboard | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: ownRows } = await supabase
    .from("rituals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: favRows } = await supabase
    .from("ritual_favorites")
    .select("ritual_id, rituals(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const own: RitualRecord[] = (ownRows || []).map(mapRitualRow);
  const favorites: RitualRecord[] = (favRows || [])
    .map((f: any) => f.rituals)
    .filter(Boolean)
    .map(mapRitualRow);

  return {
    profile: {
      id: user.id,
      email: user.email || "",
      fullName: user.user_metadata?.full_name || "",
      likesReceived: 0,
    },
    rituals: { own, favorites },
  };
}

export async function getUserDashboard(): Promise<UserDashboard | null> {
  const apiBaseUrl = getApiBaseUrl();

  if (!apiBaseUrl) {
    return getDashboardFromSupabase();
  }

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}/me/dashboard`, {
      headers: await getAuthHeaders(),
    });
  } catch {
    return getDashboardFromSupabase();
  }

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
  if (apiBaseUrl) {
    try {
      const response = await fetch(`${apiBaseUrl}/rituals/${ritualId}/favorite`, {
        method: "POST",
        headers: await getAuthHeaders(),
      });
      if (response.ok) return response.json();
      throw new Error(await readUserServiceError(response, "No se pudo guardar el ritual."));
    } catch (err) {
      if (!(err instanceof TypeError)) throw err;
      // network failure — fall through to direct Supabase
    }
  }
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Necesitás iniciar sesión para hacer eso.");
  const { error } = await supabase
    .from("ritual_favorites")
    .upsert({ ritual_id: ritualId, user_id: session.user.id }, { onConflict: "ritual_id,user_id" });
  if (error) throw new Error("No se pudo guardar el ritual.");
  return { ok: true, favorited: true };
}

export async function unfavoriteRitual(ritualId: string) {
  const apiBaseUrl = getApiBaseUrl();
  if (apiBaseUrl) {
    try {
      const response = await fetch(`${apiBaseUrl}/rituals/${ritualId}/favorite`, {
        method: "DELETE",
        headers: await getAuthHeaders(),
      });
      if (response.ok) return response.json();
      throw new Error(await readUserServiceError(response, "No se pudo quitar el ritual."));
    } catch (err) {
      if (!(err instanceof TypeError)) throw err;
      // network failure — fall through to direct Supabase
    }
  }
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Necesitás iniciar sesión para hacer eso.");
  const { error } = await supabase
    .from("ritual_favorites")
    .delete()
    .eq("ritual_id", ritualId)
    .eq("user_id", session.user.id);
  if (error) throw new Error("No se pudo quitar el ritual.");
  return { ok: true, favorited: false };
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
