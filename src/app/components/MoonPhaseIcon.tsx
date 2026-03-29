type MoonPhaseIconProps = {
  phase: string;
  size?: number;
  darkTheme?: boolean;
  className?: string;
};

function getPhaseVariant(phase: string) {
  const normalized = phase.toLowerCase();

  if (normalized.includes("nueva")) return "new";
  if (normalized.includes("llena")) return "full";
  if (normalized.includes("cuarto creciente")) return "first-quarter";
  if (normalized.includes("cuarto menguante")) return "last-quarter";
  if (normalized.includes("gibosa creciente")) return "waxing-gibbous";
  if (normalized.includes("gibosa menguante")) return "waning-gibbous";
  if (normalized.includes("creciente")) return "waxing-crescent";
  if (normalized.includes("menguante")) return "waning-crescent";

  return "full";
}

export function MoonPhaseIcon({ phase, size = 28, darkTheme = false, className }: MoonPhaseIconProps) {
  const variant = getPhaseVariant(phase);
  const stroke = darkTheme ? "#FFFFFF" : "#111111";
  const darkFill = darkTheme ? "#050505" : "#111111";
  const lightFill = darkTheme ? "#FFFFFF" : "#F7F5F1";

  const renderPhase = () => {
    switch (variant) {
      case "new":
        return (
          <>
            <circle cx="18" cy="18" r="12" fill={darkFill} />
            <circle cx="18" cy="18" r="12" fill="none" stroke={stroke} strokeWidth="1.5" />
          </>
        );
      case "full":
        return (
          <>
            <circle cx="18" cy="18" r="12" fill={lightFill} />
            <circle cx="18" cy="18" r="12" fill="none" stroke={stroke} strokeWidth="1.5" />
          </>
        );
      case "first-quarter":
        return (
          <>
            <path d="M18 6A12 12 0 0 0 18 30Z" fill={darkFill} />
            <path d="M18 6A12 12 0 0 1 18 30Z" fill={lightFill} />
            <circle cx="18" cy="18" r="12" fill="none" stroke={stroke} strokeWidth="1.5" />
          </>
        );
      case "last-quarter":
        return (
          <>
            <path d="M18 6A12 12 0 0 1 18 30Z" fill={darkFill} />
            <path d="M18 6A12 12 0 0 0 18 30Z" fill={lightFill} />
            <circle cx="18" cy="18" r="12" fill="none" stroke={stroke} strokeWidth="1.5" />
          </>
        );
      case "waxing-crescent":
        return (
          <>
            <circle cx="18" cy="18" r="12" fill={darkFill} />
            <ellipse cx="22.2" cy="18" rx="7" ry="11" fill={lightFill} />
            <circle cx="18" cy="18" r="12" fill="none" stroke={stroke} strokeWidth="1.5" />
          </>
        );
      case "waning-crescent":
        return (
          <>
            <circle cx="18" cy="18" r="12" fill={darkFill} />
            <ellipse cx="13.8" cy="18" rx="7" ry="11" fill={lightFill} />
            <circle cx="18" cy="18" r="12" fill="none" stroke={stroke} strokeWidth="1.5" />
          </>
        );
      case "waxing-gibbous":
        return (
          <>
            <circle cx="18" cy="18" r="12" fill={lightFill} />
            <ellipse cx="12.5" cy="18" rx="5.4" ry="11" fill={darkFill} />
            <circle cx="18" cy="18" r="12" fill="none" stroke={stroke} strokeWidth="1.5" />
          </>
        );
      case "waning-gibbous":
        return (
          <>
            <circle cx="18" cy="18" r="12" fill={lightFill} />
            <ellipse cx="23.5" cy="18" rx="5.4" ry="11" fill={darkFill} />
            <circle cx="18" cy="18" r="12" fill="none" stroke={stroke} strokeWidth="1.5" />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {renderPhase()}
    </svg>
  );
}
