import { useState } from "react";
import { Lock, Check, Frame as FrameIcon } from "lucide-react";
import { useFrames } from "@/hooks/useFrames";
import { useAvatar } from "@/hooks/useAvatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const RARITY_COLOR = { epic: "#8b5cf6", legendary: "#f59e0b" } as const;
const RARITY_LABEL = { epic: "EPIC", legendary: "LEGENDARY" } as const;

const FrameSection = () => {
  const { frames, owned, loading, refetch } = useFrames();
  const { avatar, refetch: refetchAvatar } = useAvatar(false);
  const [busy, setBusy] = useState(false);
  const equipped = avatar?.equipped_frame ?? null;

  const setFrame = async (key: string | null) => {
    if (busy) return;
    setBusy(true);
    const { error } = await (supabase as any).rpc("equip_frame", { p_frame_key: key });
    setBusy(false);
    if (error) {
      toast.error("装備変更に失敗しました", { description: error.message });
      return;
    }
    toast.success(key ? "フレームを装備しました" : "フレームを解除しました");
    await Promise.all([refetch(), refetchAvatar()]);
  };

  if (loading) {
    return <p className="text-xs text-muted-foreground text-center py-4">読み込み中...</p>;
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {/* なし */}
        <button
          type="button"
          onClick={() => setFrame(null)}
          disabled={busy}
          className={`relative aspect-square rounded-xl border-2 flex flex-col items-center justify-center bg-card transition ${
            equipped === null ? "border-accent bg-accent/10" : "border-border hover:bg-muted/40"
          }`}
        >
          <FrameIcon className="w-6 h-6 text-muted-foreground" />
          <span className="text-[10px] font-bold mt-1">なし</span>
          {equipped === null && (
            <Check className="absolute top-1 right-1 w-3.5 h-3.5 text-accent" />
          )}
        </button>

        {frames.map((f) => {
          const isOwned = owned.has(f.frame_key);
          const isEquipped = equipped === f.frame_key;
          const color = RARITY_COLOR[f.rarity];
          return (
            <button
              key={f.frame_key}
              type="button"
              onClick={() => isOwned && setFrame(f.frame_key)}
              disabled={!isOwned || busy}
              className={`relative aspect-square rounded-xl border-2 overflow-hidden flex flex-col items-center justify-center bg-card transition ${
                isEquipped ? "border-accent bg-accent/10" : "border-border"
              } ${!isOwned ? "opacity-60" : "hover:bg-muted/40"}`}
              style={
                isOwned
                  ? { boxShadow: `0 0 8px ${color}55` }
                  : undefined
              }
            >
              <div className="relative w-12 h-12 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-muted" />
                <img
                  src={f.image_path}
                  alt={f.frame_name}
                  className={`absolute inset-0 w-full h-full object-contain ${!isOwned ? "grayscale" : ""}`}
                  style={{ transform: "scale(1.18)" }}
                />
              </div>
              <span className="text-[10px] font-bold mt-1 text-center leading-tight px-0.5 truncate w-full">
                {f.frame_name}
              </span>
              <span
                className="absolute top-1 left-1 text-[8px] font-extrabold px-1 rounded"
                style={{ background: color, color: "#fff" }}
              >
                {RARITY_LABEL[f.rarity]}
              </span>
              {isEquipped && (
                <Check className="absolute top-1 right-1 w-3.5 h-3.5 text-accent" />
              )}
              {!isOwned && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-[9px] font-bold text-muted-foreground mt-0.5">
                    ガチャで入手
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FrameSection;