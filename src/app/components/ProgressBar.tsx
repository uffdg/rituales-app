interface ProgressBarProps {
  step: number;
  total?: number;
  onBack?: () => void;
}

export function ProgressBar({ step, total = 5, onBack }: ProgressBarProps) {
  const progress = (step / total) * 100;

  return (
    <div className="px-6 pt-14 pb-4">
      <div className="flex items-center gap-3 mb-3">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center justify-center w-8 h-8 rounded-full border border-[rgba(0,0,0,0.1)] text-[var(--ink-strong)] hover:bg-[var(--surface-softest)] transition-colors"
            aria-label="Volver"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <div className="flex-1">
          <div className="h-[1px] bg-[var(--surface-muted)] w-full relative">
            <div
              className="absolute left-0 top-0 h-[1px] bg-[var(--ink-strong)] transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <span
          className="text-xs text-[var(--ink-subtle)] shrink-0"
          style={{ fontFamily: "var(--font-sans-ui)", letterSpacing: "0.06em" }}
        >
          {step}/{total}
        </span>
      </div>
    </div>
  );
}
