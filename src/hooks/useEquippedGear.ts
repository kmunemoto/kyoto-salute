import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface EquippedGearItem {
  item_key: string;
  item_name: string;
  item_type: "weapon" | "shield" | "amulet";
  rarity: "common" | "rare" | "epic" | "legendary";
  image_path: string;
}

export interface EquippedGear {
  weapon: EquippedGearItem | null;
  shield: EquippedGearItem | null;
  amulet: EquippedGearItem | null;
}

const EMPTY: EquippedGear = { weapon: null, shield: null, amulet: null };

export const useEquippedGear = (userId?: string | null) => {
  const [gear, setGear] = useState<EquippedGear>(EMPTY);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!userId) {
      setGear(EMPTY);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await (supabase as any)
      .from("user_equipment")
      .select("equipped, item:equipment_items(item_key,item_name,item_type,rarity,image_path)")
      .eq("user_id", userId)
      .eq("equipped", true);
    const next: EquippedGear = { weapon: null, shield: null, amulet: null };
    (data || []).forEach((row: any) => {
      const it = row.item;
      if (!it || !it.image_path) return;
      if (it.item_type === "weapon") next.weapon = it;
      else if (it.item_type === "shield") next.shield = it;
      else if (it.item_type === "amulet") next.amulet = it;
    });
    setGear(next);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => {
    const h = () => fetch();
    window.addEventListener("equipment-updated", h);
    return () => window.removeEventListener("equipment-updated", h);
  }, [fetch]);

  return { gear, loading, refetch: fetch };
};
