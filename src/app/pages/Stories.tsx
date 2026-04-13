import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, useMotionValue, animate, AnimatePresence } from "motion/react";
import { useRitual } from "../context/RitualContext";
import { getTodayCosmicContext } from "../lib/cosmic-calendar";
import { track } from "../lib/analytics";
import { CURATED_RITUALS, type CuratedRitual } from "../data/curated-rituals";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type StoryCard = {
  id: string;
  image: string;
  bg: [string, string, string];
  eyebrow: string;
  title: string;
  body: string;
  cta?: { label: string; path: string };
  curatedRitual?: CuratedRitual;
  isMoodPicker?: boolean;
};

const FIRST_VISIT_KEY = "rituales_stories_first_visit_v1";

function getDaysSinceFirstVisit(): number {
  try {
    const stored = localStorage.getItem(FIRST_VISIT_KEY);
    if (stored) {
      return Math.floor((Date.now() - parseInt(stored)) / (1000 * 60 * 60 * 24));
    }
    localStorage.setItem(FIRST_VISIT_KEY, String(Date.now()));
    return 0;
  } catch {
    return 0;
  }
}

function getDailyEditorial(all: StoryCard[]): StoryCard[] {
  const days = getDaysSinceFirstVisit();
  // Empieza con 3 cards, suma 2 por día hasta mostrar todas
  const count = Math.min(3 + days * 2, all.length);
  const unlocked = all.slice(0, count);
  // Rotamos el orden según el día para que cada día haya algo diferente arriba
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24),
  );
  const offset = dayOfYear % unlocked.length;
  return [...unlocked.slice(offset), ...unlocked.slice(0, offset)];
}

// ─── Estado emocional ─────────────────────────────────────────────────────────

interface MoodOption {
  id: string;
  label: string;
  emoji: string;
  ritualType: string;
}

const MOOD_OPTIONS: MoodOption[] = [
  { id: "ansiosa",   label: "Ansiosa",   emoji: "◎", ritualType: "calma" },
  { id: "dispersa",  label: "Dispersa",  emoji: "◌", ritualType: "enfoque" },
  { id: "triste",    label: "Triste",    emoji: "◑", ritualType: "amor-propio" },
  { id: "bloqueada", label: "Bloqueada", emoji: "◐", ritualType: "cerrar-ciclo" },
  { id: "cargada",   label: "Con carga", emoji: "●", ritualType: "cerrar-ciclo" },
  { id: "bien",      label: "Bien",      emoji: "○", ritualType: "atraer" },
];

// ─── Contenido editorial fijo ─────────────────────────────────────────────────

const EDITORIAL_CARDS: StoryCard[] = [
  // Fuego
  {
    id: "fuego-1",
    image: "/images/story-fire-1.jpg",
    bg: ["#1A0A04", "#2A1208", "#180A04"],
    eyebrow: "RITUAL DE FUEGO",
    title: "Lo que ya no alimenta, se quema",
    body: "El fuego no destruye — transforma. Nombrá en voz alta una sola cosa que ya no querés seguir cargando. Después soltala.",
    cta: { label: "Crear ritual de transformación", path: "/onboarding" },
  },
  {
    id: "fuego-2",
    image: "/images/story-fire-3.jpg",
    bg: ["#1C0C04", "#2C1A0A", "#140804"],
    eyebrow: "MICRO-RITUAL · FUEGO",
    title: "La llama de la intención",
    body: "Encendé una vela. Mirá la llama treinta segundos sin distraerte. En ese tiempo, sostené una sola intención en tu mente. Eso es suficiente.",
  },
  {
    id: "fuego-3",
    image: "/images/story-fire-5.jpg",
    bg: ["#180C02", "#241408", "#160A02"],
    eyebrow: "FUEGO · ENERGÍA",
    title: "Cuando todo urge",
    body: "La urgencia es energía sin dirección. Antes de actuar, hacé una pausa de tres respiraciones. El fuego que se controla es el más poderoso.",
    cta: { label: "Ritual para el enfoque", path: "/onboarding" },
  },
  // Agua
  {
    id: "agua-1",
    image: "/images/story-water-1.jpg",
    bg: ["#060E18", "#0A1420", "#060C16"],
    eyebrow: "RITUAL DE AGUA",
    title: "El agua recuerda",
    body: "Llenate un vaso. Antes de beberlo, sostené el vaso con las dos manos y nombrá lo que necesitás. El agua lleva tu intención.",
    cta: { label: "Crear ritual de intuición", path: "/onboarding" },
  },
  {
    id: "agua-2",
    image: "/images/story-water-2.jpg",
    bg: ["#040C16", "#081018", "#040A14"],
    eyebrow: "MICRO-RITUAL · AGUA",
    title: "Lavarse las manos con intención",
    body: "La próxima vez que te lavés las manos, imaginá que junto con el agua se va todo lo que ya no necesitás de este día.",
  },
  {
    id: "agua-3",
    image: "/images/story-water-3.jpg",
    bg: ["#06101A", "#0A1620", "#060E18"],
    eyebrow: "AGUA · EMOCIÓN",
    title: "Las emociones fluyen",
    body: "No hay emoción que sea permanente. Como el agua, todas se mueven. Permitite sentir sin intentar detener o apresurar el flujo.",
    cta: { label: "Ritual para soltar", path: "/onboarding" },
  },
  // Aire
  {
    id: "aire-1",
    image: "/images/story-air-1.jpg",
    bg: ["#0C1018", "#141820", "#0A0E16"],
    eyebrow: "RITUAL DE AIRE",
    title: "La respiración es el ancla",
    body: "Cuatro tiempos para inhalar, cuatro para sostener, cuatro para soltar. Tres veces. Eso es todo. El aire siempre estuvo ahí.",
    cta: { label: "Ritual para la calma", path: "/onboarding" },
  },
  {
    id: "aire-2",
    image: "/images/story-air-3.jpg",
    bg: ["#0E1220", "#141A28", "#0C1018"],
    eyebrow: "MICRO-RITUAL · AIRE",
    title: "Un minuto afuera",
    body: "Salí. No con el teléfono. Solo un minuto. Mirá el cielo. Sentí el aire en la piel. Tu sistema nervioso lo necesita más de lo que creés.",
  },
  {
    id: "aire-3",
    image: "/images/story-air-5.jpg",
    bg: ["#0A0E1C", "#10162A", "#08101A"],
    eyebrow: "AIRE · CLARIDAD",
    title: "Cuando la mente no para",
    body: "El aire dispersa. Cuando los pensamientos se acumulan, respirar profundo no es un cliché — es fisiología. Dos exhalaciones largas cambian tu estado.",
    cta: { label: "Ritual para claridad mental", path: "/onboarding" },
  },
  // Tierra
  {
    id: "tierra-1",
    image: "/images/story-forest-2.jpg",
    bg: ["#060E08", "#0A1410", "#06100A"],
    eyebrow: "RITUAL DE TIERRA",
    title: "Los pies en el piso",
    body: "Descalzate. Pisá el suelo con atención. Sentí el peso de tu cuerpo distribuido. La tierra siempre está ahí para sostenerte.",
    cta: { label: "Ritual de enraizamiento", path: "/onboarding" },
  },
  {
    id: "tierra-2",
    image: "/images/story-grass-3.jpg",
    bg: ["#080E06", "#0C1408", "#060C04"],
    eyebrow: "MICRO-RITUAL · TIERRA",
    title: "Tocar algo real",
    body: "Buscá algo natural cerca tuyo — una planta, una piedra, la tierra. Sostenerlo treinta segundos baja el cortisol. Es biología, no magia.",
  },
  {
    id: "tierra-3",
    image: "/images/story-mountain-2.jpg",
    bg: ["#0C1018", "#141820", "#0A0E14"],
    eyebrow: "TIERRA · CUERPO",
    title: "El cuerpo sabe antes que la mente",
    body: "Antes de tomar una decisión, cerrá los ojos y checkeá el cuerpo. ¿Tensión? ¿Expansión? El cuerpo siempre llegó primero.",
    cta: { label: "Ritual de conexión corporal", path: "/onboarding" },
  },
  // Lluvia / introspección
  {
    id: "lluvia-1",
    image: "/images/story-lluvia-5.jpg",
    bg: ["#0A0C10", "#10141C", "#080A10"],
    eyebrow: "RITUAL DE LLUVIA",
    title: "La lluvia llama adentro",
    body: "Cuando llueve, el mundo te da permiso de ir más lento. No hay nada que resolver afuera. Hoy el ritual empieza con quedarte quieta.",
    cta: { label: "Crear ritual de pausa", path: "/onboarding" },
  },
  {
    id: "lluvia-2",
    image: "/images/story-lluvia-3.jpg",
    bg: ["#080C14", "#0C1018", "#060A10"],
    eyebrow: "LLUVIA · QUIETUD",
    title: "El sonido del agua que cae",
    body: "Cerrá los ojos. Escuchá la lluvia sin hacer nada más. Sin pensar en lo que tenés que hacer. Solo el sonido. Dos minutos.",
  },
  // Noche / cierre
  {
    id: "noche-1",
    image: "/images/story-noche.jpg",
    bg: ["#080614", "#0C0A1C", "#06041A"],
    eyebrow: "RITUAL DE NOCHE",
    title: "Cierre consciente",
    body: "Antes de dormir, nombrá una cosa que pasó hoy que valió la pena. Guardala como semilla para mañana.",
    cta: { label: "Crear ritual de cierre", path: "/onboarding" },
  },
  {
    id: "noche-2",
    image: "/images/story-abastract-2.jpg",
    bg: ["#06080E", "#0A0C16", "#040610"],
    eyebrow: "NOCHE · DESCANSO",
    title: "Lo que no terminaste puede esperar",
    body: "Tu mente procesa mientras dormís. Las soluciones que no encontraste hoy aparecen mañana. Darte permiso de descansar es parte del trabajo.",
  },
  // Abstracto / identidad
  {
    id: "abstracto-1",
    image: "/images/story-abastract-4.jpg",
    bg: ["#0C0A10", "#14101C", "#080814"],
    eyebrow: "PRÁCTICA ESPIRITUAL",
    title: "Un ritual no necesita ser perfecto",
    body: "Tres respiraciones con intención son un ritual. Lavarte la cara con atención es un ritual. No hace falta más que presencia.",
    cta: { label: "Crear mi ritual", path: "/onboarding" },
  },
  {
    id: "playa-1",
    image: "/images/story-beach-1.jpg",
    bg: ["#0A0C10", "#0E1018", "#080A0E"],
    eyebrow: "AGUA · EXPANSIÓN",
    title: "El horizonte como práctica",
    body: "Mirar lejos relaja los músculos del ojo y baja la activación del sistema nervioso. Buscá el punto más lejano que puedas ver hoy.",
    cta: { label: "Ritual para expandir", path: "/onboarding" },
  },
];

// ─── Cards generadas desde rituales curatoriales ─────────────────────────────

const CURATED_BG: Record<string, [string, string, string]> = {
  claridad:       ["#060E18", "#0A1420", "#060C16"],
  "amor-propio":  ["#0A0614", "#10081C", "#080416"],
  calma:          ["#060E08", "#0A1410", "#06100A"],
  enfoque:        ["#1A0A04", "#2A1208", "#180A04"],
  "cerrar-ciclo": ["#1C0C04", "#2C1A0A", "#140804"],
  atraer:         ["#0C1018", "#141820", "#0A0E14"],
};

const CURATED_CARDS: StoryCard[] = CURATED_RITUALS.map((r) => ({
  id: r.id,
  image: r.storyImage,
  bg: CURATED_BG[r.ritualType] ?? ["#0A0A0A", "#141414", "#080808"],
  eyebrow: r.storyEyebrow,
  title: r.storyTitle,
  body: r.storyBody,
  cta: { label: r.storyCta, path: "#" },
  curatedRitual: r,
}));

// Pool completo = curatoriales + editoriales
const ALL_EDITORIAL: StoryCard[] = [...CURATED_CARDS, ...EDITORIAL_CARDS];

// ─── Componente ───────────────────────────────────────────────────────────────

const GESTURE_HINT_KEY = "rituales_stories_gesture_hint_seen_v1";

export function Stories() {
  const navigate = useNavigate();
  const { updateRitual, resetRitual, setSelectedPublicRitual, setViewMode } = useRitual();

  const containerRef = useRef<HTMLDivElement>(null);
  const yMV = useMotionValue(0);

  const [idx, setIdx] = useState(() => {
    try {
      const saved = sessionStorage.getItem("rituales_stories_idx");
      return saved ? parseInt(saved, 10) : 0;
    } catch { return 0; }
  });
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);

  const [pageH, setPageH] = useState(() =>
    typeof window !== "undefined" ? window.innerHeight - 64 : 600,
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setPageH(entry.contentRect.height));
    ro.observe(el);
    setPageH(el.clientHeight);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    track("stories_session_start", { totalCards: ALL_CARDS.length });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try { sessionStorage.setItem("rituales_stories_idx", String(idx)); } catch {}
    if (ALL_CARDS[idx]) {
      track("stories_card_viewed", { cardId: ALL_CARDS[idx].id, position: idx });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  useEffect(() => {
    try {
      if (localStorage.getItem(GESTURE_HINT_KEY) !== "true") setShowHint(true);
    } catch { setShowHint(true); }
  }, []);

  useEffect(() => {
    if (!showHint) return;
    const t = window.setTimeout(() => {
      setShowHint(false);
      try { localStorage.setItem(GESTURE_HINT_KEY, "true"); } catch {}
    }, 3000);
    return () => window.clearTimeout(t);
  }, [showHint]);

  useEffect(() => {
    // Clampear idx por si el pool de cards cambió desde la última visita
    const safeIdx = idx < ALL_CARDS.length ? idx : 0;
    if (safeIdx !== idx) setIdx(safeIdx);
    if (pageH > 0) yMV.set(-safeIdx * pageH);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageH]);

  const cosmicCtx = useMemo(() => getTodayCosmicContext(), []);

  // Card 0: lunar dinámica
  const lunarCard: StoryCard = useMemo(() => {
    const { day, lunarPhrase, lunarSubphrase, nextEvent } = cosmicCtx;
    let body = lunarSubphrase;
    if (nextEvent && nextEvent.daysAway <= 5) {
      const when = nextEvent.daysAway === 0
        ? `Hoy a las ${nextEvent.perfection.timeBuenosAires}`
        : nextEvent.daysAway === 1 ? "Mañana"
        : `En ${nextEvent.daysAway} días`;
      body += ` ${when}: ${nextEvent.perfection.label} en ${nextEvent.perfection.zodiacSign}.`;
    }
    return {
      id: "lunar-hoy",
      image: "/images/story-abastract-1.jpg",
      bg: ["#0C0E14", "#101420", "#080C18"],
      eyebrow: `${day.moonPhase.toUpperCase()} · HOY`,
      title: lunarPhrase,
      body,
      cta: { label: "Crear ritual para este momento", path: "/crear/1" },
    };
  }, [cosmicCtx]);

  // Card 1: entrada emocional
  const moodCard: StoryCard = useMemo(() => ({
    id: "mood-picker",
    image: "/images/story-abastract-3.jpg",
    bg: ["#080A10", "#0C1018", "#060810"],
    eyebrow: "AHORA MISMO",
    title: "¿Cómo llegás hoy?",
    body: "",
    isMoodPicker: true,
  }), []);

  const dailyEditorial = useMemo(() => getDailyEditorial(ALL_EDITORIAL), []);

  const ALL_CARDS: StoryCard[] = useMemo(
    () => [lunarCard, moodCard, ...dailyEditorial],
    [lunarCard, moodCard, dailyEditorial],
  );

  const total = ALL_CARDS.length;
  const idxRef = useRef(idx);
  useEffect(() => { idxRef.current = idx; }, [idx]);

  // ── Snap ──────────────────────────────────────────────────────────────────────

  const snapTo = (nextIdx: number) => {
    // Scroll infinito: wrappear
    const wrapped = ((nextIdx % total) + total) % total;
    // Animamos hacia la posición relativa más cercana para que parezca continuo
    const currentY = yMV.get();
    const targetY = -wrapped * pageH;
    // Si viene de idx total-1 → 0: saltar a -total*pageH y animar a 0
    // Si viene de idx 0 → total-1: saltar a pageH y animar a -(total-1)*pageH
    let animTarget = targetY;
    const dist = Math.abs(targetY - currentY);
    const shortcutDown = -wrapped * pageH + total * pageH; // wrappear hacia abajo
    const shortcutUp   = -wrapped * pageH - total * pageH; // wrappear hacia arriba
    if (Math.abs(shortcutDown - currentY) < dist) animTarget = shortcutDown;
    if (Math.abs(shortcutUp   - currentY) < dist) animTarget = shortcutUp;

    animate(yMV, animTarget, {
      type: "spring", stiffness: 380, damping: 36,
      onComplete: () => {
        // Re-snap silencioso a la posición canónica sin animación
        yMV.set(-wrapped * pageH);
      },
    });
    setIdx(wrapped);
    if (wrapped !== idxRef.current) setSelectedMood(null);
  };

  // ── Gestos ────────────────────────────────────────────────────────────────────

  const gesture = useRef<{ startY: number; active: boolean }>({ startY: 0, active: false });

  const isInteractive = (t: EventTarget | null) =>
    t instanceof HTMLElement && Boolean(t.closest('button, a, input, textarea, [role="button"]'));

  const onPointerDown = (e: React.PointerEvent) => {
    if (isInteractive(e.target)) return;
    if (showHint) { setShowHint(false); try { localStorage.setItem(GESTURE_HINT_KEY, "true"); } catch {} }
    gesture.current = { startY: e.clientY, active: true };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!gesture.current.active) return;
    const dy = e.clientY - gesture.current.startY;
    const base = -idxRef.current * pageH;
    yMV.set(base + dy * 0.6);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!gesture.current.active) return;
    gesture.current.active = false;
    const dy = e.clientY - gesture.current.startY;
    if (dy < -40) snapTo(idxRef.current + 1);
    else if (dy > 40) snapTo(idxRef.current - 1);
    else snapTo(idxRef.current);
  };

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const handleCardCta = (card: StoryCard) => {
    track("stories_cta_tapped", { id: card.id, ritualType: card.curatedRitual?.ritualType });
    if (card.curatedRitual) {
      const r = card.curatedRitual;
      resetRitual();
      setViewMode(false);
      setSelectedPublicRitual(null);
      updateRitual({
        ritualType: r.ritualType,
        element: r.element,
        energy: r.energy,
        intensity: r.intensity,
        duration: r.duration,
        intention: r.intention,
        anchor: r.anchor,
        aiRitual: r.aiRitual,
      });
      navigate("/ritual/nuevo");
    } else if (card.cta) {
      navigate(card.cta.path);
    }
  };

  const handleMoodContinue = () => {
    if (!selectedMood) return;
    const mood = MOOD_OPTIONS.find((m) => m.id === selectedMood);
    if (!mood) return;
    resetRitual();
    updateRitual({ ritualType: mood.ritualType, moodBefore: mood.id });
    track("stories_mood_start_ritual", { mood: mood.id });
    navigate("/crear/1");
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div
      ref={containerRef}
      style={{ height: "calc(100dvh - 64px)", overflow: "hidden", position: "relative", touchAction: "none", userSelect: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Strip vertical */}
      <motion.div style={{ y: yMV, position: "absolute", top: 0, left: 0, right: 0 }}>
        {ALL_CARDS.map((card, i) => (
          <div
            key={card.id}
            style={{
              position: "absolute",
              top: i * pageH,
              left: 0,
              right: 0,
              height: pageH,
              overflow: "hidden",
              background: `url(${card.image}) center/cover no-repeat, linear-gradient(160deg, ${card.bg[0]} 0%, ${card.bg[1]} 50%, ${card.bg[2]} 100%)`,
            }}
          >
            {/* Overlay */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.12) 55%, rgba(0,0,0,0.28) 100%)" }} />

            {/* Contenido */}
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 28px 44px", zIndex: 5 }}>

              {card.isMoodPicker ? (
                /* ── Mood picker ── */
                <div>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: 10, letterSpacing: "0.14em", color: "rgba(255,255,255,0.55)", marginBottom: 12, fontWeight: 500, textTransform: "uppercase" }}>
                    {card.eyebrow}
                  </p>
                  <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 32, fontWeight: 400, color: "rgba(255,255,255,0.95)", lineHeight: 1.15, marginBottom: 24 }}>
                    {card.title}
                  </h1>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 20 }}>
                    {MOOD_OPTIONS.map((mood) => (
                      <button
                        key={mood.id}
                        onClick={() => setSelectedMood(mood.id)}
                        style={{
                          padding: "12px 6px",
                          borderRadius: 14,
                          border: selectedMood === mood.id ? "1px solid rgba(255,255,255,0.7)" : "1px solid rgba(255,255,255,0.15)",
                          background: selectedMood === mood.id ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)",
                          display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                          cursor: "pointer", transition: "all 0.18s ease",
                        }}
                      >
                        <span style={{ fontSize: 20, color: "rgba(255,255,255,0.85)", fontFamily: "monospace" }}>{mood.emoji}</span>
                        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: selectedMood === mood.id ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.5)", letterSpacing: "0.04em" }}>
                          {mood.label}
                        </span>
                      </button>
                    ))}
                  </div>
                  <AnimatePresence>
                    {selectedMood && (
                      <motion.button
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        onClick={handleMoodContinue}
                        style={{ width: "100%", padding: "15px 0", borderRadius: 16, background: "rgba(255,255,255,0.95)", border: "none", fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 500, color: "#0A0A0A", cursor: "pointer", letterSpacing: "0.03em" }}
                      >
                        Crear ritual para este momento →
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                /* ── Card editorial ── */
                <div>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: 10, letterSpacing: "0.14em", color: "rgba(255,255,255,0.5)", marginBottom: 12, fontWeight: 500, textTransform: "uppercase" }}>
                    {card.eyebrow}
                  </p>
                  <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 36, fontWeight: 400, color: "rgba(255,255,255,0.95)", lineHeight: 1.12, marginBottom: 16 }}>
                    {card.title}
                  </h1>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 300, color: "rgba(255,255,255,0.72)", lineHeight: 1.72 }}>
                    {card.body}
                  </p>
                  {card.cta && (
                    <button
                      onClick={() => handleCardCta(card)}
                      style={{ marginTop: 22, padding: "13px 22px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.28)", background: "rgba(255,255,255,0.08)", fontFamily: "Inter, sans-serif", fontSize: 13, color: "rgba(255,255,255,0.9)", cursor: "pointer", letterSpacing: "0.03em", backdropFilter: "blur(4px)" }}
                    >
                      {card.cta.label} →
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </motion.div>

      {/* Dots verticales */}
      <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: 5, zIndex: 20, pointerEvents: "none" }}>
        {ALL_CARDS.map((_, i) => (
          <div key={i} style={{ width: 3, height: i === idx ? 20 : 4, borderRadius: 2, background: i === idx ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.25)", transition: "all 0.3s ease" }} />
        ))}
      </div>

      {/* Hint de gesto */}
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", zIndex: 30, pointerEvents: "none" }}
          >
            <motion.div
              animate={{ y: [16, -16, 16] }}
              transition={{ duration: 1.3, repeat: 2, ease: "easeInOut" }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
            >
              <div style={{ width: 3, height: 40, borderRadius: 999, background: "rgba(255,255,255,0.85)" }} />
              <div style={{ width: 20, height: 20, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 8, color: "rgba(255,255,255,0.7)" }}>↑↓</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
