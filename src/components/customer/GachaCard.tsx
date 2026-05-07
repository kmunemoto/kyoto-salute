import { useState } from "react";
import { Sparkles, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGacha, type GachaSpinResult } from "@/hooks/useGacha";
import {
  describeGachaReward,
  GACHA_RARITY_COLOR,
  GACHA_RARITY_FLASH,
  GACHA_RARITY_LABEL,
} from "@/lib/gachaSystem";
import { toast } from "sonner";

const GachaCard = () => {
  const { ticketCount, loading, spinning, spin } = useGacha();
  const [phase, setPhase] = useState<"idle" | "spinning" | "result">("idle");
  const [revealed, setRevealed] = useState<GachaSpinResult | null>(null);
  const [open, setOpen] = useState(false);

  if (loading || ticketCount <= 0) return null;

  const runSpin = async () => {
    setOpen(true);
    setPhase("spinning");
    setRevealed(null);
    try {
      const [r] = await Promise.all([spin(), new Promise((res) => setTimeout(res, 2200))]);
      if (r) {
        setRevealed(r);
        setPhase("result");
      } else {
        toast.error("チケットがありません");
        setOpen(false);
        setPhase("idle");
      }
    } catch (e: any) {
      toast.error("ガチャに失敗しました", { description: e.message });
      setOpen(false);
      setPhase("idle");
    }
  };

  const close = () => {
    setOpen(false);
    setPhase("idle");
    setRevealed(null);
  };

  const emphasize = ticketCount >= 2;

  return (
    <>
      <style>{`
        @keyframes gacha-spin { 0% { transform: rotate(0) scale(1);} 50% { transform: rotate(720deg) scale(1.2);} 100% { transform: rotate(1440deg) scale(1);} }
        @keyframes gacha-flash { 0% { opacity:0;} 20% { opacity:1;} 100% { opacity:0;} }
        @keyframes gacha-pop { 0% { transform: scale(0.3); opacity:0;} 60% { transform: scale(1.15); opacity:1;} 100% { transform: scale(1); opacity:1;} }
        @keyframes legendary-sparkle { 0%,100% { box-shadow: 0 0 30px 10px rgba(212,175,55,0.6);} 50% { box-shadow: 0 0 60px 20px rgba(212,175,55,0.9);} }
        @keyframes ticket-pulse { 0%,100% { transform: scale(1);} 50% { transform: scale(1.04);} }
        .gacha-capsule { animation: gacha-spin 2s ease-in-out; }
        .gacha-flash { animation: gacha-flash 0.6s ease-out; }
        .gacha-pop { animation: gacha-pop 0.5s ease-out; }
        .legendary-glow { animation: legendary-sparkle 1.5s ease-in-out infinite; }
        .ticket-cta { animation: ticket-pulse 1.6s ease-in-out infinite; }
      `}</style>

      <div
        className="rounded-2xl p-4 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0ABAB5 0%, #06908C 100%)" }}
      >
        <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-4 w-24 h-24 rounded-full bg-white/5" />
        <div className="relative flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold leading-tight">デイリーガチャ</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Ticket className="w-3.5 h-3.5 opacity-90" />
              <p className={`text-xs ${emphasize ? "font-extrabold" : "opacity-95"}`}>
                未使用チケット <span className="text-base font-extrabold">{ticketCount}</span> 枚
                {emphasize && " ✨"}
              </p>
            </div>
          </div>
        </div>
        <Button
          onClick={runSpin}
          disabled={spinning || open}
          className={`mt-3 w-full font-bold bg-white text-[#06908C] hover:bg-white/90 ${emphasize ? "ticket-cta" : ""}`}
        >
          ガチャを回す！
        </Button>
      </div>

      {open && (
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
            const d = describeGachaReward(revealed.reward_type, revealed.reward_amount, revealed.rarity);
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
                <p className="mt-2 text-lg font-extrabold" style={{ color }}>
                  {GACHA_RARITY_LABEL[revealed.rarity]}
                </p>
                <p className="mt-3 text-sm text-white/80">
                  残りチケット：<span className="font-bold text-white">{revealed.remaining}</span> 枚
                </p>
                <div className="mt-6 flex gap-3 justify-center">
                  {revealed.remaining > 0 && (
                    <Button
                      onClick={runSpin}
                      disabled={spinning}
                      className="px-6 font-bold"
                      style={{ backgroundColor: color, color: "white" }}
                    >
                      もう1回回す！
                    </Button>
                  )}
                  <Button
                    onClick={close}
                    variant="outline"
                    className="px-6 font-bold bg-transparent text-white border-white/40 hover:bg-white/10 hover:text-white"
                  >
                    閉じる
                  </Button>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </>
  );
};

export default GachaCard;
