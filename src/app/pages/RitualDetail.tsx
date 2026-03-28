import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { motion } from "motion/react";
import { useRitual } from "../context/RitualContext";
import { useUser } from "../context/UserContext";
import { ELEMENTS, ENERGIES } from "../data/rituals";
import { UserMenu } from "../components/UserMenu";
import { toast } from "sonner";
import { Bookmark, BookmarkCheck } from "lucide-react";
import {
  deriveGuidedSession,
  getRitualById,
  renderGuidedAudio,
  type RitualRecord,
} from "../lib/ritual-service";
import { GuidedAudioPlayer } from "../components/GuidedAudioPlayer";

export function RitualDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { ritual, isViewMode, selectedPublicRitual, updateRitual } = useRitual();
  const { saveRitual, isRitualSaved } = useUser();
  const [loadedRitual, setLoadedRitual] = useState<RitualRecord | null>(null);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "error">("idle");
  const [isGeneratingSpeech, setIsGeneratingSpeech] = useState(false);
  const [speechError, setSpeechError] = useState("");
  const [localAudioUrl, setLocalAudioUrl] = useState("");

  const isPublic = id === "publico" && isViewMode && selectedPublicRitual;
  const data = isPublic ? selectedPublicRitual : null;

  useEffect(() => {
    if (!id || id === "nuevo" || id === "publico") {
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
  const energyData = ENERGIES.find((e) => e.id === displayRitual.energy);

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

  const playbackSession =
    displayRitual.guidedSession ||
    deriveGuidedSession(
      {
        ritualId: ritual.ritualId,
        ritualType: ritual.ritualType || "default",
        simpleMode: ritual.simpleMode,
        intention: displayRitual.intention || displayRitual.title,
        intentionCategory: ritual.intentionCategory,
        energy: displayRitual.energy || ritual.energy || "calma",
        duration: displayRitual.duration || ritual.duration || 10,
        intensity: displayRitual.intensity || ritual.intensity,
        element: displayRitual.element || ritual.element,
        aiRitual: {
          title: displayRitual.title,
          opening: displayRitual.opening,
          symbolicAction: displayRitual.symbolicAction,
          closing: displayRitual.closing,
        },
        guidedSession: undefined,
        guidedAudio: undefined,
        anchor: displayRitual.anchor || "",
      },
      {
        title: displayRitual.title,
        opening: displayRitual.opening,
        symbolicAction: displayRitual.symbolicAction,
        closing: displayRitual.closing,
      },
    );

  const handleGenerateSpeech = async () => {
    setIsGeneratingSpeech(true);
    setSpeechError("");

    try {
      const response = await renderGuidedAudio({
        ritualId: loadedRitual?.ritualId || ritual.ritualId,
        guidedSession: playbackSession,
        voice: import.meta.env.VITE_ELEVENLABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL",
        model: "eleven_multilingual_v2",
        responseFormat: "mp3",
      });

      if ("audioUrl" in response && response.audioUrl) {
        setLocalAudioUrl(response.audioUrl);
        updateRitual({
          guidedAudio: {
            status: "ready",
            audioUrl: response.audioUrl,
            provider: response.provider || "elevenlabs",
            voice: response.voice,
            model: response.model,
          },
        });
        return;
      }

      if (!("blob" in response) || !response.blob) {
        throw new Error("No se recibió audio para reproducir.");
      }

      const nextAudioUrl = URL.createObjectURL(response.blob);
      setLocalAudioUrl(nextAudioUrl);
      updateRitual({
        guidedAudio: {
          status: "ready",
          audioUrl: nextAudioUrl,
          provider: "elevenlabs",
        },
      });
    } catch (error) {
      setSpeechError(
        error instanceof Error
          ? error.message
          : "No se pudo generar el audio de este ritual.",
      );
    } finally {
      setIsGeneratingSpeech(false);
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
          onClick={() => navigate(isViewMode ? "/explorar" : "/")}
          className="flex items-center gap-2 text-[#888] hover:text-[#0A0A0A] transition-colors"
          style={{ fontFamily: "Inter, sans-serif", fontSize: "13px" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {isViewMode ? "Explorar" : "Inicio"}
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
        className="relative z-10 px-6 pb-32"
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
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
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
        {[
          { label: "Apertura", text: displayRitual.opening, symbol: "◯" },
          { label: "Acción simbólica", text: displayRitual.symbolicAction, symbol: "◎" },
          { label: "Cierre", text: displayRitual.closing, symbol: "·" },
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
        {displayRitual.anchor && (
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
              {displayRitual.anchor}
            </p>
          </div>
        )}

        {playbackSession && (
          <div className="mb-6 p-5 rounded-2xl border border-[rgba(0,0,0,0.06)] bg-[#FAFAFA]">
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "10px",
                fontWeight: 500,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#AAA",
                marginBottom: "8px",
              }}
            >
              Sesión guiada
            </p>
            <p
              style={{
                fontFamily: "Cormorant Garamond, serif",
                fontSize: "20px",
                color: "#111",
                marginBottom: "8px",
              }}
            >
              {playbackSession.targetDurationMinutes} minutos con voz + ambiente
            </p>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "12px",
                lineHeight: 1.6,
                color: "#777",
                marginBottom: "14px",
              }}
            >
              {playbackSession.notes}
            </p>
            <div className="flex flex-col gap-2">
              {playbackSession.segments.map((segment) => (
                <div
                  key={segment.id}
                  className="flex items-center justify-between gap-3"
                >
                  <div>
                    <p
                      style={{
                        fontFamily: "Cormorant Garamond, serif",
                        fontSize: "16px",
                        color: "#111",
                      }}
                    >
                      {segment.label}
                    </p>
                    <p
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "11px",
                        color: "#999",
                      }}
                    >
                      {segment.isReusable ? "Base reutilizable" : "Personalizado"}
                    </p>
                  </div>
                  <p
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "12px",
                      color: "#555",
                    }}
                  >
                    {segment.durationSeconds >= 60
                      ? `${Math.round(segment.durationSeconds / 60)} min`
                      : `${segment.durationSeconds}s`}
                  </p>
                </div>
              ))}
            </div>
            {speechError ? (
              <p
                className="mt-4"
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "12px",
                  color: "#B42318",
                }}
              >
                {speechError}
              </p>
            ) : null}
            {localAudioUrl || displayRitual.guidedAudio?.audioUrl ? (
              <div className="mt-4">
                <GuidedAudioPlayer
                  src={localAudioUrl || displayRitual.guidedAudio?.audioUrl}
                  onStart={handleGenerateSpeech}
                  disabled={isGeneratingSpeech}
                  title="Sesión guiada"
                />
              </div>
            ) : (
              <div className="mt-4">
                <GuidedAudioPlayer
                  onStart={handleGenerateSpeech}
                  disabled={isGeneratingSpeech}
                  title="Sesión guiada"
                />
              </div>
            )}
          </div>
        )}

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
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-white border-t border-[rgba(0,0,0,0.06)] px-6 py-5">
        {!isPublic ? (
          <div className="flex gap-2.5">
            <button
              onClick={() => navigate("/compartir")}
              className="flex-1 py-3.5 bg-[#0A0A0A] text-white rounded-xl transition-all active:scale-[0.98]"
              style={{ fontFamily: "Inter, sans-serif", fontSize: "14px" }}
            >
              Compartir
            </button>
            <button
              className={`flex-1 py-3.5 border rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                isRitualSaved(ritual)
                  ? "border-[#0A0A0A] bg-[#F5F5F5] text-[#0A0A0A]"
                  : "border-[rgba(0,0,0,0.12)] text-[#0A0A0A] hover:border-[rgba(0,0,0,0.25)]"
              }`}
              style={{ fontFamily: "Inter, sans-serif", fontSize: "14px" }}
              onClick={() => {
                const saved = saveRitual(ritual);
                if (saved) {
                  toast("Ritual guardado ✓", {
                    description: "Lo encontrás en tu perfil.",
                  });
                } else {
                  toast("Ya está guardado", {
                    description: "Podés verlo en tu menú de usuario.",
                  });
                }
              }}
            >
              {isRitualSaved(ritual) ? (
                <BookmarkCheck size={15} strokeWidth={1.5} />
              ) : (
                <Bookmark size={15} strokeWidth={1.5} />
              )}
              {isRitualSaved(ritual) ? "Guardado" : "Guardar"}
            </button>
          </div>
        ) : (
          <div className="flex gap-2.5">
            <button
              onClick={() => {
                navigate("/onboarding");
              }}
              className="flex-1 py-3.5 bg-[#0A0A0A] text-white rounded-xl transition-all active:scale-[0.98]"
              style={{ fontFamily: "Inter, sans-serif", fontSize: "14px" }}
            >
              Crear el mío
            </button>
            <button
              className="px-4 py-3.5 border border-[rgba(0,0,0,0.12)] text-[#555] rounded-xl transition-all active:scale-[0.98]"
              style={{ fontFamily: "Inter, sans-serif", fontSize: "13px" }}
            >
              ♥ Me gusta
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
