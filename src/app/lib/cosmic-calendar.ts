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

export function getNextEvent(date: Date): { date: Date; perfection: CosmicPerfection } | null {
  const dtStr = getDateKey(date);
  const dateKeys = Object.keys(PERFECTED_POSITIONS).sort();
  for (const key of dateKeys) {
    if (key > dtStr) {
      const parts = key.split("-");
      if (parts.length === 3) {
        const eventDate = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
        return { date: eventDate, perfection: PERFECTED_POSITIONS[key] };
      }
    }
  }
  return null;
}

