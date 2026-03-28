import React, { createContext, useContext, useState, ReactNode } from "react";

export interface AIRitual {
  title: string;
  opening: string;
  symbolicAction: string;
  closing: string;
}

export interface GuidedSessionSegment {
  id: string;
  kind: "intro" | "personalized" | "ambient" | "closing";
  label: string;
  durationSeconds: number;
  text?: string;
  isReusable?: boolean;
}

export interface GuidedSessionPlan {
  targetDurationMinutes: number;
  soundscape: string;
  personalizedScript: string;
  notes: string;
  segments: GuidedSessionSegment[];
}

export interface GuidedAudioState {
  status: "idle" | "preview" | "rendering" | "ready" | "error";
  audioUrl?: string;
  provider?: string;
  voice?: string;
  model?: string;
}

export interface RitualData {
  ritualId?: string;
  // Onboarding
  ritualType: string;
  simpleMode: boolean;
  // Step 1: Intention
  intention: string;
  intentionCategory: string;
  // Step 2: Energy
  energy: string;
  duration: number;
  intensity: string;
  // Step 3: Element
  element: string;
  // Step 4: AI Ritual
  aiRitual: AIRitual;
  guidedSession?: GuidedSessionPlan;
  guidedAudio?: GuidedAudioState;
  // Step 5: Anchor
  anchor: string;
}

interface RitualContextType {
  ritual: RitualData;
  updateRitual: (updates: Partial<RitualData>) => void;
  resetRitual: () => void;
  isViewMode: boolean;
  setViewMode: (val: boolean) => void;
  selectedPublicRitual: any;
  setSelectedPublicRitual: (r: any) => void;
}

const defaultRitual: RitualData = {
  ritualId: undefined,
  ritualType: "",
  simpleMode: true,
  intention: "",
  intentionCategory: "",
  energy: "",
  duration: 10,
  intensity: "",
  element: "",
  aiRitual: { title: "", opening: "", symbolicAction: "", closing: "" },
  guidedSession: undefined,
  guidedAudio: { status: "idle" },
  anchor: "",
};

const RitualContext = createContext<RitualContextType>({
  ritual: defaultRitual,
  updateRitual: () => {},
  resetRitual: () => {},
  isViewMode: false,
  setViewMode: () => {},
  selectedPublicRitual: null,
  setSelectedPublicRitual: () => {},
});

const STORAGE_KEY = "rituales_current";

function loadFromStorage(): RitualData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultRitual;
    return { ...defaultRitual, ...JSON.parse(raw) };
  } catch {
    return defaultRitual;
  }
}

export const RitualProvider = ({ children }: { children: ReactNode }) => {
  const [ritual, setRitual] = useState<RitualData>(loadFromStorage);
  const [isViewMode, setIsViewMode] = useState(false);
  const [selectedPublicRitual, setSelectedPublicRitual] = useState<any>(null);

  const updateRitual = (updates: Partial<RitualData>) => {
    setRitual((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const resetRitual = () => {
    setRitual(defaultRitual);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };
  const setViewMode = (val: boolean) => setIsViewMode(val);

  return (
    <RitualContext.Provider
      value={{
        ritual,
        updateRitual,
        resetRitual,
        isViewMode,
        setViewMode,
        selectedPublicRitual,
        setSelectedPublicRitual,
      }}
    >
      {children}
    </RitualContext.Provider>
  );
};

export const useRitual = () => useContext(RitualContext);
