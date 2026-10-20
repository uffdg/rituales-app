import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { Toaster } from "sonner";
import { track } from "../lib/analytics";
import { useUser } from "../context/UserContext";

function RouteTracker() {
  const location = useLocation();

  useEffect(() => {
    track("page_view", {
      path: location.pathname,
      search: location.search || undefined,
    });
  }, [location.pathname, location.search]);

  return null;
}

function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, user, profile } = useUser();
  const displayName = profile?.fullName?.trim() || user?.email || "";
  const initial = displayName ? displayName[0].toUpperCase() : "?";
  const accountActive =
    location.pathname.startsWith("/cuenta") || location.pathname.startsWith("/login");

  const tabs = [
    {
      label: "Hoy",
      path: "/stories",
      active: location.pathname.startsWith("/stories"),
      icon: (active: boolean) => (
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke={active ? "var(--ink-strong)" : "var(--ink-subtle)"} strokeWidth={1.75}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="3" fill={active ? "var(--ink-strong)" : "var(--ink-subtle)"} stroke="none" />
        </svg>
      ),
    },
    {
      label: "Inicio",
      path: "/",
      active: location.pathname === "/",
      icon: (active: boolean) => (
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke={active ? "var(--ink-strong)" : "var(--ink-subtle)"} strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" />
        </svg>
      ),
    },
    {
      label: "Explorar",
      path: "/explorar",
      active: location.pathname.startsWith("/explorar"),
      icon: (active: boolean) => (
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke={active ? "var(--ink-strong)" : "var(--ink-subtle)"} strokeWidth={1.75}>
          <circle cx="11" cy="11" r="8" />
          <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
        </svg>
      ),
    },
    {
      label: "Crear",
      path: "/onboarding",
      active: location.pathname === "/onboarding" || location.pathname.startsWith("/crear"),
      icon: (active: boolean) => (
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke={active ? "var(--ink-strong)" : "var(--ink-subtle)"} strokeWidth={1.75}>
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" d="M12 8v8M8 12h8" />
        </svg>
      ),
    },
    {
      label: session ? "Perfil" : "Entrar",
      path: session ? "/cuenta" : "/login",
      active: accountActive,
      icon: (active: boolean) => (
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-full border font-sans text-body font-medium leading-none ${
            active ? "border-ink-strong bg-ink-strong text-on-ink-strong" : "border-line-soft bg-surface-muted text-ink-muted"
          }`}
          aria-hidden="true"
        >
          {initial}
        </div>
      ),
    },
  ];

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed bottom-0 left-1/2 z-[100] flex w-full max-w-[390px] -translate-x-1/2 items-center border-t border-line-soft bg-surface-base"
    >
      {tabs.map((tab) => (
        <button
          key={tab.path}
          type="button"
          onClick={() => navigate(tab.path)}
          aria-current={tab.active ? "page" : undefined}
          className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 py-2.5 ${
            tab.active ? "text-ink-strong" : "text-ink-subtle hover:text-ink-strong"
          }`}
        >
          {tab.icon(tab.active)}
          <span className={`font-sans text-caption ${tab.active ? "font-medium" : ""}`}>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

export function Layout() {
  return (
    <div className="min-h-screen flex items-start md:items-center justify-center overflow-x-hidden bg-surface-shell">
      <div className="relative w-full max-w-[390px] min-h-[100dvh] overflow-x-hidden bg-surface-base shadow-shell">
        <RouteTracker />
        <div className="pb-16">
          <Outlet />
        </div>
        <BottomNav />
      </div>
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: "var(--ink-strong)",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: 400,
            fontFamily: "var(--font-sans-ui)",
            boxShadow: "var(--shadow-lifted)",
          },
          classNames: {
            toast: "border-0",
            title: "text-white",
            description: "text-[var(--on-ink-muted)] opacity-100",
          },
        }}
      />
    </div>
  );
}
