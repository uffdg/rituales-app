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
            type="button"
            onClick={onBack}
            className="editorial-icon-button editorial-icon-button--filled -ml-1.5"
            aria-label="Volver al paso anterior"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <div className="flex-1">
          <div
            className="h-px w-full relative bg-line-default"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={total}
            aria-valuenow={step}
            aria-label={`Paso ${step} de ${total}`}
          >
            <div
              className="absolute left-0 top-0 h-px bg-ink-strong transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <span className="shrink-0 font-sans text-caption tabular-nums text-ink-muted" aria-hidden="true">
          {step}/{total}
        </span>
      </div>
    </div>
  );
}
