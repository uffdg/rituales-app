import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { RouterProvider } from "react-router";
import { Analytics } from "@vercel/analytics/react";
import { router } from "./routes.tsx";
import { RitualProvider } from "./context/RitualContext";
import { UserProvider, useUser } from "./context/UserContext";
import { track } from "./lib/analytics";

function SplashScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-white"
    >
      <div className="relative flex h-full w-full max-w-[390px] flex-col items-center justify-center overflow-hidden px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 flex flex-col items-center"
        >
          <div className="mb-6 relative flex items-center justify-center">
            <div className="absolute inset-0 pointer-events-none z-0">
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0.15, opacity: 0.1, x: "-50%", y: "-50%" }}
                  animate={{
                    scale: [0.15, 1],
                    opacity: [0.1, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "linear",
                    delay: i * 1,
                  }}
                  className="absolute top-1/2 left-1/2 rounded-full"
                  style={{
                    width: "400px",
                    height: "400px",
                    border: "1px solid rgba(0,0,0,1)",
                  }}
                />
              ))}
            </div>

            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="relative z-10">
              <circle cx="18" cy="18" r="17" stroke="var(--ink-strong)" strokeWidth="0.75" />
              <circle cx="18" cy="18" r="10" stroke="var(--ink-strong)" strokeWidth="0.5" />
              <circle cx="18" cy="18" r="3" fill="var(--ink-strong)" />
            </svg>
          </div>

          <h1
            style={{
              fontFamily: "var(--font-serif-display)",
              fontSize: "52px",
              fontWeight: 300,
              letterSpacing: "0.12em",
              color: "var(--ink-strong)",
              lineHeight: 1,
              textTransform: "uppercase",
            }}
          >
            Rituales
          </h1>

          <p
            className="mt-4 text-center text-[var(--ink-subtle)]"
            style={{
              fontFamily: "var(--font-sans-ui)",
              fontSize: "13px",
              fontWeight: 300,
              letterSpacing: "0.08em",
              lineHeight: 1.6,
            }}
          >
            Magia natural para ordenar tu intención.
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

function AppShell() {
  const { loading } = useUser();
  const [minimumReached, setMinimumReached] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMinimumReached(true);
    }, 4000);

    return () => window.clearTimeout(timer);
  }, []);

  const showSplash = useMemo(
    () => loading || !minimumReached,
    [loading, minimumReached],
  );

  return (
    <>
      <RouterProvider router={router} />
      <AnimatePresence>{showSplash ? <SplashScreen /> : null}</AnimatePresence>
      <Analytics />
    </>
  );
}

export default function App() {
  useEffect(() => {
    track("app_open");
  }, []);

  return (
    <UserProvider>
      <RitualProvider>
        <AppShell />
      </RitualProvider>
    </UserProvider>
  );
}
