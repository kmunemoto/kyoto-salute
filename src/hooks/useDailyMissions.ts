import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getJSTToday, formatJST } from "@/lib/timezone";
import { pickDailyMissions } from "@/lib/missionSystem";
import { ensureDailyMissions } from "@/lib/missionRewards";

export interface DailyMissionRow {
  mission_date: string;
  mission_keys: string[];
  completed_keys: string[];
  all_completed: boolean;
  exp_earned: number;
}

export const useDailyMissions = () => {
  const { user } = useAuth();
  const [mission, setMission] = useState<DailyMissionRow | null>(null);
  const [hasBookingToday, setHasBookingToday] = useState(false);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) return;
    const today = getJSTToday();
    const { data } = await supabase
      .from("daily_missions")
      .select("mission_date, mission_keys, completed_keys, all_completed, exp_earned")
      .eq("user_id", user.id)
      .eq("mission_date", today)
      .maybeSingle();
    setMission(data as DailyMissionRow | null);
  }, [user]);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const today = getJSTToday();

      // Check today's booking (non-cancelled)
      const startOfDay = `${today}T00:00:00+09:00`;
      const endOfDay = `${today}T23:59:59+09:00`;
      const { data: bookings } = await supabase
        .from("bookings")
        .select("id, booking_date, status")
        .eq("user_id", user.id)
        .neq("status", "キャンセル済み")
        .gte("booking_date", startOfDay)
        .lte("booking_date", endOfDay);
      const hasBooking = (bookings || []).some(
        (b: any) => formatJST(b.booking_date, "yyyy-MM-dd") === today,
      );
      if (cancelled) return;
      setHasBookingToday(hasBooking);

      if (hasBooking) {
        // Ensure mission row exists
        const { data: existing } = await supabase
          .from("daily_missions")
          .select("mission_date, mission_keys, completed_keys, all_completed, exp_earned")
          .eq("user_id", user.id)
          .eq("mission_date", today)
          .maybeSingle();
        if (existing) {
          setMission(existing as DailyMissionRow);
        } else {
          const keys = pickDailyMissions();
          await ensureDailyMissions(user.id, today, keys);
          await refetch();
        }
      }
      if (!cancelled) setLoading(false);
    })().catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user, refetch]);

  return { mission, hasBookingToday, loading, refetch };
};