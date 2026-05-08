import { supabase } from "@/integrations/supabase/client";
import { calculateLevel } from "./avatarSystem";
import { getMissionDef, MISSION_BONUS_EXP, pickDailyMissions, type MissionKey } from "./missionSystem";
import { getMuscleGroup } from "./muscleGroup";
import { formatJST } from "./timezone";
import { getRankInfo } from "./avatarSystem";
import { MISSION_EXP_MULT } from "./rankPerks";

async function getMissionMult(userId: string): Promise<number> {
  const { data } = await supabase.from("user_avatars").select("level").eq("user_id", userId).maybeSingle();
  const lvl = (data as any)?.level || 1;
  return MISSION_EXP_MULT[getRankInfo(lvl).key];
}

export interface MissionEvalContext {
  userId: string;
  date: string; // yyyy-MM-dd (JST)
}

export interface MissionEvalResult {
  newlyCompleted: { key: string; name: string; exp: number }[];
  bonusAwarded: boolean;
  allCompleted: boolean;
}

interface WorkoutRow {
  workout_date: string;
  weight: number | null;
  reps: number | null;
  sets: { set: number; weight: number; reps: number }[] | null;
  exercise_id: string;
  exercise_name: string;
}

const setsOf = (w: WorkoutRow) =>
  w.sets && w.sets.length > 0
    ? w.sets
    : w.weight != null
      ? [{ set: 1, weight: Number(w.weight), reps: Number(w.reps || 0) }]
      : [];

/** Fetch today's workouts + previous max weight per exercise + booking time. */
async function loadEvalData(userId: string, date: string) {
  const [todayRes, allRes, bookingRes] = await Promise.all([
    supabase
      .from("workouts")
      .select("workout_date, weight, reps, sets, exercise_id, exercises(name)")
      .eq("user_id", userId)
      .eq("workout_date", date),
    supabase
      .from("workouts")
      .select("workout_date, weight, reps, sets, exercise_id, exercises(name)")
      .eq("user_id", userId)
      .lt("workout_date", date),
    supabase
      .from("bookings")
      .select("booking_date")
      .eq("user_id", userId)
      .neq("status", "キャンセル済み"),
  ]);

  const todayWorkouts: WorkoutRow[] = (todayRes.data || []).map((w: any) => ({
    workout_date: w.workout_date,
    weight: w.weight,
    reps: w.reps,
    sets: w.sets,
    exercise_id: w.exercise_id,
    exercise_name: w.exercises?.name || "",
  }));

  const prevMaxByExercise = new Map<string, number>();
  for (const w of (allRes.data || []) as any[]) {
    const sets = (w.sets as any[]) || (w.weight != null ? [{ weight: w.weight }] : []);
    const max = sets.reduce((m, s) => Math.max(m, Number(s.weight) || 0), 0);
    const prev = prevMaxByExercise.get(w.exercise_id) ?? 0;
    if (max > prev) prevMaxByExercise.set(w.exercise_id, max);
  }

  // Find today's booking time (JST hour)
  let bookingHour: number | null = null;
  for (const b of (bookingRes.data || []) as any[]) {
    const d = formatJST(b.booking_date, "yyyy-MM-dd");
    if (d === date) {
      const hourStr = formatJST(b.booking_date, "HH");
      bookingHour = parseInt(hourStr, 10);
      break;
    }
  }

  return { todayWorkouts, prevMaxByExercise, bookingHour };
}

function evaluateMission(
  key: MissionKey,
  ctx: { todayWorkouts: WorkoutRow[]; prevMaxByExercise: Map<string, number>; bookingHour: number | null },
): boolean {
  const { todayWorkouts: ws, prevMaxByExercise, bookingHour } = ctx;
  if (ws.length === 0) return false;

  switch (key) {
    case "full_power": {
      // For each exercise today, today's max >= prev max (no prev = pass)
      const todayMaxByEx = new Map<string, number>();
      for (const w of ws) {
        const m = setsOf(w).reduce((mx, s) => Math.max(mx, Number(s.weight) || 0), 0);
        todayMaxByEx.set(w.exercise_id, Math.max(todayMaxByEx.get(w.exercise_id) ?? 0, m));
      }
      for (const [exId, todayMax] of todayMaxByEx) {
        const prev = prevMaxByExercise.get(exId);
        if (prev != null && todayMax < prev) return false;
      }
      return true;
    }
    case "volume_king": {
      const total = ws.reduce(
        (s, w) => s + setsOf(w).reduce((ss, st) => ss + (Number(st.weight) || 0) * (Number(st.reps) || 0), 0),
        0,
      );
      return total >= 5000;
    }
    case "three_parts": {
      const groups = new Set(ws.map((w) => getMuscleGroup(w.exercise_name || "")));
      groups.delete("その他");
      return groups.size >= 3;
    }
    case "rep_master": {
      for (const w of ws) {
        const sets = setsOf(w);
        if (sets.length === 0) return false;
        if (!sets.every((s) => Number(s.reps) >= 10)) return false;
      }
      return true;
    }
    case "new_record": {
      const todayMaxByEx = new Map<string, number>();
      for (const w of ws) {
        const m = setsOf(w).reduce((mx, s) => Math.max(mx, Number(s.weight) || 0), 0);
        todayMaxByEx.set(w.exercise_id, Math.max(todayMaxByEx.get(w.exercise_id) ?? 0, m));
      }
      for (const [exId, todayMax] of todayMaxByEx) {
        const prev = prevMaxByExercise.get(exId) ?? 0;
        if (todayMax > prev) return true;
      }
      return false;
    }
    case "complete_sets": {
      // Aggregate sets per exercise across rows for today
      const setsByEx = new Map<string, number>();
      for (const w of ws) {
        setsByEx.set(w.exercise_id, (setsByEx.get(w.exercise_id) ?? 0) + setsOf(w).length);
      }
      if (setsByEx.size === 0) return false;
      return [...setsByEx.values()].every((n) => n >= 3);
    }
    case "morning_training":
      return bookingHour != null && bookingHour < 12;
    case "night_fighter":
      return bookingHour != null && bookingHour >= 19;
  }
}

/**
 * Evaluate today's missions for a user and award EXP for newly-completed ones.
 * Returns info about what got newly completed.
 */
export async function evaluateAndAwardMissions(
  userId: string,
  date: string,
): Promise<MissionEvalResult> {
  let { data: missionRow } = await supabase
    .from("daily_missions")
    .select("id, mission_keys, completed_keys, all_completed, exp_earned")
    .eq("user_id", userId)
    .eq("mission_date", date)
    .maybeSingle();

  // Auto-create today's mission row if missing (e.g., training saved without booking).
  if (!missionRow) {
    const keys = pickDailyMissions();
    await ensureDailyMissions(userId, date, keys);
    const { data: created } = await supabase
      .from("daily_missions")
      .select("id, mission_keys, completed_keys, all_completed, exp_earned")
      .eq("user_id", userId)
      .eq("mission_date", date)
      .maybeSingle();
    missionRow = created;
    if (!missionRow) return { newlyCompleted: [], bonusAwarded: false, allCompleted: false };
  }

  const data = await loadEvalData(userId, date);
  const mult = await getMissionMult(userId);

  const already = new Set<string>(missionRow.completed_keys || []);
  const newlyCompleted: { key: string; name: string; exp: number }[] = [];
  const newExpLogs: { user_id: string; exp_amount: number; reason: string; reference_date: string }[] = [];

  for (const key of missionRow.mission_keys as MissionKey[]) {
    if (already.has(key)) continue;
    if (evaluateMission(key, data)) {
      const def = getMissionDef(key);
      if (!def) continue;
      already.add(key);
      const exp = Math.ceil(def.exp * mult);
      newlyCompleted.push({ key, name: `${def.icon} ${def.name}`, exp });
      newExpLogs.push({
        user_id: userId,
        exp_amount: exp,
        reason: `mission|${key}|${date}`,
        reference_date: date,
      });
    }
  }

  const allCompleted = (missionRow.mission_keys as string[]).every((k) => already.has(k));
  const bonusJustAwarded = allCompleted && !missionRow.all_completed;
  if (bonusJustAwarded) {
    const bonusExp = Math.ceil(MISSION_BONUS_EXP * mult);
    newExpLogs.push({
      user_id: userId,
      exp_amount: bonusExp,
      reason: `mission_bonus|${date}`,
      reference_date: date,
    });
  }

  if (newExpLogs.length === 0 && !bonusJustAwarded) {
    return { newlyCompleted: [], bonusAwarded: false, allCompleted };
  }

  // Insert new logs
  if (newExpLogs.length > 0) {
    await supabase
      .from("avatar_exp_logs")
      .upsert(newExpLogs, { onConflict: "user_id,reason,reference_date", ignoreDuplicates: true });
  }

  // Update daily_missions row
  const expEarnedDelta =
    newlyCompleted.reduce((s, m) => s + m.exp, 0) + (bonusJustAwarded ? Math.ceil(MISSION_BONUS_EXP * mult) : 0);
  await supabase
    .from("daily_missions")
    .update({
      completed_keys: [...already],
      all_completed: allCompleted,
      exp_earned: (missionRow.exp_earned || 0) + expEarnedDelta,
    })
    .eq("id", missionRow.id);

  // Recompute total_exp + level on user_avatars
  const { data: allLogs } = await supabase
    .from("avatar_exp_logs")
    .select("exp_amount")
    .eq("user_id", userId);
  const totalExp = (allLogs || []).reduce((s, r: any) => s + (Number(r.exp_amount) || 0), 0);
  const newLevel = calculateLevel(totalExp);

  const { data: avatarRow } = await supabase
    .from("user_avatars")
    .select("level, coins")
    .eq("user_id", userId)
    .maybeSingle();
  if (avatarRow) {
    const oldLevel = avatarRow.level;
    const newCoins = (avatarRow.coins || 0) + Math.max(0, newLevel - oldLevel) * 10;
    await supabase
      .from("user_avatars")
      .update({ total_exp: totalExp, level: newLevel, coins: newCoins })
      .eq("user_id", userId);
  }

  return { newlyCompleted, bonusAwarded: bonusJustAwarded, allCompleted };
}

/**
 * Ensure today's mission row exists (insert if missing).
 */
export async function ensureDailyMissions(userId: string, date: string, keys: string[]) {
  await supabase
    .from("daily_missions")
    .upsert(
      { user_id: userId, mission_date: date, mission_keys: keys },
      { onConflict: "user_id,mission_date", ignoreDuplicates: true },
    );
}