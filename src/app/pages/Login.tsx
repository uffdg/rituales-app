import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import { supabase } from "../lib/supabase";
import { useUser } from "../context/UserContext";

export function Login() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { session } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) {
      navigate("/", { replace: true });
    }
  }, [session]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
    });

    setLoading(false);

    if (error) {
      setError("No pudimos enviar el código. Probá de nuevo.");
      return;
    }

    setStep("code");
  };

  const handleCodeChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (next.every((d) => d !== "") && next.join("").length === 6) {
      handleVerify(next.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const next = pasted.split("");
      setCode(next);
      inputRefs.current[5]?.focus();
      handleVerify(pasted);
    }
  };

  const handleVerify = async (token: string) => {
    setVerifying(true);
    setError("");

    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token,
      type: "email",
    });

    setVerifying(false);

    if (error) {
      setError("Código incorrecto o expirado. Pedí uno nuevo.");
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-[var(--app-page)] flex flex-col items-center justify-center px-6">
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
              border: "1px solid var(--border-default)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--ink-strong)" }} />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === "email" ? (
            <motion.div key="email" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h1
                style={{
                  fontFamily: "var(--font-serif-display)",
                  fontSize: "32px",
                  fontWeight: 400,
                  color: "var(--ink-strong)",
                  marginBottom: "8px",
                  lineHeight: 1.2,
                  textAlign: "center",
                }}
              >
                Rituales
              </h1>
              <p
                style={{
                  fontFamily: "var(--font-sans-ui)",
                  fontSize: "13px",
                  fontWeight: 300,
                  color: "var(--ink-subtle)",
                  textAlign: "center",
                  marginBottom: "32px",
                }}
              >
                Ingresá tu email para continuar
              </p>

              <form onSubmit={handleSend} className="flex flex-col gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  autoFocus
                  className="w-full px-4 py-4 rounded-2xl border bg-[var(--surface-softest)] focus:outline-none"
                  style={{ borderColor: "var(--border-default)", fontFamily: "var(--font-sans-ui)", fontSize: "15px", fontWeight: 300, color: "var(--ink-strong)" }}
                />

                {error && (
                  <p style={{ fontFamily: "var(--font-sans-ui)", fontSize: "12px", color: "#B42318" }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="editorial-action-button editorial-action-button-primary"
                >
                  {loading ? "Enviando..." : "Recibir código"}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="code"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <h1
                style={{
                  fontFamily: "var(--font-serif-display)",
                  fontSize: "28px",
                  fontWeight: 400,
                  color: "var(--ink-strong)",
                  marginBottom: "8px",
                  lineHeight: 1.2,
                  textAlign: "center",
                }}
              >
                Revisá tu email
              </h1>
              <p
                style={{
                  fontFamily: "var(--font-sans-ui)",
                  fontSize: "13px",
                  fontWeight: 300,
                  color: "var(--ink-subtle)",
                  textAlign: "center",
                  marginBottom: "32px",
                  lineHeight: 1.6,
                }}
              >
                Enviamos un código de 6 dígitos a{" "}
                <span style={{ color: "var(--ink-muted)" }}>{email.trim().toLowerCase()}</span>
              </p>

              {/* Code inputs */}
              <div className="flex gap-2 justify-center mb-4" onPaste={handlePaste}>
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    autoFocus={i === 0}
                    onChange={(e) => handleCodeChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className="w-12 h-14 text-center rounded-xl border border-[rgba(0,0,0,0.12)] bg-[var(--surface-softest)] focus:outline-none focus:border-[var(--ink-strong)] transition-colors"
                    style={{
                      fontFamily: "var(--font-sans-ui)",
                      fontSize: "22px",
                      fontWeight: 400,
                      color: "var(--ink-strong)",
                    }}
                  />
                ))}
              </div>

              {verifying && (
                <p
                  style={{
                    fontFamily: "var(--font-sans-ui)",
                    fontSize: "13px",
                    color: "var(--ink-soft)",
                    textAlign: "center",
                    marginBottom: "8px",
                  }}
                >
                  Verificando...
                </p>
              )}

              {error && (
                <p
                  style={{
                    fontFamily: "var(--font-sans-ui)",
                    fontSize: "12px",
                    color: "#B42318",
                    textAlign: "center",
                    marginBottom: "8px",
                  }}
                >
                  {error}
                </p>
              )}

              <button
                onClick={() => { setStep("email"); setError(""); setCode(["", "", "", "", "", ""]); }}
                className="w-full mt-4 py-3 text-[var(--ink-subtle)] hover:text-[var(--ink-strong)] transition-colors"
                style={{ fontFamily: "var(--font-sans-ui)", fontSize: "13px", fontWeight: 300 }}
              >
                Cambiar email o reenviar código
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
