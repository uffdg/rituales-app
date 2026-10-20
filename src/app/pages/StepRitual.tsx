import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { useRitual } from "../context/RitualContext";
import { ProgressBar } from "../components/ProgressBar";
import { generateRitual } from "../lib/ritual-service";
import { deriveCandleGuide } from "../lib/candle";
import { track } from "../lib/analytics";
import { getUserFacingErrorMessage } from "../lib/errors";

const RITUAL_VERSIONS = [
  {
    title: "Ritual de presencia plena",
    opening: "Cerrá los ojos. Hacé tres respiraciones profundas, soltando con cada exhalación lo que no necesitás ahora. Cuando sientas tu cuerpo un poco más suave, estás segura para comenzar.",
    symbolicAction: "Llená un vaso con agua limpia. Sostenelo entre tus manos. Observá el agua — sin agitación, transparente, receptiva. Tomala lentamente en tres sorbos, como si tomaras claridad.",
    closing: "Cerrá los ojos una vez más. Decí en silencio: \"Gracias por lo que ya está tomando forma\". Quedate así 30 segundos. Eso fue suficiente.",
  },
  {
    title: "Ritual de soltura y apertura",
    opening: "Parate con los pies bien apoyados en el suelo. Respirá hondo. Imaginá que con cada exhalación te sentís más liviana.",
    symbolicAction: "Escribí en papel lo que querés dejar ir o lo que querés recibir. Una sola frase, sin editar. Después doblalo y guardalo en un lugar que veas.",
    closing: "Leé en voz baja lo que escribiste. Decí: \"Confío en el proceso\". Doblá el papel. Ya terminó. Ya empezó.",
  },
  {
    title: "Ritual de conexión simple",
    opening: "Sentate cómoda. Apoyá una mano en tu corazón. Sentí tu latido durante unos segundos. Estás acá.",
    symbolicAction: "Tomá algo de la naturaleza — una hoja, una piedra, agua, sal — y sostenelo. Pensá en tu intención como si ya estuviera cumplida. Visualizala concreta, específica.",
    closing: "Dejá el objeto en tu mesa o escritorio. Cada vez que lo veas hoy, recordá tu intención. Decí: \"Ya está en movimiento\".",
  },
];

interface RitualIngredient {
  name: string;
  quantity: string;
  note: string;
}

const INGREDIENT_PATTERNS: Array<{
  name: string;
  quantity: string;
  note: string;
  matches: string[];
}> = [
  { name: "Papel", quantity: "1 hoja", note: "Para escribir o representar la intención.", matches: ["papel", "hoja"] },
  { name: "Lapicera", quantity: "1", note: "Para nombrar la intención con tus palabras.", matches: ["escribe", "escribi", "escribí", "anota", "anotá", "frase"] },
  { name: "Agua", quantity: "1 vaso", note: "Para limpiar, beber o acompañar el gesto.", matches: ["agua", "vaso", "bebe", "bebé", "beber"] },
  { name: "Cuenco", quantity: "1", note: "Para contener agua, sal, hierbas o el papel.", matches: ["cuenco", "recipiente", "bowl"] },
  { name: "Plato pequeño", quantity: "1", note: "Para apoyar la vela o dejar el objeto del ritual.", matches: ["plato", "apoya", "apoyá", "deja", "dejá", "mesa"] },
  { name: "Sal", quantity: "1 pizca", note: "Para marcar limpieza, protección o límite.", matches: ["sal", "limpia", "limpiá", "limpieza", "proteccion", "protección"] },
  { name: "Piedra", quantity: "1", note: "Para usar como ancla física de la intención.", matches: ["piedra", "objeto", "ancla"] },
  { name: "Hoja seca", quantity: "1", note: "Para simbolizar lo que querés soltar o mover.", matches: ["hoja seca", "hoja", "naturaleza"] },
  { name: "Aceite", quantity: "Unas gotas", note: "Para preparar la vela o cargar el gesto.", matches: ["aceite", "ungir", "untá", "unta"] },
  { name: "Romero", quantity: "1 ramita", note: "Hierba de limpieza, foco y protección.", matches: ["romero"] },
  { name: "Lavanda", quantity: "1 ramita", note: "Hierba de calma, suavidad y descanso.", matches: ["lavanda"] },
  { name: "Laurel", quantity: "1 hoja", note: "Hierba de claridad, pedido y dirección.", matches: ["laurel"] },
  { name: "Canela", quantity: "1 pizca", note: "Para intención de impulso, abundancia o calor.", matches: ["canela"] },
  { name: "Hilo o cinta", quantity: "1 tramo", note: "Para atar, cerrar o sellar una intención.", matches: ["hilo", "cinta", "ata", "atá", "nudo"] },
];

function normalizeIngredientText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function addUniqueIngredient(items: RitualIngredient[], item: RitualIngredient) {
  if (items.some((existing) => existing.name === item.name)) return;
  items.push(item);
}

function deriveRitualIngredients(input: {
  ritualType?: string;
  intention?: string;
  energy?: string;
  element?: string;
  opening?: string;
  symbolicAction?: string;
  closing?: string;
  candleGuide?: ReturnType<typeof deriveCandleGuide> | null;
}) {
  const haystack = normalizeIngredientText(
    [
      input.ritualType,
      input.intention,
      input.energy,
      input.element,
      input.opening,
      input.symbolicAction,
      input.closing,
    ].filter(Boolean).join(" "),
  );

  const ingredients: RitualIngredient[] = [];

  if (input.candleGuide) {
    addUniqueIngredient(ingredients, {
      name: `Vela ${input.candleGuide.color.toLowerCase()}`,
      quantity: "1",
      note: input.candleGuide.meaning,
    });
    addUniqueIngredient(ingredients, {
      name: "Fósforos o encendedor",
      quantity: "1",
      note: "Para prender la vela al inicio.",
    });
  }

  INGREDIENT_PATTERNS.forEach((item) => {
    if (item.matches.some((match) => haystack.includes(normalizeIngredientText(match)))) {
      addUniqueIngredient(ingredients, {
        name: item.name,
        quantity: item.quantity,
        note: item.note,
      });
    }
  });

  if (ingredients.length < 4) {
    const element = normalizeIngredientText(input.element || "");
    if (element.includes("agua")) {
      addUniqueIngredient(ingredients, { name: "Agua", quantity: "1 vaso", note: "Para acompañar el ritual desde lo sensible." });
      addUniqueIngredient(ingredients, { name: "Cuenco", quantity: "1", note: "Para contener el agua durante la práctica." });
    } else if (element.includes("tierra")) {
      addUniqueIngredient(ingredients, { name: "Piedra", quantity: "1", note: "Para dar peso y cuerpo a la intención." });
      addUniqueIngredient(ingredients, { name: "Plato pequeño", quantity: "1", note: "Para dejar apoyado el ancla del ritual." });
    } else if (element.includes("aire")) {
      addUniqueIngredient(ingredients, { name: "Papel", quantity: "1 hoja", note: "Para escribir algo breve y dejarlo moverse." });
      addUniqueIngredient(ingredients, { name: "Lapicera", quantity: "1", note: "Para nombrar la intención." });
    } else {
      addUniqueIngredient(ingredients, { name: "Papel", quantity: "1 hoja", note: "Para escribir la intención." });
      addUniqueIngredient(ingredients, { name: "Plato pequeño", quantity: "1", note: "Para ordenar los elementos antes de empezar." });
    }
  }

  return ingredients.slice(0, 7);
}

export function StepRitual() {
  const navigate = useNavigate();
  const { ritual, updateRitual } = useRitual();
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentRitual, setCurrentRitual] = useState(ritual.aiRitual?.title ? ritual.aiRitual : null);
  const [guidedSession, setGuidedSession] = useState(ritual.guidedSession || null);
  const [showVersions, setShowVersions] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [editedTexts, setEditedTexts] = useState({
    title: "",
    opening: "",
    symbolicAction: "",
    closing: "",
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleGenerateRitual = async () => {
    setIsGenerating(true);
    setGenerateError("");

    try {
      const result = await generateRitual(ritual);
      setCurrentRitual(result.ritual);
      setGuidedSession(result.guidedSession);
      setEditedTexts(result.ritual);
      updateRitual({
        ritualId: result.ritualId,
        aiRitual: result.ritual,
        guidedSession: result.guidedSession,
        guidedAudio: result.guidedAudio || { status: "idle" },
      });
      track("ritual_created", {
        ritualId: result.ritualId,
        ritualType: ritual.ritualType,
        duration: ritual.duration,
      });
    } catch (err) {
      setGenerateError(getUserFacingErrorMessage(err, "No se pudo generar el ritual."));
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (!currentRitual || !currentRitual.title) {
      handleGenerateRitual();
    } else {
      setEditedTexts(currentRitual);
    }
  }, []);

  const handleSimplify = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const simple = {
        title: "Ritual breve de intención",
        opening: "Cerrá los ojos. Respirá profundo tres veces.",
        symbolicAction: "Tomá un vaso de agua despacio, pensando en lo que querés.",
        closing: "Decí en voz baja: \"Confío en mi proceso\". Abrí los ojos.",
      };
      setCurrentRitual(simple);
      setEditedTexts(simple);
      setGuidedSession((prev) =>
        prev
          ? {
              ...prev,
              personalizedScript: `${simple.opening} ${simple.symbolicAction} ${simple.closing}`,
            }
          : prev,
      );
      setIsGenerating(false);
    }, 1400);
  };

  const handleSelectVersion = (v: (typeof RITUAL_VERSIONS)[0]) => {
    setCurrentRitual(v);
    setEditedTexts(v);
    setGuidedSession((prev) =>
      prev
        ? {
            ...prev,
            personalizedScript: `${v.opening} ${v.symbolicAction} ${v.closing}`,
          }
        : prev,
    );
    setShowVersions(false);
  };

  const handleNext = () => {
    const finalRitual = editedTexts.title ? editedTexts : currentRitual;
    updateRitual({
      aiRitual: finalRitual as any,
      guidedSession: guidedSession || undefined,
    });
    navigate("/crear/5");
  };

  const finalTexts = editedTexts.title ? editedTexts : currentRitual;
  const candleGuide = finalTexts
    ? deriveCandleGuide({
        ritualType: ritual.ritualType,
        intention: ritual.intention,
        energy: ritual.energy,
        title: finalTexts.title,
        opening: finalTexts.opening,
        symbolicAction: finalTexts.symbolicAction,
        closing: finalTexts.closing,
      })
    : null;
  const ritualIngredients = finalTexts
    ? deriveRitualIngredients({
        ritualType: ritual.ritualType,
        intention: ritual.intention,
        energy: ritual.energy,
        element: ritual.element,
        opening: finalTexts.opening,
        symbolicAction: finalTexts.symbolicAction,
        closing: finalTexts.closing,
        candleGuide,
      })
    : [];

  return (
    <div className="min-h-screen bg-surface-page flex flex-col">
      <div className="editorial-radial-wash" aria-hidden="true" />

      <ProgressBar step={4} onBack={() => navigate("/crear/3")} />

      <div className="flex-1 px-6 pb-10 overflow-y-auto relative z-10">
        <p className="editorial-eyebrow editorial-step-label">Paso 4 — Ingredientes del ritual</p>

        {/* Loading state */}
        <AnimatePresence>
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
              role="status"
              aria-live="polite"
            >
              <div className="relative mb-6 h-16 w-16" aria-hidden="true">
                <motion.div
                  className="absolute inset-0 rounded-full border border-ink-strong"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="absolute inset-0 rounded-full border border-line-strong" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path
                      d="M9 1L11 7L17 9L11 11L9 17L7 11L1 9L7 7L9 1Z"
                      stroke="var(--ink-strong)"
                      strokeWidth="1"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
              <p className="mb-1 font-serif text-title-3 text-ink-strong">Creando tu ritual…</p>
              <p className="font-sans text-body text-ink-muted">Un momento</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error state */}
        {!isGenerating && generateError && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <p className="editorial-error justify-center" role="alert">
              {generateError}
            </p>
            <button type="button" onClick={handleGenerateRitual} className="editorial-pill-button bg-surface-base">
              Reintentar
            </button>
          </div>
        )}

        {/* Ritual content */}
        <AnimatePresence>
          {!isGenerating && currentRitual && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="editorial-step-title">{currentRitual.title}</h2>

              {/* Recipe ingredients */}
              <div className="mb-5">
                <div className="mb-3 flex items-end justify-between gap-3">
                  <div>
                    <p className="editorial-eyebrow mb-1.5">Vas a necesitar</p>
                    <p className="font-sans text-body text-ink-muted">
                      Juntá estos elementos. Después armamos el ritual completo con ellos.
                    </p>
                  </div>
                  <span className="editorial-badge shrink-0" aria-label={`${ritualIngredients.length} elementos`}>
                    {ritualIngredients.length}
                  </span>
                </div>

                <div className="overflow-hidden rounded-md border border-line-soft bg-surface-base">
                  {ritualIngredients.map((item, index) => (
                    <motion.div
                      key={`${item.name}-${index}`}
                      className={`grid grid-cols-[74px_1fr] gap-3 px-4 py-3 ${
                        index > 0 ? "border-t border-line-soft" : ""
                      }`}
                      layout
                    >
                      <p className="font-sans text-body font-medium text-ink-muted">{item.quantity}</p>
                      <div>
                        <p className="mb-0.5 font-sans text-label font-medium leading-[1.35] text-ink-strong">{item.name}</p>
                        <p className="font-sans text-body text-ink-muted">{item.note}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* AI action buttons */}
              <div className="mb-8 flex flex-wrap gap-2">
                <button type="button" onClick={() => handleGenerateRitual()} className="editorial-pill-button bg-surface-base">
                  <svg width="12" height="12" viewBox="0 0 11 11" fill="none" aria-hidden="true">
                    <path d="M5.5 1L6.8 4.2L10 5.5L6.8 6.8L5.5 10L4.2 6.8L1 5.5L4.2 4.2L5.5 1Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
                  </svg>
                  Regenerar
                </button>
                <button type="button" onClick={handleSimplify} className="editorial-pill-button bg-surface-base">
                  Hacerlo más simple
                </button>
                <button type="button" onClick={() => setShowVersions(true)} className="editorial-pill-button bg-surface-base">
                  Dame 3 versiones
                </button>
              </div>

              {/* CTA */}
              <button
                type="button"
                onClick={handleNext}
                className="editorial-button editorial-button--primary editorial-button--lg"
              >
                Siguiente
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom sheet: 3 versions */}
      <AnimatePresence>
        {showVersions && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-scrim z-40"
              onClick={() => setShowVersions(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="editorial-sheet fixed bottom-0 left-1/2 z-50 max-h-[80vh] w-full max-w-[390px] -translate-x-1/2 overflow-y-auto p-6 pb-10"
              role="dialog"
              aria-label="Elegí una versión"
            >
              <div className="editorial-sheet-handle mb-6" />
              <p className="mb-4 font-serif text-title-3 text-ink-strong">Elegí una versión</p>
              <div className="flex flex-col gap-3">
                {RITUAL_VERSIONS.map((v, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectVersion(v)}
                    className="editorial-option flex-col items-start gap-1"
                  >
                    <span className="font-sans text-title-4 font-medium text-ink-strong">{v.title}</span>
                    <span className="line-clamp-2 font-sans text-body text-ink-muted">{v.opening}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
