import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { useRitual } from "../context/RitualContext";
import { ProgressBar } from "../components/ProgressBar";
import { ELEMENTS } from "../data/rituals";

const ELEMENT_STYLES: Record<string, { symbol: string }> = {
  tierra: {
    symbol: "▭",
  },
  agua: {
    symbol: "〜",
  },
  fuego: {
    symbol: "△",
  },
  aire: {
    symbol: "≋",
  },
};

export function StepElement() {
  const navigate = useNavigate();
  const { ritual, updateRitual } = useRitual();
  const [element, setElement] = useState(ritual.element || "");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleNext = () => {
    updateRitual({ element });
    navigate("/crear/4");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="editorial-radial-wash" aria-hidden="true" />

      <ProgressBar step={3} onBack={() => navigate("/crear/2")} />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1 px-6 pb-10 overflow-y-auto"
      >
        <p className="editorial-eyebrow editorial-step-label">Paso 3 — Elemento</p>

        <h2 className="editorial-step-title mb-1.5">
          ¿Con qué <em className="italic font-light">energía natural</em>
          <br />
          querés trabajar?
        </h2>

        <p className="mb-8 font-sans text-body text-ink-muted">
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
                type="button"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                onClick={() => setElement(el.id)}
                aria-pressed={isSelected}
                className={`editorial-option-card active:scale-[0.98] p-5 ${isSelected ? "editorial-option-card-active" : ""}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <span className="font-serif text-title-3 font-light text-ink-decor" aria-hidden="true">
                        {style.symbol}
                      </span>
                      <div>
                        {/* Nombre del elemento: título de la opción, en serif de 20 */}
                        <p className="font-serif text-title-3 font-medium leading-none text-ink-strong">{el.label}</p>
                        <p className="editorial-eyebrow mt-1">{el.subtitle}</p>
                      </div>
                    </div>
                    <p className="font-sans text-body text-ink-muted">{el.description}</p>
                  </div>
                  <div
                    className={`ml-3 flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all ${
                      isSelected ? "bg-ink-strong" : "border border-line-default bg-transparent"
                    }`}
                    aria-hidden="true"
                  >
                    {isSelected && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5L4 7L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={handleNext}
          disabled={!element}
          className="editorial-button editorial-button--primary editorial-button--lg"
        >
          Siguiente
        </button>
      </motion.div>
    </div>
  );
}
