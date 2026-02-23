import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import { useUser } from "../context/UserContext";
import { useRitual } from "../context/RitualContext";
import { X, Bookmark, ChevronRight } from "lucide-react";

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, savedRituals, removeSavedRitual } = useUser();
  const { setSelectedPublicRitual, setViewMode } = useRitual();
  const navigate = useNavigate();

  // Calculate dropdown position from button
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
    setOpen((v) => !v);
  };

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on scroll/resize
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

  const handleViewRitual = (entry: (typeof savedRituals)[0]) => {
    setSelectedPublicRitual({
      ...entry.ritual,
      aiRitual: entry.ritual.aiRitual,
      author: user.name,
    });
    setViewMode(false);
    setOpen(false);
    navigate("/ritual/nuevo");
  };

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
            width: 272,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="w-full rounded-2xl bg-white border border-[rgba(0,0,0,0.08)] overflow-hidden"
            style={{
              boxShadow: "0 8px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)",
              transformOrigin: "top right",
            }}
          >
            {/* User header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[rgba(0,0,0,0.06)]">
              <div className="w-10 h-10 rounded-full bg-[#0A0A0A] flex items-center justify-center flex-shrink-0">
                <span
                  style={{
                    fontFamily: "Cormorant Garamond, serif",
                    fontSize: "18px",
                    fontWeight: 500,
                    color: "white",
                    lineHeight: 1,
                  }}
                >
                  {user.initial}
                </span>
              </div>
              <div>
                <p
                  style={{
                    fontFamily: "Cormorant Garamond, serif",
                    fontSize: "18px",
                    fontWeight: 400,
                    color: "#0A0A0A",
                    lineHeight: 1.2,
                  }}
                >
                  {user.name}
                </p>
                <p
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "11px",
                    color: "#BBB",
                    fontWeight: 300,
                  }}
                >
                  {savedRituals.length}{" "}
                  {savedRituals.length === 1 ? "ritual guardado" : "rituales guardados"}
                </p>
              </div>
            </div>

            {/* Saved rituals */}
            <div className="max-h-64 overflow-y-auto">
              {savedRituals.length === 0 ? (
                <div className="flex flex-col items-center py-8 px-5 gap-2">
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
                    Aún no guardaste ningún ritual.
                  </p>
                </div>
              ) : (
                <div>
                  <p
                    className="px-5 pt-4 pb-2"
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "10px",
                      fontWeight: 500,
                      letterSpacing: "0.13em",
                      textTransform: "uppercase",
                      color: "#BBB",
                    }}
                  >
                    Mis rituales
                  </p>
                  {savedRituals.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-2 px-5 py-3 hover:bg-[#FAFAFA] transition-colors group"
                    >
                      <button
                        onClick={() => handleViewRitual(entry)}
                        className="flex-1 text-left min-w-0"
                      >
                        <p
                          className="truncate"
                          style={{
                            fontFamily: "Cormorant Garamond, serif",
                            fontSize: "15px",
                            fontWeight: 400,
                            color: "#0A0A0A",
                            lineHeight: 1.3,
                          }}
                        >
                          {entry.ritual.aiRitual?.title || "Ritual personal"}
                        </p>
                        <p
                          style={{
                            fontFamily: "Inter, sans-serif",
                            fontSize: "10px",
                            color: "#BBB",
                            fontWeight: 300,
                            marginTop: "2px",
                          }}
                        >
                          {entry.savedAt}
                        </p>
                      </button>
                      <div className="flex items-center gap-1 shrink-0">
                        <ChevronRight
                          size={13}
                          strokeWidth={1.5}
                          className="text-[#CCC] group-hover:text-[#999] transition-colors"
                        />
                        <button
                          onClick={() => removeSavedRitual(entry.id)}
                          className="p-1 rounded-lg hover:bg-[#F0F0F0] text-[#CCC] hover:text-[#888] transition-colors"
                          aria-label="Eliminar"
                        >
                          <X size={12} strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-[rgba(0,0,0,0.06)] px-5 py-3">
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "11px",
                  color: "#CCC",
                  fontWeight: 300,
                  textAlign: "center",
                }}
              >
                Rituales · MVP
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {/* Avatar button */}
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
          {user.initial}
        </span>
      </button>

      {/* Portal: dropdown rendered directly in body, above everything */}
      {createPortal(dropdown, document.body)}
    </>
  );
}
