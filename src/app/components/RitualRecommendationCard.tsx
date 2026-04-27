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
    <div
      className="rounded-[24px] overflow-hidden cursor-pointer"
      style={{ background: "#fff", boxShadow: "0 2px 20px rgba(0,0,0,0.09)" }}
      onClick={onOpen}
    >
      {/* Cover image */}
      <div className="relative w-full" style={{ aspectRatio: "4/3" }}>
        <img
          src={imageUrl}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, transparent 45%)",
          }}
        />

        {/* Eyebrow pill — top left */}
        <div className="absolute top-3.5 left-3.5">
          <span
            style={{
              fontFamily: "var(--font-sans-ui)",
              fontSize: "10px",
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.9)",
              background: "rgba(0,0,0,0.28)",
              backdropFilter: "blur(8px)",
              padding: "4px 10px",
              borderRadius: "99px",
            }}
          >
            {eyebrow}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-3.5 pb-4">
        <h3
          style={{
            fontFamily: "var(--font-serif-display)",
            fontSize: "22px",
            fontWeight: 400,
            color: "var(--ink-strong)",
            lineHeight: 1.2,
            marginBottom: "6px",
          }}
        >
          {title}
        </h3>

        <p
          className="line-clamp-2"
          style={{
            fontFamily: "var(--font-sans-ui)",
            fontSize: "13px",
            fontWeight: 300,
            color: "var(--ink-soft)",
            lineHeight: 1.55,
            marginBottom: "14px",
          }}
        >
          {description}
        </p>

        {/* Meta row */}
        <p
          style={{
            fontFamily: "var(--font-sans-ui)",
            fontSize: "11px",
            fontWeight: 400,
            color: "var(--ink-muted)",
            marginBottom: "16px",
            letterSpacing: "0.02em",
          }}
        >
          {meta.join(" · ")}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={onOpen}
            className="flex-1 rounded-full py-3 transition-all active:scale-[0.97]"
            style={{
              background: "var(--ink-strong)",
              color: "#fff",
              fontFamily: "var(--font-sans-ui)",
              fontSize: "13px",
              fontWeight: 400,
            }}
          >
            Ver ritual
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="h-[46px] w-[46px] rounded-full border flex items-center justify-center transition-all active:scale-90"
            style={{
              borderColor: saved ? "var(--ink-strong)" : "var(--border-default)",
              background: saved ? "var(--ink-strong)" : "transparent",
            }}
            aria-label="Guardar ritual"
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
