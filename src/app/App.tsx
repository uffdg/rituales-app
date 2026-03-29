import { useEffect } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes.tsx";
import { RitualProvider } from "./context/RitualContext";
import { UserProvider } from "./context/UserContext";
import { track } from "./lib/analytics";

export default function App() {
  useEffect(() => {
    track("app_open");
  }, []);

  return (
    <UserProvider>
      <RitualProvider>
        <RouterProvider router={router} />
      </RitualProvider>
    </UserProvider>
  );
}