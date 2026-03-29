import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { addMonths, addWeeks, format, subMonths, subWeeks } from "date-fns";
import { es } from "date-fns/locale";
import { MoonPhaseIcon } from "../components/MoonPhaseIcon";
import {
  buildCosmicDay,
  getMonthlyCosmicDays,
  getWeeklyCosmicDays,
  isToday,
  type CosmicDay,
} from "../lib/cosmic-calendar";

export function CosmicCalendar() {
  const navigate = useNavigate();
  const [view, setView] = useState<"week" | "month">("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<CosmicDay | null>(null);

  const weeklyDays = useMemo(() => getWeeklyCosmicDays(currentDate), [currentDate]);
  const monthlyDays = useMemo(() => getMonthlyCosmicDays(currentDate), [currentDate]);

  const goPrevious = () => {
    setCurrentDate((prev) => (view === "week" ? subWeeks(prev, 1) : subMonths(prev, 1)));
  };

  const goNext = () => {
    setCurrentDate((prev) => (view === "week" ? addWeeks(prev, 1) : addMonths(prev, 1)));
  };

  const selectedDayHasPerfection = Boolean(selectedDay?.perfection);
  const getDisplayMoonPhase = (day: CosmicDay) =>
    day.perfection?.kind === "moon_phase" ? day.perfection.label : day.moonPhase;

  return (
    <div className="min-h-screen bg-white flex flex-col overflow-y-auto">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 50% 0%, rgba(0,0,0,0.04) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 pt-14 px-6 pb-4 flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-[#888] hover:text-[#0A0A0A] transition-colors"
          style={{ fontFamily: "Inter, sans-serif", fontSize: "13px" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Inicio
        </button>
      </div>

      <div className="relative z-10 px-6 pb-12">
        <div className="mb-8">
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#BBB",
              marginBottom: "8px",
            }}
          >
            Calendario cósmico
          </p>
          <h1
            style={{
              fontFamily: "Cormorant Garamond, serif",
              fontSize: "32px",
              fontWeight: 400,
              color: "#0A0A0A",
              lineHeight: 1.15,
              marginBottom: "10px",
            }}
          >
            Luna, eclipses y equinoccios
          </h1>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              color: "#888",
              lineHeight: 1.6,
            }}
          >
            Tocá un día para ver el clima astral y sumar recomendaciones para rituales.
          </p>
        </div>

        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goPrevious}
            className="w-10 h-10 rounded-full border border-[rgba(0,0,0,0.08)] text-[#666]"
          >
            ←
          </button>
          <p
            style={{
              fontFamily: "Cormorant Garamond, serif",
              fontSize: "26px",
              color: "#0A0A0A",
            }}
          >
            {format(currentDate, "LLLL yyyy", { locale: es })}
          </p>
          <button
            onClick={goNext}
            className="w-10 h-10 rounded-full border border-[rgba(0,0,0,0.08)] text-[#666]"
          >
            →
          </button>
        </div>

        <div className="inline-flex rounded-full border border-[rgba(0,0,0,0.08)] p-1 bg-[#FAFAFA] mb-6">
          <button
            onClick={() => setView("week")}
            className={`px-4 py-2 rounded-full transition-colors ${
              view === "week" ? "bg-[#0A0A0A] text-white" : "text-[#777]"
            }`}
            style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 500 }}
          >
            Semana
          </button>
          <button
            onClick={() => setView("month")}
            className={`px-4 py-2 rounded-full transition-colors ${
              view === "month" ? "bg-[#0A0A0A] text-white" : "text-[#777]"
            }`}
            style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 500 }}
          >
            Mes
          </button>
        </div>

        {view === "week" ? (
          <div className="grid grid-cols-2 gap-3">
            {weeklyDays.map((day) => (
              <button
                key={day.dateKey}
                onClick={() => setSelectedDay(day)}
                className="rounded-[28px] border border-[rgba(0,0,0,0.07)] bg-white px-4 py-4 text-left"
              >
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: "#AAA", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
                  {day.weekdayLabel}
                </p>
                <div className="flex items-center justify-between mb-3">
                  <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "28px", color: "#0A0A0A" }}>
                    {format(day.date, "d")}
                  </p>
                  <MoonPhaseIcon phase={getDisplayMoonPhase(day)} size={28} />
                </div>
                {day.perfection ? (
                  <>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#666", marginBottom: "6px" }}>
                      {day.perfection.label}
                    </p>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: "#AAA", lineHeight: 1.5 }}>
                      {day.perfection.timeBuenosAires} hs · {day.perfection.zodiacSign}
                    </p>
                  </>
                ) : null}
              </button>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-2 mb-3">
              {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((weekday) => (
                <p
                  key={weekday}
                  className="text-center"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "10px",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "#AAA",
                  }}
                >
                  {weekday}
                </p>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {monthlyDays.map((day) => (
                <button
                  key={day.dateKey}
                  onClick={() => setSelectedDay(buildCosmicDay(day.date))}
                  className={`min-h-[96px] rounded-[22px] border px-2 py-2 text-left transition-colors flex flex-col ${
                    day.inCurrentMonth
                      ? "border-[rgba(0,0,0,0.07)] bg-white"
                      : "border-[rgba(0,0,0,0.04)] bg-[#FAFAFA]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "11px",
                        fontWeight: isToday(day.date) ? 600 : 400,
                        color: isToday(day.date) ? "#0A0A0A" : day.inCurrentMonth ? "#666" : "#BBB",
                      }}
                    >
                      {format(day.date, "d")}
                    </span>
                    <MoonPhaseIcon phase={getDisplayMoonPhase(day)} size={18} />
                  </div>
                  <div className="mt-auto min-h-[28px] flex flex-col justify-end">
                    {day.perfection ? (
                      <>
                        <span
                          style={{
                            fontFamily: "Inter, sans-serif",
                            fontSize: "8px",
                            lineHeight: 1.2,
                            color: "#888",
                          }}
                        >
                          {day.perfection.timeBuenosAires} hs
                        </span>
                        {day.perfection.kind === "moon_phase" &&
                        day.perfection.label.toLowerCase() === "luna nueva" ? (
                          <span
                            style={{
                              fontFamily: "Inter, sans-serif",
                              fontSize: "8px",
                              lineHeight: 1.2,
                              color: "#0A0A0A",
                              fontWeight: 500,
                            }}
                          >
                            Conjunción
                          </span>
                        ) : null}
                      </>
                    ) : day.events[0] ? (
                      <div className="flex items-center justify-center">
                        <span
                          className="inline-flex w-2 h-2 rounded-full bg-[#0A0A0A]"
                          aria-hidden="true"
                        />
                      </div>
                    ) : (
                      <div className="h-2" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {selectedDay ? (
        <div className="fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/35"
            onClick={() => setSelectedDay(null)}
          />
          <div className="absolute left-1/2 top-1/2 w-[calc(100%-3rem)] max-w-[330px] -translate-x-1/2 -translate-y-1/2 rounded-[28px] border border-[rgba(0,0,0,0.08)] bg-white px-5 py-5 shadow-[0_20px_60px_rgba(0,0,0,0.12)]">
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "10px",
                fontWeight: 500,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#BBB",
                marginBottom: "10px",
              }}
            >
              {selectedDay.weekdayLabel}
            </p>

            <p
              style={{
                fontFamily: "Cormorant Garamond, serif",
                fontSize: "26px",
                fontWeight: 400,
                color: "#0A0A0A",
                lineHeight: 1.1,
                marginBottom: "10px",
              }}
            >
              {format(selectedDay.date, "d 'de' LLLL", { locale: es })}
            </p>

            {selectedDayHasPerfection ? (
              <>
                <p
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "13px",
                    color: "#777",
                    lineHeight: 1.6,
                    marginBottom: "16px",
                  }}
                >
                  {selectedDay.perfection?.label}
                </p>

                <div className="rounded-[22px] border border-[rgba(0,0,0,0.06)] bg-[#FAFAFA] px-4 py-4 mb-4">
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: "#AAA", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
                    Posición exacta
                  </p>
                  <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "18px", color: "#0A0A0A", lineHeight: 1.2, marginBottom: "6px" }}>
                    {selectedDay.perfection?.timeBuenosAires} hs en Buenos Aires
                  </p>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#777", lineHeight: 1.6 }}>
                    Se perfecciona en {selectedDay.perfection?.zodiacSign}.
                  </p>
                </div>
              </>
            ) : null}

            <button
              onClick={() => setSelectedDay(null)}
              className="w-full rounded-[20px] bg-[#0A0A0A] px-5 py-3 text-white hover:bg-[#1A1A1A]"
              style={{ fontFamily: "Inter, sans-serif", fontSize: "13px" }}
            >
              Cerrar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
