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
      setIsListening(false);
      return;
    }

    setMicError("");
    const recognition = createSpeechRecognition();
    if (!recognition) {
      setMicError("Tu navegador no soporta reconocimiento de voz.");
      return;
    }

    recognition.lang = "es-AR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onresult = async (e: SpeechRecognitionEvent) => {
      const transcript = e.results[0][0].transcript;
      setIntention((prev) => (prev ? `${prev} ${transcript}` : transcript));
      track("voice_input_used");

      setIsReframing(true);
      try {
        const reframed = await reframeIntention(transcript);
        if (reframed) setIntention(reframed);
      } finally {
        setIsReframing(false);
      }
    };

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error !== "no-speech" && e.error !== "aborted") {
        setMicError("No se pudo acceder al micrófono.");
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
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
    <div className="min-h-screen bg-white flex flex-col">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(0,0,0,0.04) 0%, transparent 60%)",
        }}
      />

      <ProgressBar step={1} onBack={() => navigate("/onboarding")} />

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1 px-6 pb-10 overflow-y-auto"
      >
        {/* Step label */}
        <p
          className="mb-3 text-[#AAA]"
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          Paso 1 — Intención
        </p>

        <h2
          style={{
            fontFamily: "Cormorant Garamond, serif",
            fontSize: "28px",
            fontWeight: 400,
            color: "#0A0A0A",
            lineHeight: 1.25,
            marginBottom: "20px",
          }}
        >
          ¿Cuál es tu intención
          <br />
          <em style={{ fontStyle: "italic", fontWeight: 300 }}>para este ritual?</em>
        </h2>

        {/* Text field */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <label
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "12px",
                fontWeight: 400,
                color: "#999",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              Mi intención
            </label>
            {hasSpeechRecognition && (
              <button
                onClick={handleMic}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all ${
                  isListening
                    ? "border-[#0A0A0A] bg-[#0A0A0A] text-white"
                    : "border-[rgba(0,0,0,0.15)] text-[#666] hover:border-[rgba(0,0,0,0.3)]"
                }`}
                style={{ fontFamily: "Inter, sans-serif", fontSize: "11px" }}
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
              className="w-full p-4 rounded-2xl border border-[rgba(0,0,0,0.1)] bg-[#FAFAFA] text-[#0A0A0A] placeholder-[#CCC] resize-none focus:outline-none focus:border-[rgba(0,0,0,0.3)] transition-colors"
              style={{
                fontFamily: "Cormorant Garamond, serif",
                fontSize: "17px",
                fontWeight: 300,
                lineHeight: 1.5,
              }}
            />
            {isListening && (
              <div className="absolute bottom-3 right-3 flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1 rounded-full bg-[#0A0A0A]"
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
                  className="absolute inset-0 rounded-2xl flex items-center justify-center bg-[rgba(255,255,255,0.92)]"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-[#0A0A0A]"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </div>
                    <span
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "13px",
                        color: "#666",
                      }}
                    >
                      {isReframing ? "Reencuadrando..." : "Generando..."}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {micError && (
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#B42318", marginTop: "6px" }}>
              {micError}
            </p>
          )}
        </div>

        {/* AI button */}
        <button
          onClick={handleSuggestIntention}
          disabled={isGenerating}
          className="w-full py-3 px-5 border border-dashed border-[rgba(0,0,0,0.15)] rounded-xl text-[#666] hover:border-[rgba(0,0,0,0.3)] hover:text-[#0A0A0A] transition-all mb-8 flex items-center justify-center gap-2"
          style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 300 }}
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
          className={`w-full py-4 px-6 rounded-2xl transition-all active:scale-[0.98] ${
            intention.trim()
              ? "bg-[#0A0A0A] text-white hover:bg-[#1A1A1A]"
              : "bg-[#F0F0F0] text-[#BBB] cursor-not-allowed"
          }`}
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "15px",
            fontWeight: 400,
            letterSpacing: "0.03em",
          }}
        >
          Siguiente
        </button>
      </motion.div>
    </div>
  );
}
