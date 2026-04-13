import { useNavigate } from "react-router";
import { useUser } from "../context/UserContext";

export function UserMenu() {
  const navigate = useNavigate();
  const { session, user, profile } = useUser();
  const displayName = profile?.fullName?.trim() || user?.email || "";
  const initial = displayName ? displayName[0].toUpperCase() : "?";

  return (
    <button
      onClick={() => navigate(session ? "/cuenta" : "/login")}
      className="w-9 h-9 rounded-full bg-[var(--ink-strong)] flex items-center justify-center flex-shrink-0 transition-all active:scale-[0.93] hover:bg-[var(--ink-strong)]"
      aria-label={session ? "Ir a mi cuenta" : "Iniciar sesión"}
    >
      <span
        style={{
          fontFamily: "var(--font-serif-display)",
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
  );
}
