import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  plan: string | null;
  paid_this_month: boolean;
  trial_completed: boolean;
  created_at: string;
  updated_at: string;
}

const PROFILE_UPDATED_EVENT = "profile-updated";

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = () => setRefreshKey((k) => k + 1);

  const updateDisplayName = async (nextDisplayName: string) => {
    if (!user) {
      return { error: new Error("ログイン情報が見つかりません") };
    }

    const trimmedName = nextDisplayName.trim();
    if (!trimmedName) {
      return { error: new Error("名前を入力してください") };
    }

    const { data: updatedRow, error: updateError } = await supabase
      .from("profiles")
      .update({ display_name: trimmedName })
      .eq("user_id", user.id)
      .select("*")
      .maybeSingle();

    if (updateError) {
      return { error: updateError };
    }

    const nextProfile = updatedRow
      ? (updatedRow as Profile)
      : await (async () => {
          const { data: insertedRow, error: insertError } = await supabase
            .from("profiles")
            .insert({
              user_id: user.id,
              display_name: trimmedName,
            })
            .select("*")
            .single();

          if (insertError) {
            throw insertError;
          }

          return insertedRow as Profile;
        })().catch((error) => ({ error } as const));

    if ("error" in nextProfile) {
      return { error: nextProfile.error };
    }

    setProfile(nextProfile);
    window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT, { detail: nextProfile }));
    return { data: nextProfile, error: null };
  };

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const fetchProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!cancelled) {
        if (!error) {
          setProfile((data as Profile) ?? null);
        }
        setLoading(false);
      }
    };

    fetchProfile();
    return () => {
      cancelled = true;
    };
  }, [user, refreshKey]);

  useEffect(() => {
    const handleProfileUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<Profile>;
      if (customEvent.detail?.user_id === user?.id) {
        setProfile(customEvent.detail);
      }
    };

    window.addEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
    return () => window.removeEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
  }, [user?.id]);

  return { profile, loading, refetch, updateDisplayName };
};

export const useAllCustomerProfiles = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "customer");

      if (!roles || roles.length === 0) {
        setProfiles([]);
        setLoading(false);
        return;
      }

      const customerIds = roles.map((r) => r.user_id);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", customerIds);

      if (!error && data) {
        setProfiles(data as Profile[]);
      }
      setLoading(false);
    };

    fetchProfiles();
  }, []);

  return { profiles, loading, setProfiles };
};
