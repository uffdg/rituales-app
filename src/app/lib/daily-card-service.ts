import { supabase } from "./supabase";

export interface DailyCard {
  dateKey: string;
  intentionText: string;
  feeling: string | null;
  createdAt?: string;
}

export interface DailyCardDraft {
  intentionText: string;
  feeling?: string | null;
  synced?: boolean;
}

const API_BASE = import.meta.env.VITE_RITUALES_API_BASE_URL?.replace(/\/$/, "") || "";
export const DAILY_CARD_DRAFT_KEY = "rituales_daily_card_draft_v1";

function getTodayDateKey() {
  const date = new Date();
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

function readDrafts(): Record<string, DailyCardDraft> {
  try {
    const raw = localStorage.getItem(DAILY_CARD_DRAFT_KEY);
    return raw ? JSON.parse(raw) as Record<string, DailyCardDraft> : {};
  } catch {
    return {};
  }
}

function writeDrafts(drafts: Record<string, DailyCardDraft>) {
  try {
    localStorage.setItem(DAILY_CARD_DRAFT_KEY, JSON.stringify(drafts));
  } catch {}
}

export function getLocalDailyCardDraft(dateKey: string): DailyCardDraft | null {
  return readDrafts()[dateKey] ?? null;
}

export function saveLocalDailyCardDraft(dateKey: string, draft: DailyCardDraft) {
  const drafts = readDrafts();
  drafts[dateKey] = {
    ...drafts[dateKey],
    ...draft,
    synced: draft.synced ?? false,
  };
  writeDrafts(drafts);
}

export function markLocalDailyCardDraftSynced(dateKey: string) {
  const drafts = readDrafts();
  if (!drafts[dateKey]) return;
  drafts[dateKey] = { ...drafts[dateKey], synced: true };
  writeDrafts(drafts);
}

export async function getDailyCard(dateKey: string): Promise<DailyCard | null> {
  if (!API_BASE) {
    const draft = getLocalDailyCardDraft(dateKey);
    return draft?.intentionText
      ? {
          dateKey,
          intentionText: draft.intentionText,
          feeling: draft.feeling ?? null,
        }
      : null;
  }

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

export async function createDailyCard(params: {
  dateKey: string;
  intentionText: string;
  feeling?: string | null;
}): Promise<{ card: DailyCard; created: boolean }> {
  if (!API_BASE) {
    saveLocalDailyCardDraft(params.dateKey, {
      intentionText: params.intentionText,
      feeling: params.feeling ?? null,
      synced: false,
    });
    return {
      card: {
        dateKey: params.dateKey,
        intentionText: params.intentionText,
        feeling: params.feeling ?? null,
      },
      created: true,
    };
  }

  const response = await fetch(`${API_BASE}/me/daily-card`, {
    method: "POST",
    headers: await getAuthHeaders(),
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(await readError(response, "No se pudo guardar tu carta de hoy."));
  }

  return response.json();
}

export async function updateDailyCardFeeling(params: {
  dateKey: string;
  feeling: string | null;
}): Promise<DailyCard> {
  if (!API_BASE) {
    const draft = getLocalDailyCardDraft(params.dateKey);
    saveLocalDailyCardDraft(params.dateKey, {
      intentionText: draft?.intentionText ?? "",
      feeling: params.feeling,
      synced: false,
    });
    return {
      dateKey: params.dateKey,
      intentionText: draft?.intentionText ?? "",
      feeling: params.feeling,
    };
  }

  const response = await fetch(`${API_BASE}/me/daily-card`, {
    method: "PATCH",
    headers: await getAuthHeaders(),
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(await readError(response, "No se pudo guardar tu sentir."));
  }

  const data = await response.json();
  return data.card;
}

export async function syncDailyCardDraftOnLogin(_userId: string): Promise<DailyCard | null> {
  if (!API_BASE) return null;

  const dateKey = getTodayDateKey();
  const draft = getLocalDailyCardDraft(dateKey);

  if (!draft || draft.synced || !draft.intentionText?.trim()) {
    return null;
  }

  const result = await createDailyCard({
    dateKey,
    intentionText: draft.intentionText,
    feeling: draft.feeling ?? null,
  });

  let card = result.card;
  if (!result.created && draft.feeling && !card.feeling) {
    card = await updateDailyCardFeeling({ dateKey, feeling: draft.feeling });
  }

  markLocalDailyCardDraftSynced(dateKey);
  return card;
}
