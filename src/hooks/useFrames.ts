import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AvatarFrame {
  frame_key: string;
  frame_name: string;
  rarity: "epic" | "legendary";
  image_path: string;
  sort_order: number;
}

export const useFrames = () => {
  const { user } = useAuth();
  const [frames, setFrames] = useState<AvatarFrame[]>([]);
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const [{ data: framesData }, ownedRes] = await Promise.all([
      (supabase as any)
        .from("avatar_frames")
        .select("frame_key, frame_name, rarity, image_path, sort_order")
        .order("sort_order", { ascending: true }),
      user
        ? (supabase as any).from("user_frame_inventory").select("frame_key").eq("user_id", user.id)
        : Promise.resolve({ data: [] }),
    ]);
    setFrames((framesData as AvatarFrame[]) || []);
    setOwned(new Set(((ownedRes?.data as any[]) || []).map((r) => r.frame_key)));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { frames, owned, loading, refetch };
};

// Map of frame_key -> image path. Includes legacy CSS-only frames as null.
export const FRAME_IMAGES: Record<string, string> = {
  silver: "/shop/frames/silver.png",
  gold: "/shop/frames/gold.png",
  sakura: "/shop/frames/sakura.png",
  ocean: "/shop/frames/ocean.png",
  flame: "/shop/frames/flame.png",
  ice: "/shop/frames/ice.png",
  star: "/shop/frames/star.png",
  royal: "/shop/frames/royal.png",
  neon: "/shop/frames/neon.png",
  diamond: "/shop/frames/diamond.png",
};

export const getFrameImage = (frameKey?: string | null): string | null => {
  if (!frameKey) return null;
  return FRAME_IMAGES[frameKey] || null;
};