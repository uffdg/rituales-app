import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { useRitual } from "../context/RitualContext";
import { ProgressBar } from "../components/ProgressBar";
import { ANCHOR_SUGGESTIONS } from "../data/rituals";

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
    navigate("/ritual/nuevo");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(0,0,0,0.04) 0%, transparent 60%)",
        }}
      />

      <ProgressBar step={5} onBack={() => navigate("/crear/4")} />

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1 px-6 pb-10 overflow-y-auto"
      >
        {/* Step label */}
        <p
          className="mb-3 text-[#AAA]"
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          Paso 5 — Anclaje real
        </p>

        <h2
          style={{
            fontFamily: "Cormorant Garamond, serif",
            fontSize: "28px",
            fontWeight: 400,
            color: "#0A0A0A",
            lineHeight: 1.25,
            marginBottom: "8px",
          }}
        >
          Para que esto{" "}
          <em style={{ fontStyle: "italic", fontWeight: 300 }}>aterrice</em>,
          <br />
          ¿qué acción real harás?
        </h2>

        <p
          className="text-[#999] mb-8"
          style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 300, lineHeight: 1.6 }}
        >
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
              className="w-full p-4 rounded-2xl border border-[rgba(0,0,0,0.1)] bg-[#FAFAFA] text-[#0A0A0A] placeholder-[#CCC] resize-none focus:outline-none focus:border-[rgba(0,0,0,0.3)] transition-colors"
              style={{
                fontFamily: "Cormorant Garamond, serif",
                fontSize: "17px",
                fontWeight: 300,
                lineHeight: 1.5,
              }}
            />
            <AnimatePresence>
              {isGenerating && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 rounded-2xl flex items-center justify-center bg-[rgba(255,255,255,0.92)]"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-[#0A0A0A]"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </div>
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#666" }}>
                      Generando...
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Suggestion chips */}
        <div className="mb-5">
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "12px",
              color: "#BBB",
              marginBottom: "10px",
            }}
          >
            Sugerencias rápidas
          </p>
          <div className="flex flex-wrap gap-2">
            {ANCHOR_SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setAnchor(s)}
                className={`px-4 py-1.5 rounded-full border text-sm transition-all ${
                  anchor === s
                    ? "bg-[#0A0A0A] border-[#0A0A0A] text-white"
                    : "bg-white border-[rgba(0,0,0,0.12)] text-[#555] hover:border-[rgba(0,0,0,0.25)]"
                }`}
                style={{ fontFamily: "Inter, sans-serif", fontSize: "13px" }}
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
          className="w-full py-3 px-5 border border-dashed border-[rgba(0,0,0,0.15)] rounded-xl text-[#666] hover:border-[rgba(0,0,0,0.3)] hover:text-[#0A0A0A] transition-all mb-8 flex items-center justify-center gap-2"
          style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 300 }}
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
          className={`w-full py-4 px-6 rounded-2xl transition-all active:scale-[0.98] ${
            anchor.trim()
              ? "bg-[#0A0A0A] text-white hover:bg-[#1A1A1A]"
              : "bg-[#F0F0F0] text-[#BBB] cursor-not-allowed"
          }`}
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "15px",
            fontWeight: 400,
            letterSpacing: "0.03em",
          }}
        >
          Finalizar ritual
        </button>
      </motion.div>
    </div>
  );
}
