import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { useRitual } from "../context/RitualContext";
import { ProgressBar } from "../components/ProgressBar";
import { ANCHOR_SUGGESTIONS } from "../data/rituals";
import { track } from "../lib/analytics";

export function StepAnchor() {
  const navigate = useNavigate();
  const { ritual, updateRitual } = useRitual();
  const [anchor, setAnchor] = useState(ritual.anchor || "");
  const [isGenerating, setIsGenerating] = useState(false);

  const AI_ANCHORS: Record<string, string> = {
    claridad: "Escribir en papel las dos opciones y decidir en los próximos 30 minutos",
    "amor-propio": "Mandar un mensaje a alguien que quiero, sin esperar nada",
    calma: "Salir a caminar 15 minutos sin el celular",
    enfoque: "Apagar las notificaciones y trabajar 1 hora sin interrupciones",
    "cerrar-ciclo": "Borrar o archivar algo que me recordaba eso que quiero soltar",
    atraer: "Mandar esa propuesta o mensaje que tenía pendiente",
  };

  const handleSuggestAnchor = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const suggestion =
        AI_ANCHORS[ritual.ritualType] ||
        "Hacer una sola cosa concreta relacionada con mi intención, hoy.";
      setAnchor(suggestion);
      setIsGenerating(false);
    }, 1200);
  };

  const handleFinish = () => {
    updateRitual({ anchor });
    track("ritual_completed", {
      ritualId: ritual.ritualId,
      ritualType: ritual.ritualType,
      duration: ritual.duration,
      hasAudio: !!ritual.guidedAudio?.audioUrl,
    });
    const isRealId = ritual.ritualId && !ritual.ritualId.startsWith("dev-") && !ritual.ritualId.startsWith("mock-");
    navigate(`/ritual/${isRealId ? ritual.ritualId : "nuevo"}`);
  };

  return (
    <div className="editorial-page-bg">
      <div className="editorial-radial-wash" />

      <ProgressBar step={5} onBack={() => navigate("/crear/4")} />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="editorial-content-scroll"
      >
        <p className="editorial-eyebrow editorial-step-label">
          Paso 5 — Anclaje real
        </p>

        <h2 className="editorial-step-title mb-2">
          Para que esto{" "}
          <em>aterrice</em>,
          <br />
          ¿qué acción real harás?
        </h2>

        <p className="editorial-helper mb-8">
          Un ritual sin acción concreta es solo un bello momento.
          <br />
          Un paso pequeño lo hace real.
        </p>

        {/* Text input */}
        <div className="mb-5">
          <div className="relative">
            <textarea
              value={anchor}
              onChange={(e) => setAnchor(e.target.value)}
              placeholder="Ej: Voy a mandar ese mensaje que tenía pendiente..."
              rows={3}
              className="editorial-textarea"
            />
            <AnimatePresence>
              {isGenerating && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 rounded-2xl flex items-center justify-center bg-white/90"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-[var(--ink-strong)]"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </div>
                    <span className="editorial-body-muted">Generando...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Suggestion chips */}
        <div className="mb-5">
          <p className="editorial-field-label mb-2.5">
            Sugerencias rápidas
          </p>
          <div className="flex flex-wrap gap-2">
            {ANCHOR_SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setAnchor(s)}
                className={`editorial-chip-outline ${anchor === s ? "editorial-chip-outline-active" : ""}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* AI button */}
        <button
          onClick={handleSuggestAnchor}
          disabled={isGenerating}
          className="editorial-dashed-action mb-8"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1L8.5 5.5L13 7L8.5 8.5L7 13L5.5 8.5L1 7L5.5 5.5L7 1Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
          </svg>
          Sugerirme un anclaje
        </button>

        {/* CTA */}
        <button
          onClick={handleFinish}
          disabled={!anchor.trim()}
          className={`editorial-action-button active:scale-[0.98] ${
            anchor.trim()
              ? "editorial-action-button-primary"
              : "editorial-action-button-disabled"
          }`}
        >
          Construir ritual
        </button>
      </motion.div>
    </div>
  );
}
