import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { BackLink } from "../components/BackLink";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, addWeeks, format, subMonths, subWeeks } from "date-fns";
import { es } from "date-fns/locale";
import { MoonPhaseIcon } from "../components/MoonPhaseIcon";
import { useUser } from "../context/UserContext";
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
import {
  getJournalByDate,
  getJournalEntries,
  getJournalEntriesFromOwnRituals,
} from "../lib/practice-journal";

// Nombres que entran en una celda del mes (unos 40 px) a 10 px, el mínimo del
// design system. El nombre completo, el signo y la hora están en el detalle del día.
const CELL_LABELS: Record<string, string> = {
  "Luna nueva": "Nueva",
  "Luna llena": "Llena",
  "Cuarto creciente": "Crec.",
  "Cuarto menguante": "Meng.",
  Equinoccio: "Equin.",
  Solsticio: "Solst.",
};

export function CosmicCalendar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, ownRituals } = useUser();
  const [view, setView] = useState<"week" | "month">("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const initialSelectedDate: string | undefined = location.state?.selectedDate;
  const [selectedDay, setSelectedDay] = useState<CosmicDay | null>(null);

  const weeklyDays = useMemo(() => getWeeklyCosmicDays(currentDate), [currentDate]);
  const monthlyDays = useMemo(() => getMonthlyCosmicDays(currentDate), [currentDate]);

  const journalEntries = useMemo(
    () => (user ? getJournalEntriesFromOwnRituals(ownRituals) : getJournalEntries()),
    [user, ownRituals],
  );
  const journalByDate = useMemo(() => getJournalByDate(journalEntries), [journalEntries]);

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
    <div className="editorial-detail-shell">
      <div className="editorial-radial-wash" />

      <div className="relative z-10 pt-14 px-6 pb-4 flex items-center justify-between">
        <BackLink to="/" label="Inicio" />
      </div>

      <div className="relative z-10 px-6 pb-12">
        <div className="mb-8">
          <p className="editorial-eyebrow mb-2">Calendario cósmico</p>
          <h1 className="editorial-title-hero mb-2.5 max-w-[280px]">
            Luna, eclipses y equinoccios
          </h1>
          <p className="editorial-body-muted">
            Tocá un día para ver el clima astral y sumar recomendaciones para rituales.
          </p>
        </div>

        <div className="flex items-center justify-between mb-4">
          <button type="button" onClick={goPrevious} className="editorial-icon-button text-ink-muted" aria-label={view === "week" ? "Semana anterior" : "Mes anterior"}>
            <ChevronLeft size={18} strokeWidth={1.5} aria-hidden="true" />
          </button>
          <p className="font-serif text-title-2 capitalize text-ink-strong" aria-live="polite">
            {format(currentDate, "LLLL yyyy", { locale: es })}
          </p>
          <button type="button" onClick={goNext} className="editorial-icon-button text-ink-muted" aria-label={view === "week" ? "Semana siguiente" : "Mes siguiente"}>
            <ChevronRight size={18} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        <div className="editorial-segmented mb-6 inline-flex">
          <button
            type="button"
            onClick={() => setView("week")}
            aria-pressed={view === "week"}
            className={`editorial-segmented-option px-4 ${view === "week" ? "editorial-segmented-option-active" : ""}`}
          >
            Semana
          </button>
          <button
            type="button"
            onClick={() => setView("month")}
            aria-pressed={view === "month"}
            className={`editorial-segmented-option px-4 ${view === "month" ? "editorial-segmented-option-active" : ""}`}
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
              
              const cardBgClass = isBlackCard ? "bg-black border-transparent" : "bg-surface-base border-line-soft";
              const dateColor = isBlackCard ? "text-on-ink-strong" : "text-ink-strong";
              const dayColor = isBlackCard ? "editorial-eyebrow--on-dark" : "";
              const descColor = isBlackCard ? "text-on-ink-muted" : "text-ink-muted";

              return (
                <button
                  key={day.dateKey}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`relative flex min-h-[164px] flex-col overflow-hidden rounded-card border ${cardBgClass} p-5 text-left transition-all hover:opacity-90`}
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
                      <p className={`editorial-eyebrow ${dayColor}`}>{day.weekdayLabel}</p>
                      {isToday(day.date) ? (
                        <span className={`editorial-badge ${isBlackCard ? "bg-white text-ink-strong" : "editorial-badge--inverse"}`}>Hoy</span>
                      ) : day.perfection ? (
                        <span className="editorial-badge editorial-badge--inverse">Evento</span>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-between mb-auto text-current">
                      <p className={`font-serif text-title-1 leading-none ${dateColor}`}>{format(day.date, "d")}</p>
                      <div className={isBlackCard ? "invert opacity-90" : ""}>
                        <MoonPhaseIcon phase={getDisplayMoonPhase(day)} size={30} />
                      </div>
                    </div>

                    <div className="mt-auto pt-4 flex items-end justify-between">
                      {day.perfection ? (
                        <div>
                          <p className={`mb-1 font-sans text-body font-medium ${descColor}`}>{day.perfection.label}</p>
                          <p className={`font-sans text-caption ${descColor}`}>
                            {day.perfection.timeBuenosAires} hs · {day.perfection.zodiacSign}
                          </p>
                        </div>
                      ) : <div />}
                      {journalByDate.has(day.dateKey) && (
                        <span className={`text-body leading-none ${isBlackCard ? "text-on-ink-muted" : "text-ink-decor"}`} title="Hiciste un ritual este día">
                          <span aria-hidden="true">✦</span>
                          <span className="sr-only">Hiciste un ritual este día</span>
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
                <p key={weekday} className="text-center font-sans text-caption font-medium text-ink-muted">
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
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    aria-label={`${format(day.date, "d 'de' LLLL", { locale: es })}${day.perfection ? `, ${day.perfection.label}` : day.events[0] ? `, ${day.events[0].label}` : ""}`}
                    className={`flex min-h-[80px] flex-col rounded-sm border px-1 py-1.5 text-left transition-colors ${
                      inCurrentMonth ? "border-line-soft bg-surface-base" : "border-transparent bg-surface-soft"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`font-sans text-caption ${
                          isToday(day.date)
                            ? "flex h-6 w-6 items-center justify-center rounded-full bg-ink-strong font-medium text-on-ink-strong"
                            : inCurrentMonth
                            ? "text-ink-body"
                            : "text-ink-subtle"
                        }`}
                      >
                        {format(day.date, "d")}
                      </span>
                      <MoonPhaseIcon phase={getDisplayMoonPhase(day)} size={16} />
                    </div>
                    <div className="mt-auto flex flex-col gap-0.5">
                      {/* Mínimo 10 px: la celda muestra solo el evento; signo y hora
                          están en el detalle del día (rediseño del mes: spec aparte). */}
                      {day.perfection ? (
                        <span className="w-full truncate font-sans text-eyebrow font-medium leading-tight text-ink-strong" aria-hidden="true">
                          {CELL_LABELS[day.perfection.label] ?? day.perfection.label}
                        </span>
                      ) : day.events[0] ? (
                        <span className="w-full truncate font-sans text-eyebrow font-medium leading-tight text-ink-strong" aria-hidden="true">
                          {CELL_LABELS[day.events[0].shortLabel] ?? day.events[0].shortLabel}
                        </span>
                      ) : null}
                      {journalByDate.has(day.dateKey) && (
                        <span className="text-caption leading-none text-ink-decor" aria-hidden="true">✦</span>
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
            className="absolute inset-0 bg-scrim"
            onClick={() => setSelectedDay(null)}
          />
          <div className="editorial-calendar-dialog absolute left-1/2 top-1/2 w-[calc(100%-3rem)] max-w-[330px] -translate-x-1/2 -translate-y-1/2 px-5 py-5">
            <button
              type="button"
              onClick={() => setSelectedDay(null)}
              className="editorial-icon-button absolute top-3 right-3 text-ink-muted"
              aria-label="Cerrar"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>

            <p className="editorial-eyebrow mb-2.5">{selectedDay.weekdayLabel}</p>

            <p className="editorial-title-section mb-2.5 pr-8">
              {format(selectedDay.date, "d 'de' LLLL", { locale: es })}
            </p>

            {/* Entradas del diario personal para este día */}
            {journalByDate.has(selectedDay.dateKey) && (
              <div className="editorial-calendar-soft-block mb-4">
                <p className="editorial-eyebrow mb-2.5">
                  Tu práctica este día
                </p>
                {journalByDate.get(selectedDay.dateKey)!.map((entry, i) => (
                  <div key={i} className={i > 0 ? "mt-3 pt-3 border-t border-line-soft" : ""}>
                    <p className="font-sans text-title-4 text-ink-strong">
                      "{entry.anchor}"
                    </p>
                    {entry.element && (
                      <p className="mt-1 font-sans text-caption capitalize text-ink-muted">
                        {entry.ritualType} · {entry.element}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {selectedDayHasPerfection ? (
              <>
                <p className="editorial-body-muted mb-4">
                  {selectedDay.perfection?.label}
                </p>

                <div className="editorial-calendar-soft-block">
                  <p className="editorial-eyebrow mb-2">
                    Posición exacta
                  </p>
                  <p className="editorial-title-card mb-1.5">
                    {selectedDay.perfection?.timeBuenosAires} hs en Buenos Aires
                  </p>
                  <p className="editorial-body-muted">
                    Se perfecciona en {selectedDay.perfection?.zodiacSign}.
                  </p>
                </div>
              </>
            ) : (() => {
              const nextEventData = getNextEvent(selectedDay.date);
              return (
                <div className="editorial-calendar-soft-block mt-4">
                  <p className="editorial-body-muted mb-4">
                    No hay eventos particulares hoy, pero te podés preparar para el próximo evento.
                  </p>
                  {nextEventData && (
                    <>
                      <p className="editorial-eyebrow mb-2">
                        Próximo evento
                      </p>
                      <p className="editorial-title-card mb-0.5">
                        {nextEventData.perfection.label}
                      </p>
                      <p className="editorial-body-muted">
                        {format(nextEventData.date, "d 'de' LLLL", { locale: es })}
                      </p>
                    </>
                  )}
                  
                  <div className="mt-5 border-t border-line-soft pt-4 flex justify-center">
                    <button
                      onClick={() => {
                        setSelectedDay(null);
                        setTimeout(() => navigate("/"), 50);
                      }}
                      className="editorial-button editorial-button--tertiary"
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
