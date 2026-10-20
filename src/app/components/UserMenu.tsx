import { useNavigate } from "react-router";
import { useUser } from "../context/UserContext";

export function UserMenu() {
  const navigate = useNavigate();
  const { session, user, profile } = useUser();
  const displayName = profile?.fullName?.trim() || user?.email || "";
  const initial = displayName ? displayName[0].toUpperCase() : "?";

  return (
    <button
      type="button"
      onClick={() => navigate(session ? "/cuenta" : "/login")}
      className="group flex h-11 w-11 shrink-0 items-center justify-center"
      aria-label={session ? "Ir a mi cuenta" : "Iniciar sesión"}
    >
      {/* Círculo de 36 con la inicial; el área táctil es de 44. */}
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-strong font-sans text-label font-medium text-on-ink-strong transition-transform group-active:scale-[0.93]">
        {initial}
      </span>
    </button>
  );
}
