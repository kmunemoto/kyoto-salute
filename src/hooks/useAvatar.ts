import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "./useProfile";
import {
  buildExpLogsFromWorkouts,
  computeAchievements,
  recomputeAvatar,
  unlockAchievements,
  type WorkoutRow,
} from "@/lib/avatarRewards";
import { getMuscleGroup } from "@/lib/muscleGroup";
import { computeTitles } from "@/lib/titleSystem";
import { formatJST } from "@/lib/timezone";

export interface AvatarRow {
  total_exp: number;
  level: number;
  coins: number;
  combo_count?: number;
  last_session_date?: string | null;
  max_combo_reached?: number;
  combo_5_count?: number;
  equipped_title?: string | null;
}

export interface ExpLogRow {
  id: string;
  exp_amount: number;
  reason: string;
  reference_date: string | null;
  created_at: string;
}

export const useAvatar = (autoSync = true) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [avatar, setAvatar] = useState<AvatarRow | null>(null);
  const [logs, setLogs] = useState<ExpLogRow[]>([]);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [titles, setTitles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [levelUp, setLevelUp] = useState<{ newLevel: number; earnedCoins: number } | null>(null);

  const refetch = useCallback(async () => {
    if (!user) return;
    const [avRes, logRes, achRes, titleRes] = await Promise.all([
      supabase.from("user_avatars").select("total_exp, level, coins, combo_count, last_session_date, max_combo_reached, combo_5_count, equipped_title").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("avatar_exp_logs")
        .select("id, exp_amount, reason, reference_date, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.from("avatar_achievements").select("achievement_key").eq("user_id", user.id),
      supabase.from("user_titles").select("title_key").eq("user_id", user.id),
    ]);
    setAvatar((avRes.data as AvatarRow) ?? { total_exp: 0, level: 1, coins: 0 });
    setLogs((logRes.data as ExpLogRow[]) || []);
    setAchievements(((achRes.data as any[]) || []).map((r) => r.achievement_key));
    setTitles(((titleRes.data as any[]) || []).map((r) => r.title_key));
  }, [user]);

  // Initial sync: backfill from workouts if needed
  useEffect(() => {
    if (!user || !autoSync) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    (async () => {
      setLoading(true);
      const { data: avRow } = await supabase
        .from("user_avatars")
        .select("total_exp, level, coins, combo_5_count, max_combo_reached")
        .eq("user_id", user.id)
        .maybeSingle();

      // Always sync logs from workouts (idempotent)
      const { data: workoutsData } = await supabase
        .from("workouts")
        .select("id, workout_date, weight, reps, sets, exercise_id, exercises(name)")
        .eq("user_id", user.id)
        .order("workout_date", { ascending: true });

      const workouts: WorkoutRow[] = (workoutsData || []).map((w: any) => ({
        id: w.id,
        workout_date: w.workout_date,
        weight: w.weight,
        reps: w.reps,
        sets: w.sets,
        exercise_id: w.exercise_id,
        exercise_name: w.exercises?.name || "",
      }));

      if (!avRow) {
        await supabase.from("user_avatars").insert({ user_id: user.id, total_exp: 0, level: 1, coins: 0 });
      }

      const expLogs = buildExpLogsFromWorkouts(workouts, profile?.plan ?? null);
      const result = await recomputeAvatar(user.id, expLogs);
      if (result.newLevel > result.oldLevel && result.oldLevel >= 1 && avRow) {
        setLevelUp({ newLevel: result.newLevel, earnedCoins: result.newCoins - result.oldCoins });
      }

      // Achievements
      const { count } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .neq("status", "キャンセル済み")
        .lt("booking_date", new Date().toISOString());

      // Mission stats
      const { data: missionsData } = await supabase
        .from("daily_missions")
        .select("mission_date, completed_keys, all_completed")
        .eq("user_id", user.id);
      const rows = (missionsData || []) as any[];
      const rowsWithAnyComplete = rows.filter((r) => (r.completed_keys || []).length > 0).length;
      const totalCompletedCount = rows.reduce((s, r) => s + (r.completed_keys?.length || 0), 0);
      const perfectDayCount = rows.filter((r) => r.all_completed).length;
      // perfect_week: any ISO-week where every session-date in that week has all_completed
      const perfectByDate = new Map<string, boolean>();
      rows.forEach((r) => perfectByDate.set(r.mission_date, !!r.all_completed));
      const sessionDates = new Set(workouts.map((w) => w.workout_date));
      const weekMap = new Map<string, { total: number; perfect: number }>();
      sessionDates.forEach((d) => {
        const dt = new Date(d);
        const onejan = new Date(dt.getFullYear(), 0, 1);
        const wk = Math.ceil(((dt.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
        const key = `${dt.getFullYear()}-W${String(wk).padStart(2, "0")}`;
        const cur = weekMap.get(key) || { total: 0, perfect: 0 };
        cur.total += 1;
        if (perfectByDate.get(d)) cur.perfect += 1;
        weekMap.set(key, cur);
      });
      const hasPerfectWeek = [...weekMap.values()].some((v) => v.total > 0 && v.total === v.perfect);

      const achKeys = computeAchievements(workouts, count || 0, profile?.best_streak || 0, getMuscleGroup, {
        rowsWithAnyComplete, totalCompletedCount, perfectDayCount, hasPerfectWeek,
      });
      await unlockAchievements(user.id, achKeys);

      // Title computation
      const { data: bookingsForTitles } = await supabase
        .from("bookings")
        .select("booking_date")
        .eq("user_id", user.id)
        .neq("status", "キャンセル済み")
        .lt("booking_date", new Date().toISOString());
      const bookingHours = (bookingsForTitles || []).map((b: any) => parseInt(formatJST(b.booking_date, "HH"), 10));

      // Raid contribution count (defeated raids the user contributed to)
      const { data: raidContribs } = await supabase
        .from("raid_damage_logs")
        .select("raid_id, raid_bosses!inner(defeated)")
        .eq("user_id", user.id);
      const defeatedRaidIds = new Set<string>();
      (raidContribs || []).forEach((r: any) => {
        if (r.raid_bosses?.defeated) defeatedRaidIds.add(r.raid_id);
      });

      const titleKeys = computeTitles({
        workouts: workouts as any,
        bookingHours,
        bestStreakWeeks: profile?.best_streak || 0,
        raidsContributedAndDefeated: defeatedRaidIds.size,
        totalMissionCompletions: totalCompletedCount,
        combo5Reached: avRow?.combo_5_count || 0,
        exerciseMuscleGroup: getMuscleGroup,
      });
      if (titleKeys.length > 0) {
        const rows = titleKeys.map((k) => ({ user_id: user.id, title_key: k }));
        await supabase.from("user_titles").upsert(rows, { onConflict: "user_id,title_key", ignoreDuplicates: true });
      }

      if (!cancelled) {
        await refetch();
        setLoading(false);
      }
    })().catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [user, profile?.plan, profile?.best_streak, autoSync, refetch]);

  const equipTitle = useCallback(async (titleKey: string | null) => {
    if (!user) return;
    await supabase.from("user_avatars").update({ equipped_title: titleKey } as any).eq("user_id", user.id);
    await refetch();
  }, [user, refetch]);

  return { avatar, logs, achievements, titles, loading, refetch, levelUp, clearLevelUp: () => setLevelUp(null), equipTitle };
};