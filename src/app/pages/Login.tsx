import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import { supabase } from "../lib/supabase";
import { useUser } from "../context/UserContext";
import { track } from "../lib/analytics";

const OTP_RESEND_COOLDOWN_SECONDS = 60;

export function Login() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState<"email" | "link" | "code">("email");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [resendAvailableAt, setResendAvailableAt] = useState<number | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { session } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) {
      navigate("/", { replace: true });
    }
  }, [session]);

  useEffect(() => {
    if (!resendAvailableAt) {
      setCooldownRemaining(0);
      return;
    }

    const updateCooldown = () => {
      const remaining = Math.max(0, Math.ceil((resendAvailableAt - Date.now()) / 1000));
      setCooldownRemaining(remaining);
      if (remaining === 0) {
        setResendAvailableAt(null);
      }
    };

    updateCooldown();
    const timer = window.setInterval(updateCooldown, 1000);

    return () => window.clearInterval(timer);
  }, [resendAvailableAt]);

  const sendOtp = async (source: "initial" | "resend") => {
    if (!email.trim()) return;

    setLoading(true);
    setError("");

    const redirectUrl = import.meta.env.VITE_AUTH_REDIRECT_URL as string | undefined;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: redirectUrl ? { emailRedirectTo: redirectUrl } : undefined,
    });

    setLoading(false);

    if (error) {
      console.error("signInWithOtp error", error.status, error.name, error.message);
      track("otp_send_error", {
        source,
        status: error.status,
        name: error.name,
        message: error.message,
      });
      setError("No pudimos enviar el código. Probá de nuevo.");
      return;
    }

    setResendAvailableAt(Date.now() + OTP_RESEND_COOLDOWN_SECONDS * 1000);
    setStep("link");
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    void sendOtp("initial");
  };

  const handleResend = () => {
    if (cooldownRemaining > 0 || loading) return;
    setCode(["", "", "", "", "", ""]);
    void sendOtp("resend");
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
          ) : step === "link" ? (
            <motion.div key="link" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
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
                Te mandamos un link a{" "}
                <span style={{ color: "var(--ink-muted)" }}>{email.trim().toLowerCase()}</span>.
                Tocalo para entrar. Si no lo ves en unos minutos, revisá spam o promociones.
              </p>

              <button
                onClick={() => { setStep("code"); setError(""); }}
                className="editorial-action-button editorial-action-button-primary"
              >
                Ingresar el código en cambio
              </button>

              <button
                onClick={handleResend}
                disabled={loading || cooldownRemaining > 0}
                className="w-full mt-4 py-3 text-[var(--ink-subtle)] hover:text-[var(--ink-strong)] disabled:opacity-50 disabled:hover:text-[var(--ink-subtle)] transition-colors"
                style={{ fontFamily: "var(--font-sans-ui)", fontSize: "13px", fontWeight: 300 }}
              >
                {loading
                  ? "Reenviando..."
                  : cooldownRemaining > 0
                    ? `Reenviar en ${cooldownRemaining}s`
                    : "Reenviar email"}
              </button>

              <button
                onClick={() => { setStep("email"); setError(""); }}
                className="w-full mt-4 py-3 text-[var(--ink-subtle)] hover:text-[var(--ink-strong)] transition-colors"
                style={{ fontFamily: "var(--font-sans-ui)", fontSize: "13px", fontWeight: 300 }}
              >
                Cambiar email
              </button>
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
                <span style={{ color: "var(--ink-muted)" }}>{email.trim().toLowerCase()}</span>.
                Si no lo ves en unos minutos, revisá spam o promociones.
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
                onClick={handleResend}
                disabled={loading || cooldownRemaining > 0}
                className="w-full mt-4 py-3 text-[var(--ink-subtle)] hover:text-[var(--ink-strong)] disabled:opacity-50 disabled:hover:text-[var(--ink-subtle)] transition-colors"
                style={{ fontFamily: "var(--font-sans-ui)", fontSize: "13px", fontWeight: 300 }}
              >
                {loading
                  ? "Reenviando..."
                  : cooldownRemaining > 0
                    ? `Reenviar código en ${cooldownRemaining}s`
                    : "Reenviar código"}
              </button>

              <button
                onClick={() => { setStep("email"); setError(""); setCode(["", "", "", "", "", ""]); }}
                className="w-full mt-2 py-3 text-[var(--ink-subtle)] hover:text-[var(--ink-strong)] transition-colors"
                style={{ fontFamily: "var(--font-sans-ui)", fontSize: "13px", fontWeight: 300 }}
              >
                Cambiar email
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
