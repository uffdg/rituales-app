import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { RitualData } from "./RitualContext";

export interface SavedRitual {
  id: string;
  savedAt: string;
  ritual: RitualData;
}

interface UserContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  savedRituals: SavedRitual[];
  saveRitual: (ritual: RitualData) => boolean;
  removeSavedRitual: (id: string) => void;
  isRitualSaved: (ritual: RitualData) => boolean;
  signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  session: null,
  user: null,
  loading: true,
  savedRituals: [],
  saveRitual: () => true,
  removeSavedRitual: () => {},
  isRitualSaved: () => false,
  signOut: async () => {},
});

const SAVED_KEY = "rituales_saved";

function loadSaved(): SavedRitual[] {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedRituals, setSavedRituals] = useState<SavedRitual[]>(loadSaved);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Persist saved rituals to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(savedRituals));
    } catch {}
  }, [savedRituals]);

  const isRitualSaved = (ritual: RitualData) =>
    savedRituals.some((s) => s.ritual.aiRitual?.title === ritual.aiRitual?.title);

  const saveRitual = (ritual: RitualData): boolean => {
    if (isRitualSaved(ritual)) return false;
    const entry: SavedRitual = {
      id: `${Date.now()}`,
      savedAt: new Date().toLocaleDateString("es-AR", { day: "numeric", month: "long" }),
      ritual,
    };
    setSavedRituals((prev) => [entry, ...prev]);
    return true;
  };

  const removeSavedRitual = (id: string) =>
    setSavedRituals((prev) => prev.filter((s) => s.id !== id));

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <UserContext.Provider
      value={{ session, user, loading, savedRituals, saveRitual, removeSavedRitual, isRitualSaved, signOut }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
