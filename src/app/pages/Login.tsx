import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../lib/supabase";

export function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    setLoading(false);

    if (error) {
      setError("No pudimos enviar el link. Revisá el email e intentá de nuevo.");
      return;
    }

    setSent(true);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(0,0,0,0.04) 0%, transparent 60%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-[340px] relative z-10"
      >
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              border: "1px solid rgba(0,0,0,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#0A0A0A",
              }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div
              key="sent"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h1
                style={{
                  fontFamily: "Cormorant Garamond, serif",
                  fontSize: "28px",
                  fontWeight: 400,
                  color: "#0A0A0A",
                  marginBottom: "12px",
                  lineHeight: 1.2,
                }}
              >
                Revisá tu email
              </h1>
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "14px",
                  fontWeight: 300,
                  color: "#888",
                  lineHeight: 1.6,
                }}
              >
                Te enviamos un link a{" "}
                <span style={{ color: "#555" }}>{email}</span>.{" "}
                Hacé click en él para entrar.
              </p>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h1
                style={{
                  fontFamily: "Cormorant Garamond, serif",
                  fontSize: "32px",
                  fontWeight: 400,
                  color: "#0A0A0A",
                  marginBottom: "8px",
                  lineHeight: 1.2,
                  textAlign: "center",
                }}
              >
                Rituales
              </h1>
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "13px",
                  fontWeight: 300,
                  color: "#AAA",
                  textAlign: "center",
                  marginBottom: "32px",
                }}
              >
                Ingresá tu email para continuar
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  autoFocus
                  className="w-full px-4 py-4 rounded-2xl border border-[rgba(0,0,0,0.1)] bg-[#FAFAFA] focus:outline-none focus:border-[rgba(0,0,0,0.3)]"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "15px",
                    fontWeight: 300,
                    color: "#0A0A0A",
                  }}
                />

                {error && (
                  <p
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "12px",
                      color: "#B42318",
                    }}
                  >
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full py-4 bg-[#0A0A0A] text-white rounded-2xl disabled:opacity-50 cursor-pointer hover:bg-[#222] transition-all active:scale-[0.98]"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "15px",
                    fontWeight: 400,
                  }}
                >
                  {loading ? "Enviando..." : "Recibir link de acceso"}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
