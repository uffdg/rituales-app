import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getDailyRecords, getTodayDateKey, type DailyRecord } from "../lib/daily-service";
import { ArcanaArt, ARCANA_GOLD } from "./arcana/ArcanaArt";

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

function monthLabel(date: Date) {
  const raw = date.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function dayLabel(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map(Number);
  const raw = new Date(y, m - 1, d).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function timeLabel(createdAt?: string | null) {
  if (!createdAt) return null;
  return new Date(createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

// Calendario del perfil: cada día marca si la persona pidió intenciones y si
// sacó su arcano. Al tocar un día se ve el detalle.
export function DailyRecordsCalendar() {
  const location = useLocation();
  const sectionRef = useRef<HTMLElement | null>(null);
  const todayKey = getTodayDateKey();
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedKey, setSelectedKey] = useState(todayKey);
  const [records, setRecords] = useState<Map<string, DailyRecord>>(new Map());
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    if (location.hash === "#registro") {
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location.hash]);

  useEffect(() => {
    let cancelled = false;
    const from = getTodayDateKey(month);
    const to = getTodayDateKey(new Date(month.getFullYear(), month.getMonth() + 1, 0));
    setStatus("loading");

    getDailyRecords(from, to)
      .then((days) => {
        if (cancelled) return;
        setRecords(new Map(days.map((day) => [day.dateKey, day])));
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [month]);

  // Celdas del mes empezando en lunes; null = hueco antes del día 1.
  const cells = useMemo(() => {
    const leading = (month.getDay() + 6) % 7;
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [
      ...Array.from({ length: leading }, () => null),
      ...Array.from({ length: daysInMonth }, (_, i) =>
        getTodayDateKey(new Date(month.getFullYear(), month.getMonth(), i + 1)),
      ),
    ];
  }, [month]);

  const isCurrentMonth = getTodayDateKey(month).slice(0, 7) === todayKey.slice(0, 7);
  const selected = records.get(selectedKey) ?? null;

  const changeMonth = (delta: number) => {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  };

  return (
    <section id="registro" ref={sectionRef} className="mb-8 scroll-mt-6">
      <div className="mb-3 flex items-center justify-between">
        <p className="editorial-eyebrow" style={{ color: "var(--ink-muted)" }}>
          Tu registro diario
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            aria-label="Mes anterior"
            className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--ink-muted)] hover:bg-[var(--surface-muted)]"
          >
            <ChevronLeft size={16} strokeWidth={1.5} />
          </button>
          <span className="min-w-[124px] text-center font-sans text-[13px] font-light text-[var(--ink-strong)]">
            {monthLabel(month)}
          </span>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            disabled={isCurrentMonth}
            aria-label="Mes siguiente"
            className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--ink-muted)] hover:bg-[var(--surface-muted)] disabled:opacity-30"
          >
            <ChevronRight size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="rounded-[24px] bg-white p-4" style={{ border: "1px solid var(--border-soft)" }}>
        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((day, i) => (
            <span key={i} className="pb-1 font-sans text-[11px] font-medium text-[var(--ink-muted)]">
              {day}
            </span>
          ))}
          {cells.map((dateKey, i) => {
            if (!dateKey) return <span key={`empty-${i}`} />;
            const record = records.get(dateKey);
            const hasIntention = Boolean(record?.intentions.length);
            const hasCard = Boolean(record?.card);
            const isSelected = dateKey === selectedKey;
            const isToday = dateKey === todayKey;
            const isFuture = dateKey > todayKey;
            return (
              <button
                key={dateKey}
                type="button"
                disabled={isFuture}
                onClick={() => setSelectedKey(dateKey)}
                aria-pressed={isSelected}
                aria-label={`${dayLabel(dateKey)}${hasIntention ? ", con intención" : ""}${hasCard ? ", con arcano" : ""}`}
                className={`flex h-11 flex-col items-center justify-center rounded-xl font-sans text-[13px] transition-colors disabled:opacity-30 ${
                  isSelected
                    ? "bg-[var(--ink-strong)] text-white"
                    : isToday
                    ? "text-[var(--ink-strong)] ring-1 ring-[var(--ink-strong)]"
                    : "text-[var(--ink-body)] hover:bg-[var(--surface-muted)]"
                }`}
              >
                <span className="leading-none">{Number(dateKey.slice(8))}</span>
                <span className="mt-1 flex h-1.5 items-center gap-1" aria-hidden="true">
                  {hasIntention ? (
                    <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : "bg-[var(--ink-strong)]"}`} />
                  ) : null}
                  {hasCard ? (
                    <span className="h-1.5 w-1.5 rotate-45" style={{ background: ARCANA_GOLD }} />
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-center gap-4 font-sans text-[11px] font-light text-[var(--ink-muted)]">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--ink-strong)]" aria-hidden="true" /> Intención
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rotate-45" style={{ background: ARCANA_GOLD }} aria-hidden="true" /> Arcano
          </span>
        </div>
      </div>

      <div className="mt-4 rounded-[24px] bg-[var(--surface-soft)] p-5">
        <p className="font-sans text-[13px] font-medium text-[var(--ink-strong)]">{dayLabel(selectedKey)}</p>

        {status === "loading" ? (
          <p className="mt-3 font-sans text-[13px] font-light text-[var(--ink-muted)]">Cargando…</p>
        ) : status === "error" ? (
          <p className="mt-3 font-sans text-[13px] font-light text-[var(--ink-muted)]">
            No pudimos cargar tu registro. Probá de nuevo en un momento.
          </p>
        ) : !selected ? (
          <p className="mt-3 font-sans text-[13px] font-light text-[var(--ink-muted)]">No hay registros este día.</p>
        ) : (
          <div className="mt-4 space-y-5">
            {selected.card ? (
              <div className="flex gap-4">
                <div className="shrink-0">
                  <ArcanaArt id={selected.card.cardId} width={56} />
                </div>
                <div>
                  <p className="editorial-eyebrow" style={{ color: "var(--ink-muted)" }}>
                    Arcano · {selected.card.number}
                  </p>
                  <p className="mt-1 font-serif text-[20px] leading-[1.2] text-[var(--ink-strong)]" style={{ fontWeight: 400 }}>
                    {selected.card.name}
                  </p>
                  <p className="mt-2 font-sans text-[13px] font-light leading-[1.5] text-[var(--ink-body)]">
                    {selected.card.consejo}
                  </p>
                </div>
              </div>
            ) : null}

            {selected.intentions.length ? (
              <div>
                <p className="editorial-eyebrow" style={{ color: "var(--ink-muted)" }}>
                  {selected.intentions.length === 1 ? "Intención" : `Intenciones (${selected.intentions.length})`}
                </p>
                <ul className="mt-2 space-y-4">
                  {selected.intentions.map((intention, i) => (
                    <li key={`${intention.createdAt ?? i}`}>
                      <p className="whitespace-pre-line font-serif text-[17px] leading-[1.4] text-[var(--ink-strong)]" style={{ fontWeight: 400 }}>
                        {intention.intentionText}
                      </p>
                      <p className="mt-1 font-sans text-[12px] font-light text-[var(--ink-muted)]">
                        {timeLabel(intention.createdAt) ? `${timeLabel(intention.createdAt)} · ` : ""}
                        Deseabas: «{intention.inputText}»
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
