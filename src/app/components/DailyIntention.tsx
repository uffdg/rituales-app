import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Mic } from "lucide-react";
import { track } from "../lib/analytics";
import { getUserFacingErrorMessage } from "../lib/errors";
import { createDailyIntention, getDailyIntention, type DailyIntention as Intention } from "../lib/daily-service";

// Si escribir la intención tarda más que esto, se avisa que va lento en vez de
// parecer colgado (Supabase a veces tarda varios segundos en validar la sesión).
const SLOW_HINT_MS = 6000;

// "input" incluye la vista sin sesión; "writing" es mientras el backend escribe.
type Phase = "loading" | "input" | "writing" | "done";

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

function createSpeechRecognition(): SpeechRecognitionInstance | null {
  const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  return Ctor ? (new Ctor() as SpeechRecognitionInstance) : null;
}

// Un cuenco abierto con una estrella que flota sobre él. `active` la acelera
// mientras se dicta o se escribe la intención.
function WishIllustration({ active }: { active: boolean }) {
  return (
    <svg
      width="104"
      height="80"
      viewBox="0 0 104 80"
      fill="none"
      stroke="var(--ink-strong)"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={active ? "oracle-active" : undefined}
    >
      <path d="M8 58 H96" stroke="rgba(10,10,10,0.25)" />
      <path d="M18 58 Q52 84 86 58" />
      <path className="oracle-draw" pathLength={1} d="M52 62 C46 50 58 42 52 32" />
      <g className="oracle-float">
        <path d="M52 8 L54.5 17.5 L64 20 L54.5 22.5 L52 32 L49.5 22.5 L40 20 L49.5 17.5 Z" />
        <ellipse className="oracle-spin" cx="52" cy="20" rx="20" ry="7" stroke="rgba(10,10,10,0.35)" strokeWidth="0.8" />
      </g>
      <g className="oracle-pulse">
        <path d="M30 10 v4 M28 12 h4" />
        <path d="M78 30 v4 M76 32 h4" />
      </g>
    </svg>
  );
}

export function DailyIntention({
  dateKey,
  isLoggedIn,
  onLogin,
  onCreateRitual,
  onOpenRecords,
}: {
  dateKey: string;
  isLoggedIn: boolean;
  onLogin: () => void;
  onCreateRitual: (intentionText: string) => void;
  onOpenRecords: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [intention, setIntention] = useState<Intention | null>(null);
  const [justWritten, setJustWritten] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState("");
  const [isSlow, setIsSlow] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const hasSpeechRecognition =
    typeof window !== "undefined" &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  useEffect(() => {
    let cancelled = false;
    setIntention(null);
    setJustWritten(false);
    setError("");

    if (!isLoggedIn) {
      setPhase("input");
      return;
    }

    setPhase("loading");
    getDailyIntention(dateKey)
      .then((existing) => {
        if (cancelled) return;
        if (existing) {
          setIntention(existing);
          setPhase("done");
          track("intention_reopened");
        } else {
          setPhase("input");
        }
      })
      .catch(() => {
        if (!cancelled) setPhase("input");
      });

    return () => {
      cancelled = true;
    };
  }, [dateKey, isLoggedIn]);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  const handleMic = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = createSpeechRecognition();
    if (!recognition) return;

    const textBefore = inputText.trim();
    recognition.lang = "es-AR";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onresult = (e) => {
      let spoken = "";
      for (let i = 0; i < e.results.length; i++) {
        spoken += e.results[i][0].transcript;
      }
      setInputText([textBefore, spoken.trim()].filter(Boolean).join(" "));
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    track("intention_voice_used");
  };

  const handleSubmit = async () => {
    if (!isLoggedIn) {
      track("intention_login_prompted");
      onLogin();
      return;
    }

    const text = inputText.trim();
    if (!text || phase !== "input") return;

    recognitionRef.current?.stop();
    setError("");
    setPhase("writing");
    setIsSlow(false);
    const slowTimer = window.setTimeout(() => setIsSlow(true), SLOW_HINT_MS);
    const startedAt = Date.now();

    try {
      const result = await createDailyIntention({ dateKey, inputText: text });
      setIntention(result.intention);
      setJustWritten(true);
      setPhase("done");
      track("intention_written", {
        durationMs: Date.now() - startedAt,
        wordCount: text.split(/\s+/).length,
        isRetry: Boolean(intention),
        persisted: result.persisted,
      });
    } catch (writeError) {
      setError(getUserFacingErrorMessage(writeError, "No pudimos escribir tu intención. Probá de nuevo."));
      setPhase("input");
      track("intention_error", {
        message: writeError instanceof Error ? writeError.message.slice(0, 120) : "unknown",
      });
    } finally {
      window.clearTimeout(slowTimer);
      setIsSlow(false);
    }
  };

  // La intención se puede volver a pedir: vuelve al campo con lo que había
  // escrito, para ajustarlo o pedir otra versión tal cual.
  const handleAskAgain = () => {
    if (!intention) return;
    setInputText(intention.inputText);
    setError("");
    setJustWritten(false);
    setPhase("input");
    track("intention_ask_again");
  };

  const handleCreateRitual = () => {
    if (!intention) return;
    track("intention_ritual_started");
    onCreateRitual(intention.intentionText);
  };

  const isWriting = phase === "writing";

  return (
    <div>
      <div className="mb-5 flex items-baseline justify-between">
        <p className="editorial-eyebrow">Intención del día</p>
        {isLoggedIn ? (
          <button
            type="button"
            onClick={onOpenRecords}
            className="editorial-section-link"
          >
            Tu registro →
          </button>
        ) : null}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {phase === "loading" ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="editorial-skeleton h-[300px]"
          />
        ) : null}

        {phase === "input" || phase === "writing" ? (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            <WishIllustration active={isListening || isWriting} />
            <div>
              <h3 className="font-serif text-title-2 text-ink-strong">
                ¿Qué deseás hoy?
              </h3>
              <p className="mt-2 font-sans text-body text-ink-muted">
                Contalo en pocas palabras y te devolvemos una intención clara para el día.
              </p>
            </div>

            <div
              className="relative rounded-md bg-surface-muted px-4 pb-14 pt-3.5 focus-within:bg-surface-base focus-within:shadow-[inset_0_0_0_1px_var(--ink-strong)]"
              style={{ boxShadow: isListening ? "inset 0 0 0 1.5px var(--ink-strong)" : undefined }}
            >
              <textarea
                value={inputText}
                onChange={(event) => setInputText(event.target.value)}
                disabled={isWriting}
                maxLength={1000}
                placeholder="Ej.: terminar la entrega sin perder la calma"
                aria-label="Qué deseás hoy"
                className="min-h-[88px] w-full resize-none bg-transparent font-sans text-body-lg text-ink-strong outline-none placeholder:text-ink-subtle disabled:opacity-60"
              />
              {hasSpeechRecognition && isLoggedIn ? (
                <button
                  type="button"
                  onClick={handleMic}
                  disabled={isWriting}
                  aria-pressed={isListening}
                  className={`editorial-pill-button absolute bottom-3 right-3 disabled:opacity-40 ${
                    isListening ? "editorial-pill-button-active" : "bg-surface-base"
                  }`}
                >
                  {isListening ? (
                    <>
                      <span className="flex h-3 items-center gap-[2px]">
                        {[0, 1, 2].map((i) => (
                          <motion.span
                            key={i}
                            className="w-[2px] rounded-full bg-white"
                            animate={{ height: ["4px", "12px", "4px"] }}
                            transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.12 }}
                          />
                        ))}
                      </span>
                      Listo
                    </>
                  ) : (
                    <>
                      <Mic size={13} strokeWidth={1.5} />
                      Hablar
                    </>
                  )}
                </button>
              ) : null}
            </div>

            {error ? (
              <p className="editorial-error" role="alert">{error}</p>
            ) : null}

            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={isLoggedIn && (!inputText.trim() || isWriting)}
              aria-busy={isWriting}
              className="editorial-button editorial-button--primary editorial-button--lg"
            >
              {!isLoggedIn
                ? "Ingresá para escribir tu intención"
                : isWriting && isSlow
                ? "Está tardando un poco más de lo normal…"
                : isWriting
                ? "Escribiendo tu intención…"
                : error
                ? "Probar de nuevo"
                : "Recibir mi intención"}
            </button>
          </motion.div>
        ) : null}

        {phase === "done" && intention ? (
          <motion.div
            key="done"
            initial={justWritten ? { opacity: 0, y: 10 } : false}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-4"
          >
            <div className="editorial-card editorial-card--muted editorial-card--feature">
              <WishIllustration active={false} />
              {/* Sobre --surface-muted el gris secundario es --ink-muted (spec 02). */}
              <p className="editorial-eyebrow mt-3 text-ink-muted">
                Tu intención de hoy
              </p>
              <p className="mt-3 whitespace-pre-line font-sans text-title-4 text-ink-strong">
                {intention.intentionText}
              </p>
              <p className="mt-4 font-sans text-body text-ink-muted">
                Lo que deseabas: «{intention.inputText}»
              </p>
            </div>

            <p className="px-1 pt-1 text-center font-sans text-body-lg text-ink-body">
              Llevate esta intención durante el resto del día.
              <br />
              Pensala y releela.
            </p>

            <button
              type="button"
              onClick={handleCreateRitual}
              className="editorial-button editorial-button--secondary editorial-button--lg"
            >
              Hacer un ritual con esta intención
              <ArrowUpRight size={16} strokeWidth={1.5} aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={handleAskAgain}
              className="editorial-button editorial-button--tertiary mx-auto flex"
            >
              Pedir otra intención
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
