import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowUpRight,
  Circle,
  Compass,
  DoorOpen,
  Eye,
  Feather,
  Flame,
  Flower2,
  Footprints,
  Hand,
  Heart,
  House,
  KeyRound,
  Leaf,
  MessageCircle,
  Mic,
  Moon,
  Mountain,
  Sparkles,
  Sprout,
  Star,
  Sun,
  Target,
  Waves,
  Wind,
} from "lucide-react";
import { track } from "../lib/analytics";
import { getUserFacingErrorMessage } from "../lib/errors";
import { drawDailyCard, getDailyCard, type DailyCard } from "../lib/daily-card-service";

// Claves de `symbol` del mazo (rituales-backend/src/lib/oracle-deck.js).
const SYMBOL_ICONS: Record<string, React.ElementType> = {
  circle: Circle,
  compass: Compass,
  door: DoorOpen,
  eye: Eye,
  feather: Feather,
  flame: Flame,
  flower: Flower2,
  footprints: Footprints,
  hand: Hand,
  heart: Heart,
  house: House,
  key: KeyRound,
  leaf: Leaf,
  message: MessageCircle,
  moon: Moon,
  mountain: Mountain,
  sprout: Sprout,
  star: Star,
  sun: Sun,
  target: Target,
  waves: Waves,
  wind: Wind,
};

// Mínimo de "barajado" antes de dar vuelta la carta, para que el revelado no
// dependa de cuánto tarde la API.
const MIN_DRAW_MS = 900;
const POSITIONS = [0, 1, 2] as const;

// "deck" es la vista sin sesión; con sesión se arranca en "input".
type Phase = "loading" | "deck" | "input" | "spread" | "drawing" | "revealed";

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

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function CardBack({ className = "", children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div
      className={`relative overflow-hidden rounded-[22px] ${className}`}
      style={{ background: "var(--ink-strong)", border: "1px solid var(--ink-strong)" }}
    >
      <div className="absolute inset-2.5 rounded-[16px]" style={{ border: "1px solid rgba(255,255,255,0.12)" }} />
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ border: "1px solid rgba(255,255,255,0.22)" }}
        >
          <Sparkles size={14} strokeWidth={1.3} className="text-white/60" />
        </div>
      </div>
      {children}
    </div>
  );
}

function CardFront({ card, moonPhase }: { card: DailyCard; moonPhase: string }) {
  const Icon = (card.symbol && SYMBOL_ICONS[card.symbol]) || Sparkles;

  return (
    <div
      className="relative overflow-hidden rounded-[22px] p-6"
      style={{ background: "var(--ink-strong)", border: "1px solid var(--ink-strong)", minHeight: 340 }}
    >
      <div className="absolute inset-2.5 rounded-[16px] pointer-events-none" style={{ border: "1px solid rgba(255,255,255,0.1)" }} />
      <div className="relative flex min-h-[292px] flex-col">
        <div className="flex items-center justify-between">
          <p className="editorial-eyebrow" style={{ color: "rgba(255,255,255,0.45)" }}>
            Tu carta de hoy
          </p>
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ border: "1px solid rgba(255,255,255,0.22)" }}
          >
            <Icon size={15} strokeWidth={1.3} className="text-white/80" />
          </div>
        </div>

        {card.name ? (
          <h3 className="mt-6 font-serif text-[30px] leading-[1.05] text-white" style={{ fontWeight: 400 }}>
            {card.name}
          </h3>
        ) : null}
        <p
          className={`${card.name ? "mt-3" : "mt-6"} font-serif text-[20px] leading-[1.35] text-white/85`}
          style={{ fontWeight: 300, fontStyle: "italic" }}
        >
          {card.intentionText}
        </p>

        {card.gesture ? (
          <div className="mt-auto pt-6">
            <div className="pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <p className="editorial-eyebrow mb-2" style={{ color: "rgba(255,255,255,0.38)" }}>
                Gesto de hoy
              </p>
              <p className="font-sans text-[14px] font-light leading-[1.55] text-white/80">{card.gesture}</p>
            </div>
          </div>
        ) : null}

        {moonPhase ? (
          <p className={`${card.gesture ? "mt-4" : "mt-auto pt-6"} font-sans text-[11px] font-light text-white/40`}>
            {moonPhase}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function OracleCard({
  dateKey,
  moonPhase,
  isLoggedIn,
  onLogin,
  onCreateRitual,
}: {
  dateKey: string;
  moonPhase: string;
  isLoggedIn: boolean;
  onLogin: () => void;
  onCreateRitual: (card: DailyCard) => void;
}) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [card, setCard] = useState<DailyCard | null>(null);
  const [chosenPosition, setChosenPosition] = useState<number | null>(null);
  const [justRevealed, setJustRevealed] = useState(false);
  const [error, setError] = useState("");
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const spreadAtRef = useRef<number | null>(null);
  const reducedMotion = typeof window !== "undefined" && prefersReducedMotion();
  const hasSpeechRecognition =
    typeof window !== "undefined" &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  useEffect(() => {
    let cancelled = false;
    setCard(null);
    setChosenPosition(null);
    setJustRevealed(false);
    setError("");

    if (!isLoggedIn) {
      setPhase("deck");
      return;
    }

    setPhase("loading");
    getDailyCard(dateKey)
      .then((existing) => {
        if (cancelled) return;
        if (existing) {
          setCard(existing);
          setPhase("revealed");
          track("oracle_card_reopened", { cardId: existing.cardId });
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
    track("oracle_voice_used");
  };

  const handleLogin = () => {
    track("oracle_login_prompted");
    onLogin();
  };

  const handleOpenDeck = () => {
    if (!inputText.trim()) return;
    recognitionRef.current?.stop();
    spreadAtRef.current = Date.now();
    setError("");
    setPhase("spread");
    track("oracle_deck_opened", { moonPhase, wordCount: inputText.trim().split(/\s+/).length });
  };

  const handleChoose = async (position: number) => {
    if (phase !== "spread") return;
    setChosenPosition(position);
    setPhase("drawing");
    const msToChoose = spreadAtRef.current ? Date.now() - spreadAtRef.current : null;

    try {
      const [result] = await Promise.all([
        drawDailyCard({ dateKey, moonPhase, inputText: inputText.trim() }),
        wait(reducedMotion ? 0 : MIN_DRAW_MS),
      ]);
      setCard(result.card);
      setJustRevealed(true);
      setPhase("revealed");
      track("oracle_card_revealed", {
        cardId: result.card.cardId,
        position: position + 1,
        msToChoose,
        created: result.created,
      });
    } catch (drawError) {
      setChosenPosition(null);
      setError(getUserFacingErrorMessage(drawError, "No pudimos sacar tu carta. Probá de nuevo."));
      // Vuelve al paso de escribir con el texto intacto, para reintentar.
      setPhase("input");
      track("oracle_draw_error", {
        message: drawError instanceof Error ? drawError.message.slice(0, 120) : "unknown",
      });
    }
  };

  const handleCreateRitual = () => {
    if (!card) return;
    track("oracle_ritual_started", { cardId: card.cardId });
    onCreateRitual(card);
  };

  return (
    <div>
      <div className="mb-5 flex items-baseline justify-between">
        <p className="editorial-eyebrow">Oráculo del día</p>
        {phase === "revealed" && card?.name ? (
          <p className="font-sans text-[11px] font-light text-[var(--ink-muted)]">Vuelve a abrirse mañana</p>
        ) : null}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {phase === "loading" ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-[340px] rounded-[22px] bg-[var(--surface-muted)] animate-pulse"
          />
        ) : null}

        {phase === "input" ? (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            <div>
              <h3 className="font-serif text-[26px] leading-[1.15] text-[var(--ink-strong)]" style={{ fontWeight: 400 }}>
                ¿Qué deseás hoy?
              </h3>
              <p className="mt-2 font-sans text-[13px] font-light leading-[1.55] text-[var(--ink-subtle)]">
                Contalo en pocas palabras. Con eso escribimos tu intención y después elegís una carta del mazo.
              </p>
            </div>

            <div
              className="relative rounded-2xl px-5 pb-14 pt-4"
              style={{
                background: "var(--surface-muted)",
                boxShadow: isListening ? "inset 0 0 0 1.5px var(--ink-strong)" : undefined,
              }}
            >
              <textarea
                value={inputText}
                onChange={(event) => setInputText(event.target.value)}
                maxLength={1000}
                placeholder="Ej.: terminar la entrega sin perder la calma"
                aria-label="Qué deseás hoy"
                className="min-h-[88px] w-full resize-none bg-transparent font-sans text-[15px] font-light leading-[1.6] text-[var(--ink-strong)] outline-none placeholder:text-[var(--ink-soft)]"
              />
              {hasSpeechRecognition ? (
                <button
                  type="button"
                  onClick={handleMic}
                  className={`absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-full px-3.5 py-2 font-sans text-[12px] font-light transition-all active:scale-[0.97] ${
                    isListening ? "bg-[var(--ink-strong)] text-white" : "bg-white text-[var(--ink-body)]"
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
              <p className="font-sans text-[12px] font-light text-[var(--ink-muted)]">{error}</p>
            ) : null}

            <button
              type="button"
              onClick={handleOpenDeck}
              disabled={!inputText.trim()}
              className="editorial-action-button editorial-action-button-primary"
            >
              {error ? "Probar de nuevo" : "Elegir mi carta"}
            </button>
          </motion.div>
        ) : null}

        {phase === "deck" ? (
          <motion.div
            key="deck"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            <div>
              <h3 className="font-serif text-[26px] leading-[1.15] text-[var(--ink-strong)]" style={{ fontWeight: 400 }}>
                Tu carta de hoy te espera
              </h3>
              <p className="mt-2 font-sans text-[13px] font-light leading-[1.55] text-[var(--ink-subtle)]">
                Contá qué deseás hoy y sacá una carta: es tu intención para el día, con un gesto simple para vivirla.
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogin}
              className="group relative mx-auto block h-[230px] w-[164px] active:scale-[0.98] transition-transform"
              aria-label="Ingresá para sacar tu carta"
            >
              {POSITIONS.map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0"
                  style={{ zIndex: 3 - i }}
                  initial={false}
                  animate={{ rotate: (i - 1) * 4, x: (i - 1) * 6, y: i * -3 }}
                  whileHover={reducedMotion ? undefined : { rotate: (i - 1) * 7, x: (i - 1) * 12 }}
                >
                  <CardBack className="h-full w-full shadow-[0_8px_24px_rgba(10,10,10,0.18)]" />
                </motion.div>
              ))}
            </button>

            <button
              type="button"
              onClick={handleLogin}
              className="editorial-action-button editorial-action-button-primary"
            >
              Ingresá para sacar tu carta
            </button>
          </motion.div>
        ) : null}

        {phase === "spread" || phase === "drawing" ? (
          <motion.div
            key="spread"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            <p className="text-center font-sans text-[13px] font-light text-[var(--ink-muted)]">
              {phase === "drawing" ? "Armando tu intención…" : "Elegí la que te llame."}
            </p>
            <div className="flex h-[250px] items-center justify-center gap-3">
              {POSITIONS.map((i) => {
                const isChosen = chosenPosition === i;
                const isOther = chosenPosition !== null && !isChosen;
                return (
                  <motion.button
                    key={i}
                    type="button"
                    disabled={phase !== "spread"}
                    onClick={() => void handleChoose(i)}
                    aria-label={`Carta ${i + 1}`}
                    className="relative h-[160px] w-[108px] shrink-0"
                    initial={reducedMotion ? false : { x: (1 - i) * 116, rotate: 0, y: 0 }}
                    animate={{
                      x: 0,
                      rotate: isChosen ? 0 : (i - 1) * 6,
                      y: isChosen ? -14 : i === 1 ? -8 : 0,
                      scale: isChosen ? 1.08 : 1,
                      opacity: isOther ? 0.25 : 1,
                    }}
                    whileTap={phase === "spread" ? { scale: 0.96 } : undefined}
                    transition={{ type: "spring", stiffness: 220, damping: 24, delay: chosenPosition === null ? i * 0.05 : 0 }}
                  >
                    <CardBack className="h-full w-full shadow-[0_8px_24px_rgba(10,10,10,0.18)]">
                      {isChosen && !reducedMotion ? (
                        <motion.div
                          className="absolute inset-0 rounded-[22px]"
                          style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.5)" }}
                          animate={{ opacity: [0.2, 1, 0.2] }}
                          transition={{ duration: 1.1, repeat: Infinity }}
                        />
                      ) : null}
                    </CardBack>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        ) : null}

        {phase === "revealed" && card ? (
          <motion.div
            key="revealed"
            initial={false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div style={{ perspective: 1200 }}>
              <motion.div
                initial={justRevealed && !reducedMotion ? { rotateY: 180, scale: 0.92 } : justRevealed ? { opacity: 0 } : false}
                animate={{ rotateY: 0, scale: 1, opacity: 1 }}
                transition={{ duration: reducedMotion ? 0.3 : 0.9, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformStyle: "preserve-3d" }}
                className="relative"
              >
                <div style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
                  <CardFront card={card} moonPhase={moonPhase} />
                </div>
                <div
                  className="absolute inset-0"
                  style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  <CardBack className="h-full w-full" />
                </div>
              </motion.div>
            </div>

            <motion.p
              initial={justRevealed ? { opacity: 0, y: 6 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: justRevealed && !reducedMotion ? 0.6 : 0 }}
              className="px-1 pt-1 text-center font-serif text-[17px] leading-[1.45] text-[var(--ink-body)]"
              style={{ fontWeight: 400, fontStyle: "italic" }}
            >
              Llevate esta intención durante el resto del día.
              <br />
              Pensala y releela.
            </motion.p>

            <motion.button
              type="button"
              onClick={handleCreateRitual}
              initial={justRevealed ? { opacity: 0, y: 6 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: justRevealed && !reducedMotion ? 0.8 : 0 }}
              className="editorial-action-button editorial-action-button-secondary inline-flex items-center justify-center gap-1.5"
            >
              Hacer un ritual con esta intención
              <ArrowUpRight size={13} strokeWidth={1.5} />
            </motion.button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
