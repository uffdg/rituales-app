import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { useRitual } from "../context/RitualContext";
import { ProgressBar } from "../components/ProgressBar";
import { ENERGIES } from "../data/rituals";

const DURATIONS = [5, 10, 20];
const INTENSITIES = [
  { id: "suave", label: "Suave", description: "Liviano y breve" },
  { id: "media", label: "Media", description: "Con más presencia" },
  { id: "profunda", label: "Profunda", description: "Inmersivo y completo" },
];

export function StepEnergy() {
  const navigate = useNavigate();
  const { ritual, updateRitual } = useRitual();
  const [energy, setEnergy] = useState(ritual.energy || "");
  const [duration, setDuration] = useState(ritual.duration || 10);
  const [intensity, setIntensity] = useState(ritual.intensity || "");

  const handleNext = () => {
    updateRitual({ energy, duration, intensity });
    navigate("/crear/3");
  };

  const isValid = energy && intensity;

  return (
    <div className="editorial-page-bg">
      <div className="editorial-radial-wash" />

      <ProgressBar step={2} onBack={() => navigate("/crear/1")} />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="editorial-content-scroll"
      >
        <p className="editorial-eyebrow editorial-step-label">
          Paso 2 — Energía
        </p>

        <h2 className="editorial-step-title mb-6">
          ¿Cómo te quieres{" "}
          <em>sentir?</em>
        </h2>

        {/* Energy selector */}
        <div className="mb-7">
          <p className="editorial-field-label mb-2.5">
            Tipo de energía
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {ENERGIES.map((e, i) => (
              <motion.button
                key={e.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                onClick={() => setEnergy(e.id)}
                className={`editorial-option-card active:scale-[0.97] ${energy === e.id ? "editorial-option-card-active" : ""}`}
              >
                <p className="editorial-option-title">{e.label}</p>
                <p className="editorial-option-body">{e.description}</p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Duration — segmented control */}
        <div className="mb-7">
          <p className="editorial-field-label mb-2.5">
            Duración
          </p>
          <div className="editorial-segmented">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`editorial-segmented-option ${duration === d ? "editorial-segmented-option-active" : ""}`}
              >
                {d} min
              </button>
            ))}
          </div>
        </div>

        {/* Intensity cards */}
        <div className="mb-8">
          <p className="editorial-field-label mb-2.5">
            Intensidad
          </p>
          <div className="flex flex-col gap-2">
            {INTENSITIES.map((item) => (
              <button
                key={item.id}
                onClick={() => setIntensity(item.id)}
                className={`editorial-option-card active:scale-[0.98] flex items-center justify-between ${intensity === item.id ? "editorial-option-card-active" : ""}`}
              >
                <div>
                  <p className="editorial-option-title">{item.label}</p>
                  <p className="editorial-option-body text-[12px]">{item.description}</p>
                </div>
                <div
                  className={`shrink-0 ml-3 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                    intensity === item.id
                      ? "bg-white"
                      : "border border-[var(--border-default)] bg-transparent"
                  }`}
                >
                  {intensity === item.id && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5L4 7L8 3" stroke="var(--ink-strong)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleNext}
          disabled={!isValid}
          className={`editorial-action-button active:scale-[0.98] ${
            isValid
              ? "editorial-action-button-primary"
              : "editorial-action-button-disabled"
          }`}
        >
          Siguiente
        </button>
      </motion.div>
    </div>
  );
}
