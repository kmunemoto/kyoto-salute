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

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = () => setRefreshKey((k) => k + 1);

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
        if (!error && data) {
          setProfile(data as Profile);
        }
        setLoading(false);
      }
    };

    fetchProfile();
    return () => { cancelled = true; };
  }, [user, refreshKey]);

  return { profile, loading, refetch };
};

export const useAllCustomerProfiles = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      // Get all customer user_ids from user_roles
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
