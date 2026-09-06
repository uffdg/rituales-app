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
    opening: "Cierra los ojos. Toma tres respiraciones profundas, soltando con cada exhalación lo que no necesitas ahora. Cuando sientas tu cuerpo un poco más suave, estás segura para comenzar.",
    symbolicAction: "Llena un vaso con agua limpia. Sosténlo entre tus manos. Observa el agua — sin agitación, transparente, receptiva. Bebe lentamente en tres sorbos, como si bebieras claridad.",
    closing: "Cierra los ojos una vez más. Di en silencio: \"Gracias por lo que ya está tomando forma\". Quédate así 30 segundos. Eso fue suficiente.",
  },
  {
    title: "Ritual de soltura y apertura",
    opening: "Párate con los pies bien apoyados en el suelo. Respira hondo. Imagina que con cada exhalación, te sientes más liviana.",
    symbolicAction: "Escribe en papel lo que quieres dejar ir o lo que quieres recibir. Una sola frase, sin editar. Luego dóblalo y guárdalo en un lugar que veas.",
    closing: "Lee lo que escribiste en voz baja. Di: \"Confío en el proceso\". Dobla el papel. Ya terminó. Ya empezó.",
  },
  {
    title: "Ritual de conexión simple",
    opening: "Siéntate cómoda. Coloca una mano en tu corazón. Siente tu latido durante unos segundos. Estás aquí.",
    symbolicAction: "Toma algo de la naturaleza — una hoja, una piedra, agua, sal — y sostenlo. Piensa en tu intención como si ya estuviera cumplida. Visualízala concreta, específica.",
    closing: "Deja el objeto en tu mesa o escritorio. Cada vez que lo veas hoy, recuerda tu intención. Di: \"Ya está en movimiento\".",
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
        opening: "Cierra los ojos. Respira profundo tres veces.",
        symbolicAction: "Toma un vaso de agua. Bébelo lentamente pensando en lo que quieres.",
        closing: "Di en voz baja: \"Confío en mi proceso\". Abre los ojos.",
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
    <div className="min-h-screen bg-white flex flex-col">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(0,0,0,0.04) 0%, transparent 60%)",
        }}
      />

      <ProgressBar step={4} onBack={() => navigate("/crear/3")} />

      <div className="flex-1 px-6 pb-10 overflow-y-auto relative z-10">
        {/* Step label */}
        <p
          className="mb-3 text-[var(--ink-soft)]"
          style={{
            fontFamily: "var(--font-sans-ui)",
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          Paso 4 — Ingredientes del ritual
        </p>

        {/* Loading state */}
        <AnimatePresence>
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div
                className="relative mb-6"
                style={{ width: 64, height: 64 }}
              >
                <motion.div
                  className="absolute inset-0 rounded-full border border-[var(--ink-strong)]"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="absolute inset-0 rounded-full border border-[rgba(0,0,0,0.15)]" />
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
              <p
                style={{
                  fontFamily: "var(--font-serif-display)",
                  fontSize: "20px",
                  fontWeight: 300,
                  color: "var(--ink-strong)",
                  marginBottom: "4px",
                }}
              >
                Creando tu ritual...
              </p>
              <p
                style={{
                  fontFamily: "var(--font-sans-ui)",
                  fontSize: "12px",
                  color: "var(--ink-soft)",
                  fontWeight: 300,
                }}
              >
                Un momento
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error state */}
        {!isGenerating && generateError && (
          <div className="py-8 text-center">
            <p style={{ fontFamily: "var(--font-sans-ui)", fontSize: "13px", color: "#B42318", marginBottom: "16px" }}>
              {generateError}
            </p>
            <button
              onClick={handleGenerateRitual}
              className="px-5 py-2 rounded-full border border-[rgba(0,0,0,0.15)] text-[var(--ink-muted)]"
              style={{ fontFamily: "var(--font-sans-ui)", fontSize: "13px" }}
            >
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
              {/* Title */}
              <h2
                style={{
                  fontFamily: "var(--font-serif-display)",
                  fontSize: "26px",
                  fontWeight: 400,
                  color: "var(--ink-strong)",
                  lineHeight: 1.3,
                  marginBottom: "18px",
                }}
              >
                {currentRitual.title}
              </h2>

              {/* Recipe ingredients */}
              <div className="mb-5">
                <div className="mb-3 flex items-end justify-between gap-3">
                  <div>
                    <p
                      style={{
                        fontFamily: "var(--font-sans-ui)",
                        fontSize: "10px",
                        fontWeight: 500,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "var(--ink-soft)",
                        marginBottom: "6px",
                      }}
                    >
                      Vas a necesitar
                    </p>
                    <p
                      style={{
                        fontFamily: "var(--font-sans-ui)",
                        fontSize: "13px",
                        fontWeight: 300,
                        lineHeight: 1.5,
                        color: "var(--ink-muted)",
                      }}
                    >
                      Juntá estos elementos. Después armamos el ritual completo con ellos.
                    </p>
                  </div>
                  <span
                    className="shrink-0 rounded-full border border-[rgba(0,0,0,0.08)] px-2.5 py-1"
                    style={{
                      fontFamily: "var(--font-sans-ui)",
                      fontSize: "11px",
                      color: "var(--ink-soft)",
                    }}
                  >
                    {ritualIngredients.length}
                  </span>
                </div>

                <div className="overflow-hidden rounded-2xl border border-[rgba(0,0,0,0.07)]">
                  {ritualIngredients.map((item, index) => (
                    <motion.div
                      key={`${item.name}-${index}`}
                      className={`grid grid-cols-[74px_1fr] gap-3 px-4 py-3 ${
                        index > 0 ? "border-t border-[rgba(0,0,0,0.06)]" : ""
                      }`}
                      layout
                    >
                      <p
                        style={{
                          fontFamily: "var(--font-sans-ui)",
                          fontSize: "12px",
                          fontWeight: 500,
                          color: "var(--ink-muted)",
                          lineHeight: 1.4,
                        }}
                      >
                        {item.quantity}
                      </p>
                      <div>
                        <p
                          style={{
                            fontFamily: "var(--font-sans-ui)",
                            fontSize: "14px",
                            fontWeight: 500,
                            color: "var(--ink-strong)",
                            lineHeight: 1.35,
                            marginBottom: "2px",
                          }}
                        >
                          {item.name}
                        </p>
                        <p
                          style={{
                            fontFamily: "var(--font-sans-ui)",
                            fontSize: "12px",
                            fontWeight: 300,
                            color: "var(--ink-muted)",
                            lineHeight: 1.45,
                          }}
                        >
                          {item.note}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* AI action buttons */}
              <div className="flex gap-2 mb-8 flex-wrap">
                <button
                  onClick={() => handleGenerateRitual()}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[rgba(0,0,0,0.12)] text-[var(--ink-muted)] hover:border-[rgba(0,0,0,0.3)] transition-all"
                  style={{ fontFamily: "var(--font-sans-ui)", fontSize: "12px" }}
                >
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M5.5 1L6.8 4.2L10 5.5L6.8 6.8L5.5 10L4.2 6.8L1 5.5L4.2 4.2L5.5 1Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
                  </svg>
                  Regenerar
                </button>
                <button
                  onClick={handleSimplify}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[rgba(0,0,0,0.12)] text-[var(--ink-muted)] hover:border-[rgba(0,0,0,0.3)] transition-all"
                  style={{ fontFamily: "var(--font-sans-ui)", fontSize: "12px" }}
                >
                  Hacerlo más simple
                </button>
                <button
                  onClick={() => setShowVersions(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[rgba(0,0,0,0.12)] text-[var(--ink-muted)] hover:border-[rgba(0,0,0,0.3)] transition-all"
                  style={{ fontFamily: "var(--font-sans-ui)", fontSize: "12px" }}
                >
                  Dame 3 versiones
                </button>
              </div>

              {/* CTA */}
              <button
                onClick={handleNext}
                className="editorial-action-button editorial-action-button-primary"
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
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setShowVersions(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-white rounded-t-3xl z-50 p-6 pb-10"
              style={{ maxHeight: "80vh", overflowY: "auto" }}
            >
              <div className="w-10 h-1 bg-[#E0E0E0] rounded-full mx-auto mb-6" />
              <p
                style={{
                  fontFamily: "var(--font-serif-display)",
                  fontSize: "22px",
                  fontWeight: 400,
                  marginBottom: "16px",
                  color: "var(--ink-strong)",
                }}
              >
                Elige una versión
              </p>
              <div className="flex flex-col gap-3">
                {RITUAL_VERSIONS.map((v, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectVersion(v)}
                    className="text-left p-4 border border-[rgba(0,0,0,0.08)] rounded-2xl hover:border-[rgba(0,0,0,0.2)] transition-all"
                  >
                    <p
                      style={{
                        fontFamily: "var(--font-serif-display)",
                        fontSize: "17px",
                        fontWeight: 500,
                        color: "var(--ink-strong)",
                        marginBottom: "4px",
                      }}
                    >
                      {v.title}
                    </p>
                    <p
                      style={{
                        fontFamily: "var(--font-sans-ui)",
                        fontSize: "12px",
                        fontWeight: 300,
                        color: "var(--ink-subtle)",
                        lineHeight: 1.5,
                        WebkitLineClamp: 2,
                        display: "-webkit-box",
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {v.opening}
                    </p>
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
