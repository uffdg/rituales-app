import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import { BackLink } from "../components/BackLink";
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
    "/images/story-water-1.webp",
    "/images/story-water-2.webp",
    "/images/story-water-3.webp",
    "/images/story-beach-1.webp",
    "/images/story-lluvia-1.webp",
    "/images/story-lluvia-2.webp",
    "/images/story-lluvia-3.webp",
    "/images/story-lluvia-4.webp",
    "/images/story-lluvia-5.webp",
  ],
  Fuego: [
    "/images/story-fire-1.webp",
    "/images/story-fire-2.webp",
    "/images/story-fire-3.webp",
    "/images/story-fire-4.webp",
    "/images/story-fire-5.webp",
  ],
  Tierra: [
    "/images/story-forest-1.webp",
    "/images/story-forest-2.webp",
    "/images/story-forest-3.webp",
    "/images/story-forest-4.webp",
    "/images/story-forest-5.webp",
    "/images/story-stones-1.webp",
    "/images/story-stones-2.webp",
    "/images/story-stones-3.webp",
    "/images/story-grass-1.webp",
    "/images/story-grass-2.webp",
    "/images/story-mountain-1.webp",
    "/images/story-mountain-2.webp",
  ],
  Aire: [
    "/images/story-air-1.webp",
    "/images/story-air-2.webp",
    "/images/story-air-3.webp",
    "/images/story-air-4.webp",
    "/images/story-air-5.webp",
    "/images/story-abstract-1.webp",
    "/images/story-abstract-2.webp",
    "/images/story-abstract-3.webp",
    "/images/story-abstract-4.webp",
    "/images/story-abstract-5.webp",
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
        <p className="font-serif text-title-2 text-ink-muted" role="status">Cargando tu ritual…</p>
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="editorial-page-bg flex-col items-center justify-center px-6 text-center">
        <p className="font-serif text-title-2 text-ink-strong mb-2">No pudimos abrir este ritual</p>
        <p className="editorial-body-muted mb-5">
          Puede que todavía no esté disponible o que el enlace haya cambiado.
        </p>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="editorial-button editorial-button--primary"
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
          alt=""
          decoding="async"
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
          <BackLink
            label={fromAccount ? "Volver" : isViewMode ? "Explorar" : "Inicio"}
            onClick={() => {
              if (fromAccount) navigate("/cuenta");
              else if (isViewMode) navigate("/explorar");
              else navigate("/");
            }}
            className="text-on-ink-muted hover:text-on-ink-strong"
          />
          {!isPublic && (
            <button
              type="button"
              onClick={() => navigate("/crear/1")}
              className="editorial-back-link text-on-ink-muted hover:text-on-ink-strong"
            >
              Editar
            </button>
          )}
        </div>

        {/* Title + badges at bottom of hero */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-8">
          <h1 className="mb-3.5 text-center font-serif text-title-2 text-on-ink-strong">
            {displayRitual.title}
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {displayRitual.element && (
              <span className="rounded-full border border-white/20 bg-white/15 px-2.5 py-1 font-sans text-caption text-on-ink-muted backdrop-blur-md">
                {elementData?.label || displayRitual.element}
              </span>
            )}
            {displayRitual.energy && (
              <span className="rounded-full border border-white/20 bg-white/15 px-2.5 py-1 font-sans text-caption text-on-ink-muted backdrop-blur-md">
                {ENERGY_MAP[displayRitual.energy] || displayRitual.energy}
              </span>
            )}
            {displayRitual.intensity && (
              <span className="rounded-full bg-white/90 px-2.5 py-1 font-sans text-caption font-medium text-ink-strong">
                {INTENSITY_MAP[displayRitual.intensity] || displayRitual.intensity}
              </span>
            )}
            {displayRitual.duration && (
              <span className="rounded-full border border-white/20 bg-white/15 px-2.5 py-1 font-sans text-caption text-on-ink-muted backdrop-blur-md">
                {displayRitual.duration} min
              </span>
            )}
            <span className="rounded-full border border-white/20 bg-white/15 px-2.5 py-1 font-sans text-caption text-on-ink-muted backdrop-blur-md">
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
            <p className="font-sans text-title-4 text-ink-body">
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
              className="editorial-card editorial-card--soft mb-4 p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="font-serif text-body text-ink-decor" aria-hidden="true">{section.symbol}</span>
                <p className="editorial-eyebrow">{section.label}</p>
              </div>
              <p className="font-sans text-body-lg text-ink-body">{section.text}</p>
            </motion.div>
          ))}

        {/* Anchor */}
        <div className="editorial-card editorial-card--inverse mb-6 p-5">
          <p className="editorial-eyebrow editorial-eyebrow--on-dark mb-1.5">
            Tu anclaje real
          </p>
          <p className="font-sans text-title-4 text-on-ink-strong">
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
              type="button"
              onClick={handleStartRitual}
              className="editorial-button editorial-button--primary min-h-[52px] flex-1"
            >
              Iniciar
            </button>
            <button
              type="button"
              onClick={() => navigate("/compartir")}
              className="editorial-button editorial-button--secondary min-h-[52px] px-4"
            >
              Compartir
            </button>
            <button
              type="button"
              onClick={handlePrintRitual}
              className="editorial-button editorial-button--secondary h-[52px] w-[52px] !px-0"
              aria-label="Descargar o imprimir ritual"
            >
              <FileDown size={16} strokeWidth={1.6} />
            </button>
          </div>
        ) : (
          <div className="flex gap-2.5">
            {isPublic ? (
              <button
                type="button"
                onClick={handleCreateOwnRitual}
                className="editorial-button editorial-button--primary min-h-[52px] flex-1"
              >
                Crear el mío
              </button>
            ) : null}
            <button
              type="button"
              aria-pressed={isCurrentRitualSaved}
              className={`editorial-button editorial-button--secondary min-h-[52px] ${isPublic ? "px-4" : "flex-1"} ${
                isCurrentRitualSaved ? "!border-ink-strong" : ""
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
              className="fixed inset-0 bg-scrim z-[120]"
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
                    <CheckCircle2 size={32} strokeWidth={1.4} className="mx-auto mb-3 text-ink-strong" aria-hidden="true" />
                    <p className="editorial-eyebrow mb-2">Ritual completado</p>
                    <h3 className="mx-auto max-w-[280px] font-serif text-title-2 text-ink-strong">
                      Que no quede solo en la escucha.
                    </h3>
                    <p className="editorial-body-muted mt-3">
                      Llevá una acción pequeña a la vida real.
                    </p>
                  </div>

                  <div className="editorial-card editorial-card--inverse p-4">
                    <p className="editorial-eyebrow editorial-eyebrow--on-dark mb-2">
                      Tu anclaje real
                    </p>
                    <p className="font-sans text-body-lg text-on-ink-strong">
                      {anchorText}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAnchorConfirmed((current) => !current)}
                    aria-pressed={anchorConfirmed}
                    className={`flex min-h-[52px] w-full items-center gap-3 rounded-md border px-4 py-3 text-left transition-all ${
                      anchorConfirmed
                        ? "border-ink-strong bg-ink-strong text-on-ink-strong"
                        : "border-line-default bg-surface-base text-ink-strong"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        anchorConfirmed ? "border-white bg-white text-ink-strong" : "border-line-strong"
                      }`}
                    >
                      {anchorConfirmed ? <CheckCircle2 size={14} strokeWidth={2} /> : null}
                    </span>
                    <span className="font-sans text-body font-medium">
                      Confirmé mi anclaje
                    </span>
                  </button>

                  <div>
                    <label htmlFor="ritual-reflection" className="editorial-field-label mb-2 block">
                      ¿Qué te dejó este ritual?
                    </label>
                    <textarea
                      id="ritual-reflection"
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
                    aria-busy={isSavingCompletion}
                    className="editorial-button editorial-button--primary editorial-button--lg"
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
                        className="editorial-card editorial-card--soft mb-5 p-4"
                      >
                        {!pricingPrompt.answer ? (
                          <>
                            <p className="editorial-eyebrow mb-2">Voz guiada</p>
                            <h3 className="mb-3 font-serif text-title-3 text-ink-strong">
                              ¿Te haría sentido pagar por esta voz?
                            </h3>
                            <div className="editorial-card editorial-card--flat mb-3 rounded-md px-4 py-3">
                              <div className="flex items-baseline justify-center gap-1.5">
                                <span className="font-serif text-title-1 leading-none text-ink-strong">
                                  USD 10
                                </span>
                                <span className="font-sans text-body text-ink-muted">
                                  / mes
                                </span>
                              </div>
                            </div>
                            <p className="mb-4 font-sans text-body text-ink-muted">
                              La primera voz guiada queda disponible. Para sostener nuevas voces,
                              estamos probando una membresía mensual.
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => handlePricingResponse("accepted")}
                                className="editorial-button editorial-button--primary"
                              >
                                Sí
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePricingResponse("declined")}
                                className="editorial-button editorial-button--secondary"
                              >
                                No por ahora
                              </button>
                            </div>
                            <p className="mt-3 text-center font-sans text-caption text-ink-muted">
                              Tu ritual sigue después de responder.
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="editorial-eyebrow mb-2">Una pregunta más</p>
                            <h3 className="mb-2 font-serif text-title-3 text-ink-strong">
                              {pricingPrompt.answer === "yes"
                                ? "¿Por qué te haría sentido?"
                                : "¿Por qué no por ahora?"}
                            </h3>
                            <p className="mb-3 font-sans text-body text-ink-muted">
                              Respuesta: {pricingPrompt.answer === "yes" ? "Sí" : "No por ahora"}
                            </p>
                            <label htmlFor="pricing-reason" className="editorial-field-label mb-2 block">
                              Tu razón
                            </label>
                            <textarea
                              id="pricing-reason"
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
                              className="editorial-button editorial-button--primary editorial-button--lg"
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
                    <p className="editorial-error mt-3 justify-center text-center" role="alert">
                      {guidedAudioError}
                    </p>
                  )}
                  {!pricingPrompt && (
                    <button
                      type="button"
                      onClick={() => handleAudioTabChange("ambient")}
                      className="editorial-button editorial-button--tertiary mx-auto mt-5 flex"
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
                      className={`editorial-option-card flex items-center justify-between ${isActive ? "!border-ink-strong !bg-ink-strong text-on-ink-strong" : "editorial-card-soft"}`}
                    >
                      <div className="text-left">
                        <p className="font-sans text-title-4">{t.label}</p>
                        <p className={`mt-0.5 font-sans text-caption ${isActive ? "text-on-ink-muted" : "text-ink-muted"}`}>{t.sublabel}</p>
                      </div>
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${isActive ? "bg-white/15" : "bg-surface-soft"}`}
                        aria-hidden="true"
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
                    type="button"
                    onClick={() => handleAudioTabChange("guided")}
                    className="editorial-button editorial-button--tertiary mx-auto mt-2 flex"
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
