import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useUser } from "../context/UserContext";
import { useRitual } from "../context/RitualContext";
import { Bookmark, ChevronRight, Heart, LogOut, PenLine, Sparkles, X } from "lucide-react";

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const [tab, setTab] = useState<"favorites" | "own">("favorites");
  const [fullNameDraft, setFullNameDraft] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    user,
    profile,
    savedRituals,
    ownRituals,
    removeSavedRitual,
    signOut,
    updateProfileName,
    likesReceived,
  } = useUser();
  const email = user?.email || "";
  const displayName = profile?.fullName?.trim() || email || "";
  const initial = displayName ? displayName[0].toUpperCase() : "?";
  const { updateRitual, setViewMode, setSelectedPublicRitual } = useRitual();
  const navigate = useNavigate();

  useEffect(() => {
    setFullNameDraft(profile?.fullName || "");
  }, [profile?.fullName, open]);

  const updatePos = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, []);

  const handleToggle = () => {
    updatePos();
    setOpen((value) => !value);
  };

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    const close = () => setOpen(false);
    if (open) {
      window.addEventListener("scroll", close, true);
      window.addEventListener("resize", close);
    }
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const handleViewRitual = (entry: (typeof savedRituals)[number]) => {
    updateRitual(entry.ritual);
    setSelectedPublicRitual(null);
    setViewMode(false);
    setOpen(false);
    navigate(`/ritual/${entry.ritual.ritualId || "nuevo"}`);
  };

  const handleSaveName = async () => {
    setIsSavingName(true);
    try {
      await updateProfileName(fullNameDraft.trim());
      toast("Nombre guardado", {
        description: "Tu perfil ya quedó actualizado.",
      });
    } catch (error) {
      toast(error instanceof Error ? error.message : "No se pudo guardar tu nombre.");
    } finally {
      setIsSavingName(false);
    }
  };

  const activeList = tab === "favorites" ? savedRituals : ownRituals;

  const dropdown = (
    <AnimatePresence>
      {open && (
        <div
          ref={dropdownRef}
          style={{
            position: "fixed",
            top: dropdownPos.top,
            right: dropdownPos.right,
            zIndex: 99999,
            width: 320,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="w-full rounded-3xl bg-white border border-[rgba(0,0,0,0.08)] overflow-hidden"
            style={{
              boxShadow: "0 8px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)",
              transformOrigin: "top right",
            }}
          >
            <div className="px-5 pt-5 pb-4 border-b border-[rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-full bg-[#0A0A0A] flex items-center justify-center flex-shrink-0">
                  <span
                    style={{
                      fontFamily: "Cormorant Garamond, serif",
                      fontSize: "20px",
                      fontWeight: 500,
                      color: "white",
                    }}
                  >
                    {initial}
                  </span>
                </div>
                <div className="min-w-0">
                  <p
                    className="truncate"
                    style={{
                      fontFamily: "Cormorant Garamond, serif",
                      fontSize: "22px",
                      color: "#0A0A0A",
                    }}
                  >
                    {profile?.fullName || "Tu perfil"}
                  </p>
                  <p
                    className="truncate"
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "11px",
                      color: "#AAA",
                    }}
                  >
                    {email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 rounded-2xl border border-[rgba(0,0,0,0.08)] bg-[#FAFAFA] px-3 py-2">
                  <p
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "10px",
                      fontWeight: 500,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "#BBB",
                      marginBottom: "4px",
                    }}
                  >
                    Nombre
                  </p>
                  <input
                    value={fullNameDraft}
                    onChange={(event) => setFullNameDraft(event.target.value)}
                    placeholder="Cómo querés aparecer"
                    className="w-full bg-transparent outline-none"
                    style={{
                      fontFamily: "Cormorant Garamond, serif",
                      fontSize: "18px",
                      color: "#111",
                    }}
                  />
                </div>
                <button
                  onClick={handleSaveName}
                  disabled={isSavingName}
                  className="shrink-0 h-[52px] px-4 rounded-2xl bg-[#0A0A0A] text-white disabled:opacity-50"
                  style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 500 }}
                >
                  <PenLine size={14} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Favoritos", value: savedRituals.length, icon: Bookmark },
                  { label: "Propios", value: ownRituals.length, icon: Sparkles },
                  { label: "Likes", value: likesReceived, icon: Heart },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-[rgba(0,0,0,0.06)] bg-[#FAFAFA] px-3 py-3"
                  >
                    <item.icon size={13} strokeWidth={1.5} className="text-[#888] mb-2" />
                    <p
                      style={{
                        fontFamily: "Cormorant Garamond, serif",
                        fontSize: "20px",
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
                        marginTop: "4px",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                      }}
                    >
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-5 pt-4">
              <div className="inline-flex rounded-full border border-[rgba(0,0,0,0.08)] p-1 bg-[#FAFAFA]">
                <button
                  onClick={() => setTab("favorites")}
                  className={`px-4 py-1.5 rounded-full ${tab === "favorites" ? "bg-[#0A0A0A] text-white" : "text-[#777]"}`}
                  style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 500 }}
                >
                  Favoritos
                </button>
                <button
                  onClick={() => setTab("own")}
                  className={`px-4 py-1.5 rounded-full ${tab === "own" ? "bg-[#0A0A0A] text-white" : "text-[#777]"}`}
                  style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", fontWeight: 500 }}
                >
                  Propios
                </button>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto px-2 py-4">
              {activeList.length === 0 ? (
                <div className="flex flex-col items-center py-10 px-5 gap-2">
                  <Bookmark size={20} strokeWidth={1.25} className="text-[#CCC]" />
                  <p
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "13px",
                      color: "#BBB",
                      fontWeight: 300,
                      textAlign: "center",
                    }}
                  >
                    {tab === "favorites"
                      ? "Todavía no guardaste rituales."
                      : "Todavía no creaste rituales propios."}
                  </p>
                </div>
              ) : (
                activeList.map((entry) => (
                  <div
                    key={`${tab}-${entry.id}`}
                    className="flex items-center gap-2 px-3 py-3 hover:bg-[#FAFAFA] transition-colors group rounded-2xl"
                  >
                    <button
                      onClick={() => handleViewRitual(entry)}
                      className="flex-1 text-left min-w-0"
                    >
                      <p
                        className="truncate"
                        style={{
                          fontFamily: "Cormorant Garamond, serif",
                          fontSize: "16px",
                          color: "#0A0A0A",
                          lineHeight: 1.3,
                        }}
                      >
                        {entry.ritual.aiRitual?.title || "Ritual personal"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p
                          style={{
                            fontFamily: "Inter, sans-serif",
                            fontSize: "10px",
                            color: "#BBB",
                          }}
                        >
                          {entry.savedAt}
                        </p>
                        {tab === "own" ? (
                          <p
                            style={{
                              fontFamily: "Inter, sans-serif",
                              fontSize: "10px",
                              color: "#BBB",
                            }}
                          >
                            {entry.likesCount || 0} likes
                          </p>
                        ) : null}
                      </div>
                    </button>
                    <div className="flex items-center gap-1 shrink-0">
                      <ChevronRight
                        size={13}
                        strokeWidth={1.5}
                        className="text-[#CCC] group-hover:text-[#999] transition-colors"
                      />
                      {tab === "favorites" ? (
                        <button
                          onClick={async () => {
                            try {
                              await removeSavedRitual(entry.id);
                            } catch (error) {
                              toast(
                                error instanceof Error
                                  ? error.message
                                  : "No se pudo quitar el ritual de guardados.",
                              );
                            }
                          }}
                          className="p-1 rounded-lg hover:bg-[#F0F0F0] text-[#CCC] hover:text-[#888] transition-colors"
                          aria-label="Eliminar"
                        >
                          <X size={12} strokeWidth={1.5} />
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-[rgba(0,0,0,0.06)] px-5 py-3">
              <button
                onClick={async () => {
                  await signOut();
                  setOpen(false);
                }}
                className="flex items-center gap-2 text-[#888] hover:text-[#0A0A0A] transition-colors w-full"
                style={{ fontFamily: "Inter, sans-serif", fontSize: "12px" }}
              >
                <LogOut size={13} strokeWidth={1.5} />
                Cerrar sesión
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="w-9 h-9 rounded-full bg-[#0A0A0A] flex items-center justify-center flex-shrink-0 transition-all active:scale-[0.93] hover:bg-[#222]"
        aria-label="Menú de usuario"
      >
        <span
          style={{
            fontFamily: "Cormorant Garamond, serif",
            fontSize: "16px",
            fontWeight: 500,
            color: "white",
            lineHeight: 1,
            letterSpacing: "0.02em",
          }}
        >
          {initial}
        </span>
      </button>

      {createPortal(dropdown, document.body)}
    </>
  );
}
