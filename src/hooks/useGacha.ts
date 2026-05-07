import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getJSTToday } from "@/lib/timezone";
import type { GachaRarity } from "@/lib/gachaSystem";

export interface GachaResultRow {
  id: string;
  result_date: string;
  reward_type: string;
  reward_amount: number | null;
  rarity: GachaRarity;
}

export const useGacha = () => {
  const { user } = useAuth();
  const [todayResult, setTodayResult] = useState<GachaResultRow | null>(null);
  const [hasTrainedToday, setHasTrainedToday] = useState(false);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    const today = getJSTToday();
    const [gRes, wRes] = await Promise.all([
      supabase.from("gacha_results")
        .select("id, result_date, reward_type, reward_amount, rarity")
        .eq("user_id", user.id).eq("result_date", today).maybeSingle(),
      supabase.from("workouts").select("id", { count: "exact", head: true })
        .eq("user_id", user.id).eq("workout_date", today),
    ]);
    setTodayResult((gRes.data as GachaResultRow) || null);
    setHasTrainedToday((wRes.count || 0) > 0);
  }, [user]);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    refresh().finally(() => setLoading(false));
  }, [user, refresh]);

  const spin = useCallback(async (): Promise<GachaResultRow | null> => {
    if (!user) return null;
    setSpinning(true);
    try {
      const today = getJSTToday();
      const { data, error } = await supabase.rpc("spin_gacha", {
        _user_id: user.id, _result_date: today,
      });
      if (error) throw error;
      const r: any = data;
      const result: GachaResultRow = {
        id: "",
        result_date: today,
        reward_type: r.reward_type,
        reward_amount: r.reward_amount,
        rarity: r.rarity as GachaRarity,
      };
      setTodayResult(result);

      // Achievements: gacha_beginner, lucky, legend
      const achKeys: string[] = ["gacha_beginner"];
      if (r.rarity === "epic" || r.rarity === "legendary") achKeys.push("gacha_lucky");
      if (r.rarity === "legendary") achKeys.push("gacha_legend");
      await supabase.from("avatar_achievements").upsert(
        achKeys.map((k) => ({ user_id: user.id, achievement_key: k })),
        { onConflict: "user_id,achievement_key", ignoreDuplicates: true } as any,
      );

      return result;
    } finally {
      setSpinning(false);
    }
  }, [user]);

  return { todayResult, hasTrainedToday, loading, spinning, spin, refresh };
};