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
  const [step, setStep] = useState<"email" | "code">("email");
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

  useEffect(() => {
    if (step === "code") {
      window.setTimeout(() => inputRefs.current[0]?.focus(), 0);
    }
  }, [step]);

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
    setStep("code");
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
    <div className="min-h-screen bg-surface-page flex flex-col items-center justify-center px-6">
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
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-line-default" aria-hidden="true">
            <div className="h-2.5 w-2.5 rounded-full bg-ink-strong" />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === "email" ? (
            <motion.div key="email" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h1 className="mb-2 text-center font-serif text-title-1 text-ink-strong">Rituales</h1>
              <p className="mb-8 text-center font-sans text-body text-ink-muted">Ingresá tu email para continuar</p>

              <form onSubmit={handleSend} className="flex flex-col gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  autoFocus
                  aria-label="Email"
                  className="editorial-input"
                />

                {error && (
                  <p className="editorial-error" role="alert">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  aria-busy={loading}
                  className="editorial-button editorial-button--primary editorial-button--lg"
                >
                  {loading ? "Enviando…" : "Recibir código"}
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
              <h1 className="mb-2 text-center font-serif text-title-2 text-ink-strong">Revisá tu email</h1>
              <p className="mb-8 text-center font-sans text-body text-ink-muted">
                Enviamos un código de 6 dígitos a{" "}
                <span className="font-medium text-ink-strong">{email.trim().toLowerCase()}</span>.
                Si no lo ves en unos minutos, revisá spam o promociones.
              </p>

              {/* Code inputs */}
              <div className="flex gap-2 justify-center mb-4" onPaste={handlePaste} role="group" aria-label="Código de 6 dígitos">
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    autoComplete={i === 0 ? "one-time-code" : "off"}
                    aria-label={`Dígito ${i + 1} de 6`}
                    maxLength={1}
                    value={digit}
                    autoFocus={i === 0}
                    onChange={(e) => handleCodeChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className="h-14 w-12 rounded-sm border border-transparent bg-surface-muted text-center font-sans text-title-3 text-ink-strong outline-none transition-colors focus-visible:border-ink-strong focus-visible:bg-surface-base"
                  />
                ))}
              </div>

              {verifying && (
                <p className="mb-2 text-center font-sans text-body text-ink-muted" role="status">
                  Verificando…
                </p>
              )}

              {error && (
                <p className="editorial-error mb-2 justify-center text-center" role="alert">
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={handleResend}
                disabled={loading || cooldownRemaining > 0}
                className="editorial-button editorial-button--tertiary mx-auto mt-4 flex"
              >
                {loading
                  ? "Reenviando…"
                  : cooldownRemaining > 0
                    ? `Reenviar código en ${cooldownRemaining}s`
                    : "Reenviar código"}
              </button>

              <button
                type="button"
                onClick={() => { setStep("email"); setError(""); setCode(["", "", "", "", "", ""]); }}
                className="editorial-button editorial-button--tertiary mx-auto mt-1 flex"
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
