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
// Image height for 3:4 aspect + text area below
const CARD_H = Math.round(CARD_W * (4 / 3)) + 72;

type Slot = { x: number; scale: number; z: number; opacity: number; blur: number };

function getSlot(offset: number): Slot {
  const abs = Math.abs(offset);
  const sign = offset > 0 ? 1 : -1;
  if (offset === 0) return { x: 0,          scale: 1,    z: 10, opacity: 1, blur: 0 };
  if (abs === 1)    return { x: sign * 162,  scale: 0.72, z: 5,  opacity: 1, blur: 3 };
  return                   { x: sign * 300,  scale: 0.70, z: 1,  opacity: 0, blur: 6 };
}

export function PopularCarousel({ rituals }: { rituals: CarouselRitual[] }) {
  const count = rituals.length;

  // Triple the array for seamless infinite loop
  const items = useMemo(() => [
    ...rituals.map((r, i) => ({ ...r, _key: `a${i}` })),
    ...rituals.map((r, i) => ({ ...r, _key: `b${i}` })),
    ...rituals.map((r, i) => ({ ...r, _key: `c${i}` })),
  ], [rituals, count]);

  const [activeIdx, setActiveIdx] = useState(count); // start at middle section

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
      {/* Drag is on the container itself — no overlay blocking the center card */}
      <motion.div
        className="relative overflow-hidden w-full"
        style={{ height: CARD_H, touchAction: "pan-y" }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0}
        onDragEnd={(_, info) => {
          const isSwipeLeft  = info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -500;
          const isSwipeRight = info.offset.x >  SWIPE_THRESHOLD || info.velocity.x >  500;
          if (isSwipeLeft)  go(1);
          if (isSwipeRight) go(-1);
        }}
      >
        {items.map((ritual, i) => {
          const offset = i - activeIdx;
          if (Math.abs(offset) > 2) return null;
          const slot = getSlot(offset);
          const isCenter = offset === 0;

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
                pointerEvents: isCenter ? "auto" : "none",
              }}
              animate={{ x: slot.x, scale: slot.scale, opacity: slot.opacity, filter: `blur(${slot.blur}px)` }}
              transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
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

      {/* Dot indicators — outside the clipping div so they never overlap */}
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
