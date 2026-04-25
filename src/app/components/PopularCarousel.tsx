import { useState, useMemo, type MouseEvent } from "react";
import { motion } from "motion/react";
import { RitualGridCard } from "./RitualGridCard";

export interface CarouselRitual {
  id: string;
  title: string;
  type: string;
  element: string;
  duration: number;
  likes: number;
  saved: boolean;
  saving: boolean;
  onOpen: () => void;
  onSave: (e: MouseEvent<HTMLButtonElement>) => void;
}

const CARD_W = 220;
const SWIPE_THRESHOLD = 40;
const CARD_H = Math.round(CARD_W * (4 / 3)) + 72;

type Slot = { x: number; scale: number; z: number; opacity: number; blur: number };

function getSlot(offset: number): Slot {
  const abs = Math.abs(offset);
  const sign = offset > 0 ? 1 : -1;
  if (offset === 0) return { x: 0,          scale: 1,    z: 10, opacity: 1, blur: 0 };
  if (abs === 1)    return { x: sign * 162,  scale: 0.72, z: 5,  opacity: 1, blur: 3 };
  return                   { x: sign * 300,  scale: 0.70, z: 1,  opacity: 0, blur: 6 };
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function interpolateSlot(floatOffset: number): Slot {
  const clamped = Math.max(-2, Math.min(2, floatOffset));
  const floor = Math.floor(clamped);
  const t = clamped - floor;
  if (t === 0) return getSlot(floor);
  const a = getSlot(floor);
  const b = getSlot(floor + 1);
  return {
    x:       lerp(a.x,       b.x,       t),
    scale:   lerp(a.scale,   b.scale,   t),
    z:       Math.round(lerp(a.z,       b.z,       t)),
    opacity: lerp(a.opacity, b.opacity, t),
    blur:    lerp(a.blur,    b.blur,    t),
  };
}

export function PopularCarousel({ rituals }: { rituals: CarouselRitual[] }) {
  const count = rituals.length;

  const items = useMemo(() => [
    ...rituals.map((r, i) => ({ ...r, _key: `a${i}` })),
    ...rituals.map((r, i) => ({ ...r, _key: `b${i}` })),
    ...rituals.map((r, i) => ({ ...r, _key: `c${i}` })),
  ], [rituals, count]);

  const [activeIdx, setActiveIdx] = useState(count);
  const [dragPx, setDragPx] = useState(0);
  const [dragging, setDragging] = useState(false);

  const go = (dir: 1 | -1) => {
    setActiveIdx((prev) => {
      const next = prev + dir;
      if (next < Math.floor(count * 0.5)) return next + count;
      if (next >= Math.ceil(count * 2.5)) return next - count;
      return next;
    });
  };

  return (
    <div className="w-full">
      <motion.div
        className="relative overflow-hidden w-full"
        style={{ height: CARD_H, touchAction: "pan-y" }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0}
        onDragStart={() => setDragging(true)}
        onDrag={(_, info) => setDragPx(info.offset.x)}
        onDragEnd={(_, info) => {
          setDragging(false);
          setDragPx(0);
          const isLeft  = info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -500;
          const isRight = info.offset.x >  SWIPE_THRESHOLD || info.velocity.x >  500;
          if (isLeft)  go(1);
          if (isRight) go(-1);
        }}
      >
        {items.map((ritual, i) => {
          const offset = i - activeIdx;
          if (Math.abs(offset) > 2) return null;

          // During drag: interpolate position based on how far we've swiped
          // dragPx > 0 = dragging right = left card coming to center
          const floatOffset = dragging ? offset + dragPx / CARD_W : offset;
          const slot = interpolateSlot(floatOffset);

          return (
            <motion.div
              key={ritual._key}
              className="absolute top-0"
              style={{
                width: CARD_W,
                left: "50%",
                marginLeft: -CARD_W / 2,
                zIndex: slot.z,
                transformOrigin: "center center",
                pointerEvents: (!dragging && offset === 0) ? "auto" : "none",
              }}
              animate={{
                x: slot.x,
                scale: slot.scale,
                opacity: slot.opacity,
                filter: `blur(${slot.blur}px)`,
              }}
              transition={
                dragging
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 300, damping: 30, mass: 0.8 }
              }
            >
              <RitualGridCard
                id={ritual.id}
                title={ritual.title}
                type={ritual.type}
                element={ritual.element}
                duration={ritual.duration}
                likes={ritual.likes}
                saved={ritual.saved}
                saving={ritual.saving}
                imageAspect="3 / 4"
                onOpen={ritual.onOpen}
                onSave={ritual.onSave}
              />
            </motion.div>
          );
        })}
      </motion.div>

      <div className="flex justify-center gap-1.5 pt-3">
        {rituals.map((_, i) => {
          const isActive = ((activeIdx % count) + count) % count === i;
          return (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: isActive ? 16 : 5,
                height: 5,
                background: isActive ? "var(--ink-strong)" : "var(--border-default)",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
