import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Bookmark, Heart, LogOut, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "../context/UserContext";
import { useRitual } from "../context/RitualContext";
import { deriveCandleGuide } from "../lib/candle";
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
        <div className="rounded-3xl border border-[rgba(0,0,0,0.06)] bg-[#FAFAFA] px-5 py-8 text-center">
          <p
            style={{
              fontFamily: "Cormorant Garamond, serif",
              fontSize: "22px",
              color: "#555",
              marginBottom: "6px",
            }}
          >
            {mode === "favorites" ? "Todavía no guardaste rituales" : "Todavía no creaste rituales"}
          </p>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "12px",
              color: "#AAA",
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
          <button
            key={`${mode}-${entry.id}`}
            onClick={() => openRitual(entry)}
            className="w-full text-left p-4 border border-[rgba(0,0,0,0.07)] rounded-[30px] hover:border-[rgba(0,0,0,0.16)] transition-all active:scale-[0.99] bg-white"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p
                  style={{
                    fontFamily: "Cormorant Garamond, serif",
                    fontSize: "18px",
                    color: "#0A0A0A",
                    lineHeight: 1.3,
                    marginBottom: "10px",
                  }}
                >
                  {entry.ritual.aiRitual?.title || "Ritual personal"}
                </p>

                <div className="flex flex-wrap items-center gap-1.5">
                  {entry.ritual.element ? (
                    <span
                      className="px-2.5 py-0.5 rounded-full border border-[rgba(0,0,0,0.08)] text-[#666]"
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "10px",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {entry.ritual.element.charAt(0).toUpperCase() + entry.ritual.element.slice(1)}
                    </span>
                  ) : null}

                  {entry.ritual.duration ? (
                    <span
                      className="px-2.5 py-0.5 rounded-full border border-[rgba(0,0,0,0.08)] text-[#666]"
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "10px",
                      }}
                    >
                      {entry.ritual.duration} min
                    </span>
                  ) : null}

                  <span
                    className="px-2.5 py-0.5 rounded-full border border-[rgba(0,0,0,0.08)] text-[#666]"
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "10px",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Vela {candleGuide.color}
                  </span>

                  <span
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "11px",
                      color: "#CCC",
                      marginLeft: "4px",
                    }}
                  >
                    ♥ {entry.likesCount || 0}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setPendingDelete({ id: entry.id, mode });
                }}
                className="shrink-0 w-14 h-14 rounded-[20px] bg-[#F7F7F7] flex items-center justify-center text-[#888] hover:text-[#111] transition-colors"
                aria-label={mode === "favorites" ? "Quitar de guardados" : "Borrar ritual"}
              >
                <Trash2 size={18} strokeWidth={1.6} />
              </button>
            </div>
          </button>
          );
        })}
      </div>
    );
  };

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
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#888] hover:text-[#0A0A0A] transition-colors"
          style={{ fontFamily: "Inter, sans-serif", fontSize: "13px" }}
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
          className="flex items-center gap-2 text-[#888] hover:text-[#0A0A0A] transition-colors"
          style={{ fontFamily: "Inter, sans-serif", fontSize: "12px" }}
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
              fontFamily: "Inter, sans-serif",
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#BBB",
              marginBottom: "8px",
            }}
          >
            Tu cuenta
          </p>
          <h1
            style={{
              fontFamily: "Cormorant Garamond, serif",
              fontSize: "32px",
              fontWeight: 400,
              color: "#0A0A0A",
              lineHeight: 1.15,
            }}
          >
            Tu perfil y tus rituales
          </h1>
        </div>

        <div className="rounded-3xl border border-[rgba(0,0,0,0.06)] bg-white p-5 mb-6">
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "10px",
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#BBB",
              marginBottom: "6px",
            }}
          >
            Email
          </p>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "13px",
              color: "#666",
              marginBottom: "18px",
            }}
          >
            {user?.email || ""}
          </p>

          <label
            style={{
              display: "block",
              fontFamily: "Inter, sans-serif",
              fontSize: "10px",
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#BBB",
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
              className="w-full px-5 py-4 rounded-[28px] border border-[rgba(0,0,0,0.08)] bg-[#FAFAFA] outline-none"
              style={{
                fontFamily: "Cormorant Garamond, serif",
                fontSize: "22px",
                color: "#111",
              }}
            />
            <button
              onClick={handleSaveName}
              disabled={isSavingName}
              className="self-end px-6 py-3 rounded-[24px] bg-[#0A0A0A] text-white disabled:opacity-50"
              style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 500 }}
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
              className="rounded-3xl border border-[rgba(0,0,0,0.06)] bg-[#FAFAFA] px-4 py-4"
            >
              <item.icon size={15} strokeWidth={1.5} className="text-[#888] mb-3" />
              <p
                style={{
                  fontFamily: "Cormorant Garamond, serif",
                  fontSize: "26px",
                  color: "#0A0A0A",
                  lineHeight: 1,
                }}
              >
                {item.value}
              </p>
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "10px",
                  color: "#AAA",
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

        <section>
          <div className="mb-4">
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
              Tus rituales
            </p>

            <div className="inline-flex rounded-full border border-[rgba(0,0,0,0.08)] p-1 bg-[#FAFAFA] mb-4">
              <button
                onClick={() => setActiveTab("favorites")}
                className={`px-4 py-2 rounded-full transition-colors ${
                  activeTab === "favorites" ? "bg-[#0A0A0A] text-white" : "text-[#777]"
                }`}
                style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 500 }}
              >
                Favoritos
              </button>
              <button
                onClick={() => setActiveTab("own")}
                className={`px-4 py-2 rounded-full transition-colors ${
                  activeTab === "own" ? "bg-[#0A0A0A] text-white" : "text-[#777]"
                }`}
                style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 500 }}
              >
                Propios
              </button>
            </div>

            <h2
              style={{
                fontFamily: "Cormorant Garamond, serif",
                fontSize: "28px",
                color: "#0A0A0A",
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
                fontFamily: "Inter, sans-serif",
                fontSize: "10px",
                fontWeight: 500,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#BBB",
              }}
            >
              Confirmar acción
            </p>
            <AlertDialogTitle
              style={{
                fontFamily: "Cormorant Garamond, serif",
                fontSize: "30px",
                fontWeight: 400,
                color: "#0A0A0A",
                lineHeight: 1.1,
              }}
            >
              {pendingDelete?.mode === "favorites" ? "Quitar de guardados" : "Borrar ritual"}
            </AlertDialogTitle>
            <AlertDialogDescription
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "14px",
                color: "#777",
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
              className="rounded-[20px] border-[rgba(0,0,0,0.08)] px-5 py-3 text-[#666]"
              style={{ fontFamily: "Inter, sans-serif", fontSize: "13px" }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="rounded-[20px] bg-[#0A0A0A] px-5 py-3 text-white hover:bg-[#1A1A1A]"
              style={{ fontFamily: "Inter, sans-serif", fontSize: "13px" }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
