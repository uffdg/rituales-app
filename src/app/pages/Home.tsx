import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowUpRight, CalendarDays, Compass, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useRitual } from "../context/RitualContext";
import { useUser } from "../context/UserContext";
import { EXPLORE_RITUALS } from "../data/rituals";
import { WIKI_NOTES } from "../data/wiki";
import { track } from "../lib/analytics";
import { getCosmicSliderDays, getTodayCosmicContext, getNextEvent, type CosmicDay } from "../lib/cosmic-calendar";
import {
  generateRitual,
  ritualCardToRitualData,
} from "../lib/ritual-service";
import { getUserFacingErrorMessage } from "../lib/errors";
import { getTodayDateKey } from "../lib/daily-service";
import { getJournalByDate, getJournalEntries, getJournalEntriesFromOwnRituals } from "../lib/practice-journal";
import { MoonPhaseIcon } from "../components/MoonPhaseIcon";
import { DailyIntention } from "../components/DailyIntention";
import { OracleCard } from "../components/OracleCard";
import { TodayContextCard } from "../components/TodayContextCard";
import { RitualRecommendationCard } from "../components/RitualRecommendationCard";
import { PopularCarousel, type CarouselRitual } from "../components/PopularCarousel";

type ExploreRitual = (typeof EXPLORE_RITUALS)[number];

type WeatherCondition = "clear" | "cloudy" | "rain" | "storm" | "fog" | "unknown";

const HERO_TEXT_THEMES: Record<number, "light" | "dark"> = {
  1: "light",
  2: "dark",
  3: "light",
  4: "light",
  5: "dark",
  6: "light",
};

function mapWeatherCodeToCondition(code: number): WeatherCondition {
  if ([0, 1].includes(code)) return "clear";
  if ([2, 3, 45, 48].includes(code)) return "cloudy";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "rain";
  if ([95, 96, 99].includes(code)) return "storm";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "fog";
  return "unknown";
}

// Maps each lunar phase to preferred ritual types (priority order)
const MOON_PHASE_PREFS: { test: (p: string) => boolean; types: string[] }[] = [
  { test: (p) => p.includes("nueva"),      types: ["atraer", "claridad"] },
  { test: (p) => p.includes("creciente"),  types: ["enfoque", "atraer"] },
  { test: (p) => p.includes("llena"),      types: ["amor", "cerrar"] },
  { test: (p) => p.includes("menguante"),  types: ["cerrar", "calma"] },
  { test: (p) => p.includes("eclipse"),    types: ["cerrar", "claridad"] },
];

function chooseRecommendedRitual(
  rituals: ExploreRitual[],
  moonPhase: string,
): ExploreRitual {
  const normalized = moonPhase.toLowerCase();
  const prefs = MOON_PHASE_PREFS.find((p) => p.test(normalized));

  if (prefs) {
    for (const type of prefs.types) {
      const match = rituals.find((r) => r.type.toLowerCase().includes(type));
      if (match) return match;
    }
  }

  return rituals[0];
}

export function Home() {
  const navigate = useNavigate();
  const { resetRitual, updateRitual, setViewMode, setSelectedPublicRitual } = useRitual();
  const { session, user, ownRituals, isRitualSaved, saveRitual, savedRituals, removeSavedRitual } = useUser();
  const [savingRitualId, setSavingRitualId] = useState<string | null>(null);
  const [selectedCosmicDay, setSelectedCosmicDay] = useState<CosmicDay | null>(null);
  const [heroImageIndex, setHeroImageIndex] = useState(1);
  const [heroTextTheme, setHeroTextTheme] = useState<"light" | "dark">("light");
  const [localNow, setLocalNow] = useState(() => new Date());
  const [weatherCondition, setWeatherCondition] = useState<WeatherCondition>("unknown");

  const cosmicContext = useMemo(() => getTodayCosmicContext(localNow), [localNow]);
  const cosmicDays = useMemo(() => getCosmicSliderDays(localNow, 6), [localNow]);

  // Stable string key — only changes when the calendar date changes, not when
  // the 60-second localNow tick creates a new Date object for the same day.
  const todayDateKey = useMemo(() => getTodayDateKey(localNow), [localNow.toDateString()]);

  const recommendation = useMemo(
    () => chooseRecommendedRitual(EXPLORE_RITUALS, cosmicContext.day.moonPhase),
    [cosmicContext],
  );
  const recommendationData = ritualCardToRitualData(recommendation);
  const recommendationSaved = isRitualSaved(recommendationData);
  const popularRituals = useMemo(
    () => [...EXPLORE_RITUALS].sort((a, b) => b.likes - a.likes).slice(0, 6),
    [],
  );
  const journalEntries = useMemo(
    () => (user ? getJournalEntriesFromOwnRituals(ownRituals) : getJournalEntries()),
    [user, ownRituals],
  );
  const journalByDate = useMemo(() => getJournalByDate(journalEntries), [journalEntries]);

  const handleCreateRitual = () => {
    resetRitual();
    setViewMode(false);
    track("home_create_ritual_tapped", { source: "quick_path" });
    navigate("/onboarding");
  };

  const handlePrimaryCreateRitual = () => {
    resetRitual();
    setViewMode(false);
    setSelectedPublicRitual(null);
    track("home_create_ritual_tapped", { source: "primary_home" });
    navigate("/crear/1");
  };

  const handleCreateRitualFromIntention = (intentionText: string) => {
    resetRitual();
    updateRitual({ intention: intentionText });
    setViewMode(false);
    setSelectedPublicRitual(null);
    track("home_create_ritual_tapped", { source: "daily_intention" });
    navigate("/crear/1");
  };

  const handleExplore = () => {
    track("home_explore_tapped", { source: "quick_path" });
    navigate("/explorar");
  };

  const handleRitualCard = (ritual: ExploreRitual) => {
    setSelectedPublicRitual(ritual);
    setViewMode(true);
    navigate("/ritual/publico");
  };

  const handleSaveRitual = async (ritual: ExploreRitual) => {
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
      toast(saved ? "Ritual guardado ✓" : "Ya está guardado", {
        description: "Lo encontrás en Favoritos dentro de tu cuenta.",
      });
    } catch (error) {
      toast(getUserFacingErrorMessage(error, "No se pudo guardar este ritual."));
    } finally {
      setSavingRitualId(null);
    }
  };

  useEffect(() => {
    setHeroImageIndex(Math.floor(Math.random() * 6) + 1);
  }, []);

  useEffect(() => {
    setHeroTextTheme(HERO_TEXT_THEMES[heroImageIndex] ?? "light");
  }, [heroImageIndex]);

  useEffect(() => {
    const tick = () => setLocalNow(new Date());
    const interval = window.setInterval(tick, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const params = new URLSearchParams({
            latitude: String(position.coords.latitude),
            longitude: String(position.coords.longitude),
            current_weather: "true",
            timezone: "auto",
          });
          const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
          if (!response.ok) return;
          const data = await response.json();
          const code = data?.current_weather?.weathercode;
          if (typeof code === "number") {
            setWeatherCondition(mapWeatherCodeToCondition(code));
          }
        } catch {}
      },
      () => {},
      { enableHighAccuracy: false, timeout: 6_000, maximumAge: 30 * 60 * 1000 },
    );
  }, []);

  const nextEventMeta = cosmicContext.nextEvent
    ? cosmicContext.nextEvent.daysAway === 0
      ? `Hoy · ${cosmicContext.nextEvent.perfection.timeBuenosAires} Bs. As.`
      : cosmicContext.nextEvent.daysAway === 1
      ? "Mañana"
      : `En ${cosmicContext.nextEvent.daysAway} días`
    : undefined;

  return (
    <div className="min-h-screen flex flex-col overflow-y-auto overflow-x-hidden relative bg-[var(--ink-strong)]">
      {/* Dynamic Background Image */}
      <div className="absolute top-0 left-0 w-full h-[100svh] z-0 pointer-events-none">
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/50 to-transparent z-10" />
        <img 
          src={`/home/bg-${heroImageIndex}.jpg`}
          alt="Cielo actual" 
          className="w-full h-full object-cover object-center" 
        />
      </div>

      <div className="w-full flex-none h-[100svh] flex flex-col pt-[50px] pb-24 px-6 relative z-10">
        <TodayContextCard
          phase={cosmicContext.day.moonPhase}
          phrase={cosmicContext.lunarPhrase}
          subphrase={cosmicContext.lunarSubphrase}
          nextEventLabel={
            cosmicContext.nextEvent
              ? `${cosmicContext.nextEvent.perfection.label} en ${cosmicContext.nextEvent.perfection.zodiacSign}`
              : undefined
          }
          nextEventMeta={nextEventMeta}
          nextEventPhase={cosmicContext.nextEvent?.perfection.label}
          momentOfDay={cosmicContext.momentOfDay as any}
          localTimeLabel={localNow.toLocaleTimeString("es-AR", { hour: "numeric", minute: "2-digit" })}
          textTheme={heroTextTheme}
          weatherCondition={weatherCondition}
          onCreateRitual={handlePrimaryCreateRitual}
        />
      </div>

      <div className="editorial-page-sheet w-full flex-1 relative z-20 mt-[-32px] pt-10 pb-10">
        {/* Intención del día */}
        <div id="daily-intention" className="px-5 mb-12">
          <DailyIntention
            dateKey={todayDateKey}
            isLoggedIn={Boolean(session)}
            onLogin={() => navigate("/login")}
            onCreateRitual={handleCreateRitualFromIntention}
            onOpenRecords={() => navigate("/cuenta#registro")}
          />
        </div>

        {/* Oráculo del día */}
        <div id="daily-oracle" className="px-5 mb-12">
          <OracleCard
            dateKey={todayDateKey}
            moonPhase={cosmicContext.day.moonPhase}
            isLoggedIn={Boolean(session)}
            onLogin={() => navigate("/login")}
          />
        </div>

        {/* Tu Camino en Rituales */}
        <div className="px-6 mb-12">
          <div className="editorial-section-header">
            <p className="editorial-eyebrow">Tu camino en Rituales</p>
            <button onClick={() => navigate("/cuenta")} className="editorial-section-link">
              Mi continuidad →
            </button>
          </div>

          <div className="flex gap-2">
             <button onClick={handleCreateRitual} className="editorial-card-elevated editorial-quick-path-card text-left">
                <div className="mb-6 flex h-8 w-8 items-center justify-center">
                  <Sparkles size={14} className="text-[var(--ink-muted)]" />
                </div>
                <h4 className="editorial-quick-path-title">Crear un<br/>ritual</h4>
                <p className="editorial-quick-path-body">Entrá directo al ritual personalizado.</p>
                <ArrowUpRight size={12} className="text-[var(--ink-subtle)] mt-auto" />
             </button>
             <button onClick={handleExplore} className="editorial-card-elevated editorial-quick-path-card text-left">
                <div className="mb-6 flex h-8 w-8 items-center justify-center">
                  <Compass size={14} className="text-[var(--ink-muted)]" />
                </div>
                <h4 className="editorial-quick-path-title">Explorar<br/>rituales</h4>
                <p className="editorial-quick-path-body">Recorré ideas ya armadas.</p>
                <ArrowUpRight size={12} className="text-[var(--ink-subtle)] mt-auto" />
             </button>
             <button onClick={() => navigate("/calendario-cosmico")} className="editorial-card-elevated editorial-quick-path-card text-left">
                <div className="mb-6 flex h-8 w-8 items-center justify-center">
                  <CalendarDays size={14} className="text-[var(--ink-muted)]" />
                </div>
                <h4 className="editorial-quick-path-title">Abrir<br/>calendario</h4>
                <p className="editorial-quick-path-body">Leé el tono simbólico de hoy.</p>
                <ArrowUpRight size={12} className="text-[var(--ink-subtle)] mt-auto" />
             </button>
          </div>
        </div>

        {/* Ritual para hoy */}
        <div className="px-6 mb-12">
          <RitualRecommendationCard
            id={recommendation.id}
            element={recommendation.element}
            eyebrow={`${cosmicContext.day.moonEmoji} ${cosmicContext.day.moonPhase}`}
            title={recommendation.title}
            description={recommendation.intention}
            meta={[
              recommendation.element,
              `${recommendation.duration} min`,
              recommendation.energy,
            ]}
            saved={recommendationSaved}
            saving={savingRitualId === recommendation.id}
            onOpen={() => {
              track("home_recommendation_tapped", { ritualId: recommendation.id });
              handleRitualCard(recommendation);
            }}
            onSave={(event) => {
              event.stopPropagation();
              void handleSaveRitual(recommendation);
            }}
          />
        </div>

        {/* Cielo de la semana */}
        <div className="mb-12">
          <div className="px-6 editorial-section-header">
            <p className="editorial-eyebrow">Cielo de la semana</p>
            <button onClick={() => navigate("/calendario-cosmico")} className="editorial-section-link">
              Ver completo →
            </button>
          </div>
          <div className="overflow-x-auto hide-scrollbar pb-4 pl-6 pr-6 -mr-6">
            <div className="flex gap-2 w-max pr-6">
              {cosmicDays.map((day) => {
                 const isActive = day.dateKey === cosmicContext.day.dateKey;
                 return (
                  <button
                    key={day.dateKey}
                    onClick={() => setSelectedCosmicDay(day)}
                    className={`editorial-day-card ${isActive ? "editorial-day-card-active" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-5">
                      <p className={`editorial-eyebrow ${isActive ? "text-[var(--ink-strong)]" : ""}`}>
                        {day.weekdayLabel}
                      </p>
                      <div className="flex h-5 w-5 items-center justify-center">
                        <MoonPhaseIcon phase={day.moonPhase} size={14} className="scale-[0.72]" />
                      </div>
                    </div>
                    <p className="font-serif text-[22px] text-[var(--ink-strong)] leading-none mb-1.5">
                      {day.shortLabel}
                    </p>
                    <p className="font-sans text-[10px] text-[var(--ink-muted)] leading-[1.3] mb-4 opacity-90">
                      {day.moonPhase}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {selectedCosmicDay ? (
          <div className="fixed inset-0 z-40">
            <div
              className="absolute inset-0 bg-black/35"
              onClick={() => setSelectedCosmicDay(null)}
            />
            <div className="editorial-calendar-dialog absolute left-1/2 top-1/2 w-[calc(100%-3rem)] max-w-[330px] -translate-x-1/2 -translate-y-1/2 px-5 py-5">
              <button
                onClick={() => setSelectedCosmicDay(null)}
                className="editorial-icon-button absolute top-5 right-5 h-8 w-8 rounded-full text-[var(--ink-muted)]"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>

              <p className="editorial-eyebrow mb-2.5">{selectedCosmicDay.weekdayLabel}</p>

              <p className="editorial-title-section !text-[26px] leading-[1.1] mb-2.5 pr-6">
                {format(selectedCosmicDay.date, "d 'de' LLLL", { locale: es })}
              </p>

              {journalByDate.has(selectedCosmicDay.dateKey) ? (
                <div className="editorial-calendar-soft-block mb-4">
                  <p className="editorial-eyebrow mb-2.5">Tu práctica este día</p>
                  {journalByDate.get(selectedCosmicDay.dateKey)!.map((entry, i) => (
                    <div key={i} className={i > 0 ? "mt-3 pt-3 border-t border-[var(--border-soft)]" : ""}>
                      <p className="editorial-title-card !text-[16px] !leading-[1.4]">
                        "{entry.anchor}"
                      </p>
                      {entry.element ? (
                        <p className="font-sans text-[10px] text-[var(--ink-subtle)] mt-1 capitalize tracking-[0.04em]">
                          {entry.ritualType} · {entry.element}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}

              {selectedCosmicDay.perfection ? (
                <>
                  <p className="editorial-body-muted mb-4">
                    {selectedCosmicDay.perfection.label}
                  </p>

                  <div className="editorial-calendar-soft-block">
                    <p className="editorial-eyebrow mb-2">Posición exacta</p>
                    <p className="editorial-title-card !text-[18px] !leading-[1.2] mb-1.5">
                      {selectedCosmicDay.perfection.timeBuenosAires} hs en Buenos Aires
                    </p>
                    <p className="editorial-body-muted">
                      Se perfecciona en {selectedCosmicDay.perfection.zodiacSign}.
                    </p>
                  </div>
                </>
              ) : (() => {
                const nextEventData = getNextEvent(selectedCosmicDay.date);
                return (
                  <div className="editorial-calendar-soft-block mt-4">
                    <p className="editorial-body-muted mb-4">
                      No hay eventos particulares hoy, pero te podés preparar para el próximo evento.
                    </p>
                    {nextEventData ? (
                      <>
                        <p className="editorial-eyebrow mb-2">Próximo evento</p>
                        <p className="editorial-title-card !text-[18px] !leading-[1.2] mb-0.5">
                          {nextEventData.perfection.label}
                        </p>
                        <p className="editorial-body-muted">
                          {format(nextEventData.date, "d 'de' LLLL", { locale: es })}
                        </p>
                      </>
                    ) : null}

                    <div className="mt-5 border-t border-[var(--border-soft)] pt-4 flex justify-center">
                      <button
                        onClick={() => {
                          setSelectedCosmicDay(null);
                          navigate("/wiki/las-lunas-y-su-energia");
                        }}
                        className="font-sans text-[12px] text-[var(--ink-strong)] font-medium underline underline-offset-[3px] hover:opacity-60 transition-opacity"
                      >
                        Abrir información de lunas
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        ) : null}

        {/* Populares ahora */}
        <div className="mb-12">
          <div className="px-6 editorial-section-header">
            <p className="editorial-eyebrow">Populares ahora</p>
            <button onClick={handleExplore} className="editorial-section-link">
              Ver catálogo →
            </button>
          </div>

          <PopularCarousel
            rituals={popularRituals.map((ritual): CarouselRitual => {
              const ritualData = ritualCardToRitualData(ritual);
              return {
                id: ritual.id,
                title: ritual.title,
                type: ritual.type,
                element: ritual.element,
                duration: ritual.duration,
                likes: ritual.likes,
                saved: isRitualSaved(ritualData),
                saving: savingRitualId === ritual.id,
                onOpen: () => handleRitualCard(ritual),
                onSave: (e) => { e.stopPropagation(); void handleSaveRitual(ritual); },
              };
            })}
          />
        </div>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.36 }}
        className="relative z-10 pt-8 pb-12"
      >
        <div className="px-6 editorial-section-header mb-5">
          <p className="editorial-eyebrow">Notas para rituales</p>
          <button onClick={() => navigate("/wiki")} className="editorial-section-link">
            Ver wiki →
          </button>
        </div>

        <div className="overflow-x-auto hide-scrollbar pb-2 pl-6 pr-0">
          <div className="flex gap-3 w-max pr-6">
            {WIKI_NOTES.slice(0, 4).map((note, index) => (
              <motion.button
                key={note.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.42 + index * 0.05 }}
                onClick={() => navigate(`/wiki/${note.id}`)}
                className="editorial-note-card hover:opacity-80 active:scale-[0.99]"
              >
                <div className="editorial-note-media">
                  {note.image ? (
                    <img
                      src={note.image}
                      alt={note.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                    />
                  ) : null}
                </div>
                <div className="pt-1">
                  <p className="editorial-note-eyebrow">{note.eyebrow}</p>
                  <h3 className="editorial-note-title">{note.title}</h3>
                  <p className="editorial-note-summary">{note.summary}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.section>
      </div>
    </div>
  );
}
