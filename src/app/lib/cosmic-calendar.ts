import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";

export type CosmicEventType = "moon" | "equinox" | "eclipse";

export interface CosmicPerfection {
  kind: "moon_phase" | "event";
  label: string;
  timeBuenosAires: string;
  zodiacSign: string;
}

export interface CosmicDay {
  dateKey: string;
  date: Date;
  weekdayLabel: string;
  shortLabel: string;
  monthLabel: string;
  moonPhase: string;
  moonEmoji: string;
  perfection?: CosmicPerfection;
  events: {
    type: CosmicEventType;
    label: string;
    shortLabel: string;
  }[];
}

const KNOWN_EVENTS = [
  { dateKey: "2026-03-14", type: "eclipse" as const, label: "Eclipse lunar", shortLabel: "Eclipse" },
  { dateKey: "2026-03-20", type: "equinox" as const, label: "Equinoccio de otoño", shortLabel: "Equinoccio" },
  { dateKey: "2026-08-12", type: "eclipse" as const, label: "Eclipse solar", shortLabel: "Eclipse" },
  { dateKey: "2026-09-22", type: "equinox" as const, label: "Equinoccio de primavera", shortLabel: "Equinoccio" },
];

const PERFECTED_POSITIONS: Record<string, CosmicPerfection> = {
  "2026-03-14": {
    kind: "event",
    label: "Eclipse lunar",
    timeBuenosAires: "03:58",
    zodiacSign: "Virgo",
  },
  "2026-03-20": {
    kind: "event",
    label: "Equinoccio de otoño",
    timeBuenosAires: "06:01",
    zodiacSign: "Aries",
  },
  "2026-03-19": {
    kind: "moon_phase",
    label: "Luna nueva",
    timeBuenosAires: "23:24",
    zodiacSign: "Piscis",
  },
  "2026-03-26": {
    kind: "moon_phase",
    label: "Cuarto creciente",
    timeBuenosAires: "13:47",
    zodiacSign: "Cáncer",
  },
  "2026-04-02": {
    kind: "moon_phase",
    label: "Luna llena",
    timeBuenosAires: "11:12",
    zodiacSign: "Libra",
  },
  "2026-04-10": {
    kind: "moon_phase",
    label: "Cuarto menguante",
    timeBuenosAires: "22:08",
    zodiacSign: "Capricornio",
  },
  "2026-08-12": {
    kind: "event",
    label: "Eclipse solar",
    timeBuenosAires: "15:41",
    zodiacSign: "Leo",
  },
  "2026-09-22": {
    kind: "event",
    label: "Equinoccio de primavera",
    timeBuenosAires: "09:21",
    zodiacSign: "Libra",
  },
};

const PHASES = [
  { label: "Luna nueva", emoji: "●" },
  { label: "Creciente fina", emoji: "◔" },
  { label: "Cuarto creciente", emoji: "◑" },
  { label: "Cuarto creciente", emoji: "◕" },
  { label: "Luna llena", emoji: "○" },
  { label: "Cuarto menguante", emoji: "◕" },
  { label: "Cuarto menguante", emoji: "◐" },
  { label: "Menguante fina", emoji: "◓" },
];

// ─── Cálculo algorítmico de fases lunares para cualquier mes ─────────────────
//
// Método: en luna nueva, la Luna y el Sol están en conjunción (misma longitud
// eclíptica). En cuarto creciente la Luna está 90° delante del Sol, en luna
// llena 180°, en cuarto menguante 270°. Usamos eso para calcular el signo
// zodiacal exacto de cada fase.
//
// Referencia: luna nueva 2026-03-20T02:24:00Z (equinoccio de otoño +6.5h)
//             equinoccio 2026-03-20T09:01:00Z → Sol en 0° Aries.

const LUNAR_CYCLE_MS = 29.53058867 * 24 * 60 * 60 * 1000;
const REFERENCE_NEW_MOON_UTC_MS = new Date("2026-03-20T02:24:00Z").getTime();
const EQUINOX_2026_UTC_MS       = new Date("2026-03-20T09:01:00Z").getTime();
const SUN_DEG_PER_MS = 360 / (365.25 * 24 * 60 * 60 * 1000);
const BS_OFFSET_MS   = -3 * 60 * 60 * 1000; // UTC-3

const ZODIAC_ES = [
  "Aries", "Tauro", "Géminis", "Cáncer", "Leo", "Virgo",
  "Libra", "Escorpio", "Sagitario", "Capricornio", "Acuario", "Piscis",
];

function getSunLongitude(utcMs: number): number {
  const deg = ((utcMs - EQUINOX_2026_UTC_MS) * SUN_DEG_PER_MS) % 360;
  return (deg + 360) % 360;
}

function getMoonLongitudeAtPhase(utcMs: number, fraction: number): number {
  const elongation = fraction * 360;
  const longitude = (getSunLongitude(utcMs) + elongation) % 360;
  return (longitude + 360) % 360;
}

function getZodiacSign(longitude: number): string {
  return ZODIAC_ES[Math.floor(longitude / 30)];
}

/**
 * Genera las posiciones exactas de las 4 fases lunares para cualquier rango
 * de fechas, combinadas con los datos hardcodeados (que tienen prioridad).
 */
export function getMoonPerfectionsForRange(
  start: Date,
  end: Date,
): Record<string, CosmicPerfection> {
  const result: Record<string, CosmicPerfection> = {};
  const startMs = start.getTime();
  const endMs   = end.getTime();

  const PHASE_DEFS: { fraction: number; label: string }[] = [
    { fraction: 0,    label: "Luna nueva" },
    { fraction: 0.25, label: "Cuarto creciente" },
    { fraction: 0.5,  label: "Luna llena" },
    { fraction: 0.75, label: "Cuarto menguante" },
  ];

  // Ciclo inicial: 2 ciclos antes del rango para no perder fases en el borde
  const cycleOffset = Math.floor(
    (startMs - REFERENCE_NEW_MOON_UTC_MS) / LUNAR_CYCLE_MS,
  ) - 2;

  for (let c = cycleOffset; c <= cycleOffset + 6; c++) {
    for (const phase of PHASE_DEFS) {
      const phaseUtcMs = REFERENCE_NEW_MOON_UTC_MS + (c + phase.fraction) * LUNAR_CYCLE_MS;
      if (phaseUtcMs < startMs || phaseUtcMs > endMs) continue;

      // Convertir a Buenos Aires para obtener la fecha del día
      const bsasMs   = phaseUtcMs + BS_OFFSET_MS;
      const bsasDate = new Date(bsasMs);
      const dateKey  = `${bsasDate.getUTCFullYear()}-${String(bsasDate.getUTCMonth() + 1).padStart(2, "0")}-${String(bsasDate.getUTCDate()).padStart(2, "0")}`;
      const hh = String(bsasDate.getUTCHours()).padStart(2, "0");
      const mm = String(bsasDate.getUTCMinutes()).padStart(2, "0");

      const longitude = getMoonLongitudeAtPhase(phaseUtcMs, phase.fraction);
      const zodiacSign = getZodiacSign(longitude);

      result[dateKey] = {
        kind: "moon_phase",
        label: phase.label,
        timeBuenosAires: `${hh}:${mm}`,
        zodiacSign,
      };
    }
  }

  // Los datos hardcodeados tienen prioridad (son más precisos)
  for (const [key, val] of Object.entries(PERFECTED_POSITIONS)) {
    result[key] = val;
  }

  return result;
}
// ─────────────────────────────────────────────────────────────────────────────

function getDateKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function getMoonPhaseForDate(date: Date) {
  const knownNewMoon = new Date("2026-03-19T00:00:00-03:00");
  const diffMs = date.getTime() - knownNewMoon.getTime();
  const lunarCycleDays = 29.53058867;
  const dayMs = 1000 * 60 * 60 * 24;
  const cyclePosition = ((diffMs / dayMs) % lunarCycleDays + lunarCycleDays) % lunarCycleDays;
  const index = Math.round((cyclePosition / lunarCycleDays) * (PHASES.length - 1)) % PHASES.length;
  return PHASES[index];
}

export function buildCosmicDay(date: Date): CosmicDay {
  const dateKey = getDateKey(date);
  const phase = getMoonPhaseForDate(date);
  const events = KNOWN_EVENTS.filter((event) => event.dateKey === dateKey);
  const perfection = PERFECTED_POSITIONS[dateKey];

  return {
    dateKey,
    date,
    weekdayLabel: format(date, "EEEE", { locale: es }),
    shortLabel: format(date, "d MMM", { locale: es }),
    monthLabel: format(date, "LLLL", { locale: es }),
    moonPhase: phase.label,
    moonEmoji: phase.emoji,
    perfection,
    events,
  };
}

export function getCosmicSliderDays(anchor = new Date(), total = 10) {
  return Array.from({ length: total }, (_, index) => buildCosmicDay(addDays(anchor, index)));
}

export function getWeeklyCosmicDays(anchor = new Date()) {
  const start = startOfWeek(anchor, { weekStartsOn: 1 });
  const end = endOfWeek(anchor, { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end }).map(buildCosmicDay);
}

export function getMonthlyCosmicDays(anchor = new Date()) {
  const monthStart = startOfMonth(anchor);
  const monthEnd = endOfMonth(anchor);
  const start = startOfWeek(monthStart, { weekStartsOn: 1 });
  const end = endOfWeek(monthEnd, { weekStartsOn: 1 });

  return eachDayOfInterval({ start, end }).map((date) => ({
    ...buildCosmicDay(date),
    inCurrentMonth: isSameMonth(date, anchor),
  }));
}

export function isToday(date: Date) {
  return isSameDay(date, new Date());
}

export function getPhaseBackgroundUrl(phaseLabel: string): string {
  const map: Record<string, string> = {
    "Luna nueva": "black",
    "Creciente fina": "/moon-waxing.png",
    "Cuarto creciente": "/moon-waxing.png",
    "Luna llena": "/moon-full.png",
    "Cuarto menguante": "/moon-waning.png",
    "Menguante fina": "/moon-waning.png",
  };
  return map[phaseLabel] || "/moon-full.png";
}

function getPerfectionDateTimeBuenosAires(dateKey: string, timeBuenosAires: string): Date | null {
  const [year, month, day] = dateKey.split("-").map((part) => parseInt(part, 10));
  const [hours, minutes] = timeBuenosAires.split(":").map((part) => parseInt(part, 10));
  if ([year, month, day, hours, minutes].some((value) => Number.isNaN(value))) {
    return null;
  }

  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

export function getNextEvent(date: Date): { date: Date; perfection: CosmicPerfection } | null {
  const rangeStart = new Date(date);
  const rangeEnd = addDays(rangeStart, 90);
  const perfections = getMoonPerfectionsForRange(rangeStart, rangeEnd);

  const nextNewMoon = Object.entries(perfections)
    .filter(([, perfection]) => perfection.label === "Luna nueva")
    .map(([dateKey, perfection]) => {
      const eventDateTime = getPerfectionDateTimeBuenosAires(dateKey, perfection.timeBuenosAires);
      return eventDateTime ? { date: eventDateTime, perfection } : null;
    })
    .filter((entry): entry is { date: Date; perfection: CosmicPerfection } => Boolean(entry))
    .filter((entry) => entry.date.getTime() >= date.getTime())
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  return nextNewMoon[0] ?? null;
}

// Retorna cuántos días faltan entre two y from (ambas sin hora)
export function daysUntil(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export type MomentOfDay = "madrugada" | "mañana" | "tarde" | "noche";

export function getMomentOfDay(date: Date = new Date()): MomentOfDay {
  const h = date.getHours();
  if (h < 6) return "madrugada";
  if (h < 12) return "mañana";
  if (h < 19) return "tarde";
  return "noche";
}

export interface TodayCosmicContext {
  day: CosmicDay;
  momentOfDay: MomentOfDay;
  nextEvent: { date: Date; perfection: CosmicPerfection; daysAway: number } | null;
  // Frases editoriales generadas según la fase lunar actual
  lunarPhrase: string;
  lunarSubphrase: string;
}

const LUNAR_PHRASES: Record<string, { phrase: string; subphrase: string }> = {
  "Luna nueva": {
    phrase: "Es tiempo de sembrar",
    subphrase: "La oscuridad es el lienzo. Cualquier intención que plantes hoy tiene todo el ciclo para crecer.",
  },
  "Creciente fina": {
    phrase: "La intención toma forma",
    subphrase: "El deseo empieza a moverse. Es buen momento para dar el primer paso, aunque sea pequeño.",
  },
  "Cuarto creciente": {
    phrase: "Momento de acción",
    subphrase: "La luna crece y vos también. Lo que pusiste en movimiento pide decisión ahora.",
  },
  "Luna llena": {
    phrase: "Todo se ilumina",
    subphrase: "Noche de máxima energía. Lo que sembraste en luna nueva está maduro — nombralo, celébralo, soltalo.",
  },
  "Cuarto menguante": {
    phrase: "Es tiempo de soltar",
    subphrase: "La luna mengua y con ella lo que ya no necesitás. Aflojá el control, confía en el proceso.",
  },
  "Menguante fina": {
    phrase: "Cierre y descanso",
    subphrase: "El ciclo se completa. Un momento de quietud antes de la próxima luna nueva.",
  },
};

export function getTodayCosmicContext(now: Date = new Date()): TodayCosmicContext {
  const day = buildCosmicDay(now);
  const momentOfDay = getMomentOfDay(now);
  const next = getNextEvent(now);
  const nextEvent = next
    ? { ...next, daysAway: daysUntil(now, next.date) }
    : null;

  const phrases = LUNAR_PHRASES[day.moonPhase] ?? {
    phrase: "El cosmos te acompaña",
    subphrase: "Cada momento es una oportunidad para conectar con tu intención.",
  };

  return {
    day,
    momentOfDay,
    nextEvent,
    lunarPhrase: phrases.phrase,
    lunarSubphrase: phrases.subphrase,
  };
}

// Retorna un identificador de fase para calcular rachas lunares
// (luna nueva = 0, cuarto creciente = 1, luna llena = 2, cuarto menguante = 3)
export function getLunarPhaseId(date: Date): number {
  const knownNewMoon = new Date("2026-03-19T00:00:00-03:00");
  const diffMs = date.getTime() - knownNewMoon.getTime();
  const lunarCycleDays = 29.53058867;
  const dayMs = 1000 * 60 * 60 * 24;
  const cyclePosition = ((diffMs / dayMs) % lunarCycleDays + lunarCycleDays) % lunarCycleDays;
  // 4 fases de ~7.38 días cada una
  return Math.floor((cyclePosition / lunarCycleDays) * 4) % 4;
}

// Retorna un string único por fase lunar (ej: "2026-fase-2") para agrupar rachas
export function getLunarPhaseKey(date: Date): string {
  const knownNewMoon = new Date("2026-03-19T00:00:00-03:00");
  const diffMs = date.getTime() - knownNewMoon.getTime();
  const lunarCycleDays = 29.53058867;
  const dayMs = 1000 * 60 * 60 * 24;
  const totalDays = diffMs / dayMs;
  const cycleNumber = Math.floor(totalDays / lunarCycleDays);
  const phaseId = getLunarPhaseId(date);
  return `cycle${cycleNumber}-phase${phaseId}`;
}
