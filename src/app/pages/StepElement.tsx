import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { useRitual } from "../context/RitualContext";
import { ProgressBar } from "../components/ProgressBar";
import { ELEMENTS } from "../data/rituals";

const ELEMENT_STYLES: Record<string, { gradient: string; symbol: string }> = {
  tierra: {
    gradient: "radial-gradient(ellipse at 50% 80%, rgba(0,0,0,0.06) 0%, transparent 70%)",
    symbol: "▭",
  },
  agua: {
    gradient: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.05) 0%, transparent 70%)",
    symbol: "〜",
  },
  fuego: {
    gradient: "radial-gradient(ellipse at 50% 20%, rgba(0,0,0,0.07) 0%, transparent 70%)",
    symbol: "△",
  },
  aire: {
    gradient: "radial-gradient(ellipse at 80% 50%, rgba(0,0,0,0.05) 0%, transparent 70%)",
    symbol: "≋",
  },
};

export function StepElement() {
  const navigate = useNavigate();
  const { ritual, updateRitual } = useRitual();
  const [element, setElement] = useState(ritual.element || "");

  const handleNext = () => {
    updateRitual({ element });
    navigate("/crear/4");
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

      <ProgressBar step={3} onBack={() => navigate("/crear/2")} />

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
          Paso 3 — Elemento
        </p>

        <h2
          style={{
            fontFamily: "Cormorant Garamond, serif",
            fontSize: "28px",
            fontWeight: 400,
            color: "#0A0A0A",
            lineHeight: 1.25,
            marginBottom: "6px",
          }}
        >
          ¿Con qué{" "}
          <em style={{ fontStyle: "italic", fontWeight: 300 }}>energía natural</em>
          <br />
          quieres trabajar?
        </h2>

        <p
          className="text-[#999] mb-8"
          style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 300 }}
        >
          Cada elemento te acompaña de una manera distinta.
        </p>

        {/* Element cards — big */}
        <div className="flex flex-col gap-3 mb-8">
          {ELEMENTS.map((el, i) => {
            const isSelected = element === el.id;
            const style = ELEMENT_STYLES[el.id];
            return (
              <motion.button
                key={el.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                onClick={() => setElement(el.id)}
                className={`text-left rounded-2xl border overflow-hidden transition-all active:scale-[0.98] ${
                  isSelected
                    ? "border-[#0A0A0A]"
                    : "border-[rgba(0,0,0,0.08)] hover:border-[rgba(0,0,0,0.18)]"
                }`}
                style={{
                  background: isSelected
                    ? `linear-gradient(135deg, #0A0A0A 0%, #2A2A2A 100%)`
                    : "white",
                }}
              >
                <div className="p-5 relative overflow-hidden">
                  {/* Abstract gradient decoration */}
                  {!isSelected && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{ background: style.gradient }}
                    />
                  )}

                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          style={{
                            fontFamily: "Cormorant Garamond, serif",
                            fontSize: "22px",
                            fontWeight: 300,
                            color: isSelected ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.2)",
                          }}
                        >
                          {style.symbol}
                        </span>
                        <div>
                          <p
                            style={{
                              fontFamily: "Cormorant Garamond, serif",
                              fontSize: "20px",
                              fontWeight: 500,
                              color: isSelected ? "white" : "#0A0A0A",
                              lineHeight: 1,
                            }}
                          >
                            {el.label}
                          </p>
                          <p
                            style={{
                              fontFamily: "Inter, sans-serif",
                              fontSize: "11px",
                              fontWeight: 400,
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                              color: isSelected ? "rgba(255,255,255,0.5)" : "#AAA",
                            }}
                          >
                            {el.subtitle}
                          </p>
                        </div>
                      </div>
                      <p
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: "13px",
                          fontWeight: 300,
                          lineHeight: 1.5,
                          color: isSelected ? "rgba(255,255,255,0.7)" : "#666",
                        }}
                      >
                        {el.description}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="shrink-0 ml-3 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5L4 7L8 3" stroke="#0A0A0A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* CTA */}
        <button
          onClick={handleNext}
          disabled={!element}
          className={`w-full py-4 px-6 rounded-2xl transition-all active:scale-[0.98] ${
            element
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
