import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { useRitual } from "../context/RitualContext";
import { RITUAL_TYPES } from "../data/rituals";
import { Sun, Heart, Wind, Target, RotateCcw, Sparkles } from "lucide-react";
import { track } from "../lib/analytics";
import { reframeIntention } from "../lib/ritual-service";

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

function detectRitualType(text: string): string {
  const t = text.toLowerCase();
  if (/tranqui|calm|ansiedad|estr[eé]s|nervios|agobiad/.test(t)) return "calma";
  if (/amor|autoestima|valorar|cuerpo|conmigo|merec/.test(t)) return "amor-propio";
  if (/enfoc|concentr|productiv|trabajo|proyect|estudiar/.test(t)) return "enfoque";
  if (/cerrar|soltar|dejar|terminar|duelo|ex |pareja|pasado/.test(t)) return "cerrar-ciclo";
  if (/oportunidad|atraer|nuevo|cambio|abrir|manifest/.test(t)) return "atraer";
  return "claridad";
}

export function Onboarding() {
  const navigate = useNavigate();
  const { updateRitual, resetRitual } = useRitual();

  useEffect(() => {
    resetRitual();
  }, []);
  const [selected, setSelected] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isReframing, setIsReframing] = useState(false);
  const [reframedIntention, setReframedIntention] = useState<string | null>(null);
  const [detectedType, setDetectedType] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const transcriptRef = useRef<string>("");

  const hasSpeechRecognition =
    typeof window !== "undefined" &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const ritualIcons: Record<string, React.ReactNode> = {
    claridad: <Sun size={20} strokeWidth={1.25} />,
    "amor-propio": <Heart size={20} strokeWidth={1.25} />,
    calma: <Wind size={20} strokeWidth={1.25} />,
    enfoque: <Target size={20} strokeWidth={1.25} />,
    "cerrar-ciclo": <RotateCcw size={20} strokeWidth={1.25} />,
    atraer: <Sparkles size={20} strokeWidth={1.25} />,
  };

  const handleContinue = () => {
    if (reframedIntention && detectedType) {
      updateRitual({ ritualType: detectedType, intention: reframedIntention });
      track("onboarding_voice_completed", { ritualType: detectedType });
      navigate("/crear/2");
    } else {
      updateRitual({ ritualType: selected });
      track("onboarding_completed", { ritualType: selected });
      navigate("/crear/1");
    }
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
      transcriptRef.current = "";
      if (!transcript) return;

      const type = detectRitualType(transcript);
      setDetectedType(type);
      track("voice_onboarding_used");

      setIsReframing(true);
      try {
        const reframed = await reframeIntention(transcript);
        setReframedIntention(reframed || transcript);
      } finally {
        setIsReframing(false);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  return (
    <div className="min-h-screen bg-[var(--app-page)] flex flex-col overflow-y-auto">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 50% 0%, rgba(0,0,0,0.045) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 pt-14 px-6">
        <button
          onClick={() => navigate("/")}
          className="mt-4 flex items-center gap-2 text-[var(--ink-subtle)] hover:text-[var(--ink-strong)] transition-colors"
          style={{ fontFamily: "var(--font-sans-ui)", fontSize: "13px" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Rituales
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex-1 px-6 pt-8 pb-10"
      >
        <h1
          style={{
            fontFamily: "var(--font-serif-display)",
            fontSize: "32px",
            fontWeight: 400,
            color: "var(--ink-strong)",
            lineHeight: 1.2,
            marginBottom: "6px",
          }}
        >
          ¿Qué tipo de ritual
          <br />
          <em style={{ fontStyle: "italic", fontWeight: 300 }}>quieres hoy?</em>
        </h1>
        <p
          className="mb-8 text-[var(--ink-subtle)]"
          style={{ fontFamily: "var(--font-sans-ui)", fontSize: "13px", fontWeight: 300 }}
        >
          Elegí el punto de partida de tu intención
        </p>

        {/* Ritual type grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {RITUAL_TYPES.map((type, i) => (
            <motion.button
              key={type.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
              onClick={() => { setSelected(type.id); setReframedIntention(null); }}
              className={`text-left p-4 rounded-2xl border transition-all active:scale-[0.97] ${
                selected === type.id
                  ? "bg-[var(--ink-strong)] border-[var(--ink-strong)] text-white"
                  : "bg-white border-[var(--border-default)] text-[var(--ink-strong)] hover:border-[var(--border-strong)]"
              }`}
            >
              <div className={`mb-2 ${selected === type.id ? "opacity-90" : "opacity-40"}`}>
                {ritualIcons[type.id] ?? type.icon}
              </div>
              <p
                style={{
                  fontFamily: "var(--font-serif-display)",
                  fontSize: "16px",
                  fontWeight: 500,
                  lineHeight: 1.2,
                  marginBottom: "2px",
                }}
              >
                {type.label}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-sans-ui)",
                  fontSize: "11px",
                  fontWeight: 300,
                  opacity: selected === type.id ? 0.7 : 0.5,
                }}
              >
                {type.description}
              </p>
            </motion.button>
          ))}
        </div>

        {/* Voice alternative */}
        {hasSpeechRecognition && (
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-[var(--border-default)]" />
              <span
                style={{
                  fontFamily: "var(--font-sans-ui)",
                  fontSize: "11px",
                  color: "var(--ink-soft)",
                  letterSpacing: "0.08em",
                }}
              >
                o contame qué está pasando
              </span>
              <div className="flex-1 h-px bg-[var(--border-default)]" />
            </div>

            <button
              onClick={handleMic}
              className={`relative w-full py-5 px-5 rounded-2xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] ${
                isListening
                  ? "bg-[var(--ink-strong)] text-white"
                  : "bg-[var(--surface-muted)] text-[var(--ink-body)]"
              }`}
            >
              {isListening ? (
                <>
                  <div className="flex gap-[3px] items-center h-4">
                    {[0, 1, 2, 3].map((i) => (
                      <motion.div key={i} className="w-[3px] rounded-full bg-white"
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

            {/* Reframing state */}
            <AnimatePresence>
              {isReframing && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="mt-4 flex items-center gap-3 rounded-2xl border p-4"
                  style={{ background: "var(--surface-softest)", borderColor: "var(--border-soft)" }}
                >
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-[var(--ink-strong)]"
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                  <span style={{ fontFamily: "var(--font-sans-ui)", fontSize: "13px", color: "var(--ink-muted)" }}>
                    Construyendo tu intención...
                  </span>
                </motion.div>
              )}

              {reframedIntention && !isReframing && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 rounded-2xl border p-5"
                  style={{ background: "var(--surface-muted)", borderColor: "var(--border-soft)" }}
                >
                  <p
                    style={{
                      fontFamily: "var(--font-sans-ui)",
                      fontSize: "10px",
                      color: "var(--ink-subtle)",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      marginBottom: "8px",
                    }}
                  >
                    Tu intención
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-serif-display)",
                      fontSize: "18px",
                      fontWeight: 400,
                      color: "var(--ink-strong)",
                      lineHeight: 1.4,
                      marginBottom: "16px",
                    }}
                  >
                    {reframedIntention}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-sans-ui)",
                      fontSize: "12px",
                      color: "var(--ink-subtle)",
                      marginBottom: "16px",
                      lineHeight: 1.5,
                    }}
                  >
                    Vamos a construir un ritual para acompañar lo que necesitás.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* CTA cards */}
        <button
          onClick={handleContinue}
          disabled={!selected && !reframedIntention}
          className="editorial-action-button editorial-action-button-primary"
        >
          Continuar
        </button>

        <p
          className="mt-5 text-center text-[var(--ink-soft)]"
          style={{
            fontFamily: "var(--font-sans-ui)",
            fontSize: "11px",
            fontWeight: 300,
            lineHeight: 1.6,
          }}
        >
          Esta es una herramienta de reflexión y bienestar.
          <br />
          No reemplaza ayuda profesional.
        </p>
      </motion.div>
    </div>
  );
}
