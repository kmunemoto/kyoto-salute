import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGacha } from "@/hooks/useGacha";
import {
  describeGachaReward,
  GACHA_RARITY_COLOR,
  GACHA_RARITY_FLASH,
  GACHA_RARITY_LABEL,
  type GachaRarity,
} from "@/lib/gachaSystem";
import { toast } from "sonner";

const GachaCard = () => {
  const { todayResult, hasTrainedToday, loading, spinning, spin } = useGacha();
  const [phase, setPhase] = useState<"idle" | "spinning" | "result">("idle");
  const [revealed, setRevealed] = useState<{ rarity: GachaRarity; type: string; amount: number } | null>(null);

  if (loading || !hasTrainedToday) return null;

  const handleSpin = async () => {
    setPhase("spinning");
    try {
      // Wait for visual
      const [r] = await Promise.all([spin(), new Promise((res) => setTimeout(res, 2200))]);
      if (r) {
        setRevealed({ rarity: r.rarity, type: r.reward_type, amount: r.reward_amount || 0 });
        setPhase("result");
      } else {
        setPhase("idle");
      }
    } catch (e: any) {
      toast.error("ガチャに失敗しました", { description: e.message });
      setPhase("idle");
    }
  };

  const close = () => {
    setPhase("idle");
    setRevealed(null);
  };

  // Already spun today (and not currently in modal flow)
  if (todayResult && phase === "idle") {
    const d = describeGachaReward(todayResult.reward_type, todayResult.reward_amount || 0, todayResult.rarity);
    return (
      <Card>
        <CardContent className="p-3 flex items-center gap-2">
          <span className="text-xl">🎰</span>
          <p className="text-xs flex-1">
            <span className="font-bold">今日の結果：</span>
            <span className="ml-1">{d.icon} {d.name}</span>
            <span className="ml-1 font-bold" style={{ color: GACHA_RARITY_COLOR[todayResult.rarity] }}>
              （{GACHA_RARITY_LABEL[todayResult.rarity]}）
            </span>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <style>{`
        @keyframes gacha-spin {
          0% { transform: rotate(0) scale(1); }
          50% { transform: rotate(720deg) scale(1.2); }
          100% { transform: rotate(1440deg) scale(1); }
        }
        @keyframes gacha-flash {
          0% { opacity: 0; }
          20% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes gacha-pop {
          0% { transform: scale(0.3); opacity: 0; }
          60% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes legendary-sparkle {
          0%, 100% { box-shadow: 0 0 30px 10px rgba(212,175,55,0.6); }
          50% { box-shadow: 0 0 60px 20px rgba(212,175,55,0.9); }
        }
        .gacha-capsule { animation: gacha-spin 2s ease-in-out; }
        .gacha-flash { animation: gacha-flash 0.6s ease-out; }
        .gacha-pop { animation: gacha-pop 0.5s ease-out; }
        .legendary-glow { animation: legendary-sparkle 1.5s ease-in-out infinite; }
      `}</style>
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-sm font-bold mb-1">🎰 トレーニング完了！ガチャを回そう</p>
          <Button
            onClick={handleSpin}
            disabled={spinning || phase !== "idle"}
            className="mt-2 w-full font-bold"
            style={{ backgroundColor: "hsl(174, 65%, 50%)", color: "white" }}
          >
            ガチャを回す！
          </Button>
          <p className="text-[11px] text-muted-foreground mt-2">※ 1日1回、トレーニング後に回せます</p>
        </CardContent>
      </Card>

      {phase !== "idle" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.85)" }}>
          {phase === "result" && revealed && (
            <div
              className="absolute inset-0 pointer-events-none gacha-flash"
              style={{ backgroundColor: GACHA_RARITY_FLASH[revealed.rarity] }}
            />
          )}
          {phase === "spinning" && (
            <div className="text-center">
              <div className="text-[120px] gacha-capsule">🎰</div>
              <p className="text-white font-bold mt-4">回転中...</p>
            </div>
          )}
          {phase === "result" && revealed && (() => {
            const d = describeGachaReward(revealed.type, revealed.amount, revealed.rarity);
            const color = GACHA_RARITY_COLOR[revealed.rarity];
            const isLegendary = revealed.rarity === "legendary";
            return (
              <div className="text-center px-6 gacha-pop relative">
                <div
                  className={`mx-auto w-40 h-40 rounded-full flex items-center justify-center text-7xl ${isLegendary ? "legendary-glow" : ""}`}
                  style={{ backgroundColor: `${color}25`, border: `4px solid ${color}` }}
                >
                  {d.icon}
                </div>
                <p className="mt-5 text-3xl font-extrabold text-white">{d.name}</p>
                <p
                  className="mt-2 text-lg font-extrabold"
                  style={{ color }}
                >
                  {GACHA_RARITY_LABEL[revealed.rarity]}
                </p>
                <Button
                  onClick={close}
                  className="mt-8 px-10 font-bold"
                  style={{ backgroundColor: color, color: "white" }}
                >
                  受け取る
                </Button>
              </div>
            );
          })()}
        </div>
      )}
    </>
  );
};

export default GachaCard;