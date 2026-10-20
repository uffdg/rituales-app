import type { MouseEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Bookmark, BookmarkCheck, Loader2, LogOut, MoreHorizontal, Share2, Trash2 } from "lucide-react";
import {
  getJournalEntries,
  getJournalEntriesFromOwnRituals,
  getDominantElement,
  getLunarStreak,
  getJournalByDate,
} from "../lib/practice-journal";
import { buildCosmicDay } from "../lib/cosmic-calendar";
import { toast } from "sonner";
import { useUser } from "../context/UserContext";
import { useRitual } from "../context/RitualContext";
import { RitualGridCard } from "../components/RitualGridCard";
import { getUserFacingErrorMessage } from "../lib/errors";
import { DailyRecordsCalendar } from "../components/DailyRecordsCalendar";
import { BackLink } from "../components/BackLink";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

const ELEMENT_META: Record<string, { symbol: string; label: string }> = {
  fuego:  { symbol: "🜂", label: "Fuego" },
  agua:   { symbol: "🜄", label: "Agua" },
  tierra: { symbol: "🜃", label: "Tierra" },
  aire:   { symbol: "🜁", label: "Aire" },
};

const ELEMENT_FILTERS = [
  { id: "agua",   symbol: "~",  label: "Agua" },
  { id: "fuego",  symbol: "△",  label: "Fuego" },
  { id: "tierra", symbol: "▭",  label: "Tierra" },
  { id: "aire",   symbol: "≋",  label: "Aire" },
];

const PROFILE_PREFS_KEY = "rituales_profile_preferences_v1";

const PROFILE_PREF_GROUPS = [
  {
    key: "tone",
    label: "Tono",
    options: ["Directo", "Suave", "Profundo"],
  },
  {
    key: "time",
    label: "Momento",
    options: ["Mañana", "Tarde", "Noche"],
  },
  {
    key: "focus",
    label: "Foco",
    options: ["Claridad", "Calma", "Cerrar ciclo"],
  },
] as const;

type SourceFilter = "all" | "saved" | "own";
type PendingDelete = { id: string; mode: "favorites" | "own" };
type ProfilePrefKey = (typeof PROFILE_PREF_GROUPS)[number]["key"];
type ProfilePrefs = Record<ProfilePrefKey, string>;

function readProfilePrefs(): ProfilePrefs {
  const fallback = { tone: "Directo", time: "Mañana", focus: "Claridad" };
  try {
    return { ...fallback, ...JSON.parse(localStorage.getItem(PROFILE_PREFS_KEY) || "{}") };
  } catch {
    return fallback;
  }
}

export function Account() {
  const navigate = useNavigate();
  const {
    profile,
    user,
    savedRituals,
    ownRituals,
    saveRitual,
    removeSavedRitual,
    deleteOwnRitualById,
    updateProfileName,
    signOut,
  } = useUser();
  const { updateRitual, resetRitual, setSelectedPublicRitual, setViewMode } = useRitual();

  const [fullNameDraft, setFullNameDraft] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [profilePrefs, setProfilePrefs] = useState<ProfilePrefs>(readProfilePrefs);

  // Gallery filters
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [elementFilter, setElementFilter] = useState<string | null>(null);
  const [savingRitualId, setSavingRitualId] = useState<string | null>(null);

  // Dashboard data
  const now = useMemo(() => new Date(), []);
  const cosmicToday = useMemo(() => buildCosmicDay(now), [now]);
  const journalEntries = useMemo(
    () => (user ? getJournalEntriesFromOwnRituals(ownRituals) : getJournalEntries()),
    [user, ownRituals],
  );
  const dominantElement = useMemo(() => getDominantElement(journalEntries), [journalEntries]);
  const lunarStreak = useMemo(() => getLunarStreak(journalEntries), [journalEntries]);
  const recentActivity = useMemo(() => {
    const days: number[] = [];
    const byDate = getJournalByDate(journalEntries);
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push(byDate.get(key)?.length ?? 0);
    }
    return days;
  }, [journalEntries]);
  const weekTotal = recentActivity.reduce((a, b) => a + b, 0);
  const isActivityToday = (recentActivity[6] ?? 0) > 0;

  const dateLabel = useMemo(() => {
    const raw = now.toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [now]);

  // Saved ritual IDs for save-state lookup
  const savedRitualIds = useMemo(
    () => new Set(savedRituals.map((e) => e.ritual?.ritualId).filter(Boolean) as string[]),
    [savedRituals],
  );

  // Combined deduped gallery list (own first, then saved-only)
  const allEntries = useMemo(() => {
    const ownIds = new Set(ownRituals.map((e) => e.ritual?.ritualId).filter(Boolean));
    const savedOnly = savedRituals.filter(
      (e) => e.ritual?.ritualId && !ownIds.has(e.ritual.ritualId),
    );
    return [...ownRituals, ...savedOnly];
  }, [savedRituals, ownRituals]);

  const displayEntries = useMemo(() => {
    let list =
      sourceFilter === "saved" ? savedRituals
      : sourceFilter === "own"  ? ownRituals
      : allEntries;
    if (elementFilter) {
      list = list.filter(
        (e) => e.ritual?.element?.toLowerCase() === elementFilter,
      );
    }
    return list;
  }, [sourceFilter, elementFilter, allEntries, savedRituals, ownRituals]);

  useEffect(() => {
    setFullNameDraft(profile?.fullName || "");
  }, [profile?.fullName]);

  useEffect(() => {
    localStorage.setItem(PROFILE_PREFS_KEY, JSON.stringify(profilePrefs));
  }, [profilePrefs]);

  const setProfilePref = (key: ProfilePrefKey, value: string) => {
    setProfilePrefs((current) => ({ ...current, [key]: value }));
  };

  const handleSaveName = async () => {
    setIsSavingName(true);
    try {
      await updateProfileName(fullNameDraft.trim());
      toast("Nombre guardado", { description: "Tu perfil ya quedó actualizado." });
    } catch (error) {
      toast(getUserFacingErrorMessage(error, "No se pudo guardar tu nombre."));
    } finally {
      setIsSavingName(false);
    }
  };

  const openRitual = (entry: (typeof savedRituals)[number]) => {
    updateRitual(entry.ritual);
    setSelectedPublicRitual(null);
    setViewMode(false);
    navigate(`/ritual/${entry.ritual.ritualId || "nuevo"}`, { state: { fromAccount: true } });
  };

  const shareRitual = (entry: (typeof savedRituals)[number]) => {
    updateRitual(entry.ritual);
    setSelectedPublicRitual(null);
    setViewMode(false);
    navigate("/compartir");
  };

  const toggleSaveRitual = async (entry: (typeof savedRituals)[number]) => {
    const ritualId = entry.ritual?.ritualId;
    if (!ritualId || savingRitualId) return;
    setSavingRitualId(ritualId);
    try {
      const savedEntry = savedRituals.find((s) => s.ritual?.ritualId === ritualId);
      if (savedEntry) {
        await removeSavedRitual(savedEntry.id);
        toast("Se quitó de guardados");
      } else {
        await saveRitual(entry.ritual);
        toast("Ritual guardado ✓");
      }
    } catch (error) {
      toast(getUserFacingErrorMessage(error, "No se pudo actualizar."));
    } finally {
      setSavingRitualId(null);
    }
  };

  const handleToggleSave = (
    entry: (typeof savedRituals)[number],
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();
    void toggleSaveRitual(entry);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      if (pendingDelete.mode === "favorites") {
        await removeSavedRitual(pendingDelete.id);
        toast("Se quitó de guardados");
      } else {
        await deleteOwnRitualById(pendingDelete.id);
        toast("Ritual borrado");
      }
    } catch (error) {
      toast(
        getUserFacingErrorMessage(
          error,
          pendingDelete.mode === "favorites"
            ? "No se pudo quitar el ritual de guardados."
            : "No se pudo borrar el ritual.",
        ),
      );
    } finally {
      setPendingDelete(null);
    }
  };

  const totalCount = allEntries.length;

  return (
    <div className="min-h-screen flex flex-col bg-surface-page">
      <div className="editorial-radial-wash" aria-hidden="true" />

      {/* ── Top nav ── */}
      <div className="relative z-10 pt-12 px-6 pb-2 flex items-center justify-between">
        <BackLink />
        <button
          type="button"
          onClick={async () => { await signOut(); navigate("/"); }}
          className="editorial-back-link"
        >
          <LogOut size={14} strokeWidth={1.5} aria-hidden="true" />
          Salir
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 pb-16"
      >
        <div className="px-6">
          {/* ── Hero ── */}
          <div className="mb-8">
            <p className="editorial-eyebrow mb-2">
              {dateLabel} · {cosmicToday.moonEmoji} {cosmicToday.moonPhase}
            </p>
            <h1 className="font-serif text-title-1 text-ink-strong">
              {profile?.fullName ? (
                <>
                  <em className="italic font-light">Hola,</em> {profile.fullName}
                </>
              ) : (
                "Tu práctica"
              )}
            </h1>
          </div>

          {/* ── Registro diario: intenciones y arcanos ── */}
          <DailyRecordsCalendar />

          {/* ── Tu práctica — insight tiles ── */}
          <section className="mb-8">
            <p className="editorial-eyebrow mb-3">Tu práctica</p>
            <div className="grid grid-cols-2 gap-3">
              {/* Racha lunar */}
              <div
                className={`flex min-h-[148px] flex-col rounded-card p-4 ${
                  lunarStreak > 1 ? "bg-surface-inverse" : "border border-line-soft bg-surface-soft"
                }`}
              >
                <span
                  className={`mb-auto text-body-lg leading-none ${lunarStreak > 1 ? "text-on-ink-subtle" : "text-ink-subtle"}`}
                  aria-hidden="true"
                >
                  {lunarStreak > 1 ? cosmicToday.moonEmoji : "○"}
                </span>
                <div>
                  <p className={`mb-1 font-serif text-title-1 leading-none ${lunarStreak > 1 ? "text-on-ink-strong" : "text-ink-strong"}`}>
                    {lunarStreak}
                  </p>
                  <p className={`editorial-eyebrow mb-2.5 ${lunarStreak > 1 ? "editorial-eyebrow--on-dark" : ""}`}>
                    racha lunar
                  </p>
                  <div className="flex gap-[5px]" aria-hidden="true">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-[5px] w-[5px] rounded-full"
                        style={{
                          background:
                            i < Math.min(lunarStreak, 6)
                              ? lunarStreak > 1
                                ? "var(--on-ink-muted)"
                                : "var(--ink-strong)"
                              : lunarStreak > 1
                              ? "rgba(255,255,255,0.12)"
                              : "var(--line-default)",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Actividad reciente */}
              <div
                className={`flex min-h-[148px] flex-col rounded-card p-4 ${
                  isActivityToday ? "bg-surface-inverse" : "border border-line-soft bg-surface-soft"
                }`}
              >
                <p className={`editorial-eyebrow mb-auto ${isActivityToday ? "editorial-eyebrow--on-dark" : ""}`}>
                  7 días
                </p>
                <div>
                  <p className={`mb-1 font-serif text-title-1 leading-none ${isActivityToday ? "text-on-ink-strong" : "text-ink-strong"}`}>
                    {weekTotal}
                  </p>
                  <p className={`editorial-eyebrow mb-2.5 ${isActivityToday ? "editorial-eyebrow--on-dark" : ""}`}>
                    sesiones
                  </p>
                  <div className="flex items-end gap-[3px]" aria-hidden="true">
                    {recentActivity.map((count, i) => (
                      <div
                        key={i}
                        className="w-[7px] rounded-[2px]"
                        style={{
                          height: Math.max(3, count > 0 ? Math.min(count * 8, 26) : 3),
                          background:
                            count > 0
                              ? isActivityToday
                                ? "var(--on-ink-muted)"
                                : "var(--ink-strong)"
                              : isActivityToday
                              ? "rgba(255,255,255,0.12)"
                              : "var(--line-default)",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Elemento dominante */}
              <div className="flex flex-col rounded-card border border-line-soft bg-surface-soft p-4">
                <span
                  className={`mb-auto text-body-lg leading-none ${dominantElement ? "text-ink-muted" : "text-ink-subtle"}`}
                  aria-hidden="true"
                >
                  {dominantElement ? (ELEMENT_META[dominantElement]?.symbol ?? "◯") : "◯"}
                </span>
                <div>
                  <p
                    className={`mb-1 font-serif leading-none ${
                      dominantElement ? "text-title-3 italic text-ink-strong" : "text-title-2 text-ink-subtle"
                    }`}
                  >
                    {dominantElement
                      ? (ELEMENT_META[dominantElement]?.label ?? dominantElement)
                      : "—"}
                  </p>
                  <p className="editorial-eyebrow">
                    elemento
                    <br />
                    dominante
                  </p>
                </div>
              </div>

              {/* Total sesiones */}
              <div className="flex flex-col rounded-card border border-line-soft bg-surface-soft p-4">
                <span className="mb-auto text-caption leading-none text-ink-decor" aria-hidden="true">
                  ✦
                </span>
                <div>
                  <p className="mb-1 font-serif text-title-1 leading-none text-ink-strong">
                    {journalEntries.length}
                  </p>
                  <p className="editorial-eyebrow">
                    sesiones
                    <br />
                    totales
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── Anclas recientes ── */}
          {journalEntries.length > 0 && (
            <section className="mb-8">
              <p className="editorial-eyebrow mb-3">Anclas recientes</p>
              <div className="editorial-card editorial-card--soft flex flex-col gap-4 p-5">
                {journalEntries
                  .slice(-5)
                  .reverse()
                  .map((entry, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="mt-2 h-[5px] w-[5px] shrink-0 rounded-full bg-line-strong" aria-hidden="true" />
                      <div className="flex-1 min-w-0">
                        {/* Cita chica: sans (la serif es solo para titulares). */}
                        <p className="font-sans text-title-4 text-ink-strong">"{entry.anchor}"</p>
                        <p className="mt-1 font-sans text-caption text-ink-muted">
                          {entry.moonPhase} ·{" "}
                          {new Date(entry.completedAt).toLocaleDateString("es-AR", {
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          )}
        </div>

        {/* ── Galería de rituales ── */}
        <section className="mb-8">
          <div className="px-6 editorial-section-header">
            <p className="editorial-eyebrow">Tus rituales</p>
            {totalCount > 0 && (
              <span className="font-sans text-caption text-ink-muted">
                {displayEntries.length} de {totalCount}
              </span>
            )}
          </div>

          {/* Filtros: origen y elemento */}
          <div className="hide-scrollbar mb-3 flex gap-2 overflow-x-auto px-6">
            {(
              [
                { id: "all",   label: "Todos" },
                { id: "saved", label: "Guardados" },
                { id: "own",   label: "Propios" },
              ] as { id: SourceFilter; label: string }[]
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSourceFilter(f.id)}
                aria-pressed={sourceFilter === f.id}
                className="editorial-chip shrink-0 px-4"
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="hide-scrollbar mb-5 flex gap-2 overflow-x-auto px-6">
            <button
              type="button"
              onClick={() => setElementFilter(null)}
              aria-pressed={!elementFilter}
              className="editorial-chip-outline shrink-0"
            >
              Todos los elementos
            </button>
            {ELEMENT_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setElementFilter(elementFilter === f.id ? null : f.id)}
                aria-pressed={elementFilter === f.id}
                className={`editorial-chip-outline shrink-0 ${elementFilter === f.id ? "editorial-chip-outline-active" : ""}`}
              >
                <span aria-hidden="true">{f.symbol}</span> {f.label}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="px-6">
            {displayEntries.length === 0 ? (
              <div className="editorial-card editorial-card--soft px-5 py-10 text-center">
                <p className="mb-1.5 font-serif text-title-3 text-ink-strong">
                  {sourceFilter === "saved"
                    ? "Todavía no guardaste rituales"
                    : sourceFilter === "own"
                    ? "Todavía no creaste rituales"
                    : "No hay rituales con ese filtro"}
                </p>
                <p className="mx-auto mb-5 max-w-[280px] font-sans text-body text-ink-muted">
                  {elementFilter
                    ? `Probá otro elemento o quitá el filtro.`
                    : sourceFilter === "saved"
                    ? "Cuando toques guardar, van a aparecer acá."
                    : "Tus rituales creados van a quedar acá."}
                </p>
                {/* Estado vacío: siempre con una acción (spec 03). */}
                {elementFilter ? (
                  <button type="button" onClick={() => setElementFilter(null)} className="editorial-button editorial-button--secondary">
                    Quitar el filtro
                  </button>
                ) : sourceFilter === "saved" ? (
                  <button type="button" onClick={() => navigate("/explorar")} className="editorial-button editorial-button--secondary">
                    Explorar rituales
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      resetRitual();
                      setViewMode(false);
                      navigate("/crear/1");
                    }}
                    className="editorial-button editorial-button--secondary"
                  >
                    Crear un ritual
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {displayEntries.map((entry) => {
                  const rawElement = entry.ritual?.element ?? "";
                  const elementDisplay = rawElement
                    ? rawElement.charAt(0).toUpperCase() + rawElement.slice(1)
                    : "Agua";
                  const ritualId = entry.ritual?.ritualId || entry.id;
                  const saved = savedRitualIds.has(entry.ritual?.ritualId ?? "");
                  const saving = savingRitualId === entry.ritual?.ritualId;
                  const isOwn = ownRituals.some((o) => o.id === entry.id);

                  return (
                    <div key={entry.id} className="relative">
                      <RitualGridCard
                        id={ritualId}
                        title={entry.ritual?.aiRitual?.title || "Ritual personal"}
                        type={entry.ritual?.ritualType || ""}
                        element={elementDisplay}
                        duration={entry.ritual?.duration ?? 10}
                        saved={saved}
                        saving={saving}
                        showSaveButton={!isOwn}
                        imageAspect="4/5"
                        onOpen={() => openRitual(entry)}
                        onSave={(event) => handleToggleSave(entry, event)}
                      />
                      {/* Context menu — own rituals only */}
                      {isOwn && (
                        <div className="absolute top-0 right-0">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                onClick={(event) => event.stopPropagation()}
                                className="group flex h-11 w-11 items-center justify-center"
                                aria-label="Más acciones"
                              >
                                {/* Círculo visible de 28; área táctil de 44. */}
                                <span
                                  className="flex h-7 w-7 items-center justify-center rounded-full transition-transform group-active:scale-90"
                                  style={{ background: "rgba(0,0,0,0.32)", backdropFilter: "blur(8px)" }}
                                >
                                  <MoreHorizontal size={14} strokeWidth={1.8} color="rgba(255,255,255,0.88)" />
                                </span>
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <DropdownMenuItem
                                onClick={(event) => {
                                  event.stopPropagation();
                                  if (!saved && !saving) void toggleSaveRitual(entry);
                                }}
                                disabled={saved || saving}
                              >
                                {saving ? (
                                  <Loader2 size={14} strokeWidth={1.8} className="animate-spin" />
                                ) : saved ? (
                                  <BookmarkCheck size={14} strokeWidth={1.8} />
                                ) : (
                                  <Bookmark size={14} strokeWidth={1.8} />
                                )}
                                {saving ? "Guardando" : saved ? "Guardado" : "Guardar"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(event) => {
                                  event.stopPropagation();
                                  shareRitual(entry);
                                }}
                              >
                                <Share2 size={14} strokeWidth={1.8} />
                                Compartir
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setPendingDelete({ id: entry.id, mode: "own" });
                                }}
                                variant="danger"
                              >
                                <Trash2 size={14} strokeWidth={1.8} color="var(--danger)" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* ── Tu cuenta ── */}
        <div className="px-6">
          <div className="mb-6 h-px bg-line-soft" />
          <p className="editorial-eyebrow mb-3">Tu cuenta</p>
          <div className="editorial-card editorial-card--flat p-5">
            <p className="editorial-field-label mb-1">Email</p>
            <p className="mb-5 font-sans text-body text-ink-muted">{user?.email || ""}</p>

            <div className="editorial-field">
              <label htmlFor="account-name" className="editorial-field-label">
                Nombre
              </label>
              <input
                id="account-name"
                value={fullNameDraft}
                onChange={(event) => setFullNameDraft(event.target.value)}
                placeholder="Cómo querés aparecer"
                className="editorial-input"
              />
              <button
                type="button"
                onClick={handleSaveName}
                disabled={isSavingName}
                aria-busy={isSavingName}
                className="editorial-button editorial-button--primary self-end"
              >
                Guardar
              </button>
            </div>

            <div className="mt-6 border-t border-line-soft pt-5">
              <p className="editorial-eyebrow mb-2">Cómo querés que te acompañe la app</p>
              <p className="mb-4 font-sans text-body text-ink-muted">
                Esto ayuda a ordenar futuras recomendaciones. Podés cambiarlo cuando quieras.
              </p>
              <div className="space-y-4">
                {PROFILE_PREF_GROUPS.map((group) => (
                  <div key={group.key} role="group" aria-label={group.label}>
                    <p className="editorial-field-label mb-2">{group.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {group.options.map((option) => {
                        const isActive = profilePrefs[group.key] === option;
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setProfilePref(group.key, option)}
                            aria-pressed={isActive}
                            className="editorial-chip px-3.5"
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <p className="editorial-eyebrow">Confirmar acción</p>
            <AlertDialogTitle>
              Borrar ritual
            </AlertDialogTitle>
            <AlertDialogDescription>
              Este ritual se va a borrar de forma permanente. Este cambio no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Sí, borrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
