import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getJSTToday } from "@/lib/timezone";
import type { GachaRarity } from "@/lib/gachaSystem";

export interface GachaSpinResult {
  reward_type: string;
  reward_amount: number;
  rarity: GachaRarity;
  remaining: number;
}

export const useGacha = () => {
  const { user } = useAuth();
  const [ticketCount, setTicketCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    const { count } = await supabase
      .from("user_gacha_tickets")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("used", false);
    setTicketCount(count || 0);
  }, [user]);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    refresh().finally(() => setLoading(false));
  }, [user, refresh]);

  const spin = useCallback(async (): Promise<GachaSpinResult | null> => {
    if (!user) return null;
    setSpinning(true);
    try {
      const { data, error } = await supabase.rpc("spin_gacha", {
        _user_id: user.id, _result_date: getJSTToday(),
      });
      if (error) throw error;
      const r: any = data;
      if (r?.no_ticket) {
        setTicketCount(0);
        return null;
      }
      const result: GachaSpinResult = {
        reward_type: r.reward_type,
        reward_amount: r.reward_amount,
        rarity: r.rarity as GachaRarity,
        remaining: r.remaining ?? 0,
      };
      setTicketCount(result.remaining);

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

  return { ticketCount, loading, spinning, spin, refresh };
};
