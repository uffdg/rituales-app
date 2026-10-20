import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { BackLink } from "../components/BackLink";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useRitual } from "../context/RitualContext";
import { useUser } from "../context/UserContext";
import { ELEMENTS, ENERGIES, EXPLORE_RITUALS, RITUAL_TYPES } from "../data/rituals";
import {
  generateRitual,
  getPublicRituals,
  getRitualAnchor,
  ritualCardToRitualData,
} from "../lib/ritual-service";
import { getUserFacingErrorMessage } from "../lib/errors";
import { track } from "../lib/analytics";
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
            anchor: getRitualAnchor(ritual.anchor, ritual.ritualType, ritual.ritual.title),
            typeId: ritual.ritualType || "",
          })),
        );
      })
      .catch(() => {
        setCommunityRituals([]);
      });
  }, []);

  const toggleFilter = (group: FilterKey, value: string) => {
    const nextValue = activeFilters[group] === value ? "" : value;
    track("explore_filter_used", {
      group,
      value,
      enabled: Boolean(nextValue),
    });
    setActiveFilters((prev) => ({
      ...prev,
      [group]: nextValue,
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
    track("explore_ritual_opened", {
      ritualId: ritual.id,
      ritualType: ritual.typeId || ritual.type,
      source: communityRituals.some((item) => item.id === ritual.id) ? "community" : "curated",
    });
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
    <div className="min-h-screen bg-surface-page flex flex-col">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(0,0,0,0.04) 0%, transparent 55%)",
        }}
      />

      {/* Header */}
      <div className="relative z-10 pt-12 px-6 pb-4">
        <div className="mb-5 flex items-center justify-between">
          <BackLink to="/" label="Inicio" />
          <button
            type="button"
            onClick={() => navigate("/onboarding")}
            className="editorial-pill-button editorial-pill-button-active"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M6 1V11M1 6H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Crear
          </button>
        </div>

        <h1 className="mb-1 font-serif text-title-1 text-ink-strong">Explorar</h1>
        <p className="font-sans text-body text-ink-muted">Rituales compartidos por la comunidad</p>
      </div>

      {/* Filter group tabs */}
      <div className="relative z-10 px-6">
        <div className="mb-3 flex gap-4 overflow-x-auto border-b border-line-soft hide-scrollbar" role="tablist" aria-label="Filtrar por">
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
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveFilterGroup(group)}
                className={`relative min-h-[44px] shrink-0 pb-3 pt-2 font-sans text-body transition-colors ${
                  isActive ? "font-medium text-ink-strong" : "text-ink-muted hover:text-ink-strong"
                }`}
              >
                {labels[group]}
                {hasValue && (
                  <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-ink-strong align-middle" aria-label="con filtro" />
                )}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-[1.5px] rounded-full bg-ink-strong" />
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
                type="button"
                onClick={() => toggleFilter(activeFilterGroup, f)}
                aria-pressed={isChipActive}
                className={`editorial-chip-outline shrink-0 ${isChipActive ? "editorial-chip-outline-active" : ""}`}
              >
                {f}
              </button>
            );
          })}
          {hasFilters && (
            <button
              type="button"
              onClick={() =>
                setActiveFilters({ type: "", energy: "", element: "", duration: "" })
              }
              className="editorial-chip-outline shrink-0 border-dashed"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="relative z-10 px-6 mb-3">
        <p className="font-sans text-caption text-ink-muted" role="status">
          {filteredRituals.length} rituales
        </p>
      </div>

      {/* Ritual grid */}
      <div className="relative z-10 flex-1 px-6 pb-10 overflow-y-auto">
        {filteredRituals.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-line-default" aria-hidden="true">
              <span className="text-title-3 text-ink-decor">◯</span>
            </div>
            <p className="mb-1 font-serif text-title-3 text-ink-strong">Sin resultados</p>
            <p className="mb-5 font-sans text-body text-ink-muted">Probá con otros filtros.</p>
            <button
              type="button"
              onClick={() => setActiveFilters({ type: "", energy: "", element: "", duration: "" })}
              className="editorial-button editorial-button--secondary"
            >
              Limpiar filtros
            </button>
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
