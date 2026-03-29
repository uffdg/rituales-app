import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import { useRitual } from "../context/RitualContext";
import { useUser } from "../context/UserContext";
import { EXPLORE_RITUALS } from "../data/rituals";
import { WIKI_NOTES } from "../data/wiki";
import { UserMenu } from "../components/UserMenu";
import { MoonPhaseIcon } from "../components/MoonPhaseIcon";
import { getCosmicSliderDays, getPhaseBackgroundUrl } from "../lib/cosmic-calendar";
import {
  generateRitual,
  ritualCardToRitualData,
} from "../lib/ritual-service";
import { getUserFacingErrorMessage } from "../lib/errors";
import { deriveCandleGuide } from "../lib/candle";

const HOME_INTRO_KEY = "rituales_home_intro_seen_v1";

const INTRO_SLIDES = [
  {
    eyebrow: "Bienvenida",
    title: "Identifica tu intención",
    description: "La app escucha lo que necesitás ordenar y reconoce la intención que querés activar.",
  },
  {
    eyebrow: "Tu ritual",
    title: "Crea un ritual para este momento",
    description: "Transforma esa intención en una práctica concreta, simple y alineada con vos.",
  },
  {
    eyebrow: "Tu cierre",
    title: "Genera un cierre para que tu deseo se cumpla",
    description: "Te acompaña a cerrar el ritual con claridad para sostener lo que querés manifestar.",
  },
];

export function Home() {
  const navigate = useNavigate();
  const { resetRitual, setViewMode, setSelectedPublicRitual } = useRitual();
  const { session, isRitualSaved, saveRitual } = useUser();
  const [introStep, setIntroStep] = useState(0);
  const [showIntro, setShowIntro] = useState(true);
  const [savingRitualId, setSavingRitualId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const seenIntro = localStorage.getItem(HOME_INTRO_KEY) === "true";
      setShowIntro(!seenIntro);
    } catch {
      setShowIntro(true);
    }
  }, []);

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

  const handleSaveRitual = async (ritual: any) => {
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
          aiRitual: result.ritual,
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

  const completeIntro = () => {
    try {
      localStorage.setItem(HOME_INTRO_KEY, "true");
    } catch {}
    setShowIntro(false);
  };

  const handleNextIntro = () => {
    if (introStep === INTRO_SLIDES.length - 1) {
      completeIntro();
      return;
    }

    setIntroStep((current) => current + 1);
  };

  const featuredRituals = EXPLORE_RITUALS.slice(0, 3);
  const cosmicDays = getCosmicSliderDays(new Date(), 8);

  if (showIntro) {
    const slide = INTRO_SLIDES[introStep];

    return (
      <div className="min-h-screen bg-white flex flex-col justify-between overflow-hidden">
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 50% -10%, rgba(0,0,0,0.055) 0%, transparent 62%)",
          }}
        />

        <div className="relative z-10 flex justify-end px-6 pt-14">
          <button
            onClick={completeIntro}
            className="text-[#999] hover:text-[#0A0A0A] transition-colors"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "12px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Saltear
          </button>
        </div>

        <motion.div
          key={introStep}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 flex-1 px-6 flex flex-col items-center justify-center text-center"
        >
          <div
            className="mb-8 relative flex items-center justify-center"
            style={{ width: 180, height: 180 }}
          >
            <div
              style={{
                width: 180,
                height: 180,
                borderRadius: "50%",
                border: "1px solid rgba(0,0,0,0.05)",
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />
            <div
              style={{
                width: 110,
                height: 110,
                borderRadius: "50%",
                border: "1px solid rgba(0,0,0,0.08)",
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />
            <div
              className="relative"
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                border: "1px solid rgba(0,0,0,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "#0A0A0A",
                }}
              />
            </div>
          </div>

          <p
            className="mb-3 text-[#AAA]"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            {slide.eyebrow}
          </p>

          <h1
            style={{
              fontFamily: "Cormorant Garamond, serif",
              fontSize: "42px",
              fontWeight: 300,
              color: "#0A0A0A",
              lineHeight: 1.1,
              maxWidth: "320px",
            }}
          >
            {slide.title}
          </h1>

          <p
            className="mt-5 max-w-[290px]"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "15px",
              fontWeight: 300,
              color: "#7F7F7F",
              lineHeight: 1.7,
            }}
          >
            {slide.description}
          </p>
        </motion.div>

        <div className="relative z-10 px-6 pb-10">
          <div className="flex items-center justify-center gap-2 mb-6">
            {INTRO_SLIDES.map((item, index) => (
              <div
                key={item.title}
                className={index === introStep ? "bg-[#0A0A0A]" : "bg-[#D9D9D9]"}
                style={{
                  width: index === introStep ? 24 : 8,
                  height: 8,
                  borderRadius: 999,
                  transition: "all 200ms ease",
                }}
              />
            ))}
          </div>

          <button
            onClick={handleNextIntro}
            className="w-full py-4 px-6 bg-[#0A0A0A] text-white rounded-2xl transition-all active:scale-[0.98] hover:bg-[#1A1A1A]"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "15px",
              fontWeight: 400,
              letterSpacing: "0.04em",
            }}
          >
            {introStep === INTRO_SLIDES.length - 1 ? "Entrar" : "Siguiente"}
          </button>
        </div>
      </div>
    );
  }

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


        {/* Brand */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 flex flex-col items-center"
        >
          {/* Logo mark with animated ripples perfectly centered */}
          <div className="mb-6 relative flex items-center justify-center">
            {/* Animated Ripples */}
            <div className="absolute inset-0 pointer-events-none z-0">
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0.15, opacity: 0.1, x: "-50%", y: "-50%" }}
                  animate={{
                    scale: [0.15, 1],
                    opacity: [0.1, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "linear",
                    delay: i * 1,
                  }}
                  className="absolute top-1/2 left-1/2 rounded-full"
                  style={{
                    width: "400px",
                    height: "400px",
                    border: "1px solid rgba(0,0,0,1)",
                  }}
                />
              ))}
            </div>
            {/* Base SVG */}
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="relative z-10">
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

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.35 }}
        className="pt-8"
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
            Cielo de la semana
          </p>
          <button
            onClick={() => navigate("/calendario-cosmico")}
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "12px",
              color: "#0A0A0A",
              letterSpacing: "0.03em",
            }}
          >
            Ver calendario →
          </button>
        </div>

        <div className="overflow-x-auto hide-scrollbar pb-2 pl-6 pr-0">
          <div className="flex gap-3 w-max pr-6">
          {cosmicDays.map((day) => {
            const bgUrl = getPhaseBackgroundUrl(day.moonPhase);
            const isNewMoon = bgUrl === "black";
            return (
              <button
                key={day.dateKey}
                onClick={() => navigate("/calendario-cosmico", { state: { selectedDate: day.dateKey } })}
                className="relative overflow-hidden shrink-0 w-[128px] min-h-[160px] rounded-[6px] bg-[#000] px-4 py-4 text-left shadow-sm group hover:opacity-90 transition-all flex flex-col"
              >
                {!isNewMoon && bgUrl && (
                  <div
                    className="absolute inset-0 pointer-events-none transition-opacity duration-500 ease-out"
                    style={{
                      backgroundImage: `url(${bgUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                    }}
                  />
                )}

                <div className="relative z-10 w-full h-full flex flex-col flex-1 text-current">
                  <div>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: "10px", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "#FFF", marginBottom: "8px" }}>
                      {day.weekdayLabel}
                    </p>
                    <div className="flex items-center justify-between mb-3 text-current">
                      <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "28px", fontWeight: 500, color: "#FFF", lineHeight: 1 }}>
                        {day.shortLabel}
                      </p>
                      <div>
                        <MoonPhaseIcon phase={day.moonPhase} size={26} darkTheme={true} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-auto pt-4 flex flex-col items-start">
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 500, color: "#FFF", lineHeight: 1.4, marginBottom: day.events[0] ? "8px" : "0" }}>
                      {day.moonPhase}
                    </p>
                    {day.events[0] ? (
                      <span className="inline-flex px-2.5 py-0.5 rounded-[4px] bg-[#222] text-[#CCC]" style={{ fontFamily: "Inter, sans-serif", fontSize: "10px" }}>
                        {day.events[0].shortLabel}
                      </span>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })}
          </div>
        </div>
      </motion.div>

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
          {featuredRituals.map((ritual, i) => {
            const ritualData = ritualCardToRitualData(ritual);
            const isSaved = isRitualSaved(ritualData);
            const candleGuide = deriveCandleGuide({
              ritualType: ritual.type,
              intention: ritual.intention,
              energy: ritual.energy,
              title: ritual.aiRitual?.title || ritual.title,
              opening: ritual.aiRitual?.opening,
              symbolicAction: ritual.aiRitual?.symbolicAction,
              closing: ritual.aiRitual?.closing,
            });

            return (
              <motion.div
                key={ritual.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + i * 0.08 }}
                className="w-full p-4 border border-[rgba(0,0,0,0.07)] rounded-2xl hover:border-[rgba(0,0,0,0.15)] transition-all bg-white"
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    onClick={() => handleRitualCard(ritual)}
                    className="flex-1 min-w-0 text-left active:scale-[0.99] transition-transform"
                  >
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
                    <div className="flex flex-wrap items-center gap-2 mt-2">
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
                        className="text-[10px] px-2 py-0.5 rounded-full border border-[rgba(0,0,0,0.1)] text-[#666]"
                        style={{ fontFamily: "Inter, sans-serif", letterSpacing: "0.06em" }}
                      >
                        Vela {candleGuide.color}
                      </span>
                      <span
                        className="text-[10px] text-[#AAA]"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        ♥ {ritual.likes}
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleSaveRitual(ritual);
                    }}
                    disabled={savingRitualId === ritual.id}
                    className={`shrink-0 w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
                      isSaved
                        ? "border-[#0A0A0A] bg-[#0A0A0A] text-white"
                        : "border-[rgba(0,0,0,0.08)] bg-[#F5F5F5] text-[#555]"
                    }`}
                    aria-label="Guardar ritual"
                  >
                    {isSaved ? (
                      <BookmarkCheck size={16} strokeWidth={1.8} fill="currentColor" />
                    ) : (
                      <Bookmark size={16} strokeWidth={1.8} />
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.5 }}
        className="pt-2 pb-12"
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
            {WIKI_NOTES.map((note, index) => (
              <motion.button
                key={note.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.58 + index * 0.05 }}
                onClick={() => navigate(`/wiki/${note.id}`)}
                className="shrink-0 w-[220px] text-left transition-all hover:opacity-80 active:scale-[0.99] flex flex-col gap-3"
              >
                <div className="w-full aspect-[4/4] rounded-[6px] bg-[#f5f5f5] overflow-hidden relative isolate">
                  {note.image && (
                    <img 
                      src={note.image} 
                      alt={note.title} 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                    />
                  )}
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
      </motion.div>
    </div>
  );
}
