import type { MouseEvent } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { getImageUrl } from "./RitualGridCard";

interface RitualRecommendationCardProps {
  id: string;
  element: string;
  eyebrow: string;
  title: string;
  description: string;
  meta: string[];
  saved: boolean;
  saving: boolean;
  onOpen: () => void;
  onSave: (event: MouseEvent<HTMLButtonElement>) => void;
}

export function RitualRecommendationCard({
  id,
  element,
  eyebrow,
  title,
  description,
  meta,
  saved,
  saving,
  onOpen,
  onSave,
}: RitualRecommendationCardProps) {
  const imageUrl = getImageUrl(element, id);

  return (
    <div className="editorial-card editorial-card--raised overflow-hidden cursor-pointer" onClick={onOpen}>
      {/* Cover image */}
      <div className="relative w-full" style={{ aspectRatio: "4/3" }}>
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 45%)",
          }}
        />

        {/* Eyebrow pill — top left */}
        <div className="absolute top-3.5 left-3.5">
          <span
            className="editorial-eyebrow inline-flex rounded-full px-2.5 py-1"
            style={{ color: "rgba(255,255,255,0.92)", background: "rgba(0,0,0,0.32)", backdropFilter: "blur(8px)" }}
          >
            {eyebrow}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-3.5 pb-4">
        <h3 className="mb-1.5 font-serif text-title-3 text-ink-strong">
          {title}
        </h3>

        <p className="mb-3.5 line-clamp-2 font-sans text-body text-ink-muted">
          {description}
        </p>

        {/* Meta row */}
        <p className="mb-4 font-sans text-caption text-ink-muted">
          {meta.join(" · ")}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={onOpen}
            className="editorial-button editorial-button--primary flex-1"
          >
            Ver ritual
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="editorial-icon-button border transition-all active:scale-90"
            style={{
              borderColor: saved ? "var(--ink-strong)" : "var(--line-default)",
              background: saved ? "var(--ink-strong)" : "transparent",
            }}
            aria-pressed={saved}
            aria-label={saved ? "Quitar de guardados" : "Guardar ritual"}
          >
            {saved ? (
              <BookmarkCheck size={16} strokeWidth={1.8} color="#fff" />
            ) : (
              <Bookmark size={16} strokeWidth={1.8} color="var(--ink-muted)" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
