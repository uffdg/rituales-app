import React, { createContext, useContext, useState, ReactNode } from "react";
import { RitualData } from "./RitualContext";

export interface SavedRitual {
  id: string;
  savedAt: string;
  ritual: RitualData;
}

interface User {
  name: string;
  initial: string;
}

interface UserContextType {
  user: User;
  savedRituals: SavedRitual[];
  saveRitual: (ritual: RitualData) => boolean; // returns true if new, false if already saved
  removeSavedRitual: (id: string) => void;
  isRitualSaved: (ritual: RitualData) => boolean;
}

const MOCK_USER: User = { name: "Valentina", initial: "V" };

const UserContext = createContext<UserContextType>({
  user: MOCK_USER,
  savedRituals: [],
  saveRitual: () => true,
  removeSavedRitual: () => {},
  isRitualSaved: () => false,
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [savedRituals, setSavedRituals] = useState<SavedRitual[]>([]);

  const isRitualSaved = (ritual: RitualData) =>
    savedRituals.some((s) => s.ritual.aiRitual?.title === ritual.aiRitual?.title);

  const saveRitual = (ritual: RitualData): boolean => {
    if (isRitualSaved(ritual)) return false;
    const entry: SavedRitual = {
      id: `${Date.now()}`,
      savedAt: new Date().toLocaleDateString("es-AR", {
        day: "numeric",
        month: "long",
      }),
      ritual,
    };
    setSavedRituals((prev) => [entry, ...prev]);
    return true;
  };

  const removeSavedRitual = (id: string) =>
    setSavedRituals((prev) => prev.filter((s) => s.id !== id));

  return (
    <UserContext.Provider
      value={{ user: MOCK_USER, savedRituals, saveRitual, removeSavedRitual, isRitualSaved }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
