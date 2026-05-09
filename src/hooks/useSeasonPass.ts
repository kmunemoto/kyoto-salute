import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SeasonConfig {
  id: string;
  month: string;
  name: string;
  start_date: string;
  end_date: string;
  premium_cost_coins: number;
  premium_exp_multiplier: number;
  premium_daily_coins: number;
}

export interface SeasonLevel {
  id: string;
  config_id: string;
  level: number;
  required_points: number;
  free_reward_type: string | null;
  free_reward_key: string | null;
  free_reward_amount: number;
  premium_reward_type: string | null;
  premium_reward_key: string | null;
  premium_reward_amount: number;
}

export interface UserPass {
  id: string;
  config_id: string;
  is_premium: boolean;
  current_points: number;
  current_level: number;
}

export interface ClaimRow { level: number; track: "free" | "premium" }

export const useSeasonPass = () => {
  const { user } = useAuth();
  const [config, setConfig] = useState<SeasonConfig | null>(null);
  const [levels, setLevels] = useState<SeasonLevel[]>([]);
  const [pass, setPass] = useState<UserPass | null>(null);
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const today = new Date().toISOString().slice(0, 10);
    const { data: cfg } = await (supabase.from as any)("season_pass_config")
      .select("*")
      .lte("start_date", today)
      .gte("end_date", today)
      .order("start_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!cfg) { setConfig(null); setLevels([]); setPass(null); setClaims([]); setLoading(false); return; }
    setConfig(cfg as SeasonConfig);
    const [{ data: lvs }, { data: passRow }, { data: claimRows }] = await Promise.all([
      (supabase.from as any)("season_pass_levels").select("*").eq("config_id", cfg.id).order("level"),
      (supabase.from as any)("user_season_pass").select("*").eq("user_id", user.id).eq("config_id", cfg.id).maybeSingle(),
      (supabase.from as any)("user_season_pass_claims").select("level,track").eq("user_id", user.id).eq("config_id", cfg.id),
    ]);
    setLevels((lvs || []) as SeasonLevel[]);
    setPass((passRow || null) as UserPass | null);
    setClaims((claimRows || []) as ClaimRow[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { void refetch(); }, [refetch]);

  const claimReward = useCallback(async (level: number, track: "free" | "premium") => {
    if (!user) return;
    const { data, error } = await (supabase.rpc as any)("claim_season_pass_reward", {
      p_user_id: user.id, p_level: level, p_track: track,
    });
    if (error) throw error;
    await refetch();
    window.dispatchEvent(new CustomEvent("avatar-updated"));
    return data;
  }, [user, refetch]);

  const purchasePremium = useCallback(async () => {
    if (!user) return;
    const { data, error } = await (supabase.rpc as any)("purchase_premium_pass", { p_user_id: user.id });
    if (error) throw error;
    await refetch();
    window.dispatchEvent(new CustomEvent("avatar-updated"));
    return data;
  }, [user, refetch]);

  const claimedSet = new Set(claims.map((c) => `${c.level}:${c.track}`));

  return { config, levels, pass, claims, claimedSet, loading, refetch, claimReward, purchasePremium };
};
