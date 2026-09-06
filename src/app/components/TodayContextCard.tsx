import {
  ArrowUpRight,
  CloudRain,
  CloudSun,
  MoonStar,
  Sparkles,
  SunMedium,
} from "lucide-react";
import { MoonPhaseIcon } from "./MoonPhaseIcon";

type WeatherCondition = "clear" | "cloudy" | "rain" | "storm" | "fog" | "unknown";
type MomentOfDay = "madrugada" | "mañana" | "tarde" | "noche";

interface TodayContextCardProps {
  phase: string;
  phrase: string;
  subphrase: string;
  momentOfDay: MomentOfDay;
  localTimeLabel: string;
  textTheme?: "light" | "dark";
  weatherCondition?: WeatherCondition;
  nextEventLabel?: string;
  nextEventMeta?: string;
  nextEventPhase?: string;
  onCreateRitual?: () => void;
}

function getSkyMood(momentOfDay: MomentOfDay, weatherCondition: WeatherCondition = "unknown") {
  if (weatherCondition === "rain" || weatherCondition === "storm") {
    return {
      label: "Lluvia suave",
      icon: CloudRain,
      background:
        "linear-gradient(180deg, rgba(243,244,246,0.96) 0%, rgba(236,238,242,0.92) 46%, rgba(255,255,255,1) 100%), radial-gradient(circle at top right, rgba(205,214,228,0.46), transparent 42%)",
      accent: "#7D8593",
    };
  }

  if (weatherCondition === "cloudy" || weatherCondition === "fog") {
    return {
      label: "Cielo sereno",
      icon: CloudSun,
      background:
        "linear-gradient(180deg, rgba(250,249,246,0.98) 0%, rgba(245,242,236,0.92) 54%, rgba(255,255,255,1) 100%), radial-gradient(circle at top left, rgba(221,215,205,0.46), transparent 40%)",
      accent: "#948B7B",
    };
  }

  if (momentOfDay === "madrugada") {
    return {
      label: "Madrugada serena",
      icon: MoonStar,
      background:
        "linear-gradient(180deg, rgba(243,242,239,0.96) 0%, rgba(239,236,231,0.92) 50%, rgba(255,255,255,1) 100%), radial-gradient(circle at top right, rgba(204,198,189,0.38), transparent 42%)",
      accent: "#7E766D",
    };
  }

  if (momentOfDay === "noche") {
    return {
      label: "Noche calma",
      icon: MoonStar,
      background:
        "linear-gradient(180deg, rgba(243,242,239,0.96) 0%, rgba(239,236,231,0.92) 50%, rgba(255,255,255,1) 100%), radial-gradient(circle at top right, rgba(204,198,189,0.38), transparent 42%)",
      accent: "#7E766D",
    };
  }

  if (momentOfDay === "tarde") {
    return {
      label: "Tarde abierta",
      icon: SunMedium,
      background:
        "linear-gradient(180deg, rgba(251,248,242,0.98) 0%, rgba(247,243,235,0.94) 52%, rgba(255,255,255,1) 100%), radial-gradient(circle at top center, rgba(233,220,192,0.36), transparent 40%)",
      accent: "#A78E61",
    };
  }

  return {
    label: "Mañana clara",
    icon: Sparkles,
    background:
      "linear-gradient(180deg, rgba(250,248,245,0.98) 0%, rgba(246,242,236,0.94) 54%, rgba(255,255,255,1) 100%), radial-gradient(circle at top left, rgba(230,221,206,0.42), transparent 38%)",
    accent: "#9E8B74",
  };
}

export function TodayContextCard({
  phase,
  phrase,
  subphrase,
  momentOfDay,
  localTimeLabel,
  textTheme = "dark",
  weatherCondition = "unknown",
  nextEventLabel,
  nextEventMeta,
  nextEventPhase,
  onCreateRitual,
}: TodayContextCardProps) {
  const mood = getSkyMood(momentOfDay, weatherCondition);
  const MoodIcon = mood.icon;
  const isLight = textTheme === "light";
  const labelColor = isLight ? "rgba(255,255,255,0.68)" : "rgba(10,10,10,0.48)";
  const titleColor = isLight ? "#FFFFFF" : "var(--ink-strong)";
  const bodyColor = isLight ? "rgba(255,255,255,0.86)" : "rgba(23,25,28,0.78)";
  const chipBackground = isLight ? "rgba(17,17,17,0.25)" : "rgba(255,255,255,0.68)";
  const chipText = isLight ? "#FFFFFF" : "rgba(10,10,10,0.74)";
  const wheelBorder = isLight ? "rgba(255,255,255,0.28)" : "rgba(10,10,10,0.16)";
  const wheelSoftBorder = isLight ? "rgba(255,255,255,0.16)" : "rgba(10,10,10,0.09)";
  const wheelLine = isLight ? "rgba(255,255,255,0.78)" : "rgba(10,10,10,0.46)";
  const phaseBg = isLight ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.72)";
  const phaseCurrentBg = isLight ? "rgba(255,255,255,0.92)" : "rgba(10,10,10,0.88)";
  const wheelSize = 327;
  const wheelOffsetRight = 196;
  const moonPhaseRadius = 147;
  const wheelTop = "17%";
  const moonPhases = [
    "Luna nueva",
    "Creciente",
    "Cuarto creciente",
    "Gibosa creciente",
    "Luna llena",
    "Gibosa menguante",
    "Cuarto menguante",
    "Menguante",
  ];

  return (
    <div className="relative -mx-6 flex h-full w-[calc(100%+48px)] flex-col overflow-hidden px-6">
      <div
        className="pointer-events-none absolute rounded-full border"
        style={{
          top: wheelTop,
          right: `-${wheelOffsetRight}px`,
          width: `${wheelSize}px`,
          height: `${wheelSize}px`,
          borderColor: wheelBorder,
        }}
      >
        <div className="absolute inset-[18px] rounded-full border" style={{ borderColor: wheelSoftBorder }} />
        <div className="absolute inset-[48px] rounded-full border border-dashed" style={{ borderColor: wheelSoftBorder }} />
        <div
          className="absolute h-px -translate-y-1/2"
          style={{
            left: "28px",
            top: "50%",
            width: `${wheelSize / 2 - 28}px`,
            background: wheelLine,
          }}
        />
        <div
          className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ left: "28px", top: "50%", background: isLight ? "#fff" : "#111" }}
        />
        {moonPhases.map((moonPhase, index) => {
          const angle = -118 + index * 34;
          const radius = moonPhaseRadius;
          const x = Math.cos((angle * Math.PI) / 180) * radius;
          const y = Math.sin((angle * Math.PI) / 180) * radius;
          const normalizedPhase = phase.toLowerCase();
          const normalizedMoonPhase = moonPhase.toLowerCase();
          const isCurrent =
            normalizedPhase === normalizedMoonPhase ||
            (normalizedMoonPhase !== "creciente" &&
              normalizedMoonPhase !== "menguante" &&
              normalizedPhase.includes(normalizedMoonPhase));

          return (
            <div
              key={moonPhase}
              className="absolute flex h-7 w-7 items-center justify-center rounded-full"
              style={{
                left: `calc(50% + ${x}px - 14px)`,
                top: `calc(50% + ${y}px - 14px)`,
                background: isCurrent ? phaseCurrentBg : phaseBg,
                backdropFilter: "blur(8px)",
              }}
            >
              <MoonPhaseIcon phase={moonPhase} size={18} darkTheme={isLight ? !isCurrent : isCurrent} />
            </div>
          );
        })}
      </div>

      <div
        className="pointer-events-none absolute z-10 flex -translate-y-1/2 items-center gap-2"
        style={{
          left: "66px",
          top: `calc(${wheelTop} + ${wheelSize / 2}px)`,
        }}
      >
        <MoonPhaseIcon phase={phase} size={18} darkTheme={isLight} />
        <div className="flex min-w-0 flex-col items-start gap-1">
          <span
            className="rounded-full px-4 py-2"
            style={{
              background: chipBackground,
              backdropFilter: "blur(12px)",
              fontFamily: "var(--font-sans-ui)",
              fontSize: "13px",
              fontWeight: 600,
              color: chipText,
            }}
          >
            {phase}
          </span>
          {nextEventLabel ? (
            <span
              style={{
                fontFamily: "var(--font-sans-ui)",
                fontSize: "12px",
                fontWeight: 300,
                color: chipText,
                opacity: 0.82,
                paddingLeft: "16px",
                lineHeight: 1.2,
                textAlign: "left",
                textShadow: isLight ? "0 1px 8px rgba(0,0,0,0.18)" : "0 1px 8px rgba(255,255,255,0.18)",
              }}
            >
              {nextEventMeta || nextEventLabel}
            </span>
          ) : null}
        </div>
      </div>

      <div className="relative z-10 flex items-start justify-between gap-3 pt-1">
        <div>
          <p
            style={{
              fontFamily: "var(--font-serif-display)",
              fontSize: "32px",
              fontWeight: 400,
              letterSpacing: "0",
              color: labelColor,
            }}
          >
            Rituales
          </p>
        </div>

        <div
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5"
          style={{
            background: chipBackground,
            backdropFilter: "blur(10px)",
          }}
        >
          <MoodIcon size={12} strokeWidth={1.8} color={chipText} />
          <span
            style={{
              fontFamily: "var(--font-sans-ui)",
              fontSize: "10px",
              color: chipText,
              letterSpacing: "0.02em",
              fontWeight: 500
            }}
          >
            {localTimeLabel} · {mood.label}
          </span>
        </div>
      </div>

      <div className="relative z-10 mt-auto pb-6">
        <p
          style={{
            fontFamily: "var(--font-sans-ui)",
            fontSize: "10px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            color: labelColor,
            marginBottom: "10px",
          }}
        >
          Tu cielo hoy
        </p>
        <h3
          style={{
            fontFamily: "var(--font-serif-display)",
            fontSize: "54px",
            lineHeight: 0.94,
            color: titleColor,
            marginBottom: "14px",
            fontStyle: "italic",
            maxWidth: "330px",
          }}
        >
          {phrase}
        </h3>
        <p
          style={{
            fontFamily: "var(--font-sans-ui)",
            fontSize: "13px",
            color: bodyColor,
            lineHeight: 1.6,
            maxWidth: "292px",
            marginBottom: "22px",
          }}
        >
          {subphrase}
        </p>

        <button
          type="button"
          onClick={onCreateRitual}
          className="flex h-[58px] w-full items-center justify-center gap-2 rounded-none bg-black text-white transition-transform active:scale-[0.99]"
          style={{
            fontFamily: "var(--font-sans-ui)",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          Crear un ritual
          <ArrowUpRight size={16} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}
