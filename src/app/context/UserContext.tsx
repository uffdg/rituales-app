import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { RitualData } from "./RitualContext";
import {
  deleteOwnRitual,
  favoriteRitual,
  getUserDashboard,
  likeRitual,
  ritualRecordToRitualData,
  unlikeRitual,
  unfavoriteRitual,
  updateProfile,
  type UserProfileData,
} from "../lib/user-service";
import type { RitualRecord } from "../lib/ritual-service";

export interface SavedRitual {
  id: string;
  savedAt: string;
  ritual: RitualData;
  likesCount?: number;
}

interface UserContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  profile: UserProfileData | null;
  savedRituals: SavedRitual[];
  ownRituals: SavedRitual[];
  saveRitual: (ritual: RitualData) => Promise<boolean>;
  removeSavedRitual: (id: string) => Promise<void>;
  deleteOwnRitualById: (id: string) => Promise<void>;
  isRitualSaved: (ritual: RitualData) => boolean;
  likesReceived: number;
  updateProfileName: (fullName: string) => Promise<void>;
  refreshDashboard: () => Promise<void>;
  likeRitualById: (ritualId: string) => Promise<{ liked: boolean; likesCount: number }>;
  unlikeRitualById: (ritualId: string) => Promise<{ liked: boolean; likesCount: number }>;
  signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  session: null,
  user: null,
  loading: true,
  profile: null,
  savedRituals: [],
  ownRituals: [],
  saveRitual: async () => true,
  removeSavedRitual: async () => {},
  deleteOwnRitualById: async () => {},
  isRitualSaved: () => false,
  likesReceived: 0,
  updateProfileName: async () => {},
  refreshDashboard: async () => {},
  likeRitualById: async () => ({ liked: true, likesCount: 0 }),
  unlikeRitualById: async () => ({ liked: false, likesCount: 0 }),
  signOut: async () => {},
});

function toSavedRitual(ritual: RitualRecord): SavedRitual {
  return {
    id: ritual.ritualId || `${Date.now()}`,
    savedAt: ritual.createdAt
      ? new Date(ritual.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "long" })
      : new Date().toLocaleDateString("es-AR", { day: "numeric", month: "long" }),
    ritual: ritualRecordToRitualData(ritual),
    likesCount: ritual.likesCount || 0,
  };
}

function matchesSavedRitual(saved: RitualData, ritual: RitualData) {
  if (saved.ritualId && ritual.ritualId) {
    return saved.ritualId === ritual.ritualId;
  }

  return (
    saved.aiRitual.title.trim().toLowerCase() === ritual.aiRitual.title.trim().toLowerCase() &&
    saved.intention.trim().toLowerCase() === ritual.intention.trim().toLowerCase() &&
    saved.anchor.trim().toLowerCase() === ritual.anchor.trim().toLowerCase()
  );
}

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [savedRituals, setSavedRituals] = useState<SavedRitual[]>([]);
  const [ownRituals, setOwnRituals] = useState<SavedRitual[]>([]);

  const refreshDashboard = async () => {
    if (!session?.user) {
      setProfile(null);
      setSavedRituals([]);
      setOwnRituals([]);
      return;
    }

    try {
      const dashboard = await getUserDashboard();
      if (!dashboard) {
        setProfile({
          id: session.user.id,
          email: session.user.email || "",
          fullName: session.user.user_metadata?.full_name || "",
          likesReceived: 0,
        });
        return;
      }

      setProfile(dashboard.profile);
      setSavedRituals(dashboard.rituals.favorites.map(toSavedRitual));
      setOwnRituals(dashboard.rituals.own.map(toSavedRitual));
    } catch {
      setProfile({
        id: session.user.id,
        email: session.user.email || "",
        fullName: session.user.user_metadata?.full_name || "",
        likesReceived: 0,
      });
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading) {
      refreshDashboard().catch(() => {});
    }
  }, [loading, session?.user?.id]);

  const isRitualSaved = (ritual: RitualData) =>
    savedRituals.some((entry) => matchesSavedRitual(entry.ritual, ritual));

  const saveRitual = async (ritual: RitualData): Promise<boolean> => {
    if (!ritual.ritualId || isRitualSaved(ritual)) {
      return false;
    }

    await favoriteRitual(ritual.ritualId);
    await refreshDashboard();
    return true;
  };

  const removeSavedRitual = async (id: string) => {
    await unfavoriteRitual(id);
    await refreshDashboard();
  };

  const deleteOwnRitualById = async (id: string) => {
    await deleteOwnRitual(id);
    await refreshDashboard();
  };

  const updateProfileName = async (fullName: string) => {
    const nextProfile = await updateProfile(fullName);
    setProfile((prev) => ({
      id: nextProfile.id,
      email: nextProfile.email,
      fullName: nextProfile.fullName,
      likesReceived: nextProfile.likesReceived ?? prev?.likesReceived ?? 0,
    }));

    await supabase.auth.refreshSession();
  };

  const likeRitualById = async (ritualId: string) => {
    const result = await likeRitual(ritualId);
    await refreshDashboard();
    return {
      liked: Boolean(result.liked),
      likesCount: result.likesCount || 0,
    };
  };

  const unlikeRitualById = async (ritualId: string) => {
    const result = await unlikeRitual(ritualId);
    await refreshDashboard();
    return {
      liked: Boolean(result.liked),
      likesCount: result.likesCount || 0,
    };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSavedRituals([]);
    setOwnRituals([]);
  };

  return (
    <UserContext.Provider
      value={{
        session,
        user,
        loading,
        profile,
        savedRituals,
        ownRituals,
        saveRitual,
        removeSavedRitual,
        deleteOwnRitualById,
        isRitualSaved,
        likesReceived: profile?.likesReceived || 0,
        updateProfileName,
        refreshDashboard,
        likeRitualById,
        unlikeRitualById,
        signOut,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
