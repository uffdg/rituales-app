import type { MouseEvent } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";

interface RitualRecommendationCardProps {
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
  eyebrow,
  title,
  description,
  meta,
  saved,
  saving,
  onOpen,
  onSave,
}: RitualRecommendationCardProps) {
  return (
    <div
      className="rounded-[26px] border border-[rgba(0,0,0,0.04)] bg-white px-4 py-4 text-[#0A0A0A]"
      style={{ boxShadow: "0 18px 40px rgba(15, 15, 15, 0.06)" }}
    >
      <p
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: "9px",
          fontWeight: 500,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "#AAA59E",
          marginBottom: "8px",
        }}
      >
        {eyebrow}
      </p>

      <button type="button" onClick={onOpen} className="w-full text-left">
        <h3
          style={{
            fontFamily: "Cormorant Garamond, serif",
            fontSize: "24px",
            lineHeight: 1.02,
            color: "#0A0A0A",
            marginBottom: "8px",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "12px",
            color: "#737373",
            lineHeight: 1.6,
            marginBottom: "14px",
          }}
        >
          {description}
        </p>
      </button>

      <div className="flex flex-wrap gap-2 mb-4">
        {meta.map((item) => (
          <span
            key={item}
            className="rounded-full px-2.5 py-1"
            style={{
              border: "1px solid rgba(0,0,0,0.08)",
              fontFamily: "Inter, sans-serif",
              fontSize: "10px",
              color: "#6E6E6E",
              letterSpacing: "0.06em",
            }}
          >
            {item}
          </span>
        ))}
      </div>

      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={onOpen}
          className="flex-1 rounded-[18px] border border-[rgba(0,0,0,0.06)] bg-[#0A0A0A] px-4 py-3.5 text-white"
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "12px",
            fontWeight: 500,
            letterSpacing: "0.03em",
          }}
        >
          Ver ritual
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="flex h-[46px] w-[46px] items-center justify-center rounded-[18px] border border-[rgba(0,0,0,0.06)] bg-[#FBFBFA] text-[#0A0A0A]"
          aria-label="Guardar ritual"
        >
          {saved ? (
            <BookmarkCheck size={18} strokeWidth={1.8} color="currentColor" fill="currentColor" />
          ) : (
            <Bookmark size={18} strokeWidth={1.8} color="currentColor" />
          )}
        </button>
      </div>
    </div>
  );
}
