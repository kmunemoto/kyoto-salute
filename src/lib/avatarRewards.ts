import { supabase } from "@/integrations/supabase/client";
import { calculateLevel, ACHIEVEMENTS } from "./avatarSystem";

export interface WorkoutRow {
  id: string;
  workout_date: string;
  weight: number | null;
  reps: number | null;
  sets: { set: number; weight: number; reps: number }[] | null;
  exercise_id: string;
  exercise_name?: string;
}

const ymd = (d: string) => d.substring(0, 10);
const ym = (d: string) => d.substring(0, 7) + "-01";

const planMaxSessions: Record<string, number> = {
  "月4回": 4,
  "月6回": 6,
  "月8回": 8,
  "通い放題": 15,
};

/**
 * Insert exp logs (idempotent via UNIQUE) and recompute totals.
 * Returns { newExp, oldLevel, newLevel, oldCoins, newCoins }
 */
export async function recomputeAvatar(
  userId: string,
  newLogs: { exp_amount: number; reason: string; reference_date: string | null }[],
) {
  // Fetch current avatar
  const { data: existing } = await supabase
    .from("user_avatars")
    .select("total_exp, level, coins")
    .eq("user_id", userId)
    .maybeSingle();

  const oldExp = existing?.total_exp ?? 0;
  const oldLevel = existing?.level ?? 1;
  const oldCoins = existing?.coins ?? 0;

  // Insert new logs (ignore duplicates via onConflict)
  let addedExp = 0;
  if (newLogs.length > 0) {
    const rows = newLogs.map((l) => ({ user_id: userId, ...l }));
    const { data: inserted } = await supabase
      .from("avatar_exp_logs")
      .upsert(rows, { onConflict: "user_id,reason,reference_date", ignoreDuplicates: true })
      .select("exp_amount");
    addedExp = (inserted || []).reduce((s, r: any) => s + (r.exp_amount || 0), 0);
  }

  if (addedExp === 0 && existing) {
    return { addedExp: 0, oldLevel, newLevel: oldLevel, oldCoins, newCoins: oldCoins, newExp: oldExp };
  }

  const newExp = oldExp + addedExp;
  const newLevel = calculateLevel(newExp);
  const newCoins = oldCoins + Math.max(0, newLevel - oldLevel) * 10;

  if (existing) {
    await supabase
      .from("user_avatars")
      .update({ total_exp: newExp, level: newLevel, coins: newCoins })
      .eq("user_id", userId);
  } else {
    await supabase.from("user_avatars").insert({
      user_id: userId,
      total_exp: newExp,
      level: newLevel,
      coins: newCoins,
    });
  }

  return { addedExp, oldLevel, newLevel, oldCoins, newCoins, newExp };
}

/**
 * Build EXP logs from a complete workout history.
 * Idempotent — safe to run multiple times (DB UNIQUE filters duplicates).
 */
export function buildExpLogsFromWorkouts(
  workouts: WorkoutRow[],
  plan: string | null | undefined,
): { exp_amount: number; reason: string; reference_date: string | null }[] {
  const logs: { exp_amount: number; reason: string; reference_date: string | null }[] = [];

  // Group by date
  const byDate = new Map<string, WorkoutRow[]>();
  for (const w of workouts) {
    const d = ymd(w.workout_date);
    if (!byDate.has(d)) byDate.set(d, []);
    byDate.get(d)!.push(w);
  }
  const dates = [...byDate.keys()].sort();

  // 1) session per day
  for (const d of dates) {
    logs.push({ exp_amount: 100, reason: `session|${d}`, reference_date: d });
  }

  // 2) personal best per exercise per day
  const bestSoFar = new Map<string, number>();
  // walk chronologically
  const sortedAll = [...workouts].sort((a, b) => a.workout_date.localeCompare(b.workout_date));
  const pbDoneKey = new Set<string>();
  for (const w of sortedAll) {
    const sets = w.sets || (w.weight != null ? [{ set: 1, weight: w.weight!, reps: w.reps! }] : []);
    if (sets.length === 0) continue;
    const maxW = Math.max(...sets.map((s) => Number(s.weight) || 0));
    if (maxW <= 0) continue;
    const prev = bestSoFar.get(w.exercise_id) ?? 0;
    if (maxW > prev) {
      bestSoFar.set(w.exercise_id, maxW);
      const d = ymd(w.workout_date);
      const key = `pb|${w.exercise_id}|${d}`;
      if (!pbDoneKey.has(key)) {
        pbDoneKey.add(key);
        logs.push({ exp_amount: 30, reason: key, reference_date: d });
      }
    }
  }

  // 3) new exercise (first time)
  const firstSeen = new Map<string, string>();
  for (const w of sortedAll) {
    if (!firstSeen.has(w.exercise_id)) firstSeen.set(w.exercise_id, ymd(w.workout_date));
  }
  for (const [exId, firstDate] of firstSeen) {
    logs.push({ exp_amount: 20, reason: `new_exercise|${exId}`, reference_date: firstDate });
  }

  // 4) streak bonus: 2 consecutive ISO weeks both having a session
  const weeksWithSessions = new Set<string>();
  for (const d of dates) {
    const dt = new Date(d);
    // compute year-week (simplified: yyyy-Www based on Sunday week)
    const onejan = new Date(dt.getFullYear(), 0, 1);
    const week = Math.ceil(((dt.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
    weeksWithSessions.add(`${dt.getFullYear()}-W${String(week).padStart(2, "0")}`);
  }
  const sortedWeeks = [...weeksWithSessions].sort();
  for (let i = 1; i < sortedWeeks.length; i++) {
    // detect adjacency
    const [py, pw] = sortedWeeks[i - 1].split("-W").map((x) => parseInt(x));
    const [cy, cw] = sortedWeeks[i].split("-W").map((x) => parseInt(x));
    const adjacent = (py === cy && cw === pw + 1) || (cy === py + 1 && pw >= 52 && cw === 1);
    if (adjacent) {
      // refer date: pick first date in current week (approx)
      const refDate = dates.find((d) => {
        const dt = new Date(d);
        const onejan = new Date(dt.getFullYear(), 0, 1);
        const w = Math.ceil(((dt.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
        return `${dt.getFullYear()}-W${String(w).padStart(2, "0")}` === sortedWeeks[i];
      });
      if (refDate) logs.push({ exp_amount: 50, reason: `streak_bonus|${sortedWeeks[i]}`, reference_date: refDate });
    }
  }

  // 5) monthly goal: count distinct session dates per month >= plan max
  if (plan && planMaxSessions[plan]) {
    const max = planMaxSessions[plan];
    const byMonth = new Map<string, Set<string>>();
    for (const d of dates) {
      const m = d.substring(0, 7);
      if (!byMonth.has(m)) byMonth.set(m, new Set());
      byMonth.get(m)!.add(d);
    }
    for (const [m, ds] of byMonth) {
      if (ds.size >= max) {
        logs.push({ exp_amount: 200, reason: `monthly_goal|${m}-01`, reference_date: `${m}-01` });
      }
    }
  }

  return logs;
}

/**
 * Determine which achievements should be unlocked from full history.
 * Returns achievement keys to insert (DB UNIQUE will dedupe).
 */
export function computeAchievements(
  workouts: WorkoutRow[],
  totalSessions: number,
  bestStreakWeeks: number,
  exerciseMuscleGroup: (name: string) => string,
): string[] {
  const keys: string[] = [];
  if (workouts.length > 0) keys.push("first_step");
  if (totalSessions >= 10) keys.push("regular_visitor");
  if (bestStreakWeeks >= 4) keys.push("habit_formed");

  // power_up: any PB after first time
  const seen = new Map<string, number>();
  let powerUp = false;
  for (const w of [...workouts].sort((a, b) => a.workout_date.localeCompare(b.workout_date))) {
    const sets = w.sets || (w.weight != null ? [{ set: 1, weight: w.weight!, reps: w.reps! }] : []);
    if (sets.length === 0) continue;
    const maxW = Math.max(...sets.map((s) => Number(s.weight) || 0));
    if (maxW <= 0) continue;
    const prev = seen.get(w.exercise_id);
    if (prev !== undefined && maxW > prev) {
      powerUp = true;
    }
    if (prev === undefined || maxW > prev) seen.set(w.exercise_id, maxW);
  }
  if (powerUp) keys.push("power_up");

  // multiplayer: 5+ distinct exercises
  const exNames = new Set(workouts.map((w) => w.exercise_name || w.exercise_id));
  if (exNames.size >= 5) keys.push("multiplayer");

  // ton_club: any session date with total volume > 1000
  const volByDate = new Map<string, number>();
  for (const w of workouts) {
    const sets = w.sets || (w.weight != null ? [{ set: 1, weight: w.weight!, reps: w.reps! }] : []);
    const v = sets.reduce((s, st) => s + (Number(st.weight) || 0) * (Number(st.reps) || 0), 0);
    volByDate.set(w.workout_date, (volByDate.get(w.workout_date) || 0) + v);
  }
  if ([...volByDate.values()].some((v) => v >= 1000)) keys.push("ton_club");

  // balance_master: any month with 5+ distinct muscle groups
  const monthGroups = new Map<string, Set<string>>();
  for (const w of workouts) {
    const m = w.workout_date.substring(0, 7);
    if (!monthGroups.has(m)) monthGroups.set(m, new Set());
    monthGroups.get(m)!.add(exerciseMuscleGroup(w.exercise_name || ""));
  }
  if ([...monthGroups.values()].some((s) => s.size >= 5)) keys.push("balance_master");

  return keys;
}

export async function unlockAchievements(userId: string, keys: string[]) {
  if (keys.length === 0) return [];
  const rows = keys.map((k) => ({ user_id: userId, achievement_key: k }));
  const { data } = await supabase
    .from("avatar_achievements")
    .upsert(rows, { onConflict: "user_id,achievement_key", ignoreDuplicates: true })
    .select("achievement_key");
  return (data || []).map((r: any) => r.achievement_key as string);
}