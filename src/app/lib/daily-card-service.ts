import { supabase } from "./supabase";

// Carta del Oráculo del día. Las filas anteriores al oráculo no tienen
// cardId/name/symbol: solo traen la intención.
export interface DailyCard {
  dateKey: string;
  cardId: string | null;
  name: string | null;
  symbol: string | null;
  intentionText: string;
  gesture: string | null;
  createdAt?: string;
}

const API_BASE = import.meta.env.VITE_RITUALES_API_BASE_URL?.replace(/\/$/, "") || "";

export function getTodayDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

async function readError(response: Response, fallback: string) {
  try {
    const parsed = await response.json();
    return parsed?.error || parsed?.message || fallback;
  } catch {
    return fallback;
  }
}

export async function getDailyCard(dateKey: string): Promise<DailyCard | null> {
  if (!API_BASE) return null;

  const response = await fetch(`${API_BASE}/me/daily-card?date=${encodeURIComponent(dateKey)}`, {
    headers: await getAuthHeaders(),
  });

  if (response.status === 401) return null;
  if (!response.ok) {
    throw new Error(await readError(response, "No se pudo cargar tu carta de hoy."));
  }

  const data = await response.json();
  return data.card ?? null;
}

// Saca la carta del día: el backend arma la intención a partir de `inputText`.
// Si ya había una carta para esa fecha, la devuelve con `created: false`.
export async function drawDailyCard(params: {
  dateKey: string;
  inputText: string;
  moonPhase?: string;
}): Promise<{ card: DailyCard; created: boolean }> {
  if (!API_BASE) {
    throw new Error("Falta configurar la API de Rituales.");
  }

  const response = await fetch(`${API_BASE}/me/daily-card`, {
    method: "POST",
    headers: await getAuthHeaders(),
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(await readError(response, "No pudimos sacar tu carta. Probá de nuevo."));
  }

  return response.json();
}
