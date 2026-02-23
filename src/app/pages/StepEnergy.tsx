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
    <div className="min-h-screen bg-white flex flex-col">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(0,0,0,0.04) 0%, transparent 60%)",
        }}
      />

      <ProgressBar step={2} onBack={() => navigate("/crear/1")} />

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
          Paso 2 — Energía
        </p>

        <h2
          style={{
            fontFamily: "Cormorant Garamond, serif",
            fontSize: "28px",
            fontWeight: 400,
            color: "#0A0A0A",
            lineHeight: 1.25,
            marginBottom: "24px",
          }}
        >
          ¿Cómo te quieres{" "}
          <em style={{ fontStyle: "italic", fontWeight: 300 }}>sentir?</em>
        </h2>

        {/* Energy selector */}
        <div className="mb-7">
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "12px",
              color: "#999",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: "10px",
            }}
          >
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
                className={`text-left p-4 rounded-xl border transition-all active:scale-[0.97] ${
                  energy === e.id
                    ? "bg-[#0A0A0A] border-[#0A0A0A] text-white"
                    : "bg-white border-[rgba(0,0,0,0.08)] text-[#0A0A0A] hover:border-[rgba(0,0,0,0.2)]"
                }`}
              >
                <p
                  style={{
                    fontFamily: "Cormorant Garamond, serif",
                    fontSize: "18px",
                    fontWeight: 500,
                    marginBottom: "2px",
                  }}
                >
                  {e.label}
                </p>
                <p
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "11px",
                    fontWeight: 300,
                    opacity: energy === e.id ? 0.65 : 0.45,
                  }}
                >
                  {e.description}
                </p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Duration — segmented control */}
        <div className="mb-7">
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "12px",
              color: "#999",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: "10px",
            }}
          >
            Duración
          </p>
          <div className="flex gap-0 p-1 rounded-xl bg-[#F3F3F3]">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`flex-1 py-2.5 rounded-lg text-center transition-all ${
                  duration === d
                    ? "bg-white shadow-sm text-[#0A0A0A]"
                    : "text-[#888] hover:text-[#555]"
                }`}
                style={{ fontFamily: "Inter, sans-serif", fontSize: "14px" }}
              >
                {d} min
              </button>
            ))}
          </div>
        </div>

        {/* Intensity cards */}
        <div className="mb-8">
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "12px",
              color: "#999",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: "10px",
            }}
          >
            Intensidad
          </p>
          <div className="flex flex-col gap-2">
            {INTENSITIES.map((item) => (
              <button
                key={item.id}
                onClick={() => setIntensity(item.id)}
                className={`text-left p-4 rounded-xl border transition-all active:scale-[0.98] flex items-center justify-between ${
                  intensity === item.id
                    ? "bg-[#0A0A0A] border-[#0A0A0A] text-white"
                    : "bg-white border-[rgba(0,0,0,0.08)] text-[#0A0A0A] hover:border-[rgba(0,0,0,0.2)]"
                }`}
              >
                <div>
                  <p
                    style={{
                      fontFamily: "Cormorant Garamond, serif",
                      fontSize: "18px",
                      fontWeight: 500,
                    }}
                  >
                    {item.label}
                  </p>
                  <p
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "12px",
                      fontWeight: 300,
                      opacity: intensity === item.id ? 0.65 : 0.45,
                    }}
                  >
                    {item.description}
                  </p>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border transition-all ${
                    intensity === item.id
                      ? "bg-white border-white"
                      : "border-[rgba(0,0,0,0.2)]"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleNext}
          disabled={!isValid}
          className={`w-full py-4 px-6 rounded-2xl transition-all active:scale-[0.98] ${
            isValid
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
