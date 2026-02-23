import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { useRitual } from "../context/RitualContext";
import { EXPLORE_RITUALS } from "../data/rituals";
import { UserMenu } from "../components/UserMenu";

export function Home() {
  const navigate = useNavigate();
  const { resetRitual, setViewMode, setSelectedPublicRitual } = useRitual();

  const handleCreateRitual = () => {
    resetRitual();
    setViewMode(false);
    navigate("/onboarding");
  };

  const handleExplore = () => {
    navigate("/explorar");
  };

  const handleRitualCard = (ritual: any) => {
    setSelectedPublicRitual(ritual);
    setViewMode(true);
    navigate("/ritual/publico");
  };

  const featuredRituals = EXPLORE_RITUALS.slice(0, 3);

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-y-auto">
      {/* Abstract gradient background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -5%, rgba(0,0,0,0.055) 0%, transparent 65%)",
        }}
      />

      {/* Status bar + user menu */}
      <div className="pt-14 relative z-20">
        <div className="flex justify-end px-6 pt-3">
          <UserMenu />
        </div>
      </div>

      {/* Hero section */}
      <div className="relative flex flex-col items-center px-6 pt-12 pb-10">
        {/* Halo decorative rings */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 pointer-events-none">
          <div
            style={{
              width: 240,
              height: 240,
              borderRadius: "50%",
              border: "1px solid rgba(0,0,0,0.05)",
              position: "absolute",
              top: -60,
              left: -120,
            }}
          />
          <div
            style={{
              width: 340,
              height: 340,
              borderRadius: "50%",
              border: "1px solid rgba(0,0,0,0.03)",
              position: "absolute",
              top: -110,
              left: -170,
            }}
          />
          <div
            style={{
              width: 160,
              height: 160,
              borderRadius: "50%",
              border: "1px solid rgba(0,0,0,0.06)",
              position: "absolute",
              top: -20,
              left: -80,
            }}
          />
        </div>

        {/* Brand */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 flex flex-col items-center"
        >
          {/* Logo mark */}
          <div className="mb-6 relative">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="17" stroke="#0A0A0A" strokeWidth="0.75" />
              <circle cx="18" cy="18" r="10" stroke="#0A0A0A" strokeWidth="0.5" />
              <circle cx="18" cy="18" r="3" fill="#0A0A0A" />
            </svg>
          </div>

          <h1
            style={{
              fontFamily: "Cormorant Garamond, serif",
              fontSize: "52px",
              fontWeight: 300,
              letterSpacing: "0.12em",
              color: "#0A0A0A",
              lineHeight: 1,
              textTransform: "uppercase",
            }}
          >
            Rituales
          </h1>

          <p
            className="mt-4 text-center text-[#888]"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              fontWeight: 300,
              letterSpacing: "0.08em",
              lineHeight: 1.6,
            }}
          >
            Magia natural para ordenar tu intención.
          </p>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="w-full mt-12 flex flex-col gap-3"
        >
          <button
            onClick={handleCreateRitual}
            className="w-full py-4 px-6 bg-[#0A0A0A] text-white rounded-2xl transition-all active:scale-[0.98] hover:bg-[#1A1A1A]"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "15px",
              fontWeight: 400,
              letterSpacing: "0.04em",
            }}
          >
            Crear un ritual
          </button>
          <button
            onClick={handleExplore}
            className="w-full py-4 px-6 bg-transparent border border-[rgba(0,0,0,0.15)] text-[#0A0A0A] rounded-2xl transition-all active:scale-[0.98] hover:border-[rgba(0,0,0,0.3)]"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "15px",
              fontWeight: 400,
              letterSpacing: "0.04em",
            }}
          >
            Explorar rituales
          </button>
        </motion.div>
      </div>

      {/* Thin divider */}
      <div className="mx-6 h-[1px] bg-[#F0F0F0]" />

      {/* Recent / Popular section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4 }}
        className="px-6 pt-8 pb-12"
      >
        <div className="flex items-baseline justify-between mb-5">
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.14em",
              color: "#999",
              textTransform: "uppercase",
            }}
          >
            Populares ahora
          </p>
          <button
            onClick={handleExplore}
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "12px",
              color: "#0A0A0A",
              letterSpacing: "0.03em",
            }}
          >
            Ver todos →
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {featuredRituals.map((ritual, i) => (
            <motion.button
              key={ritual.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + i * 0.08 }}
              onClick={() => handleRitualCard(ritual)}
              className="w-full text-left p-4 border border-[rgba(0,0,0,0.07)] rounded-2xl hover:border-[rgba(0,0,0,0.15)] transition-all active:scale-[0.99] bg-white"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p
                    style={{
                      fontFamily: "Cormorant Garamond, serif",
                      fontSize: "17px",
                      fontWeight: 400,
                      color: "#0A0A0A",
                      lineHeight: 1.35,
                    }}
                  >
                    {ritual.title}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full border border-[rgba(0,0,0,0.1)] text-[#666]"
                      style={{ fontFamily: "Inter, sans-serif", letterSpacing: "0.06em" }}
                    >
                      {ritual.element}
                    </span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full border border-[rgba(0,0,0,0.1)] text-[#666]"
                      style={{ fontFamily: "Inter, sans-serif", letterSpacing: "0.06em" }}
                    >
                      {ritual.duration} min
                    </span>
                    <span
                      className="text-[10px] text-[#AAA]"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      ♥ {ritual.likes}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 w-9 h-9 rounded-xl bg-[#F5F5F5] flex items-center justify-center">
                  <span className="text-base">{ritual.type === "Claridad" ? "◯" : ritual.type === "Cerrar ciclo" ? "⊘" : "✦"}</span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}