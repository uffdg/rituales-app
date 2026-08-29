import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // La sesión se guarda en localStorage y se renueva sola en segundo plano
    // mientras el refresh token siga siendo válido — el objetivo es que el
    // usuario nunca tenga que volver a loguearse mientras use el mismo
    // navegador. El límite real de "para siempre" lo pone la configuración
    // de Sessions en el dashboard de Supabase (Authentication > Sessions),
    // no este cliente — ver nota para Mariana.
    persistSession: true,
    autoRefreshToken: true,
  },
});
