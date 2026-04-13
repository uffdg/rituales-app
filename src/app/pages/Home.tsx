import { useMemo, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowUpRight, Bookmark, CalendarDays, Compass, Sparkles, Smile, Cloud, Meh, Heart, Moon, Frown } from "lucide-react";
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
import { TodayContextCard } from "../components/TodayContextCard";
import { RitualRecommendationCard } from "../components/RitualRecommendationCard";

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

export function Home() {
  const navigate = useNavigate();
  const { resetRitual, setViewMode, setSelectedPublicRitual } = useRitual();
  const { session, isRitualSaved, saveRitual } = useUser();
  const [savingRitualId, setSavingRitualId] = useState<string | null>(null);
  const [dailyAnchorVersion, setDailyAnchorVersion] = useState(0);
  const [selectedAnchorStep, setSelectedAnchorStep] = useState<DailyAnchorType | null>(null);
  const [heroImageIndex, setHeroImageIndex] = useState(1);
  const [heroTextTheme, setHeroTextTheme] = useState<"light" | "dark">("light");
  const [localNow, setLocalNow] = useState(() => new Date());
  const [devTestHour, setDevTestHour] = useState<number | null>(null);
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
  const dailyJourney = useMemo(
    () => getDailyAnchorJourney(),
    [dailyAnchorVersion],
  );
  const dailyAnchorContent = useMemo(
    () => getDailyAnchorContent(),
    [dailyAnchorVersion],
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
  const currentStepIndex = currentStep ? STEP_ORDER.indexOf(currentStep) : completedCount;
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
    setSelectedAnchorStep((current) => {
      if (!current) return effectiveCurrentStep ?? nextPendingStep ?? "cierre";
      return current;
    });
  }, [effectiveCurrentStep, nextPendingStep]);

  const persistAnchorStep = async (step: DailyAnchorType, content: DailyAnchorStepContent) => {
    completeDailyAnchorStep(step, content);
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
      setIsListening(false);
      const transcript = transcriptRef.current.trim();
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
    <div className="min-h-screen flex flex-col overflow-y-auto relative bg-[#1A1A1A]">
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
          momentOfDay={cosmicContext.momentOfDay as any}
          localTimeLabel={localNow.toLocaleTimeString("es-AR", { hour: "numeric", minute: "2-digit" })}
          textTheme={heroTextTheme}
          weatherCondition={weatherCondition}
        />
      </div>

      <div className="bg-[#FCFCFA] rounded-t-[36px] w-full flex-1 relative z-20 mt-[-32px] pt-10 pb-10" style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.12)" }}>
        
        {/* Diario de anclas */}
        <div className="px-6 mb-12">
          <div className="mb-6">
            <div className="flex items-center justify-between gap-4 mb-2">
              <p className="font-sans text-[10px] font-medium tracking-[0.14em] uppercase text-[#9B978F]">
                Diario de anclas
              </p>
              {isDev ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 rounded-full border border-[rgba(0,0,0,0.04)] bg-[#F7F5F2] px-1 py-1">
                    {[
                      { label: "Real", value: null as number | null },
                      { label: "09", value: 9 },
                      { label: "14", value: 14 },
                      { label: "19", value: 19 },
                    ].map((option) => (
                      <button
                        key={option.label}
                        onClick={() => handleSetDevTestHour(option.value)}
                        className={`rounded-full px-2 py-1 font-sans text-[10px] font-medium tracking-[0.04em] transition-colors ${
                          devTestHour === option.value
                            ? "bg-[#0A0A0A] text-white"
                            : option.value === null && devTestHour === null
                            ? "bg-[#0A0A0A] text-white"
                            : "text-[#999]"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleResetDayForDev}
                    className="font-sans text-[10px] font-medium uppercase tracking-[0.12em] text-[#AAA] hover:text-[#444] transition-colors"
                  >
                    Reset dev
                  </button>
                </div>
              ) : null}
            </div>
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-serif text-[32px] text-[#0A0A0A] leading-[0.92] max-w-[210px]">
                Tu recorrido de hoy
              </h2>
              <div className="mt-1 shrink-0 rounded-full border border-[rgba(0,0,0,0.04)] bg-[#F7F5F2] px-3.5 py-1.5 text-[11px] text-[#999] font-sans font-medium">
                {completedCount}/3
              </div>
            </div>
          </div>

          <div className="mb-8">
            <div className="grid grid-cols-3 gap-3 mb-2.5">
              {dailyJourney.steps.map((step) => {
                const isSelected = step.id === selectedStep;
                const isActive = step.id === currentStep;
                const isDone = step.status === "completed";
                return (
                  <button
                    key={step.id}
                    onClick={() => handleStepSelect(step.id)}
                    className="text-left"
                  >
                    <div
                      className={`h-[5px] rounded-full transition-colors ${
                        isDone || isActive ? "bg-[#1F1F1F]" : "bg-[rgba(0,0,0,0.12)]"
                      }`}
                    />
                    <div className="mt-3 flex items-center gap-2">
                      <span
                        className={`font-sans text-[8.5px] uppercase tracking-[0.18em] ${
                          isSelected || isActive
                            ? "text-[#111111] font-medium"
                            : "text-[#AAA] font-medium"
                        }`}
                      >
                        {step.shortLabel}
                      </span>
                      {(isSelected || isActive) ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#111111]" />
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative">
            {isJourneyComplete ? (
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
                      stroke="#0A0A0A"
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
                      stroke="#0A0A0A"
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
                      stroke="#0A0A0A"
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
                      stroke="#0A0A0A"
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
                      stroke="#0A0A0A"
                      strokeWidth="1.1"
                      opacity={0.5}
                      animate={{ rotate: [0, -360] }}
                      transition={{ duration: 32, ease: "linear", repeat: Infinity }}
                      style={{ transformOrigin: "50% 50%" }}
                    />
                  </svg>
                </div>
                <div className="text-center space-y-1.5">
                  <h3 className="font-serif text-[24px] leading-[1.02] text-[#0A0A0A]">
                    Día completado
                  </h3>
                  <p className="mx-auto max-w-[280px] font-sans text-[12px] leading-[1.55] text-[#666]">
                    Registraste las tres anclas del día. Mañana este espacio vuelve a abrirse.
                  </p>
                </div>
                {dailyJourney.steps.map((step) => {
                  const content = dailyAnchorContent[step.id];
                  return (
                    <div
                      key={step.id}
                      className="rounded-2xl border border-[rgba(0,0,0,0.06)] bg-[#F7F5F2] p-4"
                    >
                      <p className="font-sans text-[10px] font-medium tracking-[0.12em] uppercase text-[#AAA] mb-3">
                        {step.shortLabel}
                      </p>
                      {step.id === "inicio" && content?.text ? (
                        <p className="font-serif text-[16px] leading-[1.45] text-[#111111] mb-3">
                          "{content.text}"
                        </p>
                      ) : null}
                      {step.id === "momento" ? (
                        <div className="space-y-2">
                          <p className="font-sans text-[12px] leading-[1.45] text-[#666]">
                            Alineación:{" "}
                            <span className="font-semibold text-[#111111]">
                              {ALIGNMENT_OPTIONS.find((item) => item.id === content?.alignment)?.label ?? "Sin registrar"}
                            </span>
                          </p>
                        </div>
                      ) : null}
                      {step.id === "cierre" && content?.text ? (
                        <p className="font-serif text-[16px] leading-[1.45] text-[#111111] mb-3">
                          "{content.text}"
                        </p>
                      ) : null}
                      <p className="font-sans text-[12px] leading-[1.45] text-[#666]">
                        Sentimiento:{" "}
                        <span className="font-semibold text-[#111111]">
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
                  <p className="font-sans text-[13px] leading-[1.45] text-[#666]">
                    Este momento se abre cuando terminás el anterior.
                  </p>
                  <div>
                    <h3 className="font-serif text-[34px] leading-[0.98] text-[#0A0A0A] max-w-[300px]">
                      Completá {previousRequiredStep?.shortLabel ?? "el paso anterior"} primero
                    </h3>
                    <p className="mt-3 font-sans text-[13px] leading-[1.5] text-[#999] max-w-[300px]">
                      El recorrido sigue el orden Inicio, Momento y Cierre. Cuando guardes el paso anterior, este contenido se habilita automáticamente.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedAnchorStep(previousRequiredStep?.id ?? currentStep ?? "inicio")}
                  className="mt-2 w-full rounded-2xl border border-[rgba(0,0,0,0.06)] bg-[#FAFAFA] px-6 py-4 font-sans text-[14px] font-normal text-[#444] transition-all"
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
                  <p className="font-sans text-[13px] leading-[1.45] text-[#666]">
                    Este momento aparece más tarde en el día.
                  </p>
                  <div>
                    <h3 className="font-serif text-[34px] leading-[0.98] text-[#0A0A0A] max-w-[300px]">
                      {selectedStep === "momento" ? "Disponible desde las 14 h" : "Disponible desde las 19 h"}
                    </h3>
                    <p className="mt-3 font-sans text-[13px] leading-[1.5] text-[#999] max-w-[300px]">
                      {selectedStep === "momento"
                        ? "Tu inicio ya quedó registrado. Volvé después de las 14 h para revisar cómo viene tu día."
                        : "Tu momento ya quedó registrado. Volvé después de las 19 h para cerrar el día con perspectiva."}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedAnchorStep(STEP_ORDER[Math.max(0, selectedStepIndex - 1)] ?? "inicio")}
                  className="mt-2 w-full rounded-2xl border border-[rgba(0,0,0,0.06)] bg-[#FAFAFA] px-6 py-4 font-sans text-[14px] font-normal text-[#444] transition-all"
                >
                  Volver a {STEP_ORDER[Math.max(0, selectedStepIndex - 1)] === "momento" ? "Momento" : "Inicio"}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key={selectedStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                <div className="space-y-3">
                  <p className="font-sans text-[13px] leading-[1.45] text-[#666]">
                    {STEP_COPY[selectedStep].intro}
                  </p>
                  <div>
                    <h3 className="font-serif text-[34px] leading-[0.98] text-[#0A0A0A] max-w-[300px]">
                      {STEP_COPY[selectedStep].title}
                    </h3>
                    <p className="mt-3 font-sans text-[13px] leading-[1.5] text-[#999] max-w-[300px]">
                      {STEP_COPY[selectedStep].body}
                    </p>
                  </div>
                </div>

                {selectedStep === "inicio" ? (
                  <div className="space-y-5">
                    {hasSpeechRecognition ? (
                      <div>
                        <button
                          onClick={handleMic}
                          className={`w-full py-4 px-5 rounded-2xl border transition-all flex items-center justify-center gap-3 ${
                            isListening
                              ? "border-[#0A0A0A] bg-[#0A0A0A] text-white"
                              : "border-[rgba(0,0,0,0.1)] bg-[#FAFAFA] text-[#444] hover:border-[rgba(0,0,0,0.2)]"
                          }`}
                        >
                          {isListening ? (
                            <>
                              <div className="flex gap-1 items-center">
                                {[0, 1, 2].map((i) => (
                                  <motion.div
                                    key={i}
                                    className="w-1 rounded-full bg-white"
                                    animate={{ height: ["4px", "14px", "4px"] }}
                                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                                  />
                                ))}
                              </div>
                              <span className="font-sans text-[14px]">Escuchando...</span>
                            </>
                          ) : (
                            <>
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <rect x="5" y="1" width="6" height="9" rx="3" stroke="currentColor" strokeWidth="1.25" />
                                <path d="M2 8.5C2 11.538 4.686 14 8 14C11.314 14 14 11.538 14 8.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
                                <line x1="8" y1="14" x2="8" y2="15.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
                              </svg>
                              <span className="font-sans text-[14px] font-light">
                                Hablá, la app te escucha
                              </span>
                            </>
                          )}
                        </button>
                      </div>
                    ) : null}

                    {isReframing ? (
                      <div className="mt-4 p-4 rounded-2xl bg-[#FAFAFA] border border-[rgba(0,0,0,0.06)] flex items-center gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1">
                            {[0, 1, 2].map((i) => (
                              <motion.div
                                key={i}
                                className="w-1.5 h-1.5 rounded-full bg-[#0A0A0A]"
                                animate={{ opacity: [0.25, 1, 0.25] }}
                                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                              />
                            ))}
                          </div>
                          <span className="font-sans text-[13px] text-[#666]">
                            Construyendo tu intención...
                          </span>
                        </div>
                      </div>
                    ) : generatedIntention ? (
                      <div className="mt-4 p-5 rounded-2xl bg-[#F7F5F2] border border-[rgba(0,0,0,0.06)]">
                        <p className="font-sans text-[10px] font-medium tracking-[0.12em] uppercase text-[#AAA] mb-2">
                          Tu intención
                        </p>
                        <p className="font-serif text-[18px] leading-[1.4] text-[#0A0A0A] mb-4">
                          {generatedIntention}
                        </p>
                      </div>
                    ) : null}

                    <div className="space-y-3">
                      <h4 className="font-sans text-[13px] font-medium text-[#0A0A0A]">¿Cómo te sentís?</h4>
                      <div className="flex gap-2.5 overflow-x-auto pb-1 hide-scrollbar">
                        {MOOD_OPTIONS.map((mood) => (
                          <button
                            key={mood.id}
                            onClick={() => setInicioFeeling(mood.id)}
                            className={`shrink-0 inline-flex items-center gap-2 rounded-2xl border px-4 py-3 transition-colors ${
                              inicioFeeling === mood.id
                                ? "border-[#0A0A0A] bg-[#0A0A0A] text-white"
                                : "border-[rgba(0,0,0,0.04)] bg-[#F3F1ED] text-[#0A0A0A] hover:bg-[#EBE9E4]"
                            }`}
                          >
                            <mood.icon size={16} strokeWidth={1.8} />
                            <span className="font-sans text-[13px] font-medium">{mood.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}

                {selectedStep === "momento" ? (
                  <div className="space-y-5">
                    <div className="flex flex-wrap gap-3">
                      {ALIGNMENT_OPTIONS.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setMomentoAlignment(item.id)}
                          className={`inline-flex min-w-[132px] items-center gap-2 rounded-2xl border px-4 py-3 transition-colors ${
                            momentoAlignment === item.id
                              ? "border-[#0A0A0A] bg-[#0A0A0A] text-white"
                              : "border-[rgba(0,0,0,0.04)] bg-[#F3F1ED] text-[#0A0A0A] hover:bg-[#EBE9E4]"
                          }`}
                        >
                          <item.icon size={16} strokeWidth={1.8} />
                            <span className="font-sans text-[13px] font-medium">{item.label}</span>
                          </button>
                      ))}
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-sans text-[13px] font-medium text-[#0A0A0A]">¿Cómo te sentís?</h4>
                      <div className="flex gap-2.5 overflow-x-auto pb-1 hide-scrollbar">
                        {MOOD_OPTIONS.map((mood) => (
                          <button
                            key={`momento-${mood.id}`}
                            onClick={() => setMomentoFeeling(mood.id)}
                            className={`shrink-0 inline-flex items-center gap-2 rounded-2xl border px-4 py-3 transition-colors ${
                              momentoFeeling === mood.id
                                ? "border-[#0A0A0A] bg-[#0A0A0A] text-white"
                                : "border-[rgba(0,0,0,0.04)] bg-[#F3F1ED] text-[#0A0A0A] hover:bg-[#EBE9E4]"
                            }`}
                          >
                            <mood.icon size={16} strokeWidth={1.8} />
                            <span className="font-sans text-[13px] font-medium">{mood.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}

                {selectedStep === "cierre" ? (
                  <div className="space-y-5">
                    <div className="rounded-2xl border border-[rgba(0,0,0,0.06)] bg-[#F7F5F2] px-5 py-5">
                      <textarea
                        value={closingReflection}
                        onChange={(event) => setClosingReflection(event.target.value)}
                        placeholder="Escribí una idea, un aprendizaje o algo que querés agradecer."
                        className="min-h-[128px] w-full resize-none bg-transparent font-sans text-[15px] leading-[1.6] text-[#111111] outline-none placeholder:text-[#999]"
                      />
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-sans text-[13px] font-medium text-[#0A0A0A]">¿Cómo te sentís?</h4>
                      <div className="flex gap-2.5 overflow-x-auto pb-1 hide-scrollbar">
                        {MOOD_OPTIONS.map((mood) => (
                          <button
                            key={`cierre-${mood.id}`}
                            onClick={() => setCierreFeeling(mood.id)}
                            className={`shrink-0 inline-flex items-center gap-2 rounded-2xl border px-4 py-3 transition-colors ${
                              cierreFeeling === mood.id
                                ? "border-[#0A0A0A] bg-[#0A0A0A] text-white"
                                : "border-[rgba(0,0,0,0.04)] bg-[#F3F1ED] text-[#0A0A0A] hover:bg-[#EBE9E4]"
                            }`}
                          >
                            <mood.icon size={16} strokeWidth={1.8} />
                            <span className="font-sans text-[13px] font-medium">{mood.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}

                <button
                  onClick={() => void handlePrimaryAction()}
                  disabled={!isJourneyComplete && selectedStep === currentStep && !canCompleteSelectedStep}
                  className={`mt-2 w-full rounded-2xl px-6 py-4 font-sans text-[14px] font-normal transition-all ${
                    isJourneyComplete
                      ? "bg-[#0A0A0A] text-white hover:bg-[#1A1A1A]"
                      : selectedStep !== currentStep
                      ? "border border-[rgba(0,0,0,0.06)] bg-[#FAFAFA] text-[#444]"
                      : canCompleteSelectedStep
                      ? "bg-[#0A0A0A] text-white hover:bg-[#1A1A1A]"
                      : "bg-[#F0F0F0] text-[#BBB] cursor-not-allowed"
                  }`}
                >
                  {isJourneyComplete
                    ? "Ver mi recorrido"
                    : selectedStep !== currentStep
                    ? `Volver a ${dailyJourney.steps.find((step) => step.id === currentStep)?.shortLabel ?? "tu paso actual"}`
                    : STEP_COPY[selectedStep].action}
                </button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Tu Camino en Rituales */}
        <div className="px-6 mb-12">
          <div className="flex items-baseline justify-between mb-4">
            <p className="font-sans text-[10px] font-medium tracking-[0.14em] uppercase text-[#999]">
              Tu camino en Rituales
            </p>
            <button onClick={() => navigate("/cuenta")} className="font-sans text-[11px] text-[#0A0A0A] tracking-[0.03em] font-medium">
              Mi continuidad →
            </button>
          </div>

          <div className="flex gap-2">
             <button onClick={handleCreateRitual} className="flex-1 bg-white border border-[rgba(0,0,0,0.04)] rounded-[20px] p-4 text-left flex flex-col shadow-[0_4px_14px_rgba(0,0,0,0.02)]">
                <div className="w-8 h-8 rounded-full bg-[#FBFBFA] border border-[rgba(0,0,0,0.03)] flex items-center justify-center mb-6">
                   <Sparkles size={14} className="text-[#6F6A63]" />
                </div>
                <h4 className="font-sans text-[11px] font-semibold text-[#0A0A0A] mb-2 leading-tight">Crear un<br/>ritual</h4>
                <p className="font-sans text-[9px] text-[#888] leading-[1.4] mb-4">Entrá directo al ritual personalizado.</p>
                <ArrowUpRight size={12} className="text-[#8D8881] mt-auto" />
             </button>
             <button onClick={handleExplore} className="flex-1 bg-white border border-[rgba(0,0,0,0.04)] rounded-[20px] p-4 text-left flex flex-col shadow-[0_4px_14px_rgba(0,0,0,0.02)]">
                <div className="w-8 h-8 rounded-full bg-[#FBFBFA] border border-[rgba(0,0,0,0.03)] flex items-center justify-center mb-6">
                   <Compass size={14} className="text-[#6F6A63]" />
                </div>
                <h4 className="font-sans text-[11px] font-semibold text-[#0A0A0A] mb-2 leading-tight">Explorar<br/>rituales</h4>
                <p className="font-sans text-[9px] text-[#888] leading-[1.4] mb-4">Recorré ideas ya armadas.</p>
                <ArrowUpRight size={12} className="text-[#8D8881] mt-auto" />
             </button>
             <button onClick={() => navigate("/calendario-cosmico")} className="flex-1 bg-white border border-[rgba(0,0,0,0.04)] rounded-[20px] p-4 text-left flex flex-col shadow-[0_4px_14px_rgba(0,0,0,0.02)]">
                <div className="w-8 h-8 rounded-full bg-[#FBFBFA] border border-[rgba(0,0,0,0.03)] flex items-center justify-center mb-6">
                   <CalendarDays size={14} className="text-[#6F6A63]" />
                </div>
                <h4 className="font-sans text-[11px] font-semibold text-[#0A0A0A] mb-2 leading-tight">Abrir<br/>calendario</h4>
                <p className="font-sans text-[9px] text-[#888] leading-[1.4] mb-4">Leé el tono simbólico de hoy.</p>
                <ArrowUpRight size={12} className="text-[#8D8881] mt-auto" />
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
          <div className="px-6 flex items-baseline justify-between mb-4">
            <p className="font-sans text-[10px] font-medium tracking-[0.14em] uppercase text-[#999]">
              Cielo de la semana
            </p>
            <button onClick={() => navigate("/calendario-cosmico")} className="font-sans text-[11px] text-[#0A0A0A] tracking-[0.03em] font-medium">
              Ver completo →
            </button>
          </div>
          <div className="overflow-x-auto hide-scrollbar pb-4 pl-6 pr-6 -mr-6">
            <div className="flex gap-2 w-max pr-6">
              {cosmicDays.map((day, idx) => {
                 const isActive = idx === 1; // mocked state corresponding to today
                 return (
                  <button
                    key={day.dateKey}
                    onClick={() => navigate("/calendario-cosmico", { state: { selectedDate: day.dateKey } })}
                    className={`w-[124px] shrink-0 rounded-[20px] bg-white px-4 py-4 text-left transition-all`}
                    style={{
                       border: isActive ? "1.5px solid #0A0A0A" : "1px solid rgba(0,0,0,0.04)",
                       boxShadow: isActive ? "0 8px 24px rgba(0,0,0,0.06)" : "0 4px 14px rgba(0,0,0,0.02)"
                    }}
                  >
                    <div className="flex items-center justify-between mb-5">
                      <p className="font-sans text-[9px] font-semibold tracking-[0.12em] uppercase" style={{ color: isActive ? "#0A0A0A" : "#A7A29A" }}>
                        {day.weekdayLabel}
                      </p>
                      <div className="text-[#0A0A0A] bg-[#FBFBFA] w-5 h-5 rounded-full flex items-center justify-center border border-[rgba(0,0,0,0.03)]">
                         <Compass size={11} strokeWidth={2} className="text-[#0A0A0A]" />
                      </div>
                    </div>
                    <p className="font-serif text-[22px] text-[#0A0A0A] leading-none mb-1.5">
                      {day.shortLabel}
                    </p>
                    <p className="font-sans text-[10px] text-[#727272] leading-[1.3] mb-4 opacity-90">
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
          <div className="flex items-baseline justify-between mb-4">
            <p className="font-sans text-[10px] font-medium tracking-[0.14em] uppercase text-[#999]">
              Populares ahora
            </p>
            <button onClick={handleExplore} className="font-sans text-[11px] text-[#0A0A0A] tracking-[0.03em] font-medium">
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
                <button 
                  key={ritual.id} 
                  onClick={() => handleRitualCard(ritual)}
                  className="w-full rounded-[24px] border border-[rgba(0,0,0,0.03)] bg-white px-4 py-4 flex items-center justify-between shadow-[0_4px_14px_rgba(0,0,0,0.02)] active:scale-[0.99] text-left"
                >
                   <div>
                      <h4 className="font-sans text-[13px] font-semibold text-[#0A0A0A] mb-1.5">{ritual.title}</h4>
                      <p className="font-sans text-[10px] text-[#767676]">{ritual.element} · {ritual.duration} min · Vela {candleGuide.color.toLowerCase()}</p>
                   </div>
                   <div 
                     onClick={(e) => {
                        e.stopPropagation();
                        void handleSaveRitual(ritual);
                     }}
                     className={`w-9 h-9 flex items-center justify-center rounded-[12px] border ${isSaved ? "bg-[#0A0A0A] border-[#0A0A0A] text-white" : "border-[rgba(0,0,0,0.06)] bg-[#FBFBFA] text-[#0A0A0A]"}`}
                   >
                      <Bookmark size={14} strokeWidth={2} fill={isSaved ? "currentColor" : "none"} />
                   </div>
                </button>
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
        <div className="px-6 flex items-baseline justify-between mb-5">
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
            Notas para rituales
          </p>
          <button
            onClick={() => navigate("/wiki")}
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "12px",
              color: "#0A0A0A",
              letterSpacing: "0.03em",
            }}
          >
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
                className="shrink-0 w-[220px] text-left transition-all hover:opacity-80 active:scale-[0.99] flex flex-col gap-3"
              >
                <div
                  className="w-full aspect-[4/4] bg-[#f5f5f5] overflow-hidden relative isolate border border-[rgba(0,0,0,0.04)]"
                  style={{
                    borderRadius: "var(--radius-2xl, 24px)",
                    boxShadow: "0 16px 34px rgba(15, 15, 15, 0.05)",
                  }}
                >
                  {note.image ? (
                    <img
                      src={note.image}
                      alt={note.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                    />
                  ) : null}
                </div>
                <div className="pt-1">
                  <p
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "10px",
                      fontWeight: 500,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "#BBB",
                      marginBottom: "6px",
                    }}
                  >
                    {note.eyebrow}
                  </p>
                  <h3
                    style={{
                      fontFamily: "Cormorant Garamond, serif",
                      fontSize: "22px",
                      fontWeight: 400,
                      color: "#0A0A0A",
                      lineHeight: 1.15,
                      marginBottom: "8px",
                    }}
                  >
                    {note.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "12px",
                      color: "#777",
                      lineHeight: 1.55,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {note.summary}
                  </p>
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
