import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { track } from "../lib/analytics";
import { getUserFacingErrorMessage } from "../lib/errors";
import { drawDailyOracleCard, getDailyOracleCard, type DailyOracleCard } from "../lib/daily-service";
import { ArcanaArt, ArcanaBack, ARCANA_GOLD, ARCANA_INK } from "./arcana/ArcanaArt";

// Mínimo de "barajado" antes de dar vuelta la carta, para que el revelado no
// dependa de cuánto tarde la API.
const MIN_DRAW_MS = 900;
const POSITIONS = [0, 1, 2] as const;
const CARD_TEXT = "#f3ede2";

type Phase = "loading" | "deck" | "spread" | "drawing" | "revealed";

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="editorial-eyebrow" style={{ color: ARCANA_GOLD }}>
      {children}
    </p>
  );
}

function CardFront({
  card,
  moonPhase,
  animate,
}: {
  card: DailyOracleCard;
  moonPhase: string;
  animate: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-[28px] px-6 pb-7 pt-6" style={{ background: ARCANA_INK }}>
      <div className="flex items-baseline justify-between">
        <Eyebrow>Tu arcano de hoy</Eyebrow>
        {moonPhase ? (
          <p className="font-sans text-[11px] font-light" style={{ color: "rgba(243,237,226,0.6)" }}>
            {moonPhase}
          </p>
        ) : null}
      </div>

      <div className="mt-6 flex justify-center">
        <ArcanaArt id={card.cardId} animate={animate} width={168} />
      </div>

      <div className="mt-6 text-center">
        <p className="font-sans text-[12px] font-medium tracking-[0.3em]" style={{ color: ARCANA_GOLD }}>
          {card.number}
        </p>
        <h3 className="mt-1 font-serif text-[32px] leading-[1.1]" style={{ fontWeight: 400, color: CARD_TEXT }}>
          {card.name}
        </h3>
        <p className="mt-2 font-sans text-[12px] font-light tracking-[0.04em]" style={{ color: ARCANA_GOLD }}>
          {card.keywords.join(" · ")}
        </p>
      </div>

      <div className="mt-6 space-y-5 pt-5" style={{ borderTop: "1px solid rgba(201,166,107,0.25)" }}>
        <div>
          <Eyebrow>La mirada</Eyebrow>
          <p
            className="mt-2 font-serif text-[19px] leading-[1.4]"
            style={{ fontWeight: 400, fontStyle: "italic", color: "rgba(243,237,226,0.9)" }}
          >
            {card.mirada}
          </p>
        </div>
        <div>
          <Eyebrow>El consejo</Eyebrow>
          <p className="mt-2 font-sans text-[15px] font-light leading-[1.55]" style={{ color: CARD_TEXT }}>
            {card.consejo}
          </p>
        </div>
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
        drawDailyOracleCard({ dateKey }),
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
        persisted: result.persisted !== false,
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
            className="h-[340px] rounded-[28px] bg-[var(--surface-muted)] animate-pulse"
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
                Tu arcano de hoy te espera
              </h3>
              <p className="mt-2 font-sans text-[13px] font-light leading-[1.55] text-[var(--ink-subtle)]">
                Sacá una carta de los 22 arcanos mayores: cada uno trae una mirada sobre el día y un consejo.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenDeck}
              className="relative mx-auto block h-[225px] w-[150px] active:scale-[0.98] transition-transform"
              aria-label={isLoggedIn ? "Abrir el mazo" : "Ingresá para sacar tu carta"}
            >
              {POSITIONS.map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 drop-shadow-[0_8px_18px_rgba(10,10,10,0.22)]"
                  style={{ zIndex: 3 - i }}
                  initial={false}
                  animate={{ rotate: (i - 1) * 5, x: (i - 1) * 8, y: i * -3 }}
                  whileHover={reducedMotion ? undefined : { rotate: (i - 1) * 9, x: (i - 1) * 16 }}
                >
                  <ArcanaBack width={150} />
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
                    className="relative shrink-0 rounded-full drop-shadow-[0_8px_18px_rgba(10,10,10,0.22)]"
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
                    <ArcanaBack width={104} />
                    {isChosen && !reducedMotion ? (
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{ boxShadow: `0 0 0 1.5px ${ARCANA_GOLD}, 0 0 22px rgba(201,166,107,0.45)` }}
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{ duration: 1.1, repeat: Infinity }}
                      />
                    ) : null}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        ) : null}

        {phase === "revealed" && card ? (
          <motion.div key="revealed" initial={false} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              initial={justRevealed && !reducedMotion ? { rotateY: 90, scale: 0.94, opacity: 0.4 } : justRevealed ? { opacity: 0 } : false}
              animate={{ rotateY: 0, scale: 1, opacity: 1 }}
              transition={{ duration: reducedMotion ? 0.3 : 0.8, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformPerspective: 1200 }}
            >
              <CardFront card={card} moonPhase={moonPhase} animate={justRevealed && !reducedMotion} />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
