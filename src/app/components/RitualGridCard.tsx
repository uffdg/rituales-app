import type { MouseEvent } from "react";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";

const IMAGE_POOLS: Record<string, string[]> = {
  Agua: [
    "/images/story-water-1.webp",
    "/images/story-water-2.webp",
    "/images/story-water-3.webp",
    "/images/story-beach-1.webp",
    "/images/story-lluvia-1.webp",
    "/images/story-lluvia-2.webp",
    "/images/story-lluvia-3.webp",
    "/images/story-lluvia-4.webp",
    "/images/story-lluvia-5.webp",
  ],
  Fuego: [
    "/images/story-fire-1.webp",
    "/images/story-fire-2.webp",
    "/images/story-fire-3.webp",
    "/images/story-fire-4.webp",
    "/images/story-fire-5.webp",
  ],
  Tierra: [
    "/images/story-forest-1.webp",
    "/images/story-forest-2.webp",
    "/images/story-forest-3.webp",
    "/images/story-forest-4.webp",
    "/images/story-forest-5.webp",
    "/images/story-stones-1.webp",
    "/images/story-stones-2.webp",
    "/images/story-stones-3.webp",
    "/images/story-grass-1.webp",
    "/images/story-grass-2.webp",
    "/images/story-mountain-1.webp",
    "/images/story-mountain-2.webp",
  ],
  Aire: [
    "/images/story-air-1.webp",
    "/images/story-air-2.webp",
    "/images/story-air-3.webp",
    "/images/story-air-4.webp",
    "/images/story-air-5.webp",
    "/images/story-abstract-1.webp",
    "/images/story-abstract-2.webp",
    "/images/story-abstract-3.webp",
    "/images/story-abstract-4.webp",
    "/images/story-abstract-5.webp",
  ],
};

function hashId(id: string): number {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) & 0x7fffffff;
  return h;
}

export function getImageUrl(element: string, id: string): string {
  const pool = IMAGE_POOLS[element] ?? IMAGE_POOLS["Agua"];
  return pool[hashId(id) % pool.length];
}

interface RitualGridCardProps {
  id: string;
  title: string;
  type: string;
  element: string;
  duration: number;
  likes?: number;
  saved: boolean;
  saving?: boolean;
  showSaveButton?: boolean;
  imageAspect?: string;
  onOpen: () => void;
  onSave: (event: MouseEvent<HTMLButtonElement>) => void;
}

export function RitualGridCard({
  id,
  title,
  type,
  element,
  duration,
  likes,
  saved,
  saving = false,
  showSaveButton = true,
  imageAspect = "1 / 1",
  onOpen,
  onSave,
}: RitualGridCardProps) {
  const imageUrl = getImageUrl(element, id);

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden active:scale-[0.97] transition-transform cursor-pointer"
      style={{ background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
      onClick={onOpen}
    >
      {/* Cover image */}
      <div className="relative w-full" style={{ aspectRatio: imageAspect }}>
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />

        {/* Bottom scrim for text legibility */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.38) 0%, transparent 38%, transparent 55%, rgba(0,0,0,0.52) 100%)",
          }}
        />

        {/* Type label top-left */}
        <div className="absolute top-2.5 left-3">
          <span className="editorial-eyebrow" style={{ color: "rgba(255,255,255,0.92)" }}>
            {type}
          </span>
        </div>

        {/* Save button top-right */}
        {showSaveButton && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSave(e);
            }}
            disabled={saving}
            className="absolute top-2 right-2 h-7 w-7 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{
              background: saved ? "rgba(255,255,255,0.95)" : "rgba(0,0,0,0.32)",
              backdropFilter: "blur(8px)",
            }}
            aria-label="Guardar ritual"
          >
            {saving ? (
              <Loader2 size={13} strokeWidth={1.8} className="animate-spin" color={saved ? "var(--ink-strong)" : "rgba(255,255,255,0.9)"} />
            ) : saved ? (
              <BookmarkCheck size={13} strokeWidth={2} color="var(--ink-strong)" fill="var(--ink-strong)" />
            ) : (
              <Bookmark size={13} strokeWidth={1.8} color="rgba(255,255,255,0.9)" fill="none" />
            )}
          </button>
        )}

        {/* Likes bottom-right */}
        {typeof likes === "number" && (
          <div className="absolute bottom-2.5 right-3">
            <span
              style={{
                fontFamily: "var(--font-sans-ui)",
                fontSize: "10px",
                color: "rgba(255,255,255,0.6)",
              }}
            >
              ♥ {likes}
            </span>
          </div>
        )}
      </div>

      {/* Text area */}
      <div className="px-3 pt-2.5 pb-3 flex flex-col gap-0.5">
        <p
          className="line-clamp-2 leading-[1.3]"
          style={{
            fontFamily: "var(--font-serif-display)",
            fontSize: "13px",
            fontWeight: 400,
            color: "var(--ink-strong)",
          }}
        >
          {title}
        </p>
        <p
          style={{
            fontFamily: "var(--font-sans-ui)",
            fontSize: "10px",
            fontWeight: 300,
            color: "var(--ink-subtle)",
          }}
        >
          {element} · {duration} min
        </p>
      </div>
    </div>
  );
}
