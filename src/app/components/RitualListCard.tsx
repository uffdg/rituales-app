import type { MouseEvent } from "react";
import { Bookmark, BookmarkCheck, Trash2 } from "lucide-react";

interface RitualListCardProps {
  title: string;
  description?: string;
  meta: string[];
  likes?: number;
  saved: boolean;
  saving?: boolean;
  actionKind?: "save" | "delete";
  actionLabel?: string;
  onOpen: () => void;
  onSave: (event: MouseEvent<HTMLButtonElement>) => void;
}

export function RitualListCard({
  title,
  description,
  meta,
  likes,
  saved,
  saving = false,
  actionKind = "save",
  actionLabel = "Guardar ritual",
  onOpen,
  onSave,
}: RitualListCardProps) {
  return (
    <div className="ritual-list-card p-4">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={onOpen}
          className="flex-1 min-w-0 text-left active:scale-[0.99] transition-transform"
        >
          <h4 className="font-serif text-[18px] font-normal leading-[1.25] text-[var(--ink-strong)] mb-2">
            {title}
          </h4>

          {description ? (
            <p className="font-sans text-[12px] font-light leading-[1.5] text-[var(--ink-muted)] mb-3 line-clamp-2">
              {description}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-1.5">
            {meta.map((item) => (
              <span key={item} className="ritual-list-meta-chip">
                {item}
              </span>
            ))}

            {typeof likes === "number" ? (
              <span className="ml-1 font-sans text-[11px] text-[var(--ink-soft)]">
                ♥ {likes}
              </span>
            ) : null}
          </div>
        </button>

        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className={`editorial-icon-button h-8 w-8 shrink-0 rounded-[14px] transition-all ${
            actionKind === "save" && saved ? "bg-[var(--ink-strong)] border-[var(--ink-strong)] text-white" : ""
          }`}
          aria-label={actionLabel}
        >
          {actionKind === "delete" ? (
            <Trash2 size={14} strokeWidth={1.8} color="currentColor" />
          ) : saved ? (
            <BookmarkCheck size={14} strokeWidth={1.8} color="currentColor" fill="currentColor" />
          ) : (
            <Bookmark size={14} strokeWidth={1.8} color="currentColor" fill="none" />
          )}
        </button>
      </div>
    </div>
  );
}
