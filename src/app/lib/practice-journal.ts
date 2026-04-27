/**
 * practice-journal.ts
 *
 * Persistencia local del diario personal de práctica del usuario.
 * Guarda anclas, mood antes/después, elemento y fecha de cada ritual completado.
 * Usado por StepAnchor (escritura) y Account + CosmicCalendar (lectura).
 */

import { buildCosmicDay, getLunarPhaseKey } from "./cosmic-calendar";

export interface JournalEntry {
  ritualId?: string;
  anchor: string;
  element: string;
  ritualType: string;
  moodBefore?: string;
  moodAfter?: string;
  moonPhase: string;
  lunarPhaseKey: string; // para calcular rachas
  completedAt: string; // ISO string
}

interface OwnRitualLike {
  createdAt?: string;
  ritual: {
    ritualId?: string;
    anchor?: string;
    element?: string;
    ritualType?: string;
  };
}

const JOURNAL_KEY = "rituales_journal_v1";

export function getJournalEntries(): JournalEntry[] {
  try {
    const raw = localStorage.getItem(JOURNAL_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as JournalEntry[];
  } catch {
    return [];
  }
}

export function saveJournalEntry(entry: Omit<JournalEntry, "lunarPhaseKey" | "completedAt"> & { completedAt?: string }): void {
  try {
    const entries = getJournalEntries();
    const now = entry.completedAt ? new Date(entry.completedAt) : new Date();
    const full: JournalEntry = {
      ...entry,
      completedAt: now.toISOString(),
      lunarPhaseKey: getLunarPhaseKey(now),
    };
    entries.push(full);
    // Máximo 200 entradas
    if (entries.length > 200) entries.splice(0, entries.length - 200);
    localStorage.setItem(JOURNAL_KEY, JSON.stringify(entries));
  } catch {}
}

// Elemento que el usuario más usa (para mostrar en /cuenta)
export function getDominantElement(entries: JournalEntry[]): string | null {
  if (entries.length < 3) return null;
  const counts: Record<string, number> = {};
  for (const e of entries) {
    if (e.element) counts[e.element] = (counts[e.element] ?? 0) + 1;
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? null;
}

// Cuántas fases lunares distintas consecutivas tienen al menos un ritual
export function getLunarStreak(entries: JournalEntry[]): number {
  if (entries.length === 0) return 0;

  // Obtener fases únicas, ordenadas cronológicamente por la primera entrada en cada fase
  const seen = new Map<string, string>(); // phaseKey → earliest completedAt
  for (const e of entries) {
    const existing = seen.get(e.lunarPhaseKey);
    if (!existing || e.completedAt < existing) {
      seen.set(e.lunarPhaseKey, e.completedAt);
    }
  }

  // Ordenar fases por fecha
  const phases = Array.from(seen.entries()).sort((a, b) => a[1].localeCompare(b[1]));

  if (phases.length === 0) return 0;

  // Extraer cycle y phase de cada key para verificar consecutividad
  function parseKey(key: string): { cycle: number; phase: number } {
    const m = key.match(/cycle(-?\d+)-phase(\d+)/);
    if (!m) return { cycle: 0, phase: 0 };
    return { cycle: parseInt(m[1]), phase: parseInt(m[2]) };
  }

  function isConsecutive(a: string, b: string): boolean {
    const pa = parseKey(a);
    const pb = parseKey(b);
    const totalA = pa.cycle * 4 + pa.phase;
    const totalB = pb.cycle * 4 + pb.phase;
    return totalB - totalA === 1;
  }

  // Contar racha desde la fase más reciente hacia atrás
  let streak = 1;
  for (let i = phases.length - 1; i > 0; i--) {
    if (isConsecutive(phases[i - 1][0], phases[i][0])) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// Mapa de dateKey → entrada para el overlay del calendario
export function getJournalByDate(entries: JournalEntry[]): Map<string, JournalEntry[]> {
  const map = new Map<string, JournalEntry[]>();
  for (const e of entries) {
    const dateKey = e.completedAt.slice(0, 10); // "yyyy-mm-dd"
    const existing = map.get(dateKey) ?? [];
    existing.push(e);
    map.set(dateKey, existing);
  }
  return map;
}

export function getJournalEntriesFromOwnRituals(entries: OwnRitualLike[]): JournalEntry[] {
  return entries
    .filter((entry) => entry.createdAt && entry.ritual.anchor)
    .map((entry) => {
      const completedAt = entry.createdAt as string;
      const completedDate = new Date(completedAt);
      const cosmicDay = buildCosmicDay(completedDate);
      return {
        ritualId: entry.ritual.ritualId,
        anchor: entry.ritual.anchor || "",
        element: entry.ritual.element || "",
        ritualType: entry.ritual.ritualType || "",
        moonPhase: cosmicDay.moonPhase,
        lunarPhaseKey: getLunarPhaseKey(completedDate),
        completedAt,
      };
    })
    .sort((a, b) => a.completedAt.localeCompare(b.completedAt));
}
