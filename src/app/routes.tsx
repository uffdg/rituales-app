import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Onboarding } from "./pages/Onboarding";
import { StepIntention } from "./pages/StepIntention";
import { StepEnergy } from "./pages/StepEnergy";
import { StepElement } from "./pages/StepElement";
import { StepRitual } from "./pages/StepRitual";
import { StepAnchor } from "./pages/StepAnchor";
import { RitualDetail } from "./pages/RitualDetail";
import { Share } from "./pages/Share";
import { Explore } from "./pages/Explore";
import { Account } from "./pages/Account";
import { CosmicCalendar } from "./pages/CosmicCalendar";
import { Wiki } from "./pages/Wiki";
import { WikiNote } from "./pages/WikiNote";
import { AuthGuard } from "./components/AuthGuard";

const guard = (Component: React.ComponentType) => () => (
  <AuthGuard><Component /></AuthGuard>
);

export const router = createBrowserRouter([
  { path: "/login", Component: Login },
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "calendario-cosmico", Component: CosmicCalendar },
      { path: "wiki", Component: Wiki },
      { path: "wiki/:id", Component: WikiNote },
      { path: "explorar", Component: Explore },
      { path: "ritual/:id", Component: RitualDetail },
      // Requieren login
      { path: "onboarding", Component: guard(Onboarding) },
      { path: "crear/1", Component: guard(StepIntention) },
      { path: "crear/2", Component: guard(StepEnergy) },
      { path: "crear/3", Component: guard(StepElement) },
      { path: "crear/4", Component: guard(StepRitual) },
      { path: "crear/5", Component: guard(StepAnchor) },
      { path: "compartir", Component: guard(Share) },
      { path: "cuenta", Component: guard(Account) },
    ],
  },
]);
