import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { useRitual } from "../context/RitualContext";
import { ProgressBar } from "../components/ProgressBar";

export function StepIntention() {
  const navigate = useNavigate();
  const { ritual, updateRitual } = useRitual();
  const [intention, setIntention] = useState(ritual.intention || "");
  const [isGenerating, setIsGenerating] = useState(false);

  const SUGGESTED_INTENTIONS: Record<string, string> = {
    Claridad: "Quiero tener claridad para tomar una decisión que lleva tiempo rondándome.",
    Calma: "Quiero soltar la tensión acumulada y sentirme en calma conmigo mismo/a.",
    "Amor propio": "Quiero reconectarme con lo que valoro de mí mismo/a hoy.",
    Enfoque: "Quiero concentrar mi energía en lo que realmente importa ahora.",
    Soltar: "Quiero dejar ir algo que ya no me sirve y que me tiene anclado/a.",
    Oportunidad: "Quiero abrirme a nuevas posibilidades que no puedo ver todavía.",
  };

  const handleSuggestIntention = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const typeMap: Record<string, string> = {
        claridad: "Claridad",
        calma: "Calma",
        "amor-propio": "Amor propio",
        enfoque: "Enfoque",
        "cerrar-ciclo": "Soltar",
        atraer: "Oportunidad",
      };
      const chip = typeMap[ritual.ritualType] || "Claridad";
      setIntention(SUGGESTED_INTENTIONS[chip]);
      setIsGenerating(false);
    }, 1400);
  };

  const handleNext = () => {
    updateRitual({ intention });
    navigate("/crear/2");
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

      <ProgressBar step={1} onBack={() => navigate("/onboarding")} />

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
          Paso 1 — Intención
        </p>

        <h2
          style={{
            fontFamily: "Cormorant Garamond, serif",
            fontSize: "28px",
            fontWeight: 400,
            color: "#0A0A0A",
            lineHeight: 1.25,
            marginBottom: "20px",
          }}
        >
          ¿Cuál es tu intención
          <br />
          <em style={{ fontStyle: "italic", fontWeight: 300 }}>para este ritual?</em>
        </h2>

        {/* Text field */}
        <div className="mb-5">
          <label
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "12px",
              fontWeight: 400,
              color: "#999",
              letterSpacing: "0.06em",
              display: "block",
              marginBottom: "8px",
              textTransform: "uppercase",
            }}
          >
            Mi intención
          </label>
          <div className="relative">
            <textarea
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              placeholder="Ej: Quiero tener claridad para decidir si cambio de trabajo..."
              rows={4}
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
                    <span
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "13px",
                        color: "#666",
                      }}
                    >
                      Generando...
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* AI button */}
        <button
          onClick={handleSuggestIntention}
          disabled={isGenerating}
          className="w-full py-3 px-5 border border-dashed border-[rgba(0,0,0,0.15)] rounded-xl text-[#666] hover:border-[rgba(0,0,0,0.3)] hover:text-[#0A0A0A] transition-all mb-8 flex items-center justify-center gap-2"
          style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 300 }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1L8.5 5.5L13 7L8.5 8.5L7 13L5.5 8.5L1 7L5.5 5.5L7 1Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
          </svg>
          Sugerirme una intención
        </button>

        {/* CTA */}
        <button
          onClick={handleNext}
          disabled={!intention.trim()}
          className={`w-full py-4 px-6 rounded-2xl transition-all active:scale-[0.98] ${
            intention.trim()
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
          Siguiente
        </button>
      </motion.div>
    </div>
  );
}