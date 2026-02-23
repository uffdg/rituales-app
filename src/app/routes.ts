import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Onboarding } from "./pages/Onboarding";
import { StepIntention } from "./pages/StepIntention";
import { StepEnergy } from "./pages/StepEnergy";
import { StepElement } from "./pages/StepElement";
import { StepRitual } from "./pages/StepRitual";
import { StepAnchor } from "./pages/StepAnchor";
import { RitualDetail } from "./pages/RitualDetail";
import { Share } from "./pages/Share";
import { Explore } from "./pages/Explore";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "onboarding", Component: Onboarding },
      { path: "crear/1", Component: StepIntention },
      { path: "crear/2", Component: StepEnergy },
      { path: "crear/3", Component: StepElement },
      { path: "crear/4", Component: StepRitual },
      { path: "crear/5", Component: StepAnchor },
      { path: "ritual/:id", Component: RitualDetail },
      { path: "compartir", Component: Share },
      { path: "explorar", Component: Explore },
    ],
  },
]);