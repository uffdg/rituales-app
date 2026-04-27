import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useRitual } from "../context/RitualContext";
import { useUser } from "../context/UserContext";
import { ELEMENTS, ENERGIES, EXPLORE_RITUALS, RITUAL_TYPES } from "../data/rituals";
import {
  generateRitual,
  getPublicRituals,
  ritualCardToRitualData,
} from "../lib/ritual-service";
import { getUserFacingErrorMessage } from "../lib/errors";
import { RitualGridCard } from "../components/RitualGridCard";

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
  const { session, isRitualSaved, saveRitual, savedRituals, removeSavedRitual } = useUser();
  const [communityRituals, setCommunityRituals] = useState<any[]>([]);
  const [activeFilterGroup, setActiveFilterGroup] = useState<FilterKey>("type");
  const [activeFilters, setActiveFilters] = useState<Record<FilterKey, string>>({
    type: "",
    energy: "",
    element: "",
    duration: "",
  });
  const [savingRitualId, setSavingRitualId] = useState<string | null>(null);

  useEffect(() => {
    getPublicRituals()
      .then((rituals) => {
        setCommunityRituals(
          rituals.map((ritual) => ({
            id: ritual.ritualId,
            title: ritual.ritual.title,
            type: RITUAL_TYPES.find((item) => item.id === ritual.ritualType)?.label || "Ritual",
            energy:
              ENERGIES.find((item) => item.id === ritual.energy)?.label || ritual.energy || "Calma",
            element:
              ELEMENTS.find((item) => item.id === ritual.element)?.label || ritual.element || "Agua",
            duration: ritual.duration || 10,
            intensity: ritual.intensity
              ? ritual.intensity.charAt(0).toUpperCase() + ritual.intensity.slice(1)
              : "Suave",
            author: ritual.author || "Anónimo",
            likes: ritual.likesCount || 0,
            aiRitual: ritual.ritual,
            intention: ritual.intention || "",
            anchor: ritual.anchor || "",
            typeId: ritual.ritualType || "",
          })),
        );
      })
      .catch(() => {
        setCommunityRituals([]);
      });
  }, []);

  const toggleFilter = (group: FilterKey, value: string) => {
    setActiveFilters((prev) => ({
      ...prev,
      [group]: prev[group] === value ? "" : value,
    }));
  };

  const filteredRituals = [...communityRituals, ...EXPLORE_RITUALS].filter((r) => {
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

  const handleSaveRitual = async (ritual: any) => {
    if (!session) {
      navigate("/login");
      return;
    }

    const ritualToSaveBase = ritualCardToRitualData(ritual);

    if (isRitualSaved(ritualToSaveBase)) {
      const savedEntry = savedRituals.find((e) => e.id === ritualToSaveBase.ritualId);
      if (savedEntry) {
        setSavingRitualId(ritual.id);
        try {
          await removeSavedRitual(savedEntry.id);
          toast("Ritual eliminado de favoritos");
        } catch (error) {
          toast(getUserFacingErrorMessage(error, "No se pudo eliminar el ritual."));
        } finally {
          setSavingRitualId(null);
        }
      }
      return;
    }

    setSavingRitualId(ritual.id);
    try {
      let ritualToSave = ritualToSaveBase;

      if (!ritualToSave.ritualId) {
        const result = await generateRitual(ritualToSave);
        ritualToSave = {
          ...ritualToSave,
          ritualId: result.ritualId,
          guidedSession: result.guidedSession,
          guidedAudio: result.guidedAudio,
        };
      }

      const saved = await saveRitual(ritualToSave);
      if (saved) {
        toast("Ritual guardado ✓", {
          description: "Lo encontrás en Favoritos dentro de tu cuenta.",
        });
      } else {
        toast("Ya está guardado", {
          description: "Lo encontrás en Favoritos dentro de tu cuenta.",
        });
      }
    } catch (error) {
      toast(getUserFacingErrorMessage(error, "No se pudo guardar este ritual."));
    } finally {
      setSavingRitualId(null);
    }
  };

  const hasFilters = Object.values(activeFilters).some((v) => v !== "");

  return (
    <div className="min-h-screen bg-[var(--app-page)] flex flex-col">
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
            className="flex items-center gap-2 text-[var(--ink-muted)] hover:text-[var(--ink-strong)] transition-colors"
            style={{ fontFamily: "var(--font-sans-ui)", fontSize: "13px" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Inicio
          </button>
          <button
            onClick={() => navigate("/onboarding")}
            className="flex items-center gap-2 px-4 py-2 rounded-full transition-all active:scale-[0.97]"
            style={{ background: "var(--ink-strong)", color: "#fff", fontFamily: "var(--font-sans-ui)", fontSize: "12px" }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1V11M1 6H11" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Crear
          </button>
        </div>

        <h1
          style={{
            fontFamily: "var(--font-serif-display)",
            fontSize: "30px",
            fontWeight: 400,
            color: "var(--ink-strong)",
            lineHeight: 1.2,
            marginBottom: "4px",
          }}
        >
          Explorar
        </h1>
        <p
          style={{
            fontFamily: "var(--font-sans-ui)",
            fontSize: "13px",
            fontWeight: 300,
            color: "var(--ink-subtle)",
          }}
        >
          Rituales compartidos por la comunidad
        </p>
      </div>

      {/* Filter group tabs */}
      <div className="relative z-10 px-6">
        <div className="mb-3 flex gap-4 overflow-x-auto border-b pb-0 hide-scrollbar" style={{ borderColor: "var(--border-soft)" }}>
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
                  fontFamily: "var(--font-sans-ui)",
                  fontSize: "13px",
                  color: isActive ? "var(--ink-strong)" : "var(--ink-soft)",
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                {labels[group]}
                {hasValue && (
                  <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-[var(--ink-strong)] align-middle" />
                )}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-[1.5px] rounded-full bg-[var(--ink-strong)]" />
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
                    ? "bg-[var(--ink-strong)] border-[var(--ink-strong)] text-white"
                    : "bg-white border-[var(--border-default)] text-[var(--ink-muted)] hover:border-[var(--border-strong)]"
                }`}
                style={{ fontFamily: "var(--font-sans-ui)", fontSize: "12px" }}
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
              className="shrink-0 rounded-full border border-dashed px-3.5 py-1.5 text-sm text-[var(--ink-muted)]"
              style={{ borderColor: "var(--border-strong)", fontFamily: "var(--font-sans-ui)", fontSize: "12px" }}
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
            fontFamily: "var(--font-sans-ui)",
            fontSize: "11px",
            color: "var(--ink-soft)",
            letterSpacing: "0.06em",
          }}
        >
          {filteredRituals.length} rituales
        </p>
      </div>

      {/* Ritual grid */}
      <div className="relative z-10 flex-1 px-4 pb-10 overflow-y-auto">
        {filteredRituals.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div
              className="mb-4 w-14 h-14 rounded-full border border-[rgba(0,0,0,0.08)] flex items-center justify-center"
            >
              <span style={{ fontSize: "20px", opacity: 0.3 }}>◯</span>
            </div>
            <p
              style={{
                fontFamily: "var(--font-serif-display)",
                fontSize: "20px",
                fontWeight: 400,
                color: "var(--ink-muted)",
                marginBottom: "4px",
              }}
            >
              Sin resultados
            </p>
            <p
              style={{
                fontFamily: "var(--font-sans-ui)",
                fontSize: "13px",
                fontWeight: 300,
                color: "var(--ink-soft)",
              }}
            >
              Prueba con otros filtros.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredRituals.map((ritual, i) => {
              const ritualData = ritualCardToRitualData(ritual);
              const isSaved = isRitualSaved(ritualData);

              return (
                <motion.div
                  key={ritual.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                >
                  <RitualGridCard
                    id={ritual.id}
                    title={ritual.title}
                    type={ritual.type}
                    element={ritual.element}
                    duration={ritual.duration}
                    likes={ritual.likes}
                    saved={isSaved}
                    saving={savingRitualId === ritual.id}
                    onOpen={() => handleRitualTap(ritual)}
                    onSave={(e) => {
                      e.stopPropagation();
                      void handleSaveRitual(ritual);
                    }}
                  />
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
