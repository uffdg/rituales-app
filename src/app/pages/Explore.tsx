import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { useRitual } from "../context/RitualContext";
import { EXPLORE_RITUALS } from "../data/rituals";

const FILTERS = {
  type: ["Claridad", "Amor propio", "Calma", "Enfoque", "Cerrar ciclo", "Atraer oportunidad"],
  energy: ["Calma", "Apertura", "Poder", "Conexión"],
  element: ["Tierra", "Agua", "Fuego", "Aire"],
  duration: ["5 min", "10 min", "20 min"],
};

type FilterKey = keyof typeof FILTERS;

export function Explore() {
  const navigate = useNavigate();
  const { setViewMode, setSelectedPublicRitual } = useRitual();
  const [activeFilterGroup, setActiveFilterGroup] = useState<FilterKey>("type");
  const [activeFilters, setActiveFilters] = useState<Record<FilterKey, string>>({
    type: "",
    energy: "",
    element: "",
    duration: "",
  });

  const toggleFilter = (group: FilterKey, value: string) => {
    setActiveFilters((prev) => ({
      ...prev,
      [group]: prev[group] === value ? "" : value,
    }));
  };

  const filteredRituals = EXPLORE_RITUALS.filter((r) => {
    if (activeFilters.type && r.type !== activeFilters.type) return false;
    if (activeFilters.energy && r.energy !== activeFilters.energy) return false;
    if (activeFilters.element && r.element !== activeFilters.element) return false;
    if (activeFilters.duration && r.duration !== parseInt(activeFilters.duration)) return false;
    return true;
  });

  const handleRitualTap = (ritual: any) => {
    setSelectedPublicRitual(ritual);
    setViewMode(true);
    navigate("/ritual/publico");
  };

  const hasFilters = Object.values(activeFilters).some((v) => v !== "");

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(0,0,0,0.04) 0%, transparent 55%)",
        }}
      />

      {/* Header */}
      <div className="relative z-10 pt-14 px-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-[#888] hover:text-[#0A0A0A] transition-colors"
            style={{ fontFamily: "Inter, sans-serif", fontSize: "13px" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Inicio
          </button>
          <button
            onClick={() => navigate("/onboarding")}
            className="flex items-center gap-2 px-4 py-2 bg-[#0A0A0A] text-white rounded-full transition-all active:scale-[0.97]"
            style={{ fontFamily: "Inter, sans-serif", fontSize: "12px" }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1V11M1 6H11" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Crear
          </button>
        </div>

        <h1
          style={{
            fontFamily: "Cormorant Garamond, serif",
            fontSize: "30px",
            fontWeight: 400,
            color: "#0A0A0A",
            lineHeight: 1.2,
            marginBottom: "4px",
          }}
        >
          Explorar
        </h1>
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "13px",
            fontWeight: 300,
            color: "#999",
          }}
        >
          Rituales compartidos por la comunidad
        </p>
      </div>

      {/* Filter group tabs */}
      <div className="relative z-10 px-6">
        <div className="flex gap-4 border-b border-[rgba(0,0,0,0.06)] pb-0 mb-3 overflow-x-auto hide-scrollbar">
          {(Object.keys(FILTERS) as FilterKey[]).map((group) => {
            const labels: Record<FilterKey, string> = {
              type: "Intención",
              energy: "Energía",
              element: "Elemento",
              duration: "Duración",
            };
            const isActive = activeFilterGroup === group;
            const hasValue = activeFilters[group] !== "";
            return (
              <button
                key={group}
                onClick={() => setActiveFilterGroup(group)}
                className="relative shrink-0 pb-3 transition-colors"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "13px",
                  color: isActive ? "#0A0A0A" : "#BBB",
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                {labels[group]}
                {hasValue && (
                  <span className="ml-1 w-1.5 h-1.5 rounded-full bg-[#0A0A0A] inline-block align-middle" />
                )}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#0A0A0A] rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-3 hide-scrollbar">
          {FILTERS[activeFilterGroup].map((f) => {
            const isChipActive = activeFilters[activeFilterGroup] === f;
            return (
              <button
                key={f}
                onClick={() => toggleFilter(activeFilterGroup, f)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full border text-sm transition-all ${
                  isChipActive
                    ? "bg-[#0A0A0A] border-[#0A0A0A] text-white"
                    : "bg-white border-[rgba(0,0,0,0.1)] text-[#555] hover:border-[rgba(0,0,0,0.2)]"
                }`}
                style={{ fontFamily: "Inter, sans-serif", fontSize: "12px" }}
              >
                {f}
              </button>
            );
          })}
          {hasFilters && (
            <button
              onClick={() =>
                setActiveFilters({ type: "", energy: "", element: "", duration: "" })
              }
              className="shrink-0 px-3.5 py-1.5 rounded-full border border-dashed border-[rgba(0,0,0,0.2)] text-[#888] text-sm"
              style={{ fontFamily: "Inter, sans-serif", fontSize: "12px" }}
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="relative z-10 px-6 mb-3">
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "11px",
            color: "#BBB",
            letterSpacing: "0.06em",
          }}
        >
          {filteredRituals.length} rituales
        </p>
      </div>

      {/* Ritual list */}
      <div className="relative z-10 flex-1 px-6 pb-10 overflow-y-auto">
        <div className="flex flex-col gap-3">
          {filteredRituals.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <div
                className="mb-4 w-14 h-14 rounded-full border border-[rgba(0,0,0,0.08)] flex items-center justify-center"
              >
                <span style={{ fontSize: "20px", opacity: 0.3 }}>◯</span>
              </div>
              <p
                style={{
                  fontFamily: "Cormorant Garamond, serif",
                  fontSize: "20px",
                  fontWeight: 400,
                  color: "#555",
                  marginBottom: "4px",
                }}
              >
                Sin resultados
              </p>
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "13px",
                  fontWeight: 300,
                  color: "#BBB",
                }}
              >
                Prueba con otros filtros.
              </p>
            </div>
          ) : (
            filteredRituals.map((ritual, i) => (
              <motion.button
                key={ritual.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                onClick={() => handleRitualTap(ritual)}
                className="w-full text-left p-4 border border-[rgba(0,0,0,0.07)] rounded-2xl hover:border-[rgba(0,0,0,0.16)] transition-all active:scale-[0.99] bg-white"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p
                      style={{
                        fontFamily: "Cormorant Garamond, serif",
                        fontSize: "18px",
                        fontWeight: 400,
                        color: "#0A0A0A",
                        lineHeight: 1.3,
                        marginBottom: "8px",
                      }}
                    >
                      {ritual.title}
                    </p>
                    <p
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "12px",
                        fontWeight: 300,
                        color: "#888",
                        lineHeight: 1.5,
                        marginBottom: "10px",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {ritual.intention}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className="px-2.5 py-0.5 rounded-full border border-[rgba(0,0,0,0.08)] text-[#666]"
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: "10px",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {ritual.element}
                      </span>
                      <span
                        className="px-2.5 py-0.5 rounded-full border border-[rgba(0,0,0,0.08)] text-[#666]"
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: "10px",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {ritual.intensity}
                      </span>
                      <span
                        className="px-2.5 py-0.5 rounded-full border border-[rgba(0,0,0,0.08)] text-[#666]"
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: "10px",
                        }}
                      >
                        {ritual.duration} min
                      </span>
                      <span
                        className="text-[11px] text-[#CCC] ml-1"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        ♥ {ritual.likes}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: "#F5F5F5" }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M3 6H9M6 3L9 6L6 9" stroke="#999" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
