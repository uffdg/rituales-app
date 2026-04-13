import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { useRitual } from "../context/RitualContext";
import { useUser } from "../context/UserContext";
import { ELEMENTS } from "../data/rituals";
import { UserMenu } from "../components/UserMenu";
import { deriveCandleGuide } from "../lib/candle";
import { getUserFacingErrorMessage } from "../lib/errors";
import { toast } from "sonner";
import { Bookmark, BookmarkCheck, Pause, Play } from "lucide-react";
import {
  generateRitual,
  getRitualById,
  type RitualRecord,
} from "../lib/ritual-service";
const TRACKS = [
  { id: 0, label: "Handpan",    sublabel: "Tierra · 432hz",   load: () => import("../assets/handpan-soundscape-432hz.mp3").then((m) => m.default as string) },
  { id: 1, label: "Meditación", sublabel: "Flujo · 432hz",    load: () => import("../assets/danamusic-432hz-meditation-355839.mp3").then((m) => m.default as string) },
  { id: 2, label: "Tercer ojo", sublabel: "Profundo · 432hz", load: () => import("../assets/meditativecalmbuddha-third-eye-frequency-deep-healing-432hz-480114.mp3").then((m) => m.default as string) },
];

export function RitualDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const fromAccount = location.state?.fromAccount;
  const { ritual, isViewMode, resetRitual, selectedPublicRitual, setSelectedPublicRitual, setViewMode, updateRitual } = useRitual();
  const { saveRitual, isRitualSaved, session } = useUser();
  const [loadedRitual, setLoadedRitual] = useState<RitualRecord | null>(null);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "error">("idle");
  const [publicSavedRitualId, setPublicSavedRitualId] = useState<string | null>(null);
  const [isSavingPublicRitual, setIsSavingPublicRitual] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [activeTrack, setActiveTrack] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isPublic = id === "publico" && isViewMode && selectedPublicRitual;
  const data = isPublic ? selectedPublicRitual : null;

  useEffect(() => {
    if (!id || id === "nuevo" || id === "publico" || id.startsWith("mock-") || id.startsWith("dev-")) {
      return;
    }

    let cancelled = false;
    setLoadState("loading");

    getRitualById(id)
      .then((result) => {
        if (cancelled) return;

        if (!result) {
          setLoadState("error");
          return;
        }

        setLoadedRitual(result);
        setLoadState("idle");
        updateRitual({
          ritualId: result.ritualId,
          intention: result.intention || "",
          energy: result.energy || "",
          element: result.element || "",
          intensity: result.intensity || "",
          duration: result.duration || ritual.duration,
          aiRitual: result.ritual,
          guidedSession: result.guidedSession,
          guidedAudio: result.guidedAudio,
          anchor: result.anchor || "",
        });
      })
      .catch(() => {
        if (cancelled) return;
        setLoadState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const displayRitual = isPublic
    ? {
        title: data.aiRitual.title,
        intention: data.intention,
        energy: data.energy,
        element: data.element,
        intensity: data.intensity,
        duration: data.duration,
        opening: data.aiRitual.opening,
        symbolicAction: data.aiRitual.symbolicAction,
        closing: data.aiRitual.closing,
        anchor: data.anchor,
        author: data.author,
        guidedSession: data.guidedSession,
        guidedAudio: data.guidedAudio,
      }
    : loadedRitual
      ? {
          title: loadedRitual.ritual.title,
          intention: loadedRitual.intention || "",
          energy: loadedRitual.energy || "",
          element: loadedRitual.element || "",
          intensity: loadedRitual.intensity || "",
          duration: loadedRitual.duration || ritual.duration,
          opening: loadedRitual.ritual.opening,
          symbolicAction: loadedRitual.ritual.symbolicAction,
          closing: loadedRitual.ritual.closing,
          anchor: loadedRitual.anchor || "",
          author: loadedRitual.author || "Tú",
          guidedSession: loadedRitual.guidedSession,
          guidedAudio: loadedRitual.guidedAudio,
        }
    : {
        title: ritual.aiRitual?.title || "Mi ritual personal",
        intention: ritual.intention,
        energy: ritual.energy,
        element: ritual.element,
        intensity: ritual.intensity,
        duration: ritual.duration,
        opening: ritual.aiRitual?.opening || "",
        symbolicAction: ritual.aiRitual?.symbolicAction || "",
        closing: ritual.aiRitual?.closing || "",
        anchor: ritual.anchor,
        author: "Tú",
        guidedSession: ritual.guidedSession,
        guidedAudio: ritual.guidedAudio,
      };

  const elementData = ELEMENTS.find((e) => e.id === displayRitual.element);
  const ritualForAccount = loadedRitual
    ? {
        ritualId: loadedRitual.ritualId,
        ritualType: loadedRitual.ritualType || ritual.ritualType,
        simpleMode: ritual.simpleMode,
        intention: loadedRitual.intention || "",
        intentionCategory: ritual.intentionCategory,
        energy: loadedRitual.energy || "",
        duration: loadedRitual.duration || ritual.duration,
        intensity: loadedRitual.intensity || "",
        element: loadedRitual.element || "",
        aiRitual: loadedRitual.ritual,
        guidedSession: loadedRitual.guidedSession,
        guidedAudio: loadedRitual.guidedAudio,
        anchor: loadedRitual.anchor || "",
      }
    : ritual;
  const publicRitualForAccount = isPublic
    ? {
        ritualId: publicSavedRitualId || undefined,
        ritualType: data?.type || "",
        simpleMode: true,
        intention: data?.intention || "",
        intentionCategory: "",
        energy: typeof data?.energy === "string" ? data.energy.toLowerCase() : "",
        duration: data?.duration || 10,
        intensity: typeof data?.intensity === "string" ? data.intensity.toLowerCase() : "",
        element: typeof data?.element === "string" ? data.element.toLowerCase() : "",
        aiRitual: data?.aiRitual,
        guidedSession: data?.guidedSession,
        guidedAudio: data?.guidedAudio,
        anchor: data?.anchor || "",
      }
    : null;
  const isPublicSaved = publicRitualForAccount ? isRitualSaved(publicRitualForAccount) : false;
  const isLoadedThirdPartyRitual = Boolean(
    loadedRitual?.userId && session?.user?.id && loadedRitual.userId !== session.user.id,
  );
  const isOwnRitualView = !isPublic && !isLoadedThirdPartyRitual;
  const canSaveCurrentRitual = isPublic || isLoadedThirdPartyRitual;
  const currentSavableRitual = isPublic ? publicRitualForAccount : isLoadedThirdPartyRitual ? ritualForAccount : null;
  const isCurrentRitualSaved = currentSavableRitual ? isRitualSaved(currentSavableRitual) : false;

  const INTENSITY_MAP: Record<string, string> = {
    suave: "Suave",
    media: "Media",
    profunda: "Profunda",
  };
  const ENERGY_MAP: Record<string, string> = {
    calma: "Calma",
    apertura: "Apertura",
    poder: "Poder",
    conexion: "Conexión",
  };
  const anchorText =
    displayRitual.anchor?.trim() ||
    "Elegí una acción concreta y pequeña para llevar este ritual a tu vida real.";
  const candleGuide = deriveCandleGuide({
    ritualType: isPublic ? data?.type || "" : loadedRitual?.ritualType || ritualForAccount.ritualType,
    intention: displayRitual.intention,
    energy: displayRitual.energy,
    title: displayRitual.title,
    opening: displayRitual.opening,
    symbolicAction: displayRitual.symbolicAction,
    closing: displayRitual.closing,
  });

  const handleCreateOwnRitual = () => {
    if (!session) {
      navigate("/login");
      return;
    }

    resetRitual();
    setViewMode(false);
    setSelectedPublicRitual(null);
    navigate("/onboarding");
  };

  const handleSavePublicRitual = async () => {
    if (!session) {
      navigate("/login");
      return;
    }

    if (!publicRitualForAccount?.aiRitual) {
      toast("No pudimos guardar este ritual.");
      return;
    }

    if (isPublicSaved) {
      toast("Ya está guardado", {
        description: "Podés verlo en Favoritos dentro de tu cuenta.",
      });
      return;
    }

    setIsSavingPublicRitual(true);
    try {
      let ritualToSave = publicRitualForAccount;

      if (!ritualToSave.ritualId) {
        const result = await generateRitual(ritualToSave);
        ritualToSave = {
          ...ritualToSave,
          ritualId: result.ritualId,
          aiRitual: result.ritual,
          guidedSession: result.guidedSession,
          guidedAudio: result.guidedAudio,
        };
        setPublicSavedRitualId(result.ritualId || null);
      }

      const saved = await saveRitual(ritualToSave);

      if (saved) {
        toast("Ritual guardado ✓", {
          description: "Lo encontrás en Favoritos dentro de tu cuenta.",
        });
      } else {
        toast("Ya está guardado", {
          description: "Podés verlo en Favoritos dentro de tu cuenta.",
        });
      }
    } catch (error) {
      toast(getUserFacingErrorMessage(error, "No se pudo guardar este ritual."));
    } finally {
      setIsSavingPublicRitual(false);
    }
  };

  if (loadState === "loading") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <p
          style={{
            fontFamily: "Cormorant Garamond, serif",
            fontSize: "26px",
            color: "#333",
          }}
        >
          Cargando tu ritual...
        </p>
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
        <p
          style={{
            fontFamily: "Cormorant Garamond, serif",
            fontSize: "28px",
            color: "#111",
            marginBottom: "8px",
          }}
        >
          No pudimos abrir este ritual
        </p>
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "13px",
            color: "#888",
            marginBottom: "18px",
          }}
        >
          Puede que todavía no esté disponible o que el enlace haya cambiado.
        </p>
        <button
          onClick={() => navigate("/")}
          className="px-5 py-3 rounded-xl bg-[#0A0A0A] text-white"
          style={{ fontFamily: "Inter, sans-serif", fontSize: "14px" }}
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-y-auto">
      {/* Gradient */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,0,0,0.05) 0%, transparent 60%)",
        }}
      />

      {/* Header */}
      <div className="relative z-10 pt-14 px-6 pb-4 flex items-center justify-between">
        <button
          onClick={() => {
            if (fromAccount) navigate("/cuenta");
            else if (isViewMode) navigate("/explorar");
            else navigate("/");
          }}
          className="flex items-center gap-2 text-[#888] hover:text-[#0A0A0A] transition-colors"
          style={{ fontFamily: "Inter, sans-serif", fontSize: "13px" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {fromAccount ? "Volver" : isViewMode ? "Explorar" : "Inicio"}
        </button>
        <div className="flex items-center gap-3">
          {!isPublic && (
            <button
              onClick={() => navigate("/crear/1")}
              className="text-[#888] hover:text-[#0A0A0A] transition-colors"
              style={{ fontFamily: "Inter, sans-serif", fontSize: "13px" }}
            >
              Editar
            </button>
          )}
          <UserMenu />
        </div>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 px-6 pb-44"
      >
        {/* Decorative mark */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                border: "1px solid rgba(0,0,0,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  border: "1px solid rgba(0,0,0,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#0A0A0A" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1
          style={{
            fontFamily: "Cormorant Garamond, serif",
            fontSize: "30px",
            fontWeight: 400,
            color: "#0A0A0A",
            lineHeight: 1.25,
            textAlign: "center",
            marginBottom: "8px",
          }}
        >
          {displayRitual.title}
        </h1>

        {/* Badges */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {displayRitual.element && (
              <span
                className="px-3 py-1 rounded-full border border-[rgba(0,0,0,0.1)] text-[#555]"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "11px",
                  letterSpacing: "0.06em",
                }}
              >
                {elementData?.label || displayRitual.element}
              </span>
            )}
            {displayRitual.energy && (
              <span
                className="px-3 py-1 rounded-full border border-[rgba(0,0,0,0.1)] text-[#555]"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "11px",
                  letterSpacing: "0.06em",
                }}
              >
                {ENERGY_MAP[displayRitual.energy] || displayRitual.energy}
              </span>
            )}
            {displayRitual.intensity && (
              <span
                className="px-3 py-1 rounded-full bg-[#0A0A0A] text-white"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "11px",
                  letterSpacing: "0.06em",
                }}
              >
                {INTENSITY_MAP[displayRitual.intensity] || displayRitual.intensity}
              </span>
            )}
            {displayRitual.duration && (
              <span
                className="px-3 py-1 rounded-full border border-[rgba(0,0,0,0.1)] text-[#555]"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "11px",
                  letterSpacing: "0.06em",
                }}
              >
                {displayRitual.duration} min
              </span>
            )}
          </div>

          <div className="flex justify-center mt-2">
            <span
              className="px-3 py-1 rounded-full border border-[rgba(0,0,0,0.1)] text-[#555]"
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "11px",
                letterSpacing: "0.06em",
              }}
            >
              Vela {candleGuide.color}
            </span>
          </div>
        </div>

        {/* Thin divider */}
        <div className="h-[1px] bg-[#F0F0F0] mb-7" />

        {/* Intention */}
        {displayRitual.intention && (
          <div className="mb-7">
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "10px",
                fontWeight: 500,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#BBB",
                marginBottom: "8px",
              }}
            >
              Intención
            </p>
            <p
              style={{
                fontFamily: "Cormorant Garamond, serif",
                fontSize: "18px",
                fontWeight: 300,
                fontStyle: "italic",
                color: "#333",
                lineHeight: 1.5,
              }}
            >
              "{displayRitual.intention}"
            </p>
          </div>
        )}

        {/* Ritual sections */}
        <div className="mb-4">
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "10px",
              fontWeight: 500,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#BBB",
            }}
          >
            Ritual completo
          </p>
        </div>

        {[
          { label: "Apertura", text: displayRitual.opening, symbol: "◯" },
          {
            label: `Vela ${candleGuide.color}`,
            text: `${candleGuide.instruction} ${candleGuide.meaning}.`,
            symbol: "✦",
          },
          { label: "Acción simbólica", text: displayRitual.symbolicAction, symbol: "◎" },
          { label: "Acción de cierre", text: displayRitual.closing, symbol: "·" },
        ]
          .filter((s) => s.text)
          .map((section, i) => (
            <motion.div
              key={section.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
              className="mb-5 p-5 rounded-2xl border border-[rgba(0,0,0,0.06)] bg-[#FAFAFA]"
            >
              <div className="flex items-center gap-2 mb-3">
                <span
                  style={{
                    fontFamily: "Cormorant Garamond, serif",
                    fontSize: "14px",
                    color: "#CCC",
                  }}
                >
                  {section.symbol}
                </span>
                <p
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "10px",
                    fontWeight: 500,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "#AAA",
                  }}
                >
                  {section.label}
                </p>
              </div>
              <p
                style={{
                  fontFamily: "Cormorant Garamond, serif",
                  fontSize: "16px",
                  fontWeight: 300,
                  lineHeight: 1.65,
                  color: "#2A2A2A",
                }}
              >
                {section.text}
              </p>
            </motion.div>
          ))}

        {/* Anchor */}
        <div className="mb-6 p-5 rounded-2xl border border-[#0A0A0A] bg-[#0A0A0A]">
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "10px",
              fontWeight: 500,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.4)",
              marginBottom: "6px",
            }}
          >
            Tu anclaje real
          </p>
          <p
            style={{
              fontFamily: "Cormorant Garamond, serif",
              fontSize: "18px",
              fontWeight: 300,
              color: "white",
              lineHeight: 1.45,
            }}
          >
            {anchorText}
          </p>
        </div>

        {/* Author */}
        {isPublic && (
          <p
            className="text-center mb-6"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "12px",
              color: "#CCC",
            }}
          >
            Compartido por {displayRitual.author}
          </p>
        )}
      </motion.div>

      {/* Bottom action bar */}
      <div className="fixed z-30 bottom-16 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-white border-t border-[rgba(0,0,0,0.06)] px-6 py-4">
        {isOwnRitualView ? (
          <div className="flex gap-2.5">
            <button
              onClick={() => setShowPlayer(true)}
              className="flex-1 py-3.5 bg-[#0A0A0A] text-white rounded-xl transition-all active:scale-[0.98] cursor-pointer"
              style={{ fontFamily: "Inter, sans-serif", fontSize: "14px" }}
            >
              Iniciar
            </button>
            <button
              onClick={() => navigate("/compartir")}
              className="px-4 py-3.5 border border-[rgba(0,0,0,0.12)] text-[#555] rounded-xl transition-all active:scale-[0.98] cursor-pointer"
              style={{ fontFamily: "Inter, sans-serif", fontSize: "13px" }}
            >
              Compartir
            </button>
          </div>
        ) : (
          <div className="flex gap-2.5">
            {isPublic ? (
              <button
                onClick={handleCreateOwnRitual}
                className="flex-1 py-3.5 bg-[#0A0A0A] text-white rounded-xl transition-all active:scale-[0.98] cursor-pointer"
                style={{ fontFamily: "Inter, sans-serif", fontSize: "14px" }}
              >
                Crear el mío
              </button>
            ) : null}
            <button
              className={`${
                isPublic ? "px-4" : "flex-1"
              } py-3.5 border rounded-xl transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 ${
                isCurrentRitualSaved
                  ? "border-[#0A0A0A] bg-[#F5F5F5] text-[#0A0A0A]"
                  : "border-[rgba(0,0,0,0.12)] text-[#555]"
              }`}
              style={{ fontFamily: "Inter, sans-serif", fontSize: "13px" }}
              onClick={async () => {
                if (!canSaveCurrentRitual) {
                  return;
                }

                if (isPublic) {
                  await handleSavePublicRitual();
                  return;
                }

                if (!session) {
                  navigate("/login");
                  return;
                }

                try {
                  const saved = await saveRitual(ritualForAccount);
                  if (saved) {
                    toast("Ritual guardado ✓", {
                      description: "Lo encontrás en Favoritos dentro de tu cuenta.",
                    });
                  } else {
                    toast("Ya está guardado", {
                      description: "Podés verlo en Favoritos dentro de tu cuenta.",
                    });
                  }
                } catch (error) {
                  toast(getUserFacingErrorMessage(error, "No se pudo guardar este ritual."));
                }
              }}
              disabled={isSavingPublicRitual}
            >
              {isCurrentRitualSaved ? (
                <BookmarkCheck size={15} strokeWidth={1.5} />
              ) : (
                <Bookmark size={15} strokeWidth={1.5} />
              )}
              {isSavingPublicRitual
                ? "Guardando..."
                : isCurrentRitualSaved
                  ? "Guardado"
                  : "Guardar"}
            </button>
          </div>
        )}
      </div>

      {/* Audio player sheet */}
      <AnimatePresence>
        {showPlayer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => {
                audioRef.current?.pause();
                setIsPlaying(false);
                setActiveTrack(null);
                setShowPlayer(false);
              }}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-white rounded-t-3xl z-50 px-6 pt-5 pb-10"
            >
              <div className="w-10 h-1 bg-[#E0E0E0] rounded-full mx-auto mb-6" />

              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "10px",
                  fontWeight: 500,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#AAA",
                  marginBottom: "16px",
                }}
              >
                Elige una pista
              </p>

              <div className="flex flex-col gap-3 mb-6">
                {TRACKS.map((t) => {
                  const isActive = activeTrack === t.id;
                  const isThisPlaying = isActive && isPlaying;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        if (isActive) {
                          if (isPlaying) {
                            audioRef.current?.pause();
                            setIsPlaying(false);
                          } else {
                            audioRef.current?.play().catch(() => {});
                            setIsPlaying(true);
                          }
                        } else {
                          audioRef.current?.pause();
                          setActiveTrack(t.id);
                          setIsPlaying(false);
                          t.load().then((src) => {
                            const audio = new Audio(src);
                            audio.loop = true;
                            audio.volume = 0.7;
                            audio.onended = () => setIsPlaying(false);
                            audioRef.current = audio;
                            audio.play().catch(() => {});
                            setIsPlaying(true);
                          });
                        }
                      }}
                      className={`flex items-center justify-between px-4 py-4 rounded-2xl border transition-all ${
                        isActive
                          ? "border-[#0A0A0A] bg-[#0A0A0A] text-white"
                          : "border-[rgba(0,0,0,0.08)] bg-[#FAFAFA] text-[#0A0A0A]"
                      }`}
                    >
                      <div className="text-left">
                        <p
                          style={{
                            fontFamily: "Cormorant Garamond, serif",
                            fontSize: "18px",
                            fontWeight: 400,
                            lineHeight: 1.2,
                          }}
                        >
                          {t.label}
                        </p>
                        <p
                          style={{
                            fontFamily: "Inter, sans-serif",
                            fontSize: "11px",
                            opacity: isActive ? 0.6 : 0.45,
                            marginTop: "2px",
                          }}
                        >
                          {t.sublabel}
                        </p>
                      </div>
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          isActive ? "bg-white/15" : "bg-[rgba(0,0,0,0.05)]"
                        }`}
                      >
                        {isThisPlaying ? (
                          <Pause size={16} strokeWidth={1.8} />
                        ) : (
                          <Play size={16} strokeWidth={1.8} />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
