import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Bookmark, Heart, LogOut, Sparkles } from "lucide-react";
import {
  getDominantElement,
  getJournalEntries,
  getJournalEntriesFromOwnRituals,
  getLunarStreak,
} from "../lib/practice-journal";
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

type PendingDelete = {
  id: string;
  mode: "favorites" | "own";
};

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
    likesReceived,
    signOut,
  } = useUser();
  const { updateRitual, setSelectedPublicRitual, setViewMode } = useRitual();
  const [fullNameDraft, setFullNameDraft] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [activeTab, setActiveTab] = useState<"favorites" | "own">("favorites");
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);

  const journalEntries = useMemo(
    () => (user ? getJournalEntriesFromOwnRituals(ownRituals) : getJournalEntries()),
    [user, ownRituals],
  );
  const dominantElement = useMemo(() => getDominantElement(journalEntries), [journalEntries]);
  const lunarStreak = useMemo(() => getLunarStreak(journalEntries), [journalEntries]);

  const ELEMENT_DESCRIPTIONS: Record<string, { symbol: string; text: string }> = {
    fuego:  { symbol: "🜂", text: "Practicás desde la acción, la transformación y el deseo." },
    agua:   { symbol: "🜄", text: "Tu práctica nace de la intuición, la emoción y la profundidad." },
    tierra: { symbol: "🜃", text: "Te movés desde la constancia, el cuerpo y lo concreto." },
    aire:   { symbol: "🜁", text: "Conectás desde el pensamiento, la claridad y la visión." },
  };

  useEffect(() => {
    setFullNameDraft(profile?.fullName || "");
  }, [profile?.fullName]);

  const handleSaveName = async () => {
    setIsSavingName(true);
    try {
      await updateProfileName(fullNameDraft.trim());
      toast("Nombre guardado", {
        description: "Tu perfil ya quedó actualizado.",
      });
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

  const renderList = (
    entries: typeof savedRituals,
    mode: "favorites" | "own",
  ) => {
    if (!entries.length) {
      return (
        <div className="rounded-3xl border px-5 py-8 text-center" style={{ borderColor: "var(--border-soft)", background: "var(--surface-softest)" }}>
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
            <div key={`${mode}-${entry.id}`} className="relative">
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
        <div className="min-h-screen bg-[var(--app-page)] flex flex-col overflow-y-auto">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 50% 0%, rgba(0,0,0,0.04) 0%, transparent 60%)",
        }}
      />

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
          onClick={async () => {
            await signOut();
            navigate("/");
          }}
          className="flex items-center gap-2 text-[var(--ink-subtle)] hover:text-[var(--ink-strong)] transition-colors"
          style={{ fontFamily: "var(--font-sans-ui)", fontSize: "12px" }}
        >
          <LogOut size={13} strokeWidth={1.5} />
          Salir
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 px-6 pb-12"
      >
        <div className="mb-8">
          <p
            style={{
              fontFamily: "var(--font-sans-ui)",
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--ink-soft)",
              marginBottom: "8px",
            }}
          >
            Tu cuenta
          </p>
          <h1
            style={{
              fontFamily: "var(--font-serif-display)",
              fontSize: "32px",
              fontWeight: 400,
              color: "var(--ink-strong)",
              lineHeight: 1.15,
            }}
          >
            Tu perfil y tus rituales
          </h1>
        </div>

        <div className="rounded-3xl border border-[rgba(0,0,0,0.06)] bg-white p-5 mb-6">
          <p
            style={{
              fontFamily: "var(--font-sans-ui)",
              fontSize: "10px",
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--ink-soft)",
              marginBottom: "6px",
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

        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: "Favoritos", value: savedRituals.length, icon: Bookmark },
            { label: "Propios", value: ownRituals.length, icon: Sparkles },
            { label: "Likes", value: likesReceived, icon: Heart },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-3xl border border-[rgba(0,0,0,0.06)] bg-[var(--surface-softest)] px-4 py-4"
            >
              <item.icon size={15} strokeWidth={1.5} className="text-[var(--ink-subtle)] mb-3" />
              <p
                style={{
                  fontFamily: "var(--font-serif-display)",
                  fontSize: "26px",
                  color: "var(--ink-strong)",
                  lineHeight: 1,
                }}
              >
                {item.value}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-sans-ui)",
                  fontSize: "10px",
                  color: "var(--ink-soft)",
                  marginTop: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                {item.label}
              </p>
            </div>
          ))}
        </div>

        {/* ── Tu práctica ── */}
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
              Tu práctica
            </p>

            <div className="rounded-3xl border border-[rgba(0,0,0,0.06)] bg-[#FAFAF9] p-5 flex flex-col gap-5">

              {/* Elemento dominante */}
              {dominantElement && ELEMENT_DESCRIPTIONS[dominantElement] && (
                <div>
                  <p style={{ fontFamily: "var(--font-sans-ui)", fontSize: "10px", color: "var(--ink-soft)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
                    Elemento dominante
                  </p>
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: 22, lineHeight: 1 }}>
                      {ELEMENT_DESCRIPTIONS[dominantElement].symbol}
                    </span>
                    <div>
                      <p style={{ fontFamily: "var(--font-serif-display)", fontSize: 20, color: "var(--ink-strong)", lineHeight: 1.2, textTransform: "capitalize" }}>
                        {dominantElement}
                      </p>
                      <p style={{ fontFamily: "var(--font-sans-ui)", fontSize: 12, color: "var(--ink-muted)", lineHeight: 1.5, marginTop: 2 }}>
                        {ELEMENT_DESCRIPTIONS[dominantElement].text}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Racha lunar */}
              {lunarStreak >= 2 && (
                <div>
                  <p style={{ fontFamily: "var(--font-sans-ui)", fontSize: "10px", color: "var(--ink-soft)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
                    Práctica continua
                  </p>
                  <p style={{ fontFamily: "var(--font-serif-display)", fontSize: 20, color: "var(--ink-strong)", lineHeight: 1.2 }}>
                    ✦ {lunarStreak} lunas en práctica continua
                  </p>
                  <p style={{ fontFamily: "var(--font-sans-ui)", fontSize: 12, color: "var(--ink-subtle)", marginTop: 4, lineHeight: 1.5 }}>
                    Hiciste al menos un ritual en {lunarStreak} fases lunares consecutivas.
                  </p>
                </div>
              )}

              {/* Diario de anclas */}
              <div>
                <p style={{ fontFamily: "var(--font-sans-ui)", fontSize: "10px", color: "var(--ink-soft)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
                  Tus anclas recientes
                </p>
                <div className="flex flex-col gap-3">
                  {journalEntries
                    .slice(-5)
                    .reverse()
                    .map((entry, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: "#D0CBC4",
                            marginTop: 7,
                            flexShrink: 0,
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            style={{
                              fontFamily: "var(--font-serif-display)",
                              fontSize: 16,
                              color: "var(--ink-strong)",
                              lineHeight: 1.4,
                            }}
                          >
                            "{entry.anchor}"
                          </p>
                          <p style={{ fontFamily: "var(--font-sans-ui)", fontSize: 10, color: "var(--ink-soft)", marginTop: 3, letterSpacing: "0.04em" }}>
                            {entry.moonPhase} · {new Date(entry.completedAt).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

            </div>
          </section>
        )}

        <section>
          <div className="mb-4">
            <p
              style={{
                fontFamily: "var(--font-sans-ui)",
                fontSize: "10px",
                fontWeight: 500,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--ink-soft)",
                marginBottom: "10px",
              }}
            >
              Tus rituales
            </p>

            <div className="inline-flex rounded-full border border-[rgba(0,0,0,0.08)] p-1 bg-[var(--surface-softest)] mb-4">
              <button
                onClick={() => setActiveTab("favorites")}
                className={`px-4 py-2 rounded-full transition-colors ${
                  activeTab === "favorites" ? "bg-[var(--ink-strong)] text-white" : "text-[var(--ink-muted)]"
                }`}
                style={{ fontFamily: "var(--font-sans-ui)", fontSize: "12px", fontWeight: 500 }}
              >
                Favoritos
              </button>
              <button
                onClick={() => setActiveTab("own")}
                className={`px-4 py-2 rounded-full transition-colors ${
                  activeTab === "own" ? "bg-[var(--ink-strong)] text-white" : "text-[var(--ink-muted)]"
                }`}
                style={{ fontFamily: "var(--font-sans-ui)", fontSize: "12px", fontWeight: 500 }}
              >
                Propios
              </button>
            </div>

            <h2
              style={{
                fontFamily: "var(--font-serif-display)",
                fontSize: "28px",
                color: "var(--ink-strong)",
                lineHeight: 1.1,
              }}
            >
              {activeTab === "favorites"
                ? "Tus rituales guardados"
                : "Los rituales que creaste"}
            </h2>
          </div>

          {activeTab === "favorites"
            ? renderList(savedRituals, "favorites")
            : renderList(ownRituals, "own")}
        </section>
      </motion.div>

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
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
