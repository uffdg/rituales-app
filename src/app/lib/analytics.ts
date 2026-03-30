import { supabase } from "./supabase";

const API_BASE = import.meta.env.VITE_RITUALES_API_BASE_URL?.replace(/\/$/, "") || "";
const LOCAL_EVENTS_KEY = "rituales_events";
const SESSION_ID_KEY = "rituales_analytics_session_id";

function getAnonymousSessionId() {
  try {
    const existing = localStorage.getItem(SESSION_ID_KEY);
    if (existing) return existing;

    const next =
      globalThis.crypto?.randomUUID?.() ||
      `rituales-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(SESSION_ID_KEY, next);
    return next;
  } catch {
    return `rituales-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

export function track(event: string, props?: Record<string, unknown>) {
  const occurredAt = new Date().toISOString();
  const payload = {
    event,
    ts: Date.now(),
    occurredAt,
    path:
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : undefined,
    ...props,
  };

  try {
    const stored = JSON.parse(localStorage.getItem(LOCAL_EVENTS_KEY) || "[]");
    stored.push(payload);
    if (stored.length > 200) stored.splice(0, stored.length - 200);
    localStorage.setItem(LOCAL_EVENTS_KEY, JSON.stringify(stored));
  } catch {}

  if (API_BASE) {
    fetch(`${API_BASE}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  }

  void (async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      await supabase.from("ritual_events").insert({
        user_id: session?.user?.id ?? null,
        session_id: getAnonymousSessionId(),
        event_name: event,
        path:
          typeof window !== "undefined"
            ? `${window.location.pathname}${window.location.search}`
            : null,
        referrer: typeof document !== "undefined" ? document.referrer || null : null,
        props: props || {},
        occurred_at: occurredAt,
      });
    } catch {}
  })();
}
