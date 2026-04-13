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
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke={active ? "var(--ink-strong)" : "var(--ink-soft)"} strokeWidth={1.75}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="3" fill={active ? "var(--ink-strong)" : "var(--ink-soft)"} stroke="none" />
        </svg>
      ),
    },
    {
      label: "Inicio",
      path: "/",
      active: location.pathname === "/",
      icon: (active: boolean) => (
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke={active ? "var(--ink-strong)" : "var(--ink-soft)"} strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" />
        </svg>
      ),
    },
    {
      label: "Explorar",
      path: "/explorar",
      active: location.pathname.startsWith("/explorar"),
      icon: (active: boolean) => (
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke={active ? "var(--ink-strong)" : "var(--ink-soft)"} strokeWidth={1.75}>
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
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke={active ? "var(--ink-strong)" : "var(--ink-soft)"} strokeWidth={1.75}>
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
          className="flex items-center justify-center rounded-full"
          style={{
            width: 28,
            height: 28,
            background: active ? "var(--ink-strong)" : "var(--surface-muted)",
            border: active ? "1px solid var(--ink-strong)" : "1px solid var(--border-soft)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-serif-display)",
              fontSize: "16px",
              fontWeight: 500,
              color: active ? "#FFFFFF" : "var(--ink-muted)",
              lineHeight: 1,
              letterSpacing: "0.02em",
            }}
          >
            {initial}
          </span>
        </div>
      ),
    },
  ];

  return (
    <nav
      className="flex items-center"
      style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: "390px",
        borderTop: "1px solid var(--border-soft)",
        background: "white",
        zIndex: 100,
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.path}
          onClick={() => navigate(tab.path)}
          className="flex-1 flex flex-col items-center justify-center py-3 gap-1"
        >
          {tab.icon(tab.active)}
          <span
            style={{
              fontFamily: "var(--font-sans-ui)",
              fontSize: "10px",
              fontWeight: tab.active ? 500 : 400,
              color: tab.active ? "var(--ink-strong)" : "var(--ink-soft)",
              letterSpacing: "0.01em",
            }}
          >
            {tab.label}
          </span>
        </button>
      ))}
    </nav>
  );
}

export function Layout() {
  return (
    <div className="min-h-screen flex items-center justify-center overflow-x-hidden" style={{ background: "var(--app-shell)" }}>
      <div
        className="relative w-full max-w-[390px] min-h-[100dvh] bg-white overflow-x-hidden shadow-2xl"
        style={{ boxShadow: "0 30px 80px rgba(15,23,42,0.14), 0 2px 8px rgba(15,23,42,0.08)" }}
      >
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
            fontFamily: "var(--font-sans-ui)",
          },
          classNames: {
            toast: "border-0 shadow-2xl",
            title: "text-white",
            description: "text-[#C9C9C9] opacity-100",
          },
        }}
      />
    </div>
  );
}
