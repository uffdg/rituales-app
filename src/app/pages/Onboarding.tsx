import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { BackLink } from "../components/BackLink";
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
    window.scrollTo(0, 0);
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
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
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
    <div className="min-h-screen bg-surface-page flex flex-col overflow-y-auto">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 50% 0%, rgba(0,0,0,0.045) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 pt-12 px-6">
        <BackLink to="/" label="Rituales" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex-1 px-6 pt-6 pb-10"
      >
        <h1 className="mb-1.5 font-serif text-title-1 text-ink-strong">
          ¿Qué tipo de ritual
          <br />
          <em className="italic font-light">querés hoy?</em>
        </h1>
        <p className="mb-8 font-sans text-body text-ink-muted">Elegí el punto de partida de tu intención</p>

        {/* Ritual type grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {RITUAL_TYPES.map((type, i) => (
            <motion.button
              key={type.id}
              type="button"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
              onClick={() => { setSelected(type.id); setReframedIntention(null); }}
              aria-pressed={selected === type.id}
              className={`editorial-option-card active:scale-[0.97] ${selected === type.id ? "editorial-option-card-active" : ""}`}
            >
              <div className={`mb-2 ${selected === type.id ? "text-ink-strong" : "text-ink-muted"}`} aria-hidden="true">
                {ritualIcons[type.id] ?? type.icon}
              </div>
              <p className="editorial-option-title">{type.label}</p>
              <p className="editorial-option-body">{type.description}</p>
            </motion.button>
          ))}
        </div>

        {/* Voice alternative */}
        {hasSpeechRecognition && (
          <div className="mb-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-line-default" />
              <span className="font-sans text-caption text-ink-muted">o contame qué está pasando</span>
              <div className="h-px flex-1 bg-line-default" />
            </div>

            <button
              type="button"
              onClick={handleMic}
              aria-pressed={isListening}
              className={`relative flex min-h-[64px] w-full items-center justify-center gap-3 rounded-md px-5 py-4 transition-all active:scale-[0.98] ${
                isListening ? "bg-ink-strong text-on-ink-strong" : "bg-surface-muted text-ink-body"
              }`}
            >
              {isListening ? (
                <>
                  <div className="flex h-4 items-center gap-[3px]" aria-hidden="true">
                    {[0, 1, 2, 3].map((i) => (
                      <motion.div key={i} className="w-[3px] rounded-full bg-white"
                        animate={{ height: ["5px", "16px", "5px"] }}
                        transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.12 }}
                      />
                    ))}
                  </div>
                  <span className="font-sans text-label">Escuchando… tocá para terminar</span>
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 16 16" fill="none" className="shrink-0" aria-hidden="true">
                    <rect x="5" y="1" width="6" height="9" rx="3" stroke="currentColor" strokeWidth="1.3" />
                    <path d="M2 8.5C2 11.538 4.686 14 8 14C11.314 14 14 11.538 14 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    <line x1="8" y1="14" x2="8" y2="15.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  </svg>
                  <div className="text-left">
                    <p className="mb-0.5 font-sans text-label">Hablá, la app te escucha</p>
                    <p className="font-sans text-caption text-ink-muted">Tocá para hablar</p>
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
                  className="editorial-card editorial-card--soft mt-4 flex items-center gap-3 p-4"
                  role="status"
                >
                  <div className="flex gap-1" aria-hidden="true">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-ink-strong"
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                  <span className="font-sans text-body text-ink-muted">Construyendo tu intención…</span>
                </motion.div>
              )}

              {reframedIntention && !isReframing && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="editorial-card editorial-card--muted mt-4 p-5"
                >
                  <p className="editorial-eyebrow mb-2 text-ink-muted">Tu intención</p>
                  <p className="mb-4 font-sans text-title-4 text-ink-strong">{reframedIntention}</p>
                  <p className="font-sans text-body text-ink-muted">
                    Vamos a construir un ritual para acompañar lo que necesitás.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* CTA cards */}
        <button
          type="button"
          onClick={handleContinue}
          disabled={!selected && !reframedIntention}
          className="editorial-button editorial-button--primary editorial-button--lg"
        >
          Continuar
        </button>

        <p className="mt-5 text-center font-sans text-caption text-ink-muted">
          Esta es una herramienta de reflexión y bienestar.
          <br />
          No reemplaza ayuda profesional.
        </p>
      </motion.div>
    </div>
  );
}
