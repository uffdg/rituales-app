import {
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
}: TodayContextCardProps) {
  const mood = getSkyMood(momentOfDay, weatherCondition);
  const MoodIcon = mood.icon;
  const isLight = textTheme === "light";
  const labelColor = isLight ? "rgba(255,255,255,0.72)" : "rgba(10,10,10,0.46)";
  const titleColor = isLight ? "#FFFFFF" : "var(--ink-strong)";
  const bodyColor = isLight ? "rgba(255,255,255,0.9)" : "rgba(23,25,28,0.82)";
  const chipBackground = isLight ? "rgba(17,17,17,0.24)" : "rgba(255,255,255,0.86)";
  const chipText = isLight ? "#FFFFFF" : "rgba(10,10,10,0.72)";
  const portalIconBg = isLight ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.78)";
  const portalIconColor = isLight ? "#FFFFFF" : "rgba(10,10,10,0.62)";

  return (
    <div
      className="flex flex-col h-full w-full"
    >
      <div className="mb-auto flex items-center justify-between gap-3">
        <div>
          <p
            style={{
              fontFamily: "var(--font-sans-ui)",
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: labelColor,
            }}
          >
            Tu cielo hoy
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

      <div className="flex-1 flex flex-col items-center justify-center text-center mt-12 mb-12">
        <div className="mb-4">
          <MoonPhaseIcon phase={phase} size={28} />
        </div>
        <p
          style={{
            fontFamily: "var(--font-sans-ui)",
            fontSize: "10px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            color: labelColor,
            marginBottom: "6px",
          }}
        >
          Fase
        </p>
        <p
          style={{
            fontFamily: "var(--font-sans-ui)",
            fontSize: "14px",
            color: bodyColor,
            marginBottom: "20px"
          }}
        >
          {phase}
        </p>

        <h3
          style={{
            fontFamily: "var(--font-serif-display)",
            fontSize: "50px",
            lineHeight: 0.98,
            color: titleColor,
            marginBottom: "20px",
            fontStyle: "italic",
            maxWidth: "320px",
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
            maxWidth: "300px",
          }}
        >
          {subphrase}
        </p>
      </div>

      <div className="mt-auto flex flex-col items-center text-center gap-6">
        {nextEventLabel ? (
          <div>
            <p
              style={{
                fontFamily: "var(--font-sans-ui)",
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: labelColor,
                marginBottom: "6px",
              }}
            >
              Próximo portal
            </p>
            <div className="flex items-center justify-center gap-2 mb-1">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{ background: portalIconBg }}
              >
                <MoonPhaseIcon
                  phase={nextEventPhase ?? nextEventLabel ?? phase}
                  size={16}
                  darkTheme={isLight}
                />
              </div>
              <p
                style={{
                  fontFamily: "var(--font-sans-ui)",
                  fontSize: "14px",
                  color: titleColor,
                  fontWeight: 500
                }}
              >
                {nextEventLabel}
              </p>
            </div>
            {nextEventMeta ? (
              <p
                style={{
                  fontFamily: "var(--font-sans-ui)",
                  fontSize: "11px",
                  color: labelColor,
                }}
              >
                {nextEventMeta}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-col items-center gap-2 mt-4 opacity-80">
          <p
            style={{
              fontFamily: "var(--font-sans-ui)",
              fontSize: "9px",
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: isLight ? "#FFFFFF" : "var(--ink-body)",
            }}
          >
            Scroll
          </p>
          <svg width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L6 6L11 1" stroke={isLight ? "#FFFFFF" : "var(--ink-body)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  );
}
