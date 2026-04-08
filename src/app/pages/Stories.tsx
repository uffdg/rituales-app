import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

type Slide = {
  eyebrow: string;
  title: string;
  body: string;
};

type Group = {
  id: string;
  image: string;
  bg: [string, string, string];
  slides: Slide[];
};

const GROUPS: Group[] = [
  {
    id: "manana",
    image: "/images/story-lluvia-4.jpg",
    bg: ["#1A1208", "#261E14", "#1A1208"],
    slides: [
      {
        eyebrow: "MICRO-RITUAL · MAÑANA",
        title: "Presencia al despertar",
        body: "Antes de levantarte, tomá tres respiraciones profundas. Con cada exhale, soltá el peso de lo que viene. Este momento es tuyo.",
      },
    ],
  },
  {
    id: "mediodia",
    image: "/images/story-lluvia-3.jpg",
    bg: ["#0A1018", "#101824", "#080C14"],
    slides: [
      {
        eyebrow: "MICRO-RITUAL · MEDIODÍA",
        title: "Pausa del mediodía",
        body: "Encontrá un momento de silencio. Cerrá los ojos treinta segundos. Recordá tu intención del día y dejá que te oriente.",
      },
    ],
  },
  {
    id: "noche",
    image: "/images/story-noche.jpg",
    bg: ["#100818", "#1A1024", "#0C0814"],
    slides: [
      {
        eyebrow: "MICRO-RITUAL · NOCHE",
        title: "Cierre consciente",
        body: "Antes de dormir, nombrá una cosa que pasó hoy que valió la pena. Guardala como semilla para mañana.",
      },
    ],
  },
  {
    id: "lluvia",
    image: "/images/story-lluvia-5.jpg",
    bg: ["#0A0C10", "#10141C", "#080A10"],
    slides: [
      {
        eyebrow: "RITUAL DE LLUVIA · I",
        title: "La lluvia llama adentro",
        body: "Cuando llueve, el mundo te da permiso de ir más lento. No hay nada que resolver afuera. Hoy el ritual empieza con quedarte quieta.",
      },
      {
        eyebrow: "RITUAL DE LLUVIA · II",
        title: "Prepará tu té",
        body: "Elegí las hierbas con intención. Escuchá el agua mientras hierve. Ese sonido ya es parte del ritual — no lo apures.",
      },
      {
        eyebrow: "RITUAL DE LLUVIA · III",
        title: "Olelo detenidamente",
        body: "Antes del primer sorbo, acercá la taza. Cerrá los ojos. Tratá de identificar cada aroma por separado. Tomá tres respiraciones dentro del vapor.",
      },
      {
        eyebrow: "RITUAL DE LLUVIA · IV",
        title: "El primer sorbo",
        body: "Con intención, tomá el primer sorbo. Dejá que el calor se distribuya despacio. Este momento no le pertenece a nadie más que a vos.",
      },
    ],
  },
];

const groupVariants = {
  enter: (d: number) => ({ y: d > 0 ? "100%" : "-100%", x: "0%" }),
  center: { y: "0%", x: "0%" },
  exit: (d: number) => ({ y: d > 0 ? "-100%" : "100%", x: "0%" }),
};

const slideVariants = {
  enter: (d: number) => ({ x: d > 0 ? "100%" : "-100%", y: "0%" }),
  center: { x: "0%", y: "0%" },
  exit: (d: number) => ({ x: d > 0 ? "-100%" : "100%", y: "0%" }),
};

const transition = { type: "tween" as const, ease: [0.32, 0, 0.67, 0] as const, duration: 0.3 };

export function Stories() {
  const [groupIdx, setGroupIdx] = useState(0);
  const [slideIdx, setSlideIdx] = useState(0);
  const [groupDir, setGroupDir] = useState(1);
  const [slideDir, setSlideDir] = useState(1);

  const group = GROUPS[groupIdx];
  const isMulti = group.slides.length > 1;

  const navigateGroup = (d: number) => {
    const next = ((groupIdx + d) % GROUPS.length + GROUPS.length) % GROUPS.length;
    setGroupDir(d > 0 ? 1 : -1);
    setGroupIdx(next);
    setSlideIdx(0);
  };

  const navigateSlide = (d: number) => {
    const next = slideIdx + d;
    if (next < 0 || next >= group.slides.length) return;
    setSlideDir(d > 0 ? 1 : -1);
    setSlideIdx(next);
  };

  const handleDragEnd = (_: unknown, info: { offset: { x: number; y: number }; velocity: { x: number; y: number } }) => {
    const ax = Math.abs(info.offset.x);
    const ay = Math.abs(info.offset.y);
    const vx = Math.abs(info.velocity.x);
    const vy = Math.abs(info.velocity.y);

    if (isMulti && ax > ay && (ax > 60 || vx > 400)) {
      navigateSlide(info.offset.x < 0 ? 1 : -1);
    } else if (ay > ax && (ay > 60 || vy > 400)) {
      navigateGroup(info.offset.y < 0 ? 1 : -1);
    }
  };

  const bgStyle = {
    background: `url(${group.image}) center/cover, linear-gradient(160deg, ${group.bg[0]} 0%, ${group.bg[1]} 50%, ${group.bg[2]} 100%)`,
  };

  return (
    <div style={{ height: "calc(100dvh - 64px)", position: "relative", overflow: "hidden" }}>
      <AnimatePresence initial={false} custom={groupDir}>
        <motion.div
          key={`g${groupIdx}`}
          custom={groupDir}
          variants={groupVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={transition}
          drag
          dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
          style={{
            position: "absolute",
            inset: 0,
            cursor: "grab",
            userSelect: "none",
            ...bgStyle,
          }}
        >
          {/* Overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.3) 100%)",
            }}
          />

          {/* Dots horizontales — pasos del ritual */}
          {isMulti && (
            <div
              style={{
                position: "absolute",
                top: 18,
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                gap: 5,
                zIndex: 10,
              }}
            >
              {group.slides.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: i === slideIdx ? 20 : 4,
                    height: 3,
                    borderRadius: 2,
                    background: i === slideIdx ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)",
                    transition: "all 0.3s ease",
                  }}
                />
              ))}
            </div>
          )}

          {/* Dots verticales — grupos */}
          <div
            style={{
              position: "absolute",
              right: 16,
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
              flexDirection: "column",
              gap: 6,
              zIndex: 10,
            }}
          >
            {GROUPS.map((_, i) => (
              <div
                key={i}
                style={{
                  width: 3,
                  height: i === groupIdx ? 22 : 4,
                  borderRadius: 2,
                  background: i === groupIdx ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.3)",
                  transition: "all 0.3s ease",
                }}
              />
            ))}
          </div>

          {/* Texto — animación horizontal solo en multi-slide */}
          <AnimatePresence initial={false} custom={slideDir}>
            <motion.div
              key={`g${groupIdx}-s${slideIdx}`}
              custom={slideDir}
              variants={isMulti ? slideVariants : undefined}
              initial={isMulti ? "enter" : false}
              animate={isMulti ? "center" : undefined}
              exit={isMulti ? "exit" : undefined}
              transition={transition}
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                padding: "0 32px 48px",
                zIndex: 5,
              }}
            >
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 10,
                  letterSpacing: "0.14em",
                  color: "rgba(255,255,255,0.55)",
                  marginBottom: 14,
                  fontWeight: 500,
                }}
              >
                {group.slides[slideIdx].eyebrow}
              </p>

              <h1
                style={{
                  fontFamily: "Cormorant Garamond, serif",
                  fontSize: 36,
                  fontWeight: 400,
                  color: "rgba(255,255,255,0.95)",
                  lineHeight: 1.12,
                  marginBottom: 16,
                }}
              >
                {group.slides[slideIdx].title}
              </h1>

              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 14,
                  fontWeight: 300,
                  color: "rgba(255,255,255,0.72)",
                  lineHeight: 1.7,
                }}
              >
                {group.slides[slideIdx].body}
              </p>

              {isMulti && slideIdx < group.slides.length - 1 && (
                <p
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 10,
                    color: "rgba(255,255,255,0.3)",
                    letterSpacing: "0.08em",
                    marginTop: 20,
                  }}
                >
                  → deslizá para continuar
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
