import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
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
import { drawDailyOracleCard, getDailyOracleCard, type DailyOracleCard } from "../lib/daily-service";

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

type Phase = "loading" | "deck" | "spread" | "drawing" | "revealed";

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

// Dorso de las cartas: órbitas que giran en sentidos opuestos y un punto que
// respira (mismo lenguaje que las elipses de "Día completado").
function OrbitMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke="rgba(255,255,255,0.6)" aria-hidden="true">
      <ellipse className="oracle-spin" cx="50" cy="50" rx="42" ry="28" strokeWidth="0.9" />
      <ellipse className="oracle-spin-rev" cx="50" cy="50" rx="28" ry="42" strokeWidth="0.9" />
      <circle className="oracle-spin oracle-spin-slow" cx="50" cy="50" r="46" strokeWidth="0.7" strokeDasharray="2 5" />
      <circle className="oracle-pulse" cx="50" cy="50" r="3" fill="rgba(255,255,255,0.85)" stroke="none" />
    </svg>
  );
}

function CardBack({
  className = "",
  orbitSize = 76,
  children,
}: {
  className?: string;
  orbitSize?: number;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[22px] ${className}`}
      style={{ background: "var(--ink-strong)", border: "1px solid var(--ink-strong)" }}
    >
      <div className="absolute inset-2.5 rounded-[16px]" style={{ border: "1px solid rgba(255,255,255,0.12)" }} />
      <div className="absolute inset-0 flex items-center justify-center">
        <OrbitMark size={orbitSize} />
      </div>
      {children}
    </div>
  );
}

// Ilustración del frente: el símbolo de la carta dibujándose en grande, con una
// luna que flota y la línea del horizonte.
function CardIllustration({ Icon }: { Icon: React.ElementType }) {
  return (
    <div className="relative mt-5 h-[96px]" aria-hidden="true">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 300 96"
        preserveAspectRatio="none"
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1"
      >
        <path d="M0 94 H300" vectorEffect="non-scaling-stroke" />
      </svg>
      <svg
        className="oracle-float absolute right-1 top-1"
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        stroke="rgba(255,255,255,0.8)"
        strokeWidth="1.1"
        strokeLinejoin="round"
      >
        <path d="M14 6 a16 16 0 1 0 18 22 a12 12 0 1 1 -18 -22 z" />
      </svg>
      <svg
        className="oracle-pulse absolute left-[44%] top-3"
        width="10"
        height="10"
        viewBox="0 0 10 10"
        fill="none"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth="1"
        strokeLinecap="round"
      >
        <path d="M5 1 v8 M1 5 h8" />
      </svg>
      <Icon
        size={76}
        strokeWidth={1.1}
        absoluteStrokeWidth
        className="oracle-draw-icon absolute bottom-2 left-0 text-white/85"
      />
    </div>
  );
}

function CardFront({ card, moonPhase }: { card: DailyOracleCard; moonPhase: string }) {
  const Icon = SYMBOL_ICONS[card.symbol] || Sparkles;

  return (
    <div
      className="relative overflow-hidden rounded-[22px] p-6"
      style={{ background: "var(--ink-strong)", border: "1px solid var(--ink-strong)", minHeight: 340 }}
    >
      <div className="absolute inset-2.5 rounded-[16px] pointer-events-none" style={{ border: "1px solid rgba(255,255,255,0.1)" }} />
      <div className="relative flex min-h-[292px] flex-col">
        <p className="editorial-eyebrow" style={{ color: "rgba(255,255,255,0.6)" }}>
          Tu carta de hoy
        </p>

        <CardIllustration Icon={Icon} />

        <h3 className="mt-4 font-serif text-[30px] leading-[1.05] text-white" style={{ fontWeight: 400 }}>
          {card.name}
        </h3>
        <p className="mt-3 font-serif text-[20px] leading-[1.35] text-white/85" style={{ fontWeight: 300, fontStyle: "italic" }}>
          {card.message}
        </p>

        <div className="mt-auto pt-6">
          <div className="pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <p className="editorial-eyebrow mb-2" style={{ color: "rgba(255,255,255,0.6)" }}>
              Gesto de hoy
            </p>
            <p className="font-sans text-[14px] font-light leading-[1.55] text-white/80">{card.gesture}</p>
          </div>
        </div>

        {moonPhase ? (
          <p className="mt-4 font-sans text-[11px] font-light text-white/55">{moonPhase}</p>
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
}: {
  dateKey: string;
  moonPhase: string;
  isLoggedIn: boolean;
  onLogin: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [card, setCard] = useState<DailyOracleCard | null>(null);
  const [chosenPosition, setChosenPosition] = useState<number | null>(null);
  const [justRevealed, setJustRevealed] = useState(false);
  const [error, setError] = useState("");
  const spreadAtRef = useRef<number | null>(null);
  const reducedMotion = typeof window !== "undefined" && prefersReducedMotion();

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
    getDailyOracleCard(dateKey)
      .then((existing) => {
        if (cancelled) return;
        if (existing) {
          setCard(existing);
          setPhase("revealed");
          track("oracle_card_reopened", { cardId: existing.cardId });
        } else {
          setPhase("deck");
        }
      })
      .catch(() => {
        if (!cancelled) setPhase("deck");
      });

    return () => {
      cancelled = true;
    };
  }, [dateKey, isLoggedIn]);

  const handleOpenDeck = () => {
    if (!isLoggedIn) {
      track("oracle_login_prompted");
      onLogin();
      return;
    }
    spreadAtRef.current = Date.now();
    setError("");
    setPhase("spread");
    track("oracle_deck_opened", { moonPhase });
  };

  const handleChoose = async (position: number) => {
    if (phase !== "spread") return;
    setChosenPosition(position);
    setPhase("drawing");
    const msToChoose = spreadAtRef.current ? Date.now() - spreadAtRef.current : null;

    try {
      const [result] = await Promise.all([
        drawDailyOracleCard({ dateKey, moonPhase }),
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
      setPhase("deck");
      track("oracle_draw_error", {
        message: drawError instanceof Error ? drawError.message.slice(0, 120) : "unknown",
      });
    }
  };

  return (
    <div>
      <div className="mb-5 flex items-baseline justify-between">
        <p className="editorial-eyebrow">Oráculo del día</p>
        {phase === "revealed" ? (
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
                Sacá una carta del mazo: trae un mensaje para el día y un gesto simple para vivirlo.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenDeck}
              className="group relative mx-auto block h-[230px] w-[164px] active:scale-[0.98] transition-transform"
              aria-label={isLoggedIn ? "Abrir el mazo" : "Ingresá para sacar tu carta"}
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
                  <CardBack orbitSize={116} className="h-full w-full shadow-[0_8px_24px_rgba(10,10,10,0.18)]" />
                </motion.div>
              ))}
            </button>

            {error ? (
              <p className="text-center font-sans text-[12px] font-light text-[var(--ink-muted)]">{error}</p>
            ) : null}

            <button
              type="button"
              onClick={handleOpenDeck}
              className="editorial-action-button editorial-action-button-primary"
            >
              {!isLoggedIn ? "Ingresá para sacar tu carta" : error ? "Probar de nuevo" : "Sacar una carta"}
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
              {phase === "drawing" ? "Dando vuelta tu carta…" : "Elegí la que te llame."}
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
          <motion.div key="revealed" initial={false} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
