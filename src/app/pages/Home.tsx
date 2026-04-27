import { useMemo, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, CalendarDays, Compass, Sparkles, Smile, Cloud, Meh, Heart, Moon, Frown } from "lucide-react";
import { toast } from "sonner";
import { useRitual } from "../context/RitualContext";
import { useUser } from "../context/UserContext";
import { EXPLORE_RITUALS } from "../data/rituals";
import { WIKI_NOTES } from "../data/wiki";
import { track } from "../lib/analytics";
import { getCosmicSliderDays, getTodayCosmicContext } from "../lib/cosmic-calendar";
import {
  generateRitual,
  ritualCardToRitualData,
  reframeIntention,
} from "../lib/ritual-service";
import { getUserFacingErrorMessage } from "../lib/errors";
import { deriveCandleGuide } from "../lib/candle";
import {
  completeDailyAnchorStep,
  getDailyAnchorContent,
  getDailyAnchorJourney,
  resetDailyAnchorJourney,
  type DailyAnchorStepContent,
  type DailyAnchorType,
} from "../lib/daily-anchor";
import { saveDailyAnchorEntry } from "../lib/anchor-service";
import { MoonPhaseIcon } from "../components/MoonPhaseIcon";
import { TodayContextCard } from "../components/TodayContextCard";
import { RitualRecommendationCard } from "../components/RitualRecommendationCard";
import { RitualListCard } from "../components/RitualListCard";

type ExploreRitual = (typeof EXPLORE_RITUALS)[number];

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

function createSpeechRecognition(): SpeechRecognitionInstance | null {
  const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!Ctor) return null;
  return new Ctor() as SpeechRecognitionInstance;
}

type WeatherCondition = "clear" | "cloudy" | "rain" | "storm" | "fog" | "unknown";

const STEP_ORDER: DailyAnchorType[] = ["inicio", "momento", "cierre"];
const HERO_TEXT_THEMES: Record<number, "light" | "dark"> = {
  1: "light",
  2: "dark",
  3: "light",
  4: "light",
  5: "dark",
  6: "light",
};

const MOOD_OPTIONS = [
  { id: "feliz", label: "Feliz", icon: Smile },
  { id: "tranquilo", label: "Tranquilo", icon: Cloud },
  { id: "neutral", label: "Neutral", icon: Meh },
  { id: "energico", label: "Enérgico", icon: Sparkles },
  { id: "ansioso", label: "Ansioso", icon: Heart },
  { id: "cansado", label: "Cansado", icon: Moon },
  { id: "triste", label: "Triste", icon: Frown },
] as const;

const ALIGNMENT_OPTIONS = [
  { id: "muy-alineado", label: "Muy alineado", icon: Sparkles },
  { id: "alineado", label: "Alineado", icon: Smile },
  { id: "neutral", label: "Neutral", icon: Meh },
  { id: "poco-alineado", label: "Poco alineado", icon: Cloud },
  { id: "desalineado", label: "Desalineado", icon: Frown },
] as const;

const STEP_COPY: Record<
  DailyAnchorType,
  {
    intro: string;
    title: string;
    body: string;
    action: string;
  }
> = {
  inicio: {
    intro: "Nombrá lo esencial de hoy.",
    title: "Contame sobre tu día",
    body: "Decilo en voz alta y armamos tu intención.",
    action: "Guardar inicio",
  },
  momento: {
    intro: "Volvé a tu centro sin romper el ritmo del día.",
    title: "¿Qué tan alineado estás con tu intención?",
    body: "Hacé una pausa breve y registrá cómo venís.",
    action: "Guardar momento",
  },
  cierre: {
    intro: "Cerrá el día con perspectiva.",
    title: "¿Qué aprendiste hoy?",
    body: "Escribí una idea breve para integrar o soltar.",
    action: "Guardar cierre",
  },
};

function mapWeatherCodeToCondition(code: number): WeatherCondition {
  if ([0, 1].includes(code)) return "clear";
  if ([2, 3, 45, 48].includes(code)) return "cloudy";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "rain";
  if ([95, 96, 99].includes(code)) return "storm";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "fog";
  return "unknown";
}

function chooseRecommendedRitual(
  rituals: ExploreRitual[],
  momentOfDay: string,
  moonPhase: string,
): ExploreRitual {
  const normalizedMoment = momentOfDay.toLowerCase();
  const normalizedPhase = moonPhase.toLowerCase();

  const byMoment =
    rituals.find((ritual) =>
      ritual.title.toLowerCase().includes(normalizedMoment)
      || ritual.intention.toLowerCase().includes(normalizedMoment),
    ) ?? null;

  if (byMoment) return byMoment;

  const byPhase =
    normalizedPhase.includes("llena")
      ? rituals.find((ritual) => ritual.type.toLowerCase().includes("cerrar"))
      : normalizedPhase.includes("nueva")
      ? rituals.find((ritual) => ritual.type.toLowerCase().includes("atraer"))
      : null;

  return byPhase ?? rituals[0];
}

function setHourForDate(date: Date, hour: number) {
  const next = new Date(date);
  next.setHours(hour, 0, 0, 0);
  return next;
}

function MoodPicker({
  label,
  options,
  selected,
  onSelect,
  keyPrefix = "",
}: {
  label: string;
  options: readonly { id: string; label: string; icon: React.ElementType }[];
  selected: string | null;
  onSelect: (id: string) => void;
  keyPrefix?: string;
}) {
  return (
    <div className="space-y-2.5">
      <p className="font-sans text-[12px] font-light text-[var(--ink-muted)] tracking-[0.03em]">{label}</p>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5 pr-5" style={{ scrollbarWidth: "none" }}>
        {options.map((opt) => {
          const Icon = opt.icon;
          const isActive = selected === opt.id;
          return (
            <button
              key={keyPrefix ? `${keyPrefix}-${opt.id}` : opt.id}
              onClick={() => onSelect(opt.id)}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-2xl px-3 py-2 font-sans text-[12px] font-light border transition-all active:scale-[0.97] ${
                isActive
                  ? "bg-[var(--ink-strong)] border-[var(--ink-strong)] text-white"
                  : "bg-white border-[var(--border-default)] text-[var(--ink-strong)]"
              }`}
            >
              <Icon size={12} strokeWidth={1.5} />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Home() {
  const navigate = useNavigate();
  const { resetRitual, setViewMode, setSelectedPublicRitual } = useRitual();
  const { session, isRitualSaved, saveRitual } = useUser();
  const [savingRitualId, setSavingRitualId] = useState<string | null>(null);
  const [dailyAnchorVersion, setDailyAnchorVersion] = useState(0);
  const [selectedAnchorStep, setSelectedAnchorStep] = useState<DailyAnchorType | null>(null);
  const [selectedDateOffset, setSelectedDateOffset] = useState(0); // 0=hoy, -1=ayer, etc.
  const [heroImageIndex, setHeroImageIndex] = useState(1);
  const [heroTextTheme, setHeroTextTheme] = useState<"light" | "dark">("light");
  const [localNow, setLocalNow] = useState(() => new Date());
  const [devTestHour, setDevTestHour] = useState<number | null>(() => {
    const v = localStorage.getItem("__dev_test_hour");
    return v !== null ? Number(v) : null;
  });
  const [weatherCondition, setWeatherCondition] = useState<WeatherCondition>("unknown");
  const [isListening, setIsListening] = useState(false);
  const [isReframing, setIsReframing] = useState(false);
  const [generatedIntention, setGeneratedIntention] = useState<string | null>(null);
  const [inicioFeeling, setInicioFeeling] = useState<string | null>(null);
  const [momentoAlignment, setMomentoAlignment] = useState<string | null>(null);
  const [momentoFeeling, setMomentoFeeling] = useState<string | null>(null);
  const [closingReflection, setClosingReflection] = useState("");
  const [cierreFeeling, setCierreFeeling] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const transcriptRef = useRef<string>("");

  const hasSpeechRecognition =
    typeof window !== "undefined" &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const cosmicContext = useMemo(() => getTodayCosmicContext(localNow), [localNow]);
  const cosmicDays = useMemo(() => getCosmicSliderDays(localNow, 6), [localNow]);

  const selectedDate = useMemo(() => {
    const d = new Date(localNow);
    d.setDate(d.getDate() + selectedDateOffset);
    return d;
  }, [localNow, selectedDateOffset]);

  // Stable string key — only changes when the calendar date changes, not when
  // the 60-second localNow tick creates a new Date object for the same day.
  const selectedDateKey = useMemo(() => {
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const d = String(selectedDate.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [selectedDate]);

  const isToday = selectedDateOffset === 0;
  const isFuture = selectedDateOffset > 0;
  const isPast = selectedDateOffset < 0;

  const dailyJourney = useMemo(
    () => getDailyAnchorJourney(selectedDate),
    [dailyAnchorVersion, selectedDateKey],
  );
  const dailyAnchorContent = useMemo(
    () => getDailyAnchorContent(selectedDate),
    [dailyAnchorVersion, selectedDateKey],
  );

  const recommendation = useMemo(
    () => chooseRecommendedRitual(EXPLORE_RITUALS, cosmicContext.momentOfDay, cosmicContext.day.moonPhase),
    [cosmicContext],
  );
  const recommendationData = ritualCardToRitualData(recommendation);
  const recommendationSaved = isRitualSaved(recommendationData);
  const popularRituals = EXPLORE_RITUALS.slice(0, 2);
  const isDev = import.meta.env.DEV;
  const journeyNow = useMemo(
    () => (devTestHour === null ? localNow : setHourForDate(localNow, devTestHour)),
    [devTestHour, localNow],
  );
  const completedCount = dailyJourney.completedCount;
  const journeyHour = journeyNow.getHours();
  const nextPendingStep = STEP_ORDER[completedCount] ?? null;
  const isMomentoUnlockedByTime = journeyHour >= 14;
  const isCierreUnlockedByTime = journeyHour >= 19;
  const effectiveCurrentStep =
    completedCount === 0
      ? "inicio"
      : completedCount === 1
      ? isMomentoUnlockedByTime
        ? "momento"
        : null
      : completedCount === 2
      ? isCierreUnlockedByTime
        ? "cierre"
        : null
      : null;
  const selectedStep = selectedAnchorStep ?? effectiveCurrentStep ?? nextPendingStep ?? "cierre";
  const selectedStepDefinition = dailyJourney.steps.find((step) => step.id === selectedStep) ?? dailyJourney.steps[0];
  const currentStep = effectiveCurrentStep;
  const isJourneyComplete = completedCount >= STEP_ORDER.length;
  const selectedStepIndex = STEP_ORDER.indexOf(selectedStep);
const isSelectedStepBlocked = !isJourneyComplete && selectedStepIndex > completedCount;
  const isSelectedStepTimeLocked =
    !isJourneyComplete &&
    nextPendingStep === selectedStep &&
    ((selectedStep === "momento" && !isMomentoUnlockedByTime) ||
      (selectedStep === "cierre" && !isCierreUnlockedByTime));
  const previousRequiredStep = isSelectedStepBlocked
    ? dailyJourney.steps.find((step) => STEP_ORDER.indexOf(step.id) === selectedStepIndex - 1)
    : null;
  const canCompleteSelectedStep =
    selectedStep === "inicio"
      ? Boolean(generatedIntention && inicioFeeling)
      : selectedStep === "momento"
      ? Boolean(momentoAlignment && momentoFeeling)
      : Boolean(closingReflection.trim() && cierreFeeling);

  const handleCreateRitual = () => {
    resetRitual();
    setViewMode(false);
    track("home_create_ritual_tapped", { source: "quick_path" });
    navigate("/onboarding");
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
      toast("Ya está guardado", {
        description: "Lo encontrás en Favoritos dentro de tu cuenta.",
      });
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

  useEffect(() => {
    setGeneratedIntention(dailyAnchorContent.inicio?.text ?? null);
    setInicioFeeling(dailyAnchorContent.inicio?.feeling ?? null);
    setMomentoAlignment(dailyAnchorContent.momento?.alignment ?? null);
    setMomentoFeeling(dailyAnchorContent.momento?.feeling ?? null);
    setClosingReflection(dailyAnchorContent.cierre?.text ?? "");
    setCierreFeeling(dailyAnchorContent.cierre?.feeling ?? null);
  }, [dailyAnchorContent]);

  useEffect(() => {
    setSelectedAnchorStep(null);
  }, [selectedDateOffset]);

  useEffect(() => {
    setSelectedAnchorStep((current) => {
      if (!current) return effectiveCurrentStep ?? nextPendingStep ?? "cierre";
      return current;
    });
  }, [effectiveCurrentStep, nextPendingStep]);

  const persistAnchorStep = async (step: DailyAnchorType, content: DailyAnchorStepContent) => {
    completeDailyAnchorStep(step, content, selectedDate);
    if (session?.user?.id) {
      void saveDailyAnchorEntry({
        userId: session.user.id,
        dateKey: dailyJourney.dateKey,
        step,
        content,
      });
    }
    setDailyAnchorVersion((current) => current + 1);
  };

  const handleStepSelect = (stepId: DailyAnchorType) => {
    setSelectedAnchorStep(stepId);
  };

  const handlePrimaryAction = async () => {
    if (isJourneyComplete) {
      navigate("/cuenta");
      return;
    }

    if (!currentStep) {
      return;
    }

    if (selectedStep !== currentStep) {
      setSelectedAnchorStep(currentStep);
      return;
    }

    if (!canCompleteSelectedStep) return;

    const content: Record<DailyAnchorType, DailyAnchorStepContent> = {
      inicio: {
        text: generatedIntention ?? undefined,
        feeling: inicioFeeling ?? undefined,
      },
      momento: {
        alignment: momentoAlignment ?? undefined,
        feeling: momentoFeeling ?? undefined,
      },
      cierre: {
        text: closingReflection.trim() || undefined,
        feeling: cierreFeeling ?? undefined,
      },
    };

    await persistAnchorStep(selectedStep, content[selectedStep]);
    const nextStep = STEP_ORDER[STEP_ORDER.indexOf(selectedStep) + 1] ?? selectedStep;
    setSelectedAnchorStep(nextStep);

    toast(`${selectedStepDefinition.shortLabel} registrada`, {
      description:
        selectedStep === "cierre"
          ? "Tu Diario de Anclas quedó completo por hoy."
          : `Seguís con ${STEP_ORDER[STEP_ORDER.indexOf(selectedStep) + 1] ?? "tu recorrido"}.`,
    });
  };

  const handleResetDayForDev = () => {
    resetDailyAnchorJourney();
    setGeneratedIntention(null);
    setInicioFeeling(null);
    setMomentoAlignment(null);
    setMomentoFeeling(null);
    setClosingReflection("");
    setCierreFeeling(null);
    setSelectedAnchorStep("inicio");
    setDailyAnchorVersion((current) => current + 1);
    toast("Diario reiniciado", {
      description: "Se limpió el recorrido local de hoy para seguir probando.",
    });
  };

  const handleSetDevTestHour = (hour: number | null) => {
    setDevTestHour(hour);
  };

  const handleMic = async () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = createSpeechRecognition();
    if (!recognition) return;

    transcriptRef.current = "";
    recognition.lang = "es-AR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = true;

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      for (let i = e.results.length - 1; i >= 0; i--) {
        if (e.results[i].isFinal) {
          transcriptRef.current += (transcriptRef.current ? " " : "") + e.results[i][0].transcript;
          break;
        }
      }
    };

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error !== "no-speech" && e.error !== "aborted") {
        setIsListening(false);
      }
    };

    recognition.onend = async () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      setIsListening(false);
      const transcript = transcriptRef.current.trim();
      transcriptRef.current = "";
      if (!transcript) return;

      track("home_voice_anchor_used");

      setIsReframing(true);
      try {
        const reframed = await reframeIntention(transcript);
        setGeneratedIntention(reframed || transcript);
      } finally {
        setIsReframing(false);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const nextEventMeta = cosmicContext.nextEvent
    ? cosmicContext.nextEvent.daysAway === 0
      ? `Hoy · ${cosmicContext.nextEvent.perfection.timeBuenosAires} Bs. As.`
      : cosmicContext.nextEvent.daysAway === 1
      ? "Mañana"
      : `En ${cosmicContext.nextEvent.daysAway} días`
    : undefined;

  return (
    <div className="min-h-screen flex flex-col overflow-y-auto relative bg-[var(--ink-strong)]">
      {/* Dynamic Background Image */}
      <div className="absolute top-0 left-0 w-full h-[85vh] z-0 pointer-events-none">
        <div className="absolute inset-0 bg-black/30 z-10" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/50 to-transparent z-10" />
        <img 
          src={`/home/bg-${heroImageIndex}.jpg`}
          alt="Cielo actual" 
          className="w-full h-full object-cover object-center" 
        />
      </div>

      <div className="w-full flex-none min-h-[85vh] flex flex-col pt-[50px] pb-14 px-6 relative z-10">
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
        />
      </div>

      <div className="editorial-page-sheet w-full flex-1 relative z-20 mt-[-32px] pt-10 pb-10">
        
        {/* Diario de intenciones */}
        <div id="daily-anchor" className="px-5 mb-12">

          {/* Header row */}
          <div className="flex items-center justify-between mb-5">
            <p className="editorial-eyebrow">Diario de intenciones</p>
            <div className="flex items-center gap-2">
              <div
                className="rounded-full px-3 py-1 font-sans text-[11px] tabular-nums font-light"
                style={{
                  background: completedCount === 3 ? "var(--ink-strong)" : "var(--surface-muted)",
                  color: completedCount === 3 ? "#fff" : "var(--ink-muted)",
                }}
              >
                {isToday ? `${completedCount}/3` : isPast ? (completedCount > 0 ? `${completedCount}/3` : "—") : "—"}
              </div>
              {isDev ? (
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-0.5 rounded-full bg-[var(--surface-muted)] px-1 py-0.5">
                    {([{ label: "●", value: null as number | null }, { label: "9h", value: 9 }, { label: "14h", value: 14 }, { label: "19h", value: 19 }] as const).map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => handleSetDevTestHour(opt.value)}
                        className={`rounded-full px-1.5 py-0.5 font-sans text-[9px] font-medium transition-colors ${
                          (opt.value === null && devTestHour === null) || devTestHour === opt.value
                            ? "bg-[var(--ink-strong)] text-white"
                            : "text-[var(--ink-subtle)]"
                        }`}
                      >{opt.label}</button>
                    ))}
                  </div>
                  <button onClick={handleResetDayForDev} className="font-sans text-[9px] text-[var(--ink-subtle)] hover:text-[var(--ink-body)]">↺</button>
                </div>
              ) : null}
            </div>
          </div>

          {/* Date navigation */}
          {(() => {
            const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
            const MONTH_NAMES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
            const dayLabel = isToday
              ? "Hoy"
              : DAY_NAMES[selectedDate.getDay()];
            const dateLabel = `${selectedDate.getDate()} ${MONTH_NAMES[selectedDate.getMonth()]}`;
            return (
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => setSelectedDateOffset((o) => o - 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-[var(--surface-muted)] text-[var(--ink-muted)] active:scale-95"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <div className="flex-1 flex justify-center">
                  <div
                    className="inline-flex items-center gap-2 rounded-2xl px-4 py-2"
                    style={{ background: isToday ? "var(--ink-strong)" : "var(--surface-muted)" }}
                  >
                    <span
                      className="font-sans text-[13px] font-light"
                      style={{ color: isToday ? "#fff" : "var(--ink-body)" }}
                    >
                      {dayLabel} · {dateLabel}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDateOffset((o) => Math.min(0, o + 1))}
                  disabled={isToday}
                  className="w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-[var(--surface-muted)] disabled:opacity-20 text-[var(--ink-muted)] active:scale-95"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            );
          })()}

          {/* Stepper — 3 tabs */}
          <div className="flex gap-2 mb-7">
            {dailyJourney.steps.map((step) => {
              const isSelected = step.id === selectedStep;
              const isDone = step.status === "completed";
              const isCurrentStep = step.id === currentStep;
              return (
                <button
                  key={step.id}
                  onClick={() => handleStepSelect(step.id)}
                  className="flex-1 flex flex-col items-center gap-1.5 transition-all"
                >
                  <div
                    className="w-full h-[3px] rounded-full transition-all"
                    style={{
                      background: isDone
                        ? "var(--ink-strong)"
                        : isCurrentStep
                        ? "rgba(10,10,10,0.25)"
                        : "var(--surface-muted)",
                    }}
                  />
                  <span
                    className="font-sans text-[11px] transition-colors"
                    style={{
                      color: isSelected
                        ? "var(--ink-strong)"
                        : isDone
                        ? "var(--ink-muted)"
                        : "var(--ink-soft)",
                      fontWeight: isSelected ? 500 : 300,
                    }}
                  >
                    {isDone ? "✓ " : ""}{step.shortLabel}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative">
            {isFuture ? (
              <motion.div
                key="future-locked"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4 py-2"
              >
                <p className="font-sans text-[12px] font-light text-[var(--ink-muted)]">
                  Este día todavía no llegó.
                </p>
                <h3 className="font-serif text-[28px] leading-[1.05] text-[var(--ink-strong)]" style={{ fontWeight: 400 }}>
                  El futuro no está<br /><em style={{ fontStyle: "italic", fontWeight: 300 }}>a tu alcance aún</em>
                </h3>
                <p className="font-sans text-[13px] font-light leading-[1.55] text-[var(--ink-subtle)] max-w-[300px]">
                  Hacé foco en el presente. Volvé hoy para registrar tu intención del día.
                </p>
                <button
                  onClick={() => setSelectedDateOffset(0)}
                  className="editorial-action-button editorial-action-button-primary"
                >
                  Volver a hoy
                </button>
              </motion.div>
            ) : isPast ? (
              <motion.div
                key={`past-${selectedDateOffset}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                {dailyJourney.completedCount === 0 ? (
                  <div className="space-y-3 py-2">
                    <p className="font-sans text-[12px] font-light text-[var(--ink-muted)]">
                      Nada registrado este día.
                    </p>
                    <h3 className="font-serif text-[28px] leading-[1.05] text-[var(--ink-strong)]" style={{ fontWeight: 400 }}>
                      Sin anclas<br /><em style={{ fontStyle: "italic", fontWeight: 300 }}>este día</em>
                    </h3>
                    <p className="font-sans text-[13px] font-light leading-[1.55] text-[var(--ink-subtle)]">
                      No registraste intenciones para esta fecha.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="font-sans text-[12px] font-light text-[var(--ink-muted)]">
                      Resumen del día
                    </p>
                    {dailyJourney.steps.map((step) => {
                      const content = dailyAnchorContent[step.id];
                      if (!content) return null;
                      return (
                        <div key={step.id} className="editorial-panel-soft rounded-2xl p-4">
                          <p className="editorial-eyebrow mb-3">{step.shortLabel}</p>
                          {step.id === "inicio" && content.text ? (
                            <p className="font-serif text-[16px] leading-[1.45] text-[var(--ink-strong)] mb-2" style={{ fontWeight: 400 }}>
                              "{content.text}"
                            </p>
                          ) : null}
                          {step.id === "momento" && content.alignment ? (
                            <p className="font-sans text-[12px] font-light text-[var(--ink-muted)] mb-1">
                              Alineación: <span className="font-normal text-[var(--ink-strong)]">{ALIGNMENT_OPTIONS.find((a) => a.id === content.alignment)?.label}</span>
                            </p>
                          ) : null}
                          {step.id === "cierre" && content.text ? (
                            <p className="font-serif text-[16px] leading-[1.45] text-[var(--ink-strong)] mb-2" style={{ fontWeight: 400 }}>
                              "{content.text}"
                            </p>
                          ) : null}
                          {content.feeling ? (
                            <p className="font-sans text-[12px] font-light text-[var(--ink-muted)]">
                              Sentimiento: <span className="font-normal text-[var(--ink-strong)]">{MOOD_OPTIONS.find((m) => m.id === content.feeling)?.label}</span>
                            </p>
                          ) : null}
                        </div>
                      );
                    })}
                  </>
                )}
              </motion.div>
            ) : isJourneyComplete ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5 pt-2"
              >
                <div className="w-24 h-24 mx-auto relative flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full overflow-visible">
                    <motion.ellipse
                      cx="50"
                      cy="50"
                      rx="42"
                      ry="46"
                      fill="none"
                      stroke="var(--ink-strong)"
                      strokeWidth="0.8"
                      opacity={0.8}
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 18, ease: "linear", repeat: Infinity }}
                      style={{ transformOrigin: "50% 50%" }}
                    />
                    <motion.ellipse
                      cx="50"
                      cy="50"
                      rx="46"
                      ry="42"
                      fill="none"
                      stroke="var(--ink-strong)"
                      strokeWidth="1"
                      opacity={0.6}
                      animate={{ rotate: [360, 0] }}
                      transition={{ duration: 24, ease: "linear", repeat: Infinity }}
                      style={{ transformOrigin: "50% 50%" }}
                    />
                    <motion.ellipse
                      cx="48"
                      cy="52"
                      rx="45"
                      ry="45"
                      fill="none"
                      stroke="var(--ink-strong)"
                      strokeWidth="0.7"
                      opacity={0.9}
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 28, ease: "linear", repeat: Infinity }}
                      style={{ transformOrigin: "50% 50%" }}
                    />
                    <motion.ellipse
                      cx="51"
                      cy="49"
                      rx="42"
                      ry="47"
                      fill="none"
                      stroke="var(--ink-strong)"
                      strokeWidth="0.9"
                      opacity={0.7}
                      animate={{ rotate: [360, 0] }}
                      transition={{ duration: 20, ease: "linear", repeat: Infinity }}
                      style={{ transformOrigin: "50% 50%" }}
                    />
                    <motion.ellipse
                      cx="52"
                      cy="51"
                      rx="47"
                      ry="44"
                      fill="none"
                      stroke="var(--ink-strong)"
                      strokeWidth="1.1"
                      opacity={0.5}
                      animate={{ rotate: [0, -360] }}
                      transition={{ duration: 32, ease: "linear", repeat: Infinity }}
                      style={{ transformOrigin: "50% 50%" }}
                    />
                  </svg>
                </div>
                <div className="text-center space-y-1.5">
                  <h3 className="font-serif text-[24px] leading-[1.1] text-[var(--ink-strong)] text-center" style={{ fontWeight: 400 }}>
                    Día completado
                  </h3>
                  <p className="mx-auto max-w-[280px] font-sans text-[12px] font-light leading-[1.55] text-[var(--ink-muted)]">
                    Registraste las tres anclas del día. Mañana este espacio vuelve a abrirse.
                  </p>
                </div>
                {dailyJourney.steps.map((step) => {
                  const content = dailyAnchorContent[step.id];
                  return (
                    <div key={step.id} className="editorial-panel-soft rounded-2xl p-4">
                      <p className="editorial-eyebrow mb-3">
                        {step.shortLabel}
                      </p>
                      {step.id === "inicio" && content?.text ? (
                        <p className="font-serif text-[16px] leading-[1.45] text-[var(--ink-strong)] mb-3" style={{ fontWeight: 400 }}>
                          "{content.text}"
                        </p>
                      ) : null}
                      {step.id === "momento" ? (
                        <div className="space-y-2">
                          <p className="font-sans text-[12px] font-light leading-[1.45] text-[var(--ink-muted)]">
                            Alineación:{" "}
                            <span className="font-normal text-[var(--ink-strong)]">
                              {ALIGNMENT_OPTIONS.find((item) => item.id === content?.alignment)?.label ?? "Sin registrar"}
                            </span>
                          </p>
                        </div>
                      ) : null}
                      {step.id === "cierre" && content?.text ? (
                        <p className="font-serif text-[16px] leading-[1.45] text-[var(--ink-strong)] mb-3" style={{ fontWeight: 400 }}>
                          "{content.text}"
                        </p>
                      ) : null}
                      <p className="font-sans text-[12px] font-light leading-[1.45] text-[var(--ink-muted)]">
                        Sentimiento:{" "}
                        <span className="font-normal text-[var(--ink-strong)]">
                          {MOOD_OPTIONS.find((item) => item.id === content?.feeling)?.label ?? "Sin registrar"}
                        </span>
                      </p>
                    </div>
                  );
                })}
              </motion.div>
            ) : isSelectedStepBlocked ? (
              <motion.div
                key={`${selectedStep}-blocked`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                <div className="space-y-4">
                  <p className="font-sans text-[12px] font-light leading-[1.45] text-[var(--ink-muted)]">
                    Este momento se abre cuando terminás el anterior.
                  </p>
                  <div>
                    <h3 className="font-serif text-[28px] leading-[1.05] text-[var(--ink-strong)] max-w-[300px]" style={{ fontWeight: 400 }}>
                      Completá {previousRequiredStep?.shortLabel ?? "el paso anterior"} primero
                    </h3>
                    <p className="mt-3 font-sans text-[13px] font-light leading-[1.5] text-[var(--ink-subtle)] max-w-[300px]">
                      El recorrido sigue el orden Inicio, Momento y Cierre. Cuando guardes el paso anterior, este contenido se habilita automáticamente.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedAnchorStep(previousRequiredStep?.id ?? currentStep ?? "inicio")}
                  className="editorial-action-button editorial-action-button-secondary mt-2"
                >
                  Ir a {previousRequiredStep?.shortLabel ?? "Inicio"}
                </button>
              </motion.div>
            ) : isSelectedStepTimeLocked ? (
              <motion.div
                key={`${selectedStep}-time-locked`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                <div className="space-y-4">
                  <p className="font-sans text-[12px] font-light leading-[1.45] text-[var(--ink-muted)]">
                    Este momento aparece más tarde en el día.
                  </p>
                  <div>
                    <h3 className="font-serif text-[18px] leading-[1.2] text-[var(--ink-strong)] max-w-[300px]" style={{ fontWeight: 400 }}>
                      {selectedStep === "momento" ? "Disponible desde las 14 h" : "Disponible desde las 19 h"}
                    </h3>
                    <p className="mt-3 font-sans text-[13px] font-light leading-[1.5] text-[var(--ink-subtle)] max-w-[300px]">
                      {selectedStep === "momento"
                        ? "Tu inicio ya quedó registrado. Volvé después de las 14 h para revisar cómo viene tu día."
                        : "Tu momento ya quedó registrado. Volvé después de las 19 h para cerrar el día con perspectiva."}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedAnchorStep(STEP_ORDER[Math.max(0, selectedStepIndex - 1)] ?? "inicio")}
                  className="editorial-action-button editorial-action-button-secondary mt-2"
                >
                  Volver a {STEP_ORDER[Math.max(0, selectedStepIndex - 1)] === "momento" ? "Momento" : "Inicio"}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key={selectedStep}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Question block */}
                <div>
                  <p className="font-sans text-[12px] font-light leading-[1.5] text-[var(--ink-muted)] mb-2 tracking-[0.02em]">
                    {STEP_COPY[selectedStep].intro}
                  </p>
                  <h3 className="font-serif text-[18px] leading-[1.2] text-[var(--ink-strong)]" style={{ fontWeight: 400 }}>
                    {STEP_COPY[selectedStep].title}
                  </h3>
                  <p className="mt-2 font-sans text-[13px] font-light leading-[1.55] text-[var(--ink-subtle)]">
                    {STEP_COPY[selectedStep].body}
                  </p>
                </div>

                {/* Inputs por paso */}
                {selectedStep === "inicio" ? (
                  <div className="space-y-5">
                    {hasSpeechRecognition ? (
                      <div className="relative">
                        {isListening && (
                          <motion.span
                            className="absolute inset-0 rounded-2xl pointer-events-none"
                            style={{ border: "1.5px solid var(--ink-strong)", opacity: 0.15 }}
                            animate={{ scale: [1, 1.04, 1], opacity: [0.15, 0, 0.15] }}
                            transition={{ duration: 1.8, repeat: Infinity }}
                          />
                        )}
                        <button
                          onClick={handleMic}
                          className={`relative w-full py-5 px-5 rounded-2xl transition-all flex items-center justify-center gap-3 ${
                            isListening
                              ? "bg-[var(--ink-strong)] text-white"
                              : "bg-[var(--surface-muted)] text-[var(--ink-body)] hover:bg-[var(--surface-soft)] active:scale-[0.98]"
                          }`}
                        >
                          {isListening ? (
                            <>
                              <div className="flex gap-[3px] items-center h-4">
                                {[0, 1, 2, 3].map((i) => (
                                  <motion.div
                                    key={i}
                                    className="w-[3px] rounded-full bg-white"
                                    animate={{ height: ["5px", "16px", "5px"] }}
                                    transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.12 }}
                                  />
                                ))}
                              </div>
                              <span className="font-sans text-[14px] font-light">Escuchando...</span>
                            </>
                          ) : (
                            <>
                              <svg width="20" height="20" viewBox="0 0 16 16" fill="none" className="shrink-0">
                                <rect x="5" y="1" width="6" height="9" rx="3" stroke="currentColor" strokeWidth="1.3" />
                                <path d="M2 8.5C2 11.538 4.686 14 8 14C11.314 14 14 11.538 14 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                                <line x1="8" y1="14" x2="8" y2="15.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                              </svg>
                              <div className="text-left">
                                <p className="font-sans text-[14px] font-light leading-none mb-0.5">Hablá, la app te escucha</p>
                                <p className="font-sans text-[11px] font-light text-[var(--ink-muted)]">Tocá para hablar</p>
                              </div>
                            </>
                          )}
                        </button>
                      </div>
                    ) : null}

                    <AnimatePresence>
                      {isReframing && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-3 px-1"
                        >
                          <div className="flex gap-1">
                            {[0, 1, 2].map((i) => (
                              <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-[var(--ink-strong)]"
                                animate={{ opacity: [0.2, 1, 0.2] }}
                                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                              />
                            ))}
                          </div>
                          <span className="font-sans text-[13px] text-[var(--ink-muted)]">Construyendo tu intención...</span>
                        </motion.div>
                      )}
                      {!isReframing && generatedIntention && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-2xl p-5"
                          style={{ background: "var(--ink-strong)" }}
                        >
                          <p className="editorial-eyebrow mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>Tu intención</p>
                          <p className="font-sans text-[14px] font-normal leading-[1.55]" style={{ color: "rgba(255,255,255,0.9)" }}>
                            {generatedIntention}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <MoodPicker
                      label="¿Cómo te sentís?"
                      options={MOOD_OPTIONS}
                      selected={inicioFeeling}
                      onSelect={setInicioFeeling}
                    />
                  </div>
                ) : null}

                {selectedStep === "momento" ? (
                  <div className="space-y-5">
                    <div>
                      <p className="font-sans text-[12px] font-light text-[var(--ink-muted)] mb-3 tracking-[0.02em]">¿Cómo viene el día?</p>
                      <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1 -mx-5 px-5 pr-5" style={{ scrollbarWidth: "none" }}>
                        {ALIGNMENT_OPTIONS.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => setMomentoAlignment(item.id)}
                            className={`shrink-0 inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-2 font-sans text-[12px] font-light border transition-all active:scale-[0.97] ${
                              momentoAlignment === item.id
                                ? "bg-[var(--ink-strong)] border-[var(--ink-strong)] text-white"
                                : "bg-white border-[var(--border-default)] text-[var(--ink-strong)]"
                            }`}
                          >
                            <item.icon size={12} strokeWidth={1.5} />
                            <span>{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <MoodPicker
                      label="¿Cómo te sentís?"
                      options={MOOD_OPTIONS}
                      selected={momentoFeeling}
                      onSelect={setMomentoFeeling}
                      keyPrefix="momento"
                    />
                  </div>
                ) : null}

                {selectedStep === "cierre" ? (
                  <div className="space-y-5">
                    <div
                      className="rounded-2xl px-5 py-4"
                      style={{ background: "var(--surface-muted)" }}
                    >
                      <textarea
                        value={closingReflection}
                        onChange={(event) => setClosingReflection(event.target.value)}
                        placeholder="Escribí una idea, un aprendizaje o algo que querés agradecer."
                        className="min-h-[120px] w-full resize-none bg-transparent font-sans text-[14px] font-light leading-[1.65] text-[var(--ink-strong)] outline-none placeholder:text-[var(--ink-soft)]"
                      />
                    </div>
                    <MoodPicker
                      label="¿Cómo te sentís?"
                      options={MOOD_OPTIONS}
                      selected={cierreFeeling}
                      onSelect={setCierreFeeling}
                      keyPrefix="cierre"
                    />
                  </div>
                ) : null}

                {/* CTA */}
                {!session && selectedStep === currentStep && !isJourneyComplete ? (
                  <button
                    onClick={() => navigate("/login")}
                    className="editorial-action-button editorial-action-button-primary"
                  >
                    Iniciá sesión para guardar
                  </button>
                ) : (
                  <button
                    onClick={() => void handlePrimaryAction()}
                    disabled={!isJourneyComplete && selectedStep === currentStep && !canCompleteSelectedStep}
                    className={`editorial-action-button ${
                      isJourneyComplete || (selectedStep === currentStep && canCompleteSelectedStep)
                        ? "editorial-action-button-primary"
                        : "editorial-action-button-secondary"
                    }`}
                  >
                    {isJourneyComplete
                      ? "Ver mi recorrido"
                      : selectedStep !== currentStep
                      ? `Ir a ${dailyJourney.steps.find((step) => step.id === currentStep)?.shortLabel ?? "paso actual"}`
                      : STEP_COPY[selectedStep].action}
                  </button>
                )}
              </motion.div>
            )}
          </div>
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
            eyebrow="Ritual para hoy"
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
              {cosmicDays.map((day, idx) => {
                 const isActive = idx === 0;
                 return (
                  <button
                    key={day.dateKey}
                    onClick={() => navigate("/calendario-cosmico", { state: { selectedDate: day.dateKey } })}
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

        {/* Populares ahora */}
        <div className="px-6 mb-12">
          <div className="editorial-section-header">
            <p className="editorial-eyebrow">Populares ahora</p>
            <button onClick={handleExplore} className="editorial-section-link">
              Ver catálogo →
            </button>
          </div>

          <div className="flex flex-col gap-3">
             {popularRituals.map((ritual) => {
               const ritualData = ritualCardToRitualData(ritual);
               const isSaved = isRitualSaved(ritualData);
               const candleGuide = deriveCandleGuide({
                 ritualType: ritual.type,
                 intention: ritual.intention,
                 energy: ritual.energy,
                 title: ritual.aiRitual?.title || ritual.title,
               });
               return (
                <RitualListCard
                  key={ritual.id}
                  title={ritual.title}
                  meta={[ritual.element, `${ritual.duration} min`, `Vela ${candleGuide.color.toLowerCase()}`]}
                  saved={isSaved}
                  saving={savingRitualId === ritual.id}
                  onOpen={() => handleRitualCard(ritual)}
                  onSave={(event) => {
                    event.stopPropagation();
                    void handleSaveRitual(ritual);
                  }}
                />
               );
             })}
          </div>
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
