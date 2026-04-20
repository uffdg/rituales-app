import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { useRitual } from "../context/RitualContext";
import { ProgressBar } from "../components/ProgressBar";
import { track } from "../lib/analytics";
import { reframeIntention } from "../lib/ritual-service";

// Tipos mínimos para SpeechRecognition (no están en lib.dom.d.ts por defecto)
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
  const Ctor =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!Ctor) return null;
  return new Ctor() as SpeechRecognitionInstance;
}

export function StepIntention() {
  const navigate = useNavigate();
  const { ritual, updateRitual } = useRitual();
  const [intention, setIntention] = useState(ritual.intention || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isReframing, setIsReframing] = useState(false);
  const [micError, setMicError] = useState("");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const transcriptRef = useRef<string>("");
  const hasSpeechRecognition = typeof window !== "undefined" &&
    !!(( window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const handleMic = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    setMicError("");
    const recognition = createSpeechRecognition();
    if (!recognition) {
      setMicError("Tu navegador no soporta reconocimiento de voz.");
      return;
    }

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
        setMicError("No se pudo acceder al micrófono.");
      }
      setIsListening(false);
    };

    recognition.onend = async () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      setIsListening(false);
      const transcript = transcriptRef.current.trim();
      transcriptRef.current = "";
      if (!transcript) return;

      setIntention(transcript);
      track("voice_input_used");

      setIsReframing(true);
      try {
        const reframed = await reframeIntention(transcript);
        if (reframed) setIntention(reframed);
      } finally {
        setIsReframing(false);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    track("voice_input_started");
  };

  const SUGGESTED_INTENTIONS: Record<string, string> = {
    Claridad: "Quiero tener claridad para tomar una decisión que lleva tiempo rondándome.",
    Calma: "Quiero soltar la tensión acumulada y sentirme en calma conmigo misma.",
    "Amor propio": "Quiero reconectarme con lo que valoro de mí misma hoy.",
    Enfoque: "Quiero concentrar mi energía en lo que realmente importa ahora.",
    Soltar: "Quiero dejar ir algo que ya no me sirve y que me tiene anclada.",
    Oportunidad: "Quiero abrirme a nuevas posibilidades que no puedo ver todavía.",
  };

  const handleSuggestIntention = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const typeMap: Record<string, string> = {
        claridad: "Claridad",
        calma: "Calma",
        "amor-propio": "Amor propio",
        enfoque: "Enfoque",
        "cerrar-ciclo": "Soltar",
        atraer: "Oportunidad",
      };
      const chip = typeMap[ritual.ritualType] || "Claridad";
      setIntention(SUGGESTED_INTENTIONS[chip]);
      setIsGenerating(false);
    }, 1400);
  };

  const handleNext = () => {
    updateRitual({ intention });
    navigate("/crear/2");
  };

  return (
    <div className="editorial-page-bg">
      <div className="editorial-radial-wash" />

      <ProgressBar step={1} onBack={() => navigate("/onboarding")} />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="editorial-content-scroll"
      >
        <p className="editorial-eyebrow editorial-step-label">
          Paso 1 — Intención
        </p>

        <h2 className="editorial-step-title">
          ¿Cuál es tu intención
          <br />
          <em>para este ritual?</em>
        </h2>

        {/* Text field */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label className="editorial-field-label">
              Mi intención
            </label>
            {hasSpeechRecognition && (
              <button
                onClick={handleMic}
                className={`editorial-pill-button ${isListening ? "editorial-pill-button-active" : ""}`}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <rect x="3" y="0.5" width="4" height="6" rx="2" stroke="currentColor" strokeWidth="1" />
                  <path d="M1 5.5C1 7.71 2.79 9.5 5 9.5C7.21 9.5 9 7.71 9 5.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                  <line x1="5" y1="9.5" x2="5" y2="10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                </svg>
                {isListening ? "Escuchando..." : "Hablar"}
              </button>
            )}
          </div>
          <div className="relative">
            <textarea
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              placeholder={isListening ? "Hablá ahora..." : "Ej: Quiero tener claridad para decidir si cambio de trabajo..."}
              rows={4}
              className="editorial-textarea"
            />
            {isListening && (
              <div className="absolute bottom-3 right-3 flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1 rounded-full bg-[var(--ink-strong)]"
                    animate={{ height: ["4px", "12px", "4px"] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            )}
            <AnimatePresence>
              {(isGenerating || isReframing) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 rounded-2xl flex items-center justify-center bg-white/90"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-[var(--ink-strong)]"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </div>
                    <span className="editorial-body-muted">
                      {isReframing ? "Reencuadrando..." : "Generando..."}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {micError && (
            <p className="editorial-error mt-1.5">
              {micError}
            </p>
          )}
        </div>

        {/* AI button */}
        <button
          onClick={handleSuggestIntention}
          disabled={isGenerating}
          className="editorial-dashed-action mb-8"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1L8.5 5.5L13 7L8.5 8.5L7 13L5.5 8.5L1 7L5.5 5.5L7 1Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
          </svg>
          Sugerirme una intención
        </button>

        {/* CTA */}
        <button
          onClick={handleNext}
          disabled={!intention.trim()}
          className={`editorial-action-button active:scale-[0.98] ${
            intention.trim()
              ? "editorial-action-button-primary"
              : "editorial-action-button-disabled"
          }`}
        >
          Siguiente
        </button>
      </motion.div>
    </div>
  );
}
