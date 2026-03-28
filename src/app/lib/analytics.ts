const API_BASE = import.meta.env.VITE_RITUALES_API_BASE_URL?.replace(/\/$/, "") || "";

export function track(event: string, props?: Record<string, unknown>) {
  const payload = {
    event,
    ts: Date.now(),
    ...props,
  };

  // Guardado local siempre (fallback y debug)
  try {
    const key = "rituales_events";
    const stored = JSON.parse(localStorage.getItem(key) || "[]");
    stored.push(payload);
    // Máximo 200 eventos en local
    if (stored.length > 200) stored.splice(0, stored.length - 200);
    localStorage.setItem(key, JSON.stringify(stored));
  } catch {}

  // Enviar al backend si está configurado
  if (!API_BASE) return;

  fetch(`${API_BASE}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {});
}
