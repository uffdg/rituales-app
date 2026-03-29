import { useEffect } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes.tsx";
import { RitualProvider } from "./context/RitualContext";
import { UserProvider } from "./context/UserContext";
import { track } from "./lib/analytics";
import { Analytics } from "@vercel/analytics/react";

export default function App() {
  useEffect(() => {
    track("app_open");
  }, []);

  return (
    <UserProvider>
      <RitualProvider>
        <RouterProvider router={router} />
        <Analytics />
      </RitualProvider>
    </UserProvider>
  );
}