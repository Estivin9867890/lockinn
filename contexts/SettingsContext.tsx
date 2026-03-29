"use client";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { upsertSettings } from "@/lib/actions/settings";
import { toast } from "sonner";
import type { UserSettings } from "@/lib/types";
import { DEFAULT_SETTINGS } from "@/lib/types";

type SettingsState = Omit<UserSettings, "id" | "user_id" | "updated_at">;

interface SettingsContextType {
  settings: SettingsState;
  isLoading: boolean;
  updateSetting: (key: keyof SettingsState, value: number | string | boolean) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  isLoading: true,
  updateSetting: async () => {},
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const loadSettings = useCallback(async (uid: string) => {
    setIsLoading(true);
    const { data } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", uid)
      .single();
    if (data) {
      const { id, user_id, updated_at, ...rest } = data as UserSettings;
      setSettings({ ...DEFAULT_SETTINGS, ...rest });
    }
    setIsLoading(false);
  }, []);

  // Écoute les changements d'auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        loadSettings(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (uid) {
        loadSettings(uid);
      } else {
        setSettings(DEFAULT_SETTINGS);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadSettings]);

  // Realtime — propagation instantanée
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel("settings-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "user_settings", filter: `user_id=eq.${userId}` },
        (payload) => {
          const { id, user_id, updated_at, ...rest } = payload.new as UserSettings;
          setSettings((prev) => ({ ...prev, ...rest }));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const updateSetting = useCallback(
    async (key: keyof SettingsState, value: number | string | boolean) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
      try {
        await upsertSettings({ [key]: value } as any);
      } catch {
        if (userId) loadSettings(userId);
        toast.error("Erreur de sauvegarde");
      }
    },
    [userId, loadSettings]
  );

  return (
    <SettingsContext.Provider value={{ settings, isLoading, updateSetting }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
