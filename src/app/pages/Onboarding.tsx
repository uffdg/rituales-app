import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { useRitual } from "../context/RitualContext";
import { RITUAL_TYPES } from "../data/rituals";
import { Sun, Heart, Wind, Target, RotateCcw, Sparkles } from "lucide-react";

export function Onboarding() {
  const navigate = useNavigate();
  const { ritual, updateRitual } = useRitual();
  const [selected, setSelected] = useState(ritual.ritualType || "");
  const [simpleMode, setSimpleMode] = useState(ritual.simpleMode ?? true);

  const ritualIcons: Record<string, React.ReactNode> = {
    "claridad": <Sun size={20} strokeWidth={1.25} />,
    "amor-propio": <Heart size={20} strokeWidth={1.25} />,
    "calma": <Wind size={20} strokeWidth={1.25} />,
    "enfoque": <Target size={20} strokeWidth={1.25} />,
    "cerrar-ciclo": <RotateCcw size={20} strokeWidth={1.25} />,
    "atraer": <Sparkles size={20} strokeWidth={1.25} />,
  };

  const handleContinue = () => {
    updateRitual({ ritualType: selected, simpleMode });
    navigate("/crear/1");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-y-auto">
      {/* Gradient background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 50% 0%, rgba(0,0,0,0.045) 0%, transparent 60%)",
        }}
      />

      {/* Header */}
      <div className="relative z-10 pt-14 px-6">
        <button
          onClick={() => navigate("/")}
          className="mt-4 flex items-center gap-2 text-[#999] hover:text-[#0A0A0A] transition-colors"
          style={{ fontFamily: "Inter, sans-serif", fontSize: "13px" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Rituales
        </button>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex-1 px-6 pt-8 pb-10"
      >
        <h1
          style={{
            fontFamily: "Cormorant Garamond, serif",
            fontSize: "32px",
            fontWeight: 400,
            color: "#0A0A0A",
            lineHeight: 1.2,
            marginBottom: "6px",
          }}
        >
          ¿Qué tipo de ritual
          <br />
          <em style={{ fontStyle: "italic", fontWeight: 300 }}>quieres hoy?</em>
        </h1>
        <p
          className="text-[#999] mb-8"
          style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 300 }}
        >Elije el punto de partida de tu intención</p>

        {/* Ritual type grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {RITUAL_TYPES.map((type, i) => (
            <motion.button
              key={type.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
              onClick={() => setSelected(type.id)}
              className={`text-left p-4 rounded-2xl border transition-all active:scale-[0.97] ${
                selected === type.id
                  ? "bg-[#0A0A0A] border-[#0A0A0A] text-white"
                  : "bg-white border-[rgba(0,0,0,0.08)] text-[#0A0A0A] hover:border-[rgba(0,0,0,0.2)]"
              }`}
            >
              <div
                className={`mb-2 ${selected === type.id ? "opacity-90" : "opacity-40"}`}
              >
                {ritualIcons[type.id] ?? type.icon}
              </div>
              <p
                style={{
                  fontFamily: "Cormorant Garamond, serif",
                  fontSize: "16px",
                  fontWeight: 500,
                  lineHeight: 1.2,
                  marginBottom: "2px",
                }}
              >
                {type.label}
              </p>
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "11px",
                  fontWeight: 300,
                  opacity: selected === type.id ? 0.7 : 0.5,
                }}
              >
                {type.description}
              </p>
            </motion.button>
          ))}
        </div>

        {/* Simple mode toggle */}
        

        {/* CTA */}
        <button
          onClick={handleContinue}
          disabled={!selected}
          className={`w-full py-4 px-6 rounded-2xl transition-all active:scale-[0.98] ${
            selected
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
          Continuar
        </button>

        {/* Disclaimer */}
        <p
          className="mt-5 text-center text-[#BBB]"
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "11px",
            fontWeight: 300,
            lineHeight: 1.6,
          }}
        >
          Esta es una herramienta de reflexión y bienestar.
          <br />
          No reemplaza ayuda profesional.
        </p>
      </motion.div>
    </div>
  );
}