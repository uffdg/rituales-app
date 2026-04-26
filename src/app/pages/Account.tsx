import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { LogOut } from "lucide-react";
import { getDailyAnchorContent, getDailyAnchorJourney } from "../lib/daily-anchor";
import { getJournalEntries, getDominantElement, getLunarStreak } from "../lib/practice-journal";
import { buildCosmicDay } from "../lib/cosmic-calendar";
import { toast } from "sonner";
import { useUser } from "../context/UserContext";
import { useRitual } from "../context/RitualContext";
import { deriveCandleGuide } from "../lib/candle";
import { RitualListCard } from "../components/RitualListCard";
import { getUserFacingErrorMessage } from "../lib/errors";
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

const ELEMENT_META: Record<string, { symbol: string; label: string }> = {
  fuego:  { symbol: "🜂", label: "Fuego" },
  agua:   { symbol: "🜄", label: "Agua" },
  tierra: { symbol: "🜃", label: "Tierra" },
  aire:   { symbol: "🜁", label: "Aire" },
};

const STEP_LABELS = ["Inicio", "Momento", "Cierre"];

type PendingDelete = { id: string; mode: "favorites" | "own" };

export function Account() {
  const navigate = useNavigate();
  const {
    profile,
    user,
    savedRituals,
    ownRituals,
    removeSavedRitual,
    deleteOwnRitualById,
    updateProfileName,
    signOut,
  } = useUser();
  const { updateRitual, setSelectedPublicRitual, setViewMode } = useRitual();
  const [fullNameDraft, setFullNameDraft] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [activeTab, setActiveTab] = useState<"favorites" | "own">("favorites");
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);

  const now = useMemo(() => new Date(), []);
  const cosmicToday = useMemo(() => buildCosmicDay(now), [now]);
  const journalEntries = useMemo(() => getJournalEntries(), []);
  const dominantElement = useMemo(() => getDominantElement(journalEntries), [journalEntries]);
  const lunarStreak = useMemo(() => getLunarStreak(journalEntries), [journalEntries]);
  const todayIntention = getDailyAnchorContent().inicio?.text?.trim() || null;
  const journey = getDailyAnchorJourney();

  const dateLabel = useMemo(() => {
    const raw = now.toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [now]);

  useEffect(() => {
    setFullNameDraft(profile?.fullName || "");
  }, [profile?.fullName]);

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

  const renderList = (entries: typeof savedRituals, mode: "favorites" | "own") => {
    if (!entries.length) {
      return (
        <div
          className="rounded-3xl border px-5 py-8 text-center"
          style={{ borderColor: "var(--border-soft)", background: "var(--surface-softest)" }}
        >
          <p
            style={{
              fontFamily: "var(--font-serif-display)",
              fontSize: "22px",
              color: "var(--ink-muted)",
              marginBottom: "6px",
            }}
          >
            {mode === "favorites" ? "Todavía no guardaste rituales" : "Todavía no creaste rituales"}
          </p>
          <p
            style={{
              fontFamily: "var(--font-sans-ui)",
              fontSize: "12px",
              color: "var(--ink-subtle)",
              lineHeight: 1.6,
            }}
          >
            {mode === "favorites"
              ? "Cuando toques guardar, van a aparecer acá."
              : "Tus rituales creados van a quedar listados en esta sección."}
          </p>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-3">
        {entries.map((entry) => {
          const candleGuide = deriveCandleGuide({
            ritualType: entry.ritual.ritualType,
            intention: entry.ritual.intention,
            energy: entry.ritual.energy,
            title: entry.ritual.aiRitual?.title,
            opening: entry.ritual.aiRitual?.opening,
            symbolicAction: entry.ritual.aiRitual?.symbolicAction,
            closing: entry.ritual.aiRitual?.closing,
          });
          return (
            <div key={`${mode}-${entry.id}`}>
              <RitualListCard
                title={entry.ritual.aiRitual?.title || "Ritual personal"}
                meta={[
                  ...(entry.ritual.element
                    ? [entry.ritual.element.charAt(0).toUpperCase() + entry.ritual.element.slice(1)]
                    : []),
                  ...(entry.ritual.duration ? [`${entry.ritual.duration} min`] : []),
                  `Vela ${candleGuide.color}`,
                ]}
                likes={entry.likesCount || 0}
                saved={false}
                actionKind="delete"
                actionLabel={mode === "favorites" ? "Quitar de guardados" : "Borrar ritual"}
                onOpen={() => openRitual(entry)}
                onSave={(event) => {
                  event.stopPropagation();
                  setPendingDelete({ id: entry.id, mode });
                }}
              />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--app-page)" }}>
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 50% 0%, rgba(0,0,0,0.04) 0%, transparent 60%)",
        }}
      />

      {/* ── Top nav ── */}
      <div className="relative z-10 pt-14 px-6 pb-4 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[var(--ink-muted)] hover:text-[var(--ink-strong)] transition-colors"
          style={{ fontFamily: "var(--font-sans-ui)", fontSize: "13px" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Volver
        </button>
        <button
          onClick={async () => { await signOut(); navigate("/"); }}
          className="flex items-center gap-1.5 text-[var(--ink-subtle)] hover:text-[var(--ink-strong)] transition-colors"
          style={{ fontFamily: "var(--font-sans-ui)", fontSize: "12px" }}
        >
          <LogOut size={12} strokeWidth={1.5} />
          Salir
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 px-6 pb-16"
      >
        {/* ── Hero ── */}
        <div className="mb-7">
          <p
            style={{
              fontFamily: "var(--font-sans-ui)",
              fontSize: "10px",
              fontWeight: 500,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--ink-soft)",
              marginBottom: "8px",
            }}
          >
            {dateLabel} · {cosmicToday.moonEmoji} {cosmicToday.moonPhase}
          </p>
          <h1
            style={{
              fontFamily: "var(--font-serif-display)",
              fontSize: "34px",
              fontWeight: 400,
              color: "var(--ink-strong)",
              lineHeight: 1.1,
            }}
          >
            {profile?.fullName ? (
              <>
                <em style={{ fontStyle: "italic", fontWeight: 300 }}>Hola,</em>{" "}
                {profile.fullName}
              </>
            ) : (
              "Tu práctica"
            )}
          </h1>
        </div>

        {/* ── Intención del día ── */}
        <section className="mb-6">
          {todayIntention ? (
            <div className="rounded-[24px] p-5" style={{ background: "var(--ink-strong)" }}>
              <p
                style={{
                  fontFamily: "var(--font-sans-ui)",
                  fontSize: "9px",
                  fontWeight: 500,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.38)",
                  marginBottom: "12px",
                }}
              >
                Intención de hoy
              </p>
              <p
                style={{
                  fontFamily: "var(--font-serif-display)",
                  fontSize: "22px",
                  fontWeight: 400,
                  fontStyle: "italic",
                  color: "#fff",
                  lineHeight: 1.35,
                  marginBottom: "20px",
                }}
              >
                "{todayIntention}"
              </p>
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "14px" }}>
                <p
                  style={{
                    fontFamily: "var(--font-sans-ui)",
                    fontSize: "9px",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.3)",
                    marginBottom: "10px",
                  }}
                >
                  Recorrido de hoy
                </p>
                <div className="flex gap-2">
                  {STEP_LABELS.map((label, i) => (
                    <div key={label} className="flex-1 flex flex-col gap-1.5">
                      <div
                        style={{
                          height: "3px",
                          borderRadius: "99px",
                          background:
                            i < journey.completedCount
                              ? "rgba(255,255,255,0.82)"
                              : "rgba(255,255,255,0.12)",
                        }}
                      />
                      <span
                        style={{
                          fontFamily: "var(--font-sans-ui)",
                          fontSize: "9px",
                          color:
                            i < journey.completedCount
                              ? "rgba(255,255,255,0.55)"
                              : "rgba(255,255,255,0.22)",
                        }}
                      >
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div
              className="rounded-[24px] p-5"
              style={{ border: "1px dashed rgba(15,23,42,0.14)" }}
            >
              <p
                style={{
                  fontFamily: "var(--font-serif-display)",
                  fontSize: "19px",
                  fontWeight: 400,
                  color: "var(--ink-muted)",
                  lineHeight: 1.4,
                  marginBottom: "14px",
                }}
              >
                Todavía no registraste
                <br />
                tu intención de hoy.
              </p>
              <button
                onClick={() => navigate("/")}
                className="rounded-full px-4 py-2.5 transition-all active:scale-[0.97]"
                style={{
                  background: "var(--ink-strong)",
                  color: "#fff",
                  fontFamily: "var(--font-sans-ui)",
                  fontSize: "12px",
                }}
              >
                Registrar inicio
              </button>
            </div>
          )}
        </section>

        {/* ── Tu práctica — insight tiles ── */}
        <section className="mb-6">
          <p
            style={{
              fontFamily: "var(--font-sans-ui)",
              fontSize: "10px",
              fontWeight: 500,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--ink-soft)",
              marginBottom: "12px",
            }}
          >
            Tu práctica
          </p>
          <div className="grid grid-cols-3 gap-2.5">

            {/* Racha lunar */}
            <div
              className="rounded-[20px] px-3.5 py-4 flex flex-col"
              style={{
                background: lunarStreak > 1 ? "var(--ink-strong)" : "var(--surface-softest)",
                border: lunarStreak > 1 ? "none" : "1px solid var(--border-soft)",
              }}
            >
              <span
                style={{
                  fontSize: "14px",
                  lineHeight: 1,
                  marginBottom: "10px",
                  color: lunarStreak > 1 ? "rgba(255,255,255,0.5)" : "var(--ink-soft)",
                }}
              >
                {lunarStreak > 1 ? cosmicToday.moonEmoji : "○"}
              </span>
              <p
                style={{
                  fontFamily: "var(--font-serif-display)",
                  fontSize: "30px",
                  fontWeight: 400,
                  lineHeight: 1,
                  color: lunarStreak > 1 ? "#fff" : "var(--ink-strong)",
                  marginBottom: "6px",
                }}
              >
                {lunarStreak}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-sans-ui)",
                  fontSize: "9px",
                  fontWeight: 500,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: lunarStreak > 1 ? "rgba(255,255,255,0.4)" : "var(--ink-soft)",
                  lineHeight: 1.4,
                }}
              >
                racha
                <br />
                lunar
              </p>
            </div>

            {/* Elemento dominante */}
            <div
              className="rounded-[20px] px-3.5 py-4 flex flex-col"
              style={{
                background: "var(--surface-softest)",
                border: "1px solid var(--border-soft)",
              }}
            >
              <span
                style={{
                  fontSize: "15px",
                  lineHeight: 1,
                  marginBottom: "8px",
                  color: dominantElement ? "var(--ink-muted)" : "var(--ink-soft)",
                }}
              >
                {dominantElement ? (ELEMENT_META[dominantElement]?.symbol ?? "◯") : "◯"}
              </span>
              <p
                style={{
                  fontFamily: "var(--font-serif-display)",
                  fontSize: dominantElement ? "17px" : "26px",
                  fontWeight: 400,
                  lineHeight: 1,
                  color: dominantElement ? "var(--ink-strong)" : "var(--ink-soft)",
                  marginBottom: "6px",
                  fontStyle: dominantElement ? "italic" : "normal",
                }}
              >
                {dominantElement ? (ELEMENT_META[dominantElement]?.label ?? dominantElement) : "—"}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-sans-ui)",
                  fontSize: "9px",
                  fontWeight: 500,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--ink-soft)",
                  lineHeight: 1.4,
                }}
              >
                elemento
                <br />
                dominante
              </p>
            </div>

            {/* Rituales creados */}
            <div
              className="rounded-[20px] px-3.5 py-4 flex flex-col"
              style={{
                background: "var(--surface-softest)",
                border: "1px solid var(--border-soft)",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  lineHeight: 1,
                  marginBottom: "10px",
                  color: "var(--ink-soft)",
                }}
              >
                ✦
              </span>
              <p
                style={{
                  fontFamily: "var(--font-serif-display)",
                  fontSize: "30px",
                  fontWeight: 400,
                  lineHeight: 1,
                  color: "var(--ink-strong)",
                  marginBottom: "6px",
                }}
              >
                {ownRituals.length}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-sans-ui)",
                  fontSize: "9px",
                  fontWeight: 500,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--ink-soft)",
                  lineHeight: 1.4,
                }}
              >
                rituales
                <br />
                creados
              </p>
            </div>
          </div>
        </section>

        {/* ── Anclas recientes ── */}
        {journalEntries.length > 0 && (
          <section className="mb-8">
            <p
              style={{
                fontFamily: "var(--font-sans-ui)",
                fontSize: "10px",
                fontWeight: 500,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--ink-soft)",
                marginBottom: "12px",
              }}
            >
              Anclas recientes
            </p>
            <div
              className="rounded-[24px] border p-5 flex flex-col gap-4"
              style={{ borderColor: "var(--border-soft)", background: "#FAFAF9" }}
            >
              {journalEntries
                .slice(-5)
                .reverse()
                .map((entry, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: "var(--border-strong)",
                        marginTop: 8,
                        flexShrink: 0,
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        style={{
                          fontFamily: "var(--font-serif-display)",
                          fontSize: "16px",
                          fontWeight: 400,
                          color: "var(--ink-strong)",
                          lineHeight: 1.4,
                        }}
                      >
                        "{entry.anchor}"
                      </p>
                      <p
                        style={{
                          fontFamily: "var(--font-sans-ui)",
                          fontSize: "10px",
                          color: "var(--ink-soft)",
                          marginTop: "3px",
                          letterSpacing: "0.04em",
                        }}
                      >
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

        {/* ── Tus rituales ── */}
        <section className="mb-8">
          <p
            style={{
              fontFamily: "var(--font-sans-ui)",
              fontSize: "10px",
              fontWeight: 500,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--ink-soft)",
              marginBottom: "12px",
            }}
          >
            Tus rituales
          </p>

          <div className="inline-flex rounded-full border border-[rgba(0,0,0,0.08)] p-1 bg-[var(--surface-softest)] mb-4">
            <button
              onClick={() => setActiveTab("favorites")}
              className={`px-4 py-2 rounded-full transition-colors ${
                activeTab === "favorites"
                  ? "bg-[var(--ink-strong)] text-white"
                  : "text-[var(--ink-muted)]"
              }`}
              style={{ fontFamily: "var(--font-sans-ui)", fontSize: "12px", fontWeight: 500 }}
            >
              Guardados
            </button>
            <button
              onClick={() => setActiveTab("own")}
              className={`px-4 py-2 rounded-full transition-colors ${
                activeTab === "own"
                  ? "bg-[var(--ink-strong)] text-white"
                  : "text-[var(--ink-muted)]"
              }`}
              style={{ fontFamily: "var(--font-sans-ui)", fontSize: "12px", fontWeight: 500 }}
            >
              Propios
            </button>
          </div>

          {activeTab === "favorites"
            ? renderList(savedRituals, "favorites")
            : renderList(ownRituals, "own")}
        </section>

        {/* ── Tu cuenta ── */}
        <section>
          <div
            style={{ height: "1px", background: "var(--border-soft)", marginBottom: "24px" }}
          />
          <p
            style={{
              fontFamily: "var(--font-sans-ui)",
              fontSize: "10px",
              fontWeight: 500,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--ink-soft)",
              marginBottom: "14px",
            }}
          >
            Tu cuenta
          </p>
          <div
            className="rounded-[24px] border bg-white p-5"
            style={{ borderColor: "var(--border-soft)" }}
          >
            <p
              style={{
                fontFamily: "var(--font-sans-ui)",
                fontSize: "10px",
                fontWeight: 500,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--ink-soft)",
                marginBottom: "4px",
              }}
            >
              Email
            </p>
            <p
              style={{
                fontFamily: "var(--font-sans-ui)",
                fontSize: "13px",
                color: "var(--ink-muted)",
                marginBottom: "18px",
              }}
            >
              {user?.email || ""}
            </p>

            <label
              style={{
                display: "block",
                fontFamily: "var(--font-sans-ui)",
                fontSize: "10px",
                fontWeight: 500,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--ink-soft)",
                marginBottom: "6px",
              }}
            >
              Nombre
            </label>
            <div className="flex flex-col gap-3">
              <input
                value={fullNameDraft}
                onChange={(event) => setFullNameDraft(event.target.value)}
                placeholder="Cómo querés aparecer"
                className="w-full px-5 py-4 rounded-[28px] border border-[rgba(0,0,0,0.08)] bg-[var(--surface-softest)] outline-none"
                style={{
                  fontFamily: "var(--font-serif-display)",
                  fontSize: "22px",
                  color: "var(--ink-strong)",
                }}
              />
              <button
                onClick={handleSaveName}
                disabled={isSavingName}
                className="self-end editorial-button-primary px-6 py-3"
              >
                Guardar
              </button>
            </div>
          </div>
        </section>
      </motion.div>

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent className="max-w-[calc(100%-2.5rem)] rounded-[28px] border border-[rgba(0,0,0,0.08)] bg-white px-6 py-6 shadow-[0_20px_60px_rgba(0,0,0,0.12)] sm:max-w-[420px]">
          <AlertDialogHeader className="text-left">
            <p
              style={{
                fontFamily: "var(--font-sans-ui)",
                fontSize: "10px",
                fontWeight: 500,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--ink-soft)",
              }}
            >
              Confirmar acción
            </p>
            <AlertDialogTitle
              style={{
                fontFamily: "var(--font-serif-display)",
                fontSize: "30px",
                fontWeight: 400,
                color: "var(--ink-strong)",
                lineHeight: 1.1,
              }}
            >
              {pendingDelete?.mode === "favorites" ? "Quitar de guardados" : "Borrar ritual"}
            </AlertDialogTitle>
            <AlertDialogDescription
              style={{
                fontFamily: "var(--font-sans-ui)",
                fontSize: "14px",
                color: "var(--ink-muted)",
                lineHeight: 1.6,
              }}
            >
              {pendingDelete?.mode === "favorites"
                ? "Este ritual va a salir de tus favoritos. Este cambio no se puede deshacer."
                : "Este ritual se va a borrar de forma permanente. Este cambio no se puede deshacer."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2 gap-2 sm:justify-end">
            <AlertDialogCancel
              className="rounded-[20px] border-[rgba(0,0,0,0.08)] px-5 py-3 text-[var(--ink-muted)]"
              style={{ fontFamily: "var(--font-sans-ui)", fontSize: "13px" }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="editorial-button-primary px-5 py-3"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
