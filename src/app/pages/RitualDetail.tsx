import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { useRitual } from "../context/RitualContext";
import { useUser } from "../context/UserContext";
import { ELEMENTS } from "../data/rituals";
import { deriveCandleGuide } from "../lib/candle";
import { getUserFacingErrorMessage } from "../lib/errors";
import { toast } from "sonner";
import { Bookmark, BookmarkCheck, CheckCircle2, FileDown, Loader2, Pause, Play } from "lucide-react";
import {
  DEFAULT_ELEVENLABS_VOICE_ID,
  generateRitual,
  getRitualAnchor,
  getRitualById,
  completeRitual,
  renderGuidedAudio,
  type RitualRecord,
} from "../lib/ritual-service";
import { GuidedAudioPlayer } from "../components/GuidedAudioPlayer";
import { track } from "../lib/analytics";
const IMAGE_POOLS: Record<string, string[]> = {
  Agua: [
    "/images/story-water-1.jpg",
    "/images/story-water-2.jpg",
    "/images/story-water-3.jpg",
    "/images/story-beach-1.jpg",
    "/images/story-lluvia-1.jpg",
    "/images/story-lluvia-2.jpg",
    "/images/story-lluvia-3.jpg",
    "/images/story-lluvia-4.jpg",
    "/images/story-lluvia-5.jpg",
  ],
  Fuego: [
    "/images/story-fire-1.jpg",
    "/images/story-fire-2.jpg",
    "/images/story-fire-3.jpg",
    "/images/story-fire-4.jpg",
    "/images/story-fire-5.jpg",
  ],
  Tierra: [
    "/images/story-forest-1.jpg",
    "/images/story-forest-2.jpg",
    "/images/story-forest-3.jpg",
    "/images/story-forest-4.jpg",
    "/images/story-forest-5.jpg",
    "/images/story-stones-1.jpg",
    "/images/story-stones-2.jpg",
    "/images/story-stones-3.jpg",
    "/images/story-grass-1.jpg",
    "/images/story-grass-2.jpg",
    "/images/story-mountain-1.jpg",
    "/images/story-mountain-2.jpg",
  ],
  Aire: [
    "/images/story-air-1.jpg",
    "/images/story-air-2.jpg",
    "/images/story-air-3.jpg",
    "/images/story-air-4.jpg",
    "/images/story-air-5.jpg",
    "/images/story-abastract-1.jpg",
    "/images/story-abastract-2.jpg",
    "/images/story-abastract-3.jpg",
    "/images/story-abastract-4.jpg",
    "/images/story-abastract-5.jpg",
  ],
};

function hashStr(s: string): number {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) & 0x7fffffff;
  return h;
}

function getCoverImage(element: string, id: string): string {
  const pool = IMAGE_POOLS[element] ?? IMAGE_POOLS["Agua"];
  return pool[hashStr(id) % pool.length];
}

const TRACKS = [
  { id: 0, label: "Handpan",    sublabel: "Tierra · 432hz",   load: () => Promise.resolve("https://sztefmznsleedqythllo.supabase.co/storage/v1/object/public/audio/handpan-soundscape-432hz.mp3") },
  { id: 1, label: "Meditación", sublabel: "Flujo · 432hz",    load: () => Promise.resolve("https://sztefmznsleedqythllo.supabase.co/storage/v1/object/public/audio/danamusic-432hz-meditation-355839.mp3") },
  { id: 2, label: "Tercer ojo", sublabel: "Profundo · 432hz", load: () => Promise.resolve("https://sztefmznsleedqythllo.supabase.co/storage/v1/object/public/audio/meditativecalmbuddha-third-eye-frequency-deep-healing-432hz-480114.mp3") },
  { id: 3, label: "Handpan II", sublabel: "Etéreo · 432hz",   load: () => Promise.resolve("https://sztefmznsleedqythllo.supabase.co/storage/v1/object/public/audio/siarhei_korbut-handpan-soundscape-432-hz-396231.mp3") },
];

const GUIDED_AUDIO_GENERATION_COUNT_KEY = "rituales_guided_audio_generation_count_v1";

type PricingPromptState = {
  generationNumber: number;
  ritualId?: string;
  answer?: "yes" | "no";
};

function getNextGuidedAudioGenerationNumber() {
  try {
    const current = Number(localStorage.getItem(GUIDED_AUDIO_GENERATION_COUNT_KEY) || "0");
    const next = Number.isFinite(current) ? current + 1 : 1;
    localStorage.setItem(GUIDED_AUDIO_GENERATION_COUNT_KEY, String(next));
    return next;
  } catch {
    return 1;
  }
}

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
  const [audioTab, setAudioTab] = useState<"guided" | "ambient">("guided");
  const [guidedAudioUrl, setGuidedAudioUrl] = useState<string | undefined>(undefined);
  const [guidedAudioLoading, setGuidedAudioLoading] = useState(false);
  const [guidedAudioError, setGuidedAudioError] = useState<string | null>(null);
  const [pricingPrompt, setPricingPrompt] = useState<PricingPromptState | null>(null);
  const [pricingReason, setPricingReason] = useState("");
  const [showCompletion, setShowCompletion] = useState(false);
  const [anchorConfirmed, setAnchorConfirmed] = useState(false);
  const [reflectionText, setReflectionText] = useState("");
  const [isSavingCompletion, setIsSavingCompletion] = useState(false);
  const [completionSaved, setCompletionSaved] = useState(false);
  const hasTrackedRitualStartRef = useRef(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

  // Read a previously cached audio_url from the persisted ritual so we never
  // regenerate audio that the backend already rendered and stored.
  useEffect(() => {
    if (displayRitual.guidedAudio?.audioUrl && !guidedAudioUrl) {
      setGuidedAudioUrl(displayRitual.guidedAudio.audioUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayRitual.guidedAudio?.audioUrl]);

  const currentRitualId = loadedRitual?.ritualId || ritual.ritualId;

  const renderGuidedAudioForCurrentRitual = async () => {
    setGuidedAudioLoading(true);
    setGuidedAudioError(null);

    try {
      const result = await renderGuidedAudio({
        ritualId: currentRitualId,
        guidedSession: displayRitual.guidedSession!,
        voice: displayRitual.guidedAudio?.voice || DEFAULT_ELEVENLABS_VOICE_ID,
        model: displayRitual.guidedAudio?.model || "eleven_multilingual_v2",
        responseFormat: "mp3",
      });

      if ("audioUrl" in result && result.audioUrl) {
        setGuidedAudioUrl(result.audioUrl);
        updateRitual({
          guidedAudio: {
            status: "ready",
            audioUrl: result.audioUrl,
            provider: result.provider,
            voice: result.voice,
            model: result.model,
          },
        });
      } else if ("blob" in result && result.blob) {
        // Local-only preview (no backend/ritualId available) — not cached,
        // it just plays once from this tab via an object URL.
        setGuidedAudioUrl(URL.createObjectURL(result.blob as Blob));
      } else {
        setGuidedAudioError("No pudimos generar el audio guiado. Probá de nuevo.");
      }
    } catch (error) {
      setGuidedAudioError(
        getUserFacingErrorMessage(error, "No pudimos generar el audio guiado. Probá de nuevo."),
      );
    } finally {
      setGuidedAudioLoading(false);
    }
  };

  const handleRequestGuidedAudio = async () => {
    if (guidedAudioLoading || guidedAudioUrl || pricingPrompt) {
      return;
    }

    const guidedSession = displayRitual.guidedSession;
    const isLocalOnlyId =
      !currentRitualId || currentRitualId.startsWith("mock-") || currentRitualId.startsWith("dev-");

    if (!guidedSession || isLocalOnlyId) {
      setGuidedAudioError(
        "Todavía no pudimos guardar este ritual, así que no podemos generar el audio guiado. Probá de nuevo en un momento.",
      );
      return;
    }

    const generationNumber = getNextGuidedAudioGenerationNumber();
    if (generationNumber >= 2) {
      const promptContext = { generationNumber, ritualId: currentRitualId };
      setPricingPrompt(promptContext);
      track("pricing_experiment_shown", {
        ...promptContext,
        hasCachedAudio: false,
      });
      return;
    }

    await renderGuidedAudioForCurrentRitual();
  };

  const handlePricingResponse = (response: "accepted" | "declined") => {
    if (!pricingPrompt) return;
    const answer = response === "accepted" ? "yes" : "no";

    track("pricing_experiment_answered", {
      ritualId: pricingPrompt.ritualId,
      generationNumber: pricingPrompt.generationNumber,
      hasCachedAudio: false,
      answer,
    });
    setPricingPrompt({ ...pricingPrompt, answer });
    setPricingReason("");
  };

  const handlePricingReasonSubmit = () => {
    if (!pricingPrompt?.answer || pricingReason.trim().length < 3) return;

    track("pricing_experiment_reason_submitted", {
      ritualId: pricingPrompt.ritualId,
      generationNumber: pricingPrompt.generationNumber,
      hasCachedAudio: false,
      answer: pricingPrompt.answer,
      reasonLength: pricingReason.trim().length,
    });
    track(
      pricingPrompt.answer === "yes"
        ? "pricing_experiment_accepted"
        : "pricing_experiment_declined",
      {
        ritualId: pricingPrompt.ritualId,
        generationNumber: pricingPrompt.generationNumber,
        hasCachedAudio: false,
        reasonLength: pricingReason.trim().length,
      },
    );
    track("guided_audio_generation_started", {
      ritualId: pricingPrompt.ritualId,
      generationNumber: pricingPrompt.generationNumber,
      hasCachedAudio: false,
    });
    setPricingPrompt(null);
    setPricingReason("");
    void renderGuidedAudioForCurrentRitual();
  };

  const handleStartRitual = () => {
    hasTrackedRitualStartRef.current = false;
    setAudioTab("guided");
    setShowPlayer(true);

    if (!guidedAudioUrl) {
      void handleRequestGuidedAudio();
    }
  };

  const handleGuidedAudioPlay = () => {
    if (hasTrackedRitualStartRef.current) {
      return;
    }
    hasTrackedRitualStartRef.current = true;
    track("ritual_started", {
      ritualId: currentRitualId,
      duration: displayRitual.duration,
    });
  };

  const handleGuidedAudioEnded = () => {
    track("ritual_completed", {
      ritualId: currentRitualId,
      duration: displayRitual.duration,
    });
    setShowCompletion(true);
    void completeRitual(currentRitualId, { audioCompleted: true }).catch(() => {});
  };

  const handlePrintRitual = () => {
    track("ritual_pdf_requested", { ritualId: currentRitualId });
    window.print();
  };

  const handleSaveCompletion = async () => {
    if (!anchorConfirmed || isSavingCompletion) return;

    setIsSavingCompletion(true);
    try {
      const completed = await completeRitual(currentRitualId, {
        audioCompleted: true,
        anchorConfirmed: true,
        reflectionText,
      });

      if (completed) {
        setLoadedRitual(completed);
      }

      setCompletionSaved(true);
      track("ritual_closure_saved", {
        ritualId: currentRitualId,
        hasReflection: Boolean(reflectionText.trim()),
      });
      toast("Cierre guardado", {
        description: "Tu anclaje quedó registrado.",
      });
    } catch (error) {
      toast(getUserFacingErrorMessage(error, "No se pudo guardar el cierre."));
    } finally {
      setIsSavingCompletion(false);
    }
  };

  const handleAudioTabChange = (tab: "guided" | "ambient") => {
    setAudioTab(tab);
    if (tab === "guided") {
      // Ambient tracks live outside React (new Audio()), so leaving that tab
      // doesn't stop them on its own — pause explicitly.
      audioRef.current?.pause();
      setIsPlaying(false);
    }
  };

  const elementData = ELEMENTS.find((e) => e.id === displayRitual.element);
  // element may arrive as ID ("agua") or label ("Agua") depending on source
  const elementLabel = elementData?.label || (IMAGE_POOLS[displayRitual.element] ? displayRitual.element : "Agua");
  // use the real ritual ID so the image matches the card that was tapped
  const imageId = (isPublic ? data?.id : loadedRitual?.ritualId) || id || displayRitual.title || "ritual";
  const coverImageUrl = getCoverImage(elementLabel, imageId);
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
        anchor: loadedRitual.anchor || ritual.anchor || "",
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
  const anchorText = getRitualAnchor(
    displayRitual.anchor,
    isPublic ? data?.type || data?.ritualType : loadedRitual?.ritualType || ritualForAccount.ritualType,
    displayRitual.title,
  );
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

      {/* Cover image hero */}
      <div className="relative z-10" style={{ height: 380 }}>
        <img
          src={coverImageUrl}
          alt={displayRitual.title}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 28%, rgba(0,0,0,0.5) 58%, rgba(0,0,0,0.92) 100%)",
          }}
        />

        {/* Nav bar */}
        <div className="relative pt-14 px-6 flex items-center justify-between">
          <button
            onClick={() => {
              if (fromAccount) navigate("/cuenta");
              else if (isViewMode) navigate("/explorar");
              else navigate("/");
            }}
            className="flex items-center gap-2 transition-opacity active:opacity-60"
            style={{ fontFamily: "var(--font-sans-ui)", fontSize: "13px", color: "rgba(255,255,255,0.8)" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {fromAccount ? "Volver" : isViewMode ? "Explorar" : "Inicio"}
          </button>
          {!isPublic && (
            <button
              onClick={() => navigate("/crear/1")}
              className="transition-opacity active:opacity-60"
              style={{ fontFamily: "var(--font-sans-ui)", fontSize: "13px", color: "rgba(255,255,255,0.8)" }}
            >
              Editar
            </button>
          )}
        </div>

        {/* Title + badges at bottom of hero */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-8">
          <h1
            className="text-center"
            style={{
              fontFamily: "var(--font-serif-display)",
              fontSize: "28px",
              fontWeight: 400,
              color: "#fff",
              lineHeight: 1.2,
              marginBottom: "14px",
            }}
          >
            {displayRitual.title}
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {displayRitual.element && (
              <span style={{ fontFamily: "var(--font-sans-ui)", fontSize: "11px", fontWeight: 400, padding: "4px 11px", borderRadius: "99px", background: "rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.18)" }}>
                {elementData?.label || displayRitual.element}
              </span>
            )}
            {displayRitual.energy && (
              <span style={{ fontFamily: "var(--font-sans-ui)", fontSize: "11px", fontWeight: 400, padding: "4px 11px", borderRadius: "99px", background: "rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.18)" }}>
                {ENERGY_MAP[displayRitual.energy] || displayRitual.energy}
              </span>
            )}
            {displayRitual.intensity && (
              <span style={{ fontFamily: "var(--font-sans-ui)", fontSize: "11px", fontWeight: 500, padding: "4px 11px", borderRadius: "99px", background: "rgba(255,255,255,0.88)", color: "#111" }}>
                {INTENSITY_MAP[displayRitual.intensity] || displayRitual.intensity}
              </span>
            )}
            {displayRitual.duration && (
              <span style={{ fontFamily: "var(--font-sans-ui)", fontSize: "11px", fontWeight: 400, padding: "4px 11px", borderRadius: "99px", background: "rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.18)" }}>
                {displayRitual.duration} min
              </span>
            )}
            <span style={{ fontFamily: "var(--font-sans-ui)", fontSize: "11px", fontWeight: 400, padding: "4px 11px", borderRadius: "99px", background: "rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.18)" }}>
              Vela {candleGuide.color}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 px-6 pb-44 pt-7"
      >
        {/* Thin divider */}
        <div className="editorial-divider mb-7" />

        {/* Intention */}
        {displayRitual.intention && (
          <div className="mb-7">
            <p className="editorial-eyebrow mb-2">Intención</p>
            <p style={{ fontFamily: "var(--font-sans-ui)", fontSize: "16px", fontWeight: 300, fontStyle: "italic", color: "var(--ink-body)", lineHeight: 1.6 }}>
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
              <p style={{ fontFamily: "var(--font-sans-ui)", fontSize: "14px", fontWeight: 300, lineHeight: 1.7, color: "var(--ink-body)" }}>{section.text}</p>
            </motion.div>
          ))}

        {/* Anchor */}
        <div className="mb-6 p-5 rounded-2xl border border-[var(--ink-strong)] bg-[var(--ink-strong)]">
          <p className="font-sans text-[10px] font-medium tracking-[0.14em] uppercase text-white/40 mb-1.5">
            Tu anclaje real
          </p>
          <p style={{ fontFamily: "var(--font-sans-ui)", fontSize: "16px", fontWeight: 300, color: "#fff", lineHeight: 1.5 }}>
            {anchorText}
          </p>
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
              onClick={handleStartRitual}
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
            <button
              onClick={handlePrintRitual}
              className="editorial-button-soft h-[50px] w-[50px] transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center"
              aria-label="Descargar o imprimir ritual"
            >
              <FileDown size={16} strokeWidth={1.6} />
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
              className="fixed inset-0 bg-black/40 z-[120]"
              onClick={() => {
                if (pricingPrompt) return;
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
              className="editorial-sheet fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] z-[130] px-6 pt-5 pb-[calc(2.5rem+env(safe-area-inset-bottom))]"
            >
              <div className="editorial-sheet-handle mb-6" />

              <p className="editorial-eyebrow mb-4">
                {audioTab === "guided" ? "Iniciar ritual" : "Solo ambiente"}
              </p>

              {showCompletion ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 space-y-5"
                >
                  <div className="text-center">
                    <CheckCircle2 size={34} strokeWidth={1.4} className="mx-auto mb-3 text-[var(--ink-strong)]" />
                    <p className="editorial-eyebrow mb-2">Ritual completado</p>
                    <h3
                      className="mx-auto max-w-[280px]"
                      style={{
                        fontFamily: "var(--font-serif-display)",
                        fontSize: "25px",
                        fontWeight: 400,
                        lineHeight: 1.12,
                        color: "var(--ink-strong)",
                      }}
                    >
                      Que no quede solo en la escucha.
                    </h3>
                    <p className="editorial-body-muted mt-3">
                      Llevá una acción pequeña a la vida real.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[var(--ink-strong)] p-4">
                    <p className="font-sans text-[9px] font-medium tracking-[0.14em] uppercase text-white/40 mb-2">
                      Tu anclaje real
                    </p>
                    <p className="font-sans text-[14px] font-light leading-[1.55] text-white">
                      {anchorText}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAnchorConfirmed((current) => !current)}
                    className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all ${
                      anchorConfirmed
                        ? "border-[var(--ink-strong)] bg-[var(--ink-strong)] text-white"
                        : "border-[var(--border-default)] bg-white text-[var(--ink-strong)]"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        anchorConfirmed ? "border-white bg-white text-[var(--ink-strong)]" : "border-[var(--border-strong)]"
                      }`}
                    >
                      {anchorConfirmed ? <CheckCircle2 size={14} strokeWidth={2} /> : null}
                    </span>
                    <span className="font-sans text-[13px] font-medium">
                      Confirmé mi anclaje
                    </span>
                  </button>

                  <div>
                    <label className="editorial-field-label mb-2 block">
                      ¿Qué te dejó este ritual?
                    </label>
                    <textarea
                      value={reflectionText}
                      onChange={(event) => setReflectionText(event.target.value)}
                      rows={4}
                      className="editorial-textarea"
                      placeholder="Una idea, una sensación o algo que quieras recordar."
                    />
                  </div>

                  <button
                    onClick={handleSaveCompletion}
                    disabled={!anchorConfirmed || isSavingCompletion || completionSaved}
                    className={`editorial-action-button ${
                      anchorConfirmed && !completionSaved
                        ? "editorial-action-button-primary"
                        : "editorial-action-button-disabled"
                    }`}
                  >
                    {isSavingCompletion ? (
                      <span className="inline-flex items-center justify-center gap-2">
                        <Loader2 size={14} strokeWidth={1.8} className="animate-spin" />
                        Guardando cierre
                      </span>
                    ) : completionSaved ? (
                      "Cierre guardado"
                    ) : (
                      "Guardar cierre"
                    )}
                  </button>
                </motion.div>
              ) : audioTab === "guided" ? (
                <div className="mb-6">
                  <AnimatePresence>
                    {pricingPrompt && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        className="mb-5 rounded-2xl border border-[var(--border-soft)] bg-[var(--surface-softest)] p-4"
                      >
                        {!pricingPrompt.answer ? (
                          <>
                            <p className="editorial-eyebrow mb-2">Voz guiada</p>
                            <h3
                              className="mb-3"
                              style={{
                                fontFamily: "var(--font-serif-display)",
                                fontSize: "22px",
                                fontWeight: 400,
                                lineHeight: 1.15,
                                color: "var(--ink-strong)",
                              }}
                            >
                              ¿Te haría sentido pagar por esta voz?
                            </h3>
                            <div className="mb-3 rounded-2xl border border-[var(--border-soft)] bg-white px-4 py-3">
                              <div className="flex items-baseline justify-center gap-1.5">
                                <span
                                  style={{
                                    fontFamily: "var(--font-serif-display)",
                                    fontSize: "34px",
                                    fontWeight: 400,
                                    lineHeight: 1,
                                    color: "var(--ink-strong)",
                                  }}
                                >
                                  USD 10
                                </span>
                                <span
                                  style={{
                                    fontFamily: "var(--font-sans-ui)",
                                    fontSize: "12px",
                                    fontWeight: 400,
                                    color: "var(--ink-subtle)",
                                  }}
                                >
                                  / mes
                                </span>
                              </div>
                            </div>
                            <p
                              className="mb-4"
                              style={{
                                fontFamily: "var(--font-sans-ui)",
                                fontSize: "13px",
                                fontWeight: 300,
                                lineHeight: 1.55,
                                color: "var(--ink-subtle)",
                              }}
                            >
                              La primera voz guiada queda disponible. Para sostener nuevas voces,
                              estamos probando una membresía mensual.
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => handlePricingResponse("accepted")}
                                className="rounded-full bg-[var(--ink-strong)] px-4 py-3 text-white"
                                style={{ fontFamily: "var(--font-sans-ui)", fontSize: "13px", fontWeight: 500 }}
                              >
                                Sí
                              </button>
                              <button
                                onClick={() => handlePricingResponse("declined")}
                                className="rounded-full border border-[var(--border-default)] bg-white px-4 py-3 text-[var(--ink-strong)]"
                                style={{ fontFamily: "var(--font-sans-ui)", fontSize: "13px", fontWeight: 500 }}
                              >
                                No por ahora
                              </button>
                            </div>
                            <p
                              className="mt-3 text-center"
                              style={{ fontFamily: "var(--font-sans-ui)", fontSize: "11px", fontWeight: 300, color: "var(--ink-muted)" }}
                            >
                              Tu ritual sigue después de responder.
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="editorial-eyebrow mb-2">Una pregunta más</p>
                            <h3
                              className="mb-2"
                              style={{
                                fontFamily: "var(--font-serif-display)",
                                fontSize: "22px",
                                fontWeight: 400,
                                lineHeight: 1.15,
                                color: "var(--ink-strong)",
                              }}
                            >
                              {pricingPrompt.answer === "yes"
                                ? "¿Por qué te haría sentido?"
                                : "¿Por qué no por ahora?"}
                            </h3>
                            <p
                              className="mb-3"
                              style={{
                                fontFamily: "var(--font-sans-ui)",
                                fontSize: "12px",
                                fontWeight: 300,
                                color: "var(--ink-subtle)",
                              }}
                            >
                              Respuesta: {pricingPrompt.answer === "yes" ? "Sí" : "No por ahora"}
                            </p>
                            <label className="editorial-field-label mb-2 block">
                              Tu razón
                            </label>
                            <textarea
                              value={pricingReason}
                              onChange={(event) => setPricingReason(event.target.value)}
                              rows={4}
                              className="editorial-textarea mb-3"
                              placeholder={
                                pricingPrompt.answer === "yes"
                                  ? "Contanos qué valor tendría para vos."
                                  : "Contanos qué faltaría para que te hiciera sentido."
                              }
                            />
                            <button
                              onClick={handlePricingReasonSubmit}
                              disabled={pricingReason.trim().length < 3}
                              className={`editorial-action-button ${
                                pricingReason.trim().length >= 3
                                  ? "editorial-action-button-primary"
                                  : "editorial-action-button-disabled"
                              }`}
                            >
                              Preparar la voz
                            </button>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {!pricingPrompt && (
                    <GuidedAudioPlayer
                      title={displayRitual.title}
                      src={guidedAudioUrl}
                      disabled={guidedAudioLoading}
                      onStart={handleRequestGuidedAudio}
                      onPlay={handleGuidedAudioPlay}
                      onEnded={handleGuidedAudioEnded}
                    />
                  )}
                  {guidedAudioError && (
                    <p
                      className="mt-3 text-center"
                      style={{ fontFamily: "var(--font-sans-ui)", fontSize: "12px", color: "var(--ink-muted)" }}
                    >
                      {guidedAudioError}
                    </p>
                  )}
                  {!pricingPrompt && (
                    <button
                      onClick={() => handleAudioTabChange("ambient")}
                      className="mx-auto mt-5 block text-[var(--ink-subtle)] hover:text-[var(--ink-strong)] transition-colors"
                      style={{ fontFamily: "var(--font-sans-ui)", fontSize: "13px", fontWeight: 300 }}
                    >
                      Prefiero solo música de fondo
                    </button>
                  )}
                </div>
              ) : (
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
                            audioRef.current
                              ?.play()
                              .then(() => setIsPlaying(true))
                              .catch((error) => {
                                console.error("Track play error", t.id, error?.name, error?.message);
                                toast("No se pudo reproducir el audio. Probá de nuevo.");
                                setIsPlaying(false);
                              });
                          }
                        } else {
                          audioRef.current?.pause();
                          setActiveTrack(t.id);
                          setIsPlaying(false);
                          t.load()
                            .then((src) => {
                              const audio = new Audio(src);
                              audio.loop = true;
                              audio.volume = 0.7;
                              audio.onended = () => setIsPlaying(false);
                              audio.onerror = () => {
                                console.error("Track load error", t.id, audio.error);
                                toast("No se pudo cargar la pista. Probá de nuevo.");
                              };
                              audioRef.current = audio;
                              return audio.play();
                            })
                            .then(() => setIsPlaying(true))
                            .catch((error) => {
                              console.error("Track play error", t.id, error?.name, error?.message);
                              toast("No se pudo reproducir el audio. Probá de nuevo.");
                              setIsPlaying(false);
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
                  <button
                    onClick={() => handleAudioTabChange("guided")}
                    className="mt-2 text-[var(--ink-subtle)] hover:text-[var(--ink-strong)] transition-colors"
                    style={{ fontFamily: "var(--font-sans-ui)", fontSize: "13px", fontWeight: 300 }}
                  >
                    Volver a voz guiada
                  </button>
              </div>
              )}

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
