import { useEffect, useState, useCallback } from "react";
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

export interface ProfileWithBooking extends Profile {
  next_booking_date: string | null;
  next_booking_type: string | null;
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
  const [profiles, setProfiles] = useState<ProfileWithBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfiles = useCallback(async () => {
    // 1. Get all customer user_ids from roles
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "customer");

    // 2. Get all user_ids that have bookings (union for self-healing)
    const { data: bookingUsers } = await supabase
      .from("bookings")
      .select("user_id");

    const allUserIds = new Set<string>();
    roles?.forEach((r) => allUserIds.add(r.user_id));
    bookingUsers?.forEach((b) => allUserIds.add(b.user_id));

    // Remove trainer ids
    const { data: trainerRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "trainer");
    trainerRoles?.forEach((t) => allUserIds.delete(t.user_id));

    if (allUserIds.size === 0) {
      setProfiles([]);
      setLoading(false);
      return;
    }

    const customerIds = [...allUserIds];

    // 3. Fetch profiles
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .in("user_id", customerIds);

    // 4. Fetch all future bookings for these customers (next booking)
    const now = new Date().toISOString();
    const { data: futureBookings } = await supabase
      .from("bookings")
      .select("user_id, booking_date, booking_type, status")
      .in("user_id", customerIds)
      .gte("booking_date", now)
      .neq("status", "キャンセル済み")
      .order("booking_date", { ascending: true });

    // Build next-booking map (first future booking per user)
    const nextBookingMap: Record<string, { booking_date: string; booking_type: string }> = {};
    futureBookings?.forEach((b) => {
      if (!nextBookingMap[b.user_id]) {
        nextBookingMap[b.user_id] = { booking_date: b.booking_date, booking_type: b.booking_type };
      }
    });

    // Merge profiles with booking info
    const merged: ProfileWithBooking[] = (profileData || []).map((p) => ({
      ...(p as Profile),
      next_booking_date: nextBookingMap[p.user_id]?.booking_date || null,
      next_booking_type: nextBookingMap[p.user_id]?.booking_type || null,
    }));

    setProfiles(merged);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  // Realtime: refetch when bookings or profiles change
  useEffect(() => {
    const channel = supabase
      .channel("customer-list-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => {
        fetchProfiles();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        fetchProfiles();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProfiles]);

  return { profiles, loading, setProfiles };
};
