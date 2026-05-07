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

export interface AvatarRow {
  total_exp: number;
  level: number;
  coins: number;
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
  const [loading, setLoading] = useState(true);
  const [levelUp, setLevelUp] = useState<{ newLevel: number; earnedCoins: number } | null>(null);

  const refetch = useCallback(async () => {
    if (!user) return;
    const [avRes, logRes, achRes] = await Promise.all([
      supabase.from("user_avatars").select("total_exp, level, coins").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("avatar_exp_logs")
        .select("id, exp_amount, reason, reference_date, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.from("avatar_achievements").select("achievement_key").eq("user_id", user.id),
    ]);
    setAvatar((avRes.data as AvatarRow) ?? { total_exp: 0, level: 1, coins: 0 });
    setLogs((logRes.data as ExpLogRow[]) || []);
    setAchievements(((achRes.data as any[]) || []).map((r) => r.achievement_key));
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
        .select("total_exp, level, coins")
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

  return { avatar, logs, achievements, loading, refetch, levelUp, clearLevelUp: () => setLevelUp(null) };
};