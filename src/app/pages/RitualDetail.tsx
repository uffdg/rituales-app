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
      <div className="editorial-page-bg items-center justify-center px-6">
        <p className="font-serif text-[26px] text-[var(--ink-body)]">Cargando tu ritual...</p>
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="editorial-page-bg flex-col items-center justify-center px-6 text-center">
        <p className="font-serif text-[28px] text-[var(--ink-strong)] mb-2">No pudimos abrir este ritual</p>
        <p className="editorial-body-muted mb-[18px]">
          Puede que todavía no esté disponible o que el enlace haya cambiado.
        </p>
        <button
          onClick={() => navigate("/")}
          className="editorial-button-primary px-5 py-3"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <div className="editorial-detail-shell">
      <div className="editorial-radial-wash" />

      {/* Header */}
      <div className="relative z-10 pt-14 px-6 pb-4 flex items-center justify-between">
        <button
          onClick={() => {
            if (fromAccount) navigate("/cuenta");
            else if (isViewMode) navigate("/explorar");
            else navigate("/");
          }}
          className="editorial-detail-header-link"
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
              className="editorial-detail-header-link"
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
            <div className="w-[60px] h-[60px] rounded-full border border-[var(--border-soft)] flex items-center justify-center">
              <div className="w-9 h-9 rounded-full border border-[var(--border-default)] flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-[var(--ink-strong)]" />
              </div>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="font-serif text-[30px] font-normal text-[var(--ink-strong)] leading-[1.25] text-center mb-2">
          {displayRitual.title}
        </h1>

        {/* Badges */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {displayRitual.element && (
              <span className="editorial-meta-badge">
                {elementData?.label || displayRitual.element}
              </span>
            )}
            {displayRitual.energy && (
              <span className="editorial-meta-badge">
                {ENERGY_MAP[displayRitual.energy] || displayRitual.energy}
              </span>
            )}
            {displayRitual.intensity && (
              <span className="editorial-meta-badge editorial-meta-badge-active">
                {INTENSITY_MAP[displayRitual.intensity] || displayRitual.intensity}
              </span>
            )}
            {displayRitual.duration && (
              <span className="editorial-meta-badge">
                {displayRitual.duration} min
              </span>
            )}
          </div>

          <div className="flex justify-center mt-2">
            <span className="editorial-meta-badge">
              Vela {candleGuide.color}
            </span>
          </div>
        </div>

        {/* Thin divider */}
        <div className="editorial-divider mb-7" />

        {/* Intention */}
        {displayRitual.intention && (
          <div className="mb-7">
            <p className="editorial-eyebrow mb-2">Intención</p>
            <p className="font-serif text-[18px] font-light italic text-[var(--ink-body)] leading-[1.5]">
              "{displayRitual.intention}"
            </p>
          </div>
        )}

        {/* Ritual sections */}
        <div className="mb-4">
          <p className="editorial-eyebrow">Ritual completo</p>
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
              className="editorial-card-soft mb-5 p-5 rounded-2xl"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="font-serif text-[14px] text-[var(--ink-soft)]">{section.symbol}</span>
                <p className="editorial-eyebrow">{section.label}</p>
              </div>
              <p className="font-serif text-[16px] font-light leading-[1.65] text-[var(--ink-body)]">{section.text}</p>
            </motion.div>
          ))}

        {/* Anchor */}
        <div className="mb-6 p-5 rounded-2xl border border-[var(--ink-strong)] bg-[var(--ink-strong)]">
          <p className="font-sans text-[10px] font-medium tracking-[0.14em] uppercase text-white/40 mb-1.5">Tu anclaje real</p>
          <p className="font-serif text-[18px] font-light text-white leading-[1.45]">{anchorText}</p>
        </div>

        {/* Author */}
        {isPublic && (
          <p className="text-center mb-6 editorial-meta">
            Compartido por {displayRitual.author}
          </p>
        )}
      </motion.div>

      {/* Bottom action bar */}
      <div className="editorial-bottom-bar">
        {isOwnRitualView ? (
          <div className="flex gap-2.5">
            <button
              onClick={() => setShowPlayer(true)}
              className="editorial-button-primary flex-1 py-3.5 transition-all active:scale-[0.98] cursor-pointer"
            >
              Iniciar
            </button>
            <button
              onClick={() => navigate("/compartir")}
              className="editorial-button-soft px-4 py-3.5 transition-all active:scale-[0.98] cursor-pointer"
            >
              Compartir
            </button>
          </div>
        ) : (
          <div className="flex gap-2.5">
            {isPublic ? (
              <button
                onClick={handleCreateOwnRitual}
                className="editorial-button-primary flex-1 py-3.5 transition-all active:scale-[0.98] cursor-pointer"
              >
                Crear el mío
              </button>
            ) : null}
            <button
              className={`${
                isPublic ? "px-4" : "flex-1"
              } py-3.5 border rounded-xl transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 font-sans text-[13px] ${
                isCurrentRitualSaved
                  ? "border-[var(--ink-strong)] bg-[var(--surface-soft)] text-[var(--ink-strong)]"
                  : "border-[var(--border-default)] text-[var(--ink-muted)]"
              }`}
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
              className="editorial-sheet fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] z-50 px-6 pt-5 pb-10"
            >
              <div className="editorial-sheet-handle mb-6" />

              <p className="editorial-eyebrow mb-4">Elige una pista</p>

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
                      className={`editorial-option-card flex items-center justify-between ${isActive ? "editorial-option-card-active" : "editorial-card-soft"}`}
                    >
                      <div className="text-left">
                        <p className="font-serif text-[18px] font-normal leading-[1.2]">{t.label}</p>
                        <p className={`font-sans text-[11px] mt-0.5 ${isActive ? "opacity-60" : "text-[var(--ink-muted)] opacity-70"}`}>{t.sublabel}</p>
                      </div>
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${isActive ? "bg-white/15" : "bg-[var(--surface-soft)]"}`}
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
