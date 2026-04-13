import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useRitual } from "../context/RitualContext";
import { UserMenu } from "../components/UserMenu";
import { deriveCandleGuide } from "../lib/candle";
import { getUserFacingErrorMessage } from "../lib/errors";
import { publishRitualToCommunity } from "../lib/ritual-service";

const MOCK_LINK = "rituales.app/r/claridad-interior-4f8a2";

export function Share() {
  const navigate = useNavigate();
  const { ritual } = useRitual();
  const [showName, setShowName] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const appBaseUrl = (import.meta.env.VITE_PUBLIC_APP_URL?.replace(/\/$/, "")) || window.location.origin;
  const realId = ritual.ritualId && !ritual.ritualId.startsWith("mock-") && !ritual.ritualId.startsWith("dev-")
    ? ritual.ritualId
    : null;
  const shareLink = realId ? `${appBaseUrl}/ritual/${realId}` : MOCK_LINK;
  const candleGuide = deriveCandleGuide({
    ritualType: ritual.ritualType,
    intention: ritual.intention,
    energy: ritual.energy,
    title: ritual.aiRitual?.title,
    opening: ritual.aiRitual?.opening,
    symbolicAction: ritual.aiRitual?.symbolicAction,
    closing: ritual.aiRitual?.closing,
  });

  const handleCopy = () => {
    navigator.clipboard?.writeText(shareLink).catch(() => {});
    setCopied(true);
    toast("Link copiado ✓", {
      description: "Listo para compartir.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    toast("Abriendo WhatsApp...", {
      description: "En la app real, esto abriría WhatsApp.",
    });
  };

  const handleInstagram = () => {
    toast("Preparando para Instagram...", {
      description: "En la app real, esto generaría una imagen para stories.",
    });
  };

  const handlePublishToCommunity = async () => {
    if (!realId) {
      toast("Todavía no pudimos publicar este ritual.", {
        description: "Probá de nuevo en unos segundos.",
      });
      return;
    }

    setIsPublishing(true);

    try {
      await publishRitualToCommunity(realId, showName);
      setIsPublished(true);
      toast("Ya está en la comunidad", {
        description: "Ahora también puede aparecer en Explorar.",
      });
    } catch (error) {
      toast(getUserFacingErrorMessage(error, "No se pudo publicar tu ritual en comunidad."));
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-y-auto">
      {/* Gradient */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 50% 0%, rgba(0,0,0,0.04) 0%, transparent 60%)",
        }}
      />

      {/* Header */}
      <div className="relative z-10 pt-14 px-6 pb-4 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[var(--ink-subtle)] hover:text-[var(--ink-strong)] transition-colors"
          style={{ fontFamily: "var(--font-sans-ui)", fontSize: "13px" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Volver
        </button>
        <UserMenu />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex-1 px-6 pt-2 pb-12"
      >
        {/* Title */}
        <div className="mb-8">
          <p
            style={{
              fontFamily: "var(--font-sans-ui)",
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--ink-soft)",
              marginBottom: "8px",
            }}
          >
            Compartir ritual
          </p>
          <h1
            style={{
              fontFamily: "var(--font-serif-display)",
              fontSize: "30px",
              fontWeight: 400,
              color: "var(--ink-strong)",
              lineHeight: 1.25,
            }}
          >
            Tu ritual ya está listo
            <br />
            <em style={{ fontStyle: "italic", fontWeight: 300 }}>para compartir.</em>
          </h1>
        </div>

        {/* Preview card */}
        <div
          className="mb-8 p-5 rounded-2xl overflow-hidden relative"
          style={{
            background: "linear-gradient(145deg, #0A0A0A 0%, #2A2A2A 100%)",
          }}
        >
          {/* Abstract decoration */}
          <div
            className="absolute pointer-events-none"
            style={{
              width: 200,
              height: 200,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.06)",
              top: -60,
              right: -60,
            }}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.04)",
              top: -20,
              right: -20,
            }}
          />

          <div className="relative z-10">
            <p
              style={{
                fontFamily: "var(--font-sans-ui)",
                fontSize: "9px",
                fontWeight: 500,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.35)",
                marginBottom: "10px",
              }}
            >
              Rituales
            </p>
            <p
              style={{
                fontFamily: "var(--font-serif-display)",
                fontSize: "20px",
                fontWeight: 400,
                color: "white",
                lineHeight: 1.3,
                marginBottom: "12px",
              }}
            >
              {ritual.aiRitual?.title || "Mi ritual personal"}
            </p>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {ritual.element && (
                <span
                  className="px-2.5 py-0.5 rounded-full"
                  style={{
                    border: "1px solid rgba(255,255,255,0.15)",
                    fontFamily: "var(--font-sans-ui)",
                    fontSize: "10px",
                    color: "rgba(255,255,255,0.55)",
                    letterSpacing: "0.05em",
                  }}
                >
                  {ritual.element.charAt(0).toUpperCase() + ritual.element.slice(1)}
                </span>
              )}
              {ritual.duration && (
                <span
                  className="px-2.5 py-0.5 rounded-full"
                  style={{
                    border: "1px solid rgba(255,255,255,0.15)",
                    fontFamily: "var(--font-sans-ui)",
                    fontSize: "10px",
                    color: "rgba(255,255,255,0.55)",
                    letterSpacing: "0.05em",
                  }}
                >
                  {ritual.duration} min
                </span>
              )}
              <span
                className="px-2.5 py-0.5 rounded-full"
                style={{
                  border: "1px solid rgba(255,255,255,0.15)",
                  fontFamily: "var(--font-sans-ui)",
                  fontSize: "10px",
                  color: "rgba(255,255,255,0.55)",
                  letterSpacing: "0.05em",
                }}
              >
                Vela {candleGuide.color}
              </span>
            </div>

            <div
              className="h-[1px]"
              style={{ background: "rgba(255,255,255,0.08)", marginBottom: "12px" }}
            />

            <p
              style={{
                fontFamily: "var(--font-sans-ui)",
                fontSize: "11px",
                color: showName ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)",
                fontWeight: 300,
                letterSpacing: "0.03em",
              }}
            >
              {showName ? "Compartido por ti" : "Compartido de forma anónima"}
            </p>
          </div>
        </div>

        {/* Link copy */}
        <div className="mb-5">
          <p
            style={{
              fontFamily: "var(--font-sans-ui)",
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--ink-soft)",
              marginBottom: "8px",
            }}
          >
            Link del ritual
          </p>
          <div className="flex gap-2">
            <div
              className="flex-1 px-4 py-3 rounded-xl bg-[var(--surface-softest)] flex items-center"
              style={{
                fontFamily: "var(--font-sans-ui)",
                fontSize: "13px",
                color: "var(--ink-muted)",
                overflow: "hidden",
              }}
            >
              <span className="truncate">{shareLink}</span>
            </div>
            <button
              onClick={handleCopy}
              className={`px-4 py-3 rounded-xl font-medium transition-all text-sm active:scale-[0.95] ${
                copied
                  ? "bg-[var(--ink-strong)] text-white"
                  : "bg-[var(--ink-strong)] text-white hover:bg-[var(--ink-strong)]"
              }`}
              style={{ fontFamily: "var(--font-sans-ui)", minWidth: "64px" }}
            >
              {copied ? "✓" : "Copiar"}
            </button>
          </div>
        </div>

        {/* Share channels */}
        <div className="mb-7">
          <p
            style={{
              fontFamily: "var(--font-sans-ui)",
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--ink-soft)",
              marginBottom: "10px",
            }}
          >
            Compartir directo
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleWhatsApp}
              className="flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-xl border border-[rgba(0,0,0,0.1)] text-[var(--ink-strong)] hover:border-[rgba(0,0,0,0.2)] hover:bg-[var(--surface-softest)] transition-all active:scale-[0.97]"
              style={{ fontFamily: "var(--font-sans-ui)", fontSize: "13px" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </button>
            <button
              onClick={handleInstagram}
              className="flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-xl border border-[rgba(0,0,0,0.1)] text-[var(--ink-strong)] hover:border-[rgba(0,0,0,0.2)] hover:bg-[var(--surface-softest)] transition-all active:scale-[0.97]"
              style={{ fontFamily: "var(--font-sans-ui)", fontSize: "13px" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="url(#ig)" strokeWidth="1.5">
                <defs>
                  <linearGradient id="ig" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#f09433" />
                    <stop offset="25%" stopColor="#e6683c" />
                    <stop offset="50%" stopColor="#dc2743" />
                    <stop offset="75%" stopColor="#cc2366" />
                    <stop offset="100%" stopColor="#bc1888" />
                  </linearGradient>
                </defs>
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="#dc2743" stroke="none" />
              </svg>
              Instagram
            </button>
          </div>
        </div>

        {/* Privacy note */}
        <div className="p-4 rounded-xl bg-[#F8F8F8] mb-6">
          <p
            style={{
              fontFamily: "var(--font-sans-ui)",
              fontSize: "12px",
              fontWeight: 300,
              color: "var(--ink-subtle)",
              lineHeight: 1.6,
            }}
          >
            Compartís una versión legible y hermosa de tu ritual. Puedes desactivar tus datos personales antes de compartir.
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-[rgba(0,0,0,0.07)] bg-white mb-6">
          <p
            style={{
              fontFamily: "var(--font-sans-ui)",
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--ink-soft)",
              marginBottom: "8px",
            }}
          >
            Comunidad
          </p>
          <p
            style={{
              fontFamily: "var(--font-serif-display)",
              fontSize: "24px",
              fontWeight: 400,
              color: "var(--ink-strong)",
              lineHeight: 1.15,
              marginBottom: "8px",
            }}
          >
            También podés dejarlo público en la app
          </p>
          <p
            style={{
              fontFamily: "var(--font-sans-ui)",
              fontSize: "13px",
              fontWeight: 300,
              color: "var(--ink-subtle)",
              lineHeight: 1.6,
              marginBottom: "14px",
            }}
          >
            Si lo publicás, otras personas lo van a poder descubrir en Explorar.
          </p>
          <button
            onClick={handlePublishToCommunity}
            disabled={isPublishing || isPublished}
            className={`w-full py-3.5 rounded-xl transition-all active:scale-[0.98] ${
              isPublished
                ? "bg-[var(--surface-softest)] text-[var(--ink-strong)] border border-[rgba(0,0,0,0.08)]"
                : "bg-[var(--ink-strong)] text-white"
            }`}
            style={{ fontFamily: "var(--font-sans-ui)", fontSize: "14px" }}
          >
            {isPublishing
              ? "Publicando..."
              : isPublished
                ? "Ya está publicado"
                : "Publicar en comunidad"}
          </button>
        </div>

        {/* Name toggle */}
        <div className="flex items-center justify-between p-4 rounded-2xl border border-[rgba(0,0,0,0.07)]">
          <div>
            <p
              style={{
                fontFamily: "var(--font-sans-ui)",
                fontSize: "14px",
                fontWeight: 400,
                color: "var(--ink-strong)",
              }}
            >
              Mostrar mi nombre
            </p>
            <p
              style={{
                fontFamily: "var(--font-sans-ui)",
                fontSize: "12px",
                fontWeight: 300,
                color: "var(--ink-soft)",
              }}
            >
              {showName ? "Visible para quien reciba el link" : "Compartirás de forma anónima"}
            </p>
          </div>
          <button
            onClick={() => setShowName(!showName)}
            className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
              showName ? "bg-[var(--ink-strong)]" : "bg-[var(--ink-soft)]"
            }`}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ${
                showName ? "left-6" : "left-0.5"
              }`}
            />
          </button>
        </div>

        {/* Done button */}
        <button
          onClick={() => navigate("/")}
          className="w-full mt-6 py-4 px-6 border border-[rgba(0,0,0,0.12)] text-[var(--ink-strong)] rounded-2xl transition-all active:scale-[0.98] hover:border-[rgba(0,0,0,0.25)]"
          style={{
            fontFamily: "var(--font-sans-ui)",
            fontSize: "15px",
            fontWeight: 400,
          }}
        >
          Volver al inicio
        </button>
      </motion.div>
    </div>
  );
}
