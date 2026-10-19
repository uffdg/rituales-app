import { supabase } from "./supabase";

// Intención del día: lo que la persona deseaba y la intención que le
// devolvió la app.
export interface DailyIntention {
  dateKey: string;
  inputText: string;
  intentionText: string;
  createdAt?: string;
}

// Carta del Oráculo del día. El contenido viene del mazo curado del backend.
export interface DailyOracleCard {
  dateKey: string;
  cardId: string;
  name: string;
  symbol: string;
  message: string;
  gesture: string;
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

async function getDaily<T>(path: string, key: string, dateKey: string, fallback: string): Promise<T | null> {
  if (!API_BASE) return null;

  const response = await fetch(`${API_BASE}/me/${path}?date=${encodeURIComponent(dateKey)}`, {
    headers: await getAuthHeaders(),
  });

  if (response.status === 401) return null;
  if (!response.ok) {
    throw new Error(await readError(response, fallback));
  }

  const data = await response.json();
  return data[key] ?? null;
}

async function postDaily<T>(path: string, body: Record<string, string>, fallback: string): Promise<T> {
  if (!API_BASE) {
    throw new Error("Falta configurar la API de Rituales.");
  }

  const response = await fetch(`${API_BASE}/me/${path}`, {
    method: "POST",
    headers: await getAuthHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await readError(response, fallback));
  }

  return response.json();
}

export function getDailyIntention(dateKey: string) {
  return getDaily<DailyIntention>("daily-intention", "intention", dateKey, "No se pudo cargar tu intención de hoy.");
}

// Si ya había una intención para esa fecha, el backend la devuelve con
// `created: false` en vez de escribir otra.
export function createDailyIntention(params: { dateKey: string; inputText: string }) {
  return postDaily<{ intention: DailyIntention; created: boolean }>(
    "daily-intention",
    params,
    "No pudimos escribir tu intención. Probá de nuevo.",
  );
}

export function getDailyOracleCard(dateKey: string) {
  return getDaily<DailyOracleCard>("daily-oracle", "card", dateKey, "No se pudo cargar tu carta de hoy.");
}

// Si ya había sacado carta ese día, el backend devuelve la misma.
export function drawDailyOracleCard(params: { dateKey: string; moonPhase: string }) {
  return postDaily<{ card: DailyOracleCard; created: boolean }>(
    "daily-oracle",
    params,
    "No pudimos sacar tu carta. Probá de nuevo.",
  );
}
