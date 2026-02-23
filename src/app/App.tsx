import { RouterProvider } from "react-router";
import { router } from "./routes";
import { RitualProvider } from "./context/RitualContext";
import { UserProvider } from "./context/UserContext";

export default function App() {
  return (
    <UserProvider>
      <RitualProvider>
        <RouterProvider router={router} />
      </RitualProvider>
    </UserProvider>
  );
}