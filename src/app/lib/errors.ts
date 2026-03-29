export function getUserFacingErrorMessage(
  error: unknown,
  fallback = "Algo no salió bien. Probá de nuevo en un momento.",
) {
  const message = error instanceof Error ? error.message : `${error || ""}`.trim();

  if (!message) {
    return fallback;
  }

  const normalized = message.toLowerCase();

  if (
    normalized.includes("cannot coerce the result to a single json object") ||
    normalized.includes("json object requested, multiple")
  ) {
    return "No pudimos completar esa acción con este ritual. Probá de nuevo en unos segundos.";
  }

  if (
    normalized.includes("quota_exceeded") ||
    normalized.includes("credits remaining") ||
    normalized.includes("exceeds your quota")
  ) {
    return "El audio no está disponible por ahora. Probá de nuevo más adelante.";
  }

  if (
    normalized.includes("schema cache") ||
    normalized.includes("pgrst205") ||
    normalized.includes("ritual_favorites")
  ) {
    return "Todavía no pudimos actualizar tus guardados. Probá de nuevo en un momento.";
  }

  if (normalized.includes("no hay sesión activa")) {
    return "Necesitás iniciar sesión para hacer eso.";
  }

  return message;
}
