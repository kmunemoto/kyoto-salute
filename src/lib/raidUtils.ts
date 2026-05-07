import { supabase } from "@/integrations/supabase/client";

export interface RaidBoss {
  id: string;
  boss_name: string;
  boss_hp: number;
  current_damage: number;
  start_date: string;
  end_date: string;
  defeated: boolean;
  defeated_at: string | null;
  boss_image_url: string | null;
  reward_exp: number;
  reward_coins: number;
}

/** Compute total session volume in kg */
export function computeSessionVolume(rows: { sets?: any[] | null; weight: number | null; reps: number | null }[]): number {
  let total = 0;
  for (const w of rows) {
    const sets = w.sets && w.sets.length > 0 ? w.sets : w.weight != null ? [{ weight: w.weight, reps: w.reps || 0 }] : [];
    for (const s of sets) {
      total += (Number(s.weight) || 0) * (Number(s.reps) || 0);
    }
  }
  return Math.floor(total);
}

/** Apply session damage to currently-active raid (if any). Server function handles defeat & rewards. */
export async function applyRaidDamage(userId: string, workoutDate: string, damage: number) {
  if (damage <= 0) return null;
  const { data, error } = await supabase.rpc("apply_raid_damage", {
    _user_id: userId,
    _workout_date: workoutDate,
    _damage: damage,
  });
  if (error) {
    console.error("apply_raid_damage", error);
    return null;
  }
  return data as { applied: number; defeated?: boolean; raid_id?: string };
}

/** Process session-level rewards (session exp + combo) via RPC */
export async function processSessionRewards(userId: string, workoutDate: string) {
  const { data, error } = await supabase.rpc("process_session_rewards", {
    _user_id: userId,
    _workout_date: workoutDate,
  });
  if (error) {
    console.error("process_session_rewards", error);
    return null;
  }
  return data as {
    combo: number;
    multiplier: number;
    combo_bonus: number;
    total_exp: number;
    level: number;
    leveled_up: boolean;
  };
}