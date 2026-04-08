type CandleColor =
  | "Blanca"
  | "Negra"
  | "Roja"
  | "Rosa"
  | "Verde"
  | "Azul"
  | "Amarilla"
  | "Violeta"
  | "Naranja"
  | "Dorada"
  | "Plateada";

export interface CandleGuide {
  color: CandleColor;
  meaning: string;
  instruction: string;
}

const CANDLE_MAP: Array<{
  color: CandleColor;
  meaning: string;
  matches: string[];
}> = [
  {
    color: "Dorada",
    meaning: "éxito, expansión, merecimiento",
    matches: ["dorado", "dorada", "oro", "exito", "éxito", "brillo", "merecimiento"],
  },
  {
    color: "Plateada",
    meaning: "intuición, sensibilidad, guía interna",
    matches: ["plateado", "plateada", "plata", "intuicion", "intuición", "sueño", "sueno", "lunar"],
  },
  {
    color: "Negra",
    meaning: "protección, absorción, corte",
    matches: ["proteccion", "proteger", "corte", "cortar", "cerrar ciclo", "soltar", "absorber"],
  },
  {
    color: "Rosa",
    meaning: "amor, vínculo, suavidad",
    matches: ["amor", "amor propio", "vinculo", "vínculo", "suavidad", "ternura", "cariño"],
  },
  {
    color: "Verde",
    meaning: "crecimiento, salud, abundancia",
    matches: ["crecimiento", "salud", "abundancia", "dinero", "prosper", "sanar", "sanacion", "sanación"],
  },
  {
    color: "Azul",
    meaning: "calma, comunicación, paz",
    matches: ["calma", "paz", "comunic", "seren", "respira", "descanso"],
  },
  {
    color: "Amarilla",
    meaning: "mente, enfoque, creatividad",
    matches: ["mente", "enfoque", "creativ", "idea", "claridad mental", "concentr"],
  },
  {
    color: "Violeta",
    meaning: "transformación, espiritualidad",
    matches: ["transform", "espiritual", "intuicion", "intuición", "ritual", "energia", "energía"],
  },
  {
    color: "Naranja",
    meaning: "impulso, motivación, cambio",
    matches: ["impulso", "motiv", "cambio", "avanzar", "movimiento", "oportunidad"],
  },
  {
    color: "Roja",
    meaning: "fuerza, deseo, acción",
    matches: ["fuerza", "deseo", "accion", "acción", "poder", "coraje", "valent"],
  },
  {
    color: "Blanca",
    meaning: "limpieza, claridad, neutralidad",
    matches: ["limpieza", "claridad", "neutral", "orden", "presencia"],
  },
];

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function deriveCandleGuide(input: {
  ritualType?: string;
  intention?: string;
  energy?: string;
  title?: string;
  opening?: string;
  symbolicAction?: string;
  closing?: string;
}): CandleGuide {
  const haystack = normalizeText(
    [
      input.ritualType,
      input.intention,
      input.energy,
      input.title,
      input.opening,
      input.symbolicAction,
      input.closing,
    ]
      .filter(Boolean)
      .join(" "),
  );

  const match =
    CANDLE_MAP.find((option) =>
      option.matches.some((keyword) => haystack.includes(normalizeText(keyword))),
    ) || CANDLE_MAP[CANDLE_MAP.length - 1];

  return {
    color: match.color,
    meaning: match.meaning,
    instruction: `Prendé una vela ${match.color.toLowerCase()} al iniciar el ritual. Dejá que su luz acompañe tu intención durante toda la práctica.`,
  };
}
