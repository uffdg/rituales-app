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
    <div className="editorial-card-elevated rounded-[24px] px-4 py-4">
      <p className="editorial-eyebrow mb-2">
        {eyebrow}
      </p>

      <button type="button" onClick={onOpen} className="w-full text-left">
        <h3 className="editorial-title-section mb-2">
          {title}
        </h3>
        <p className="editorial-body-muted mb-3.5">
          {description}
        </p>
      </button>

      <div className="flex flex-wrap gap-2 mb-4">
        {meta.map((item) => (
          <span key={item} className="ritual-list-meta-chip">
            {item}
          </span>
        ))}
      </div>

      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={onOpen}
          className="editorial-button-primary flex-1 rounded-[18px] border border-[var(--ink-strong)] px-4 py-3.5 text-[12px] tracking-[0.03em]"
        >
          Ver ritual
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="editorial-icon-button h-[46px] w-[46px]"
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
