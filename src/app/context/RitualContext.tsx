import React, { createContext, useContext, useState, ReactNode } from "react";

export interface AIRitual {
  title: string;
  opening: string;
  symbolicAction: string;
  closing: string;
}

export interface RitualData {
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
  ritualType: "",
  simpleMode: true,
  intention: "",
  intentionCategory: "",
  energy: "",
  duration: 10,
  intensity: "",
  element: "",
  aiRitual: { title: "", opening: "", symbolicAction: "", closing: "" },
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

export const RitualProvider = ({ children }: { children: ReactNode }) => {
  const [ritual, setRitual] = useState<RitualData>(defaultRitual);
  const [isViewMode, setIsViewMode] = useState(false);
  const [selectedPublicRitual, setSelectedPublicRitual] = useState<any>(null);

  const updateRitual = (updates: Partial<RitualData>) => {
    setRitual((prev) => ({ ...prev, ...updates }));
  };

  const resetRitual = () => setRitual(defaultRitual);
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
