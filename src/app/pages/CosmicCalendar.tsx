import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { addMonths, addWeeks, format, subMonths, subWeeks } from "date-fns";
import { es } from "date-fns/locale";
import { MoonPhaseIcon } from "../components/MoonPhaseIcon";
import {
  buildCosmicDay,
  getMonthlyCosmicDays,
  getWeeklyCosmicDays,
  getNextEvent,
  getPhaseBackgroundUrl,
  getMoonPerfectionsForRange,
  isToday,
  type CosmicDay,
  type CosmicPerfection,
} from "../lib/cosmic-calendar";
import { getJournalEntries, getJournalByDate } from "../lib/practice-journal";

export function CosmicCalendar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [view, setView] = useState<"week" | "month">("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const initialSelectedDate: string | undefined = location.state?.selectedDate;
  const [selectedDay, setSelectedDay] = useState<CosmicDay | null>(null);

  const weeklyDays = useMemo(() => getWeeklyCosmicDays(currentDate), [currentDate]);
  const monthlyDays = useMemo(() => getMonthlyCosmicDays(currentDate), [currentDate]);

  const journalByDate = useMemo(() => getJournalByDate(getJournalEntries()), []);

  // Calcula perfecciones lunares para el rango visible (semana o mes)
  // Incluye ±2 meses de margen para no cortar fases en el borde
  const perfectionMap = useMemo((): Record<string, CosmicPerfection> => {
    const days = view === "week" ? weeklyDays : monthlyDays;
    if (days.length === 0) return {};
    const first = days[0].date;
    const last  = days[days.length - 1].date;
    const start = new Date(first.getFullYear(), first.getMonth() - 1, 1);
    const end   = new Date(last.getFullYear(),  last.getMonth()  + 2, 0);
    return getMoonPerfectionsForRange(start, end);
  }, [view, weeklyDays, monthlyDays]);

  // Enriquece un CosmicDay con la perfección calculada para su dateKey
  function enrichDay(day: CosmicDay): CosmicDay {
    const p = perfectionMap[day.dateKey];
    return p ? { ...day, perfection: p } : day;
  }

  const hasOpenedInitialRef = useRef(false);

  useEffect(() => {
    if (initialSelectedDate && !hasOpenedInitialRef.current) {
      const match = monthlyDays.find(d => d.dateKey === initialSelectedDate);
      if (match) setSelectedDay(enrichDay(match));
      else {
        const parts = initialSelectedDate.split("-");
        if (parts.length === 3) {
          const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]));
          setSelectedDay(enrichDay(buildCosmicDay(dateObj)));
        }
      }
      hasOpenedInitialRef.current = true;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSelectedDate, monthlyDays]);

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
            {weeklyDays.map((rawDay) => {
              const day = enrichDay(rawDay);
              const bgUrl = isToday(day.date) ? getPhaseBackgroundUrl(getDisplayMoonPhase(day)) : null;
              const isNewMoon = bgUrl === "black";
              const isBlackCard = bgUrl !== null;
              
              const cardBgClass = isBlackCard ? "bg-[#000] border-transparent" : "bg-white border-[rgba(0,0,0,0.07)]";
              const tagBg = isBlackCard ? "bg-[#222] text-[#E5E5E5]" : "bg-[#0A0A0A] text-white";
              const dateColor = isBlackCard ? "#FFF" : "#0A0A0A";
              const dayColor = isBlackCard ? "#FFF" : "#AAA";
              const descColor = isBlackCard ? "#CCC" : "#666";

              return (
                <button
                  key={day.dateKey}
                  onClick={() => setSelectedDay(day)}
                  className={`relative overflow-hidden rounded-[28px] border ${cardBgClass} px-5 py-5 text-left transition-all flex flex-col hover:opacity-90 min-h-[164px]`}
                >
                  {isBlackCard && !isNewMoon && bgUrl && (
                    <div
                      className="absolute inset-0 pointer-events-none transition-opacity duration-500 ease-out"
                      style={{
                        backgroundImage: `url(${bgUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                      }}
                    />
                  )}

                  <div className="relative z-10 w-full h-full text-current flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <p style={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: dayColor, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 500 }}>
                        {day.weekdayLabel}
                      </p>
                      {isToday(day.date) && (
                        <span className={`text-[9px] px-2.5 py-1 rounded-[6px] ${tagBg} font-sans align-middle uppercase tracking-widest leading-none`}>
                          Hoy
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mb-auto text-current">
                      <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "32px", color: dateColor, lineHeight: 1 }}>
                        {format(day.date, "d")}
                      </p>
                      <div className={isBlackCard ? "invert opacity-90" : ""}>
                        <MoonPhaseIcon phase={getDisplayMoonPhase(day)} size={30} />
                      </div>
                    </div>

                    <div className="mt-auto pt-4 flex items-end justify-between">
                      {day.perfection ? (
                        <div>
                          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: descColor, marginBottom: "4px", fontWeight: 500 }}>
                            {day.perfection.label}
                          </p>
                          <p style={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: dayColor, lineHeight: 1.4 }}>
                            {day.perfection.timeBuenosAires} hs · {day.perfection.zodiacSign}
                          </p>
                        </div>
                      ) : <div />}
                      {journalByDate.has(day.dateKey) && (
                        <span style={{ fontSize: 12, color: isBlackCard ? "rgba(255,255,255,0.6)" : "#C0BAB4", lineHeight: 1 }} title="Hiciste un ritual este día">
                          ✦
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
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
              {monthlyDays.map((rawDay) => {
                const day = enrichDay(rawDay);
                const inCurrentMonth = rawDay.inCurrentMonth;
                return (
                  <button
                    key={day.dateKey}
                    onClick={() => setSelectedDay(day)}
                    className={`min-h-[96px] rounded-[22px] border px-2 py-2 text-left transition-colors flex flex-col ${
                      inCurrentMonth
                        ? "border-[rgba(0,0,0,0.07)] bg-white"
                        : "border-[rgba(0,0,0,0.04)] bg-[#FAFAFA]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={isToday(day.date) ? "flex items-center justify-center w-6 h-6 rounded-full bg-[#0A0A0A] text-white" : ""}
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: "11px",
                          fontWeight: isToday(day.date) ? 600 : 400,
                          color: isToday(day.date) ? "#FFF" : inCurrentMonth ? "#666" : "#BBB",
                        }}
                      >
                        {format(day.date, "d")}
                      </span>
                      <MoonPhaseIcon phase={getDisplayMoonPhase(day)} size={16} />
                    </div>
                    <div className="mt-auto flex flex-col gap-0.5">
                      {day.perfection ? (
                        <>
                          <span
                            className="w-full truncate leading-tight"
                            style={{ fontFamily: "Inter, sans-serif", fontSize: "7.5px", color: "#0A0A0A", fontWeight: 500 }}
                          >
                            {day.perfection.label === "Luna nueva" ? "L. nueva"
                              : day.perfection.label === "Luna llena" ? "L. llena"
                              : day.perfection.label === "Cuarto creciente" ? "C. creciente"
                              : day.perfection.label === "Cuarto menguante" ? "C. menguante"
                              : day.perfection.label}
                          </span>
                          <span className="w-full truncate" style={{ fontFamily: "Inter, sans-serif", fontSize: "7px", color: "#999" }}>
                            {day.perfection.zodiacSign}
                          </span>
                          <span className="w-full truncate" style={{ fontFamily: "Inter, sans-serif", fontSize: "7px", color: "#BBB" }}>
                            {day.perfection.timeBuenosAires}
                          </span>
                        </>
                      ) : day.events[0] ? (
                        <span className="w-full truncate" style={{ fontFamily: "Inter, sans-serif", fontSize: "7.5px", color: "#0A0A0A", fontWeight: 500 }}>
                          {day.events[0].shortLabel}
                        </span>
                      ) : null}
                      {journalByDate.has(day.dateKey) && (
                        <span style={{ fontSize: 8, color: "#C0BAB4", lineHeight: 1 }}>✦</span>
                      )}
                    </div>
                  </button>
                );
              })}
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
            <button
              onClick={() => setSelectedDay(null)}
              className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-[#FAFAFA] border border-[rgba(0,0,0,0.06)] text-[#888] hover:text-[#0A0A0A] hover:bg-[#F0F0F0] transition-colors"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>

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
                paddingRight: "24px",
              }}
            >
              {format(selectedDay.date, "d 'de' LLLL", { locale: es })}
            </p>

            {/* Entradas del diario personal para este día */}
            {journalByDate.has(selectedDay.dateKey) && (
              <div className="mb-4 rounded-[22px] border border-[rgba(0,0,0,0.06)] bg-[#F7F5F2] px-4 py-4">
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: "#BBB", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
                  Tu práctica este día
                </p>
                {journalByDate.get(selectedDay.dateKey)!.map((entry, i) => (
                  <div key={i} className={i > 0 ? "mt-3 pt-3 border-t border-[rgba(0,0,0,0.05)]" : ""}>
                    <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 16, color: "#0A0A0A", lineHeight: 1.4 }}>
                      "{entry.anchor}"
                    </p>
                    {entry.element && (
                      <p style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "#AAA", marginTop: 4, textTransform: "capitalize", letterSpacing: "0.04em" }}>
                        {entry.ritualType} · {entry.element}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

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

                <div className="rounded-[22px] border border-[rgba(0,0,0,0.06)] bg-[#FAFAFA] px-4 py-4">
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
            ) : (() => {
              const nextEventData = getNextEvent(selectedDay.date);
              return (
                <div className="rounded-[22px] border border-[rgba(0,0,0,0.06)] bg-[#FAFAFA] px-4 py-4 mt-4">
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#777", lineHeight: 1.6, marginBottom: "16px" }}>
                    No hay eventos particulares hoy, pero te podés preparar para el próximo evento.
                  </p>
                  {nextEventData && (
                    <>
                      <p style={{ fontFamily: "Inter, sans-serif", fontSize: "10px", color: "#AAA", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
                        Próximo evento
                      </p>
                      <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "18px", color: "#0A0A0A", lineHeight: 1.2, marginBottom: "2px" }}>
                        {nextEventData.perfection.label}
                      </p>
                      <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#777", lineHeight: 1.6 }}>
                        {format(nextEventData.date, "d 'de' LLLL", { locale: es })}
                      </p>
                    </>
                  )}
                  
                  <div className="mt-5 border-t border-[rgba(0,0,0,0.05)] pt-4 flex justify-center">
                    <button
                      onClick={() => {
                        setSelectedDay(null);
                        setTimeout(() => navigate("/"), 50);
                      }}
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "12px",
                        color: "#0A0A0A",
                        fontWeight: 500,
                        textDecoration: "underline",
                        textUnderlineOffset: "3px",
                      }}
                      className="hover:opacity-60 transition-opacity"
                    >
                      Ir a Inicio para abrir la wiki
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      ) : null}
    </div>
  );
}
