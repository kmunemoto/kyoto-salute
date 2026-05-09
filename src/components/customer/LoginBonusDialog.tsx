import { useState } from "react";
import { Coins, Star, Ticket, Check, Gift, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLoginBonus, type ClaimResult } from "@/hooks/useLoginBonus";
import { toast } from "sonner";

interface Props { open: boolean; onClose: () => void }

const REWARDS: { day: number; type: "coins" | "exp" | "gacha_ticket"; amount: number }[] = [
  { day: 1, type: "coins", amount: 5 },
  { day: 2, type: "exp", amount: 20 },
  { day: 3, type: "coins", amount: 10 },
  { day: 4, type: "exp", amount: 30 },
  { day: 5, type: "coins", amount: 15 },
  { day: 6, type: "exp", amount: 50 },
  { day: 7, type: "gacha_ticket", amount: 1 },
];

const Icon = ({ type, className }: { type: string; className?: string }) => {
  if (type === "coins") return <Coins className={className} />;
  if (type === "exp") return <Star className={className} />;
  return <Ticket className={className} />;
};

const LoginBonusDialog = ({ open, onClose }: Props) => {
  const { status, claim } = useLoginBonus();
  const [claiming, setClaiming] = useState(false);
  const [result, setResult] = useState<ClaimResult | null>(null);

  if (!open || !status) return null;

  const claimedDays = new Set(status.recent.map((r) => r.day_number));
  // If claimed today already, mark current_day_number as claimed
  if (status.claimed_today) claimedDays.add(status.current_day_number);

  const handleClaim = async () => {
    if (claiming) return;
    setClaiming(true);
    try {
      const r = await claim();
      if (r) {
        setResult(r);
        const label = r.reward_type === "coins" ? `${r.reward_amount} コイン` : r.reward_type === "exp" ? `${r.reward_amount} EXP` : `ガチャチケット ${r.reward_amount}枚`;
        const extra = r.extra_coins > 0 ? ` (+${r.extra_coins} プレミアム)` : "";
        toast.success(`${label}${extra} 受け取りました`);
      }
    } catch (e: any) {
      toast.error("受け取りに失敗しました");
    } finally {
      setClaiming(false);
    }
  };

  const todayDay = status.current_day_number;
  const showStreakReset = !status.claimed_today && status.recent.length > 0 && todayDay === 1 && status.recent[0]?.day_number !== 7;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 text-muted-foreground" aria-label="閉じる">
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 mb-1">
          <Gift className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">ログインボーナス</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">毎日アプリを開くと報酬がもらえます</p>

        <div className="grid grid-cols-7 gap-1.5 mb-4">
          {REWARDS.map((r) => {
            const isClaimed = claimedDays.has(r.day) && (status.claimed_today || r.day !== todayDay);
            const isToday = r.day === todayDay && !status.claimed_today;
            const isDay7 = r.day === 7;
            const baseCls = isDay7
              ? "border-2 border-amber-400 bg-amber-50"
              : "border border-gray-200 bg-gray-50";
            const todayCls = isToday ? "ring-2 ring-primary animate-pulse bg-primary/10" : "";
            const claimedCls = isClaimed ? "bg-primary/15 border-primary/40" : "";
            return (
              <div key={r.day} className={`rounded-lg p-1.5 flex flex-col items-center justify-center aspect-square text-center ${baseCls} ${claimedCls} ${todayCls}`}>
                <span className="text-[9px] font-bold text-muted-foreground">Day {r.day}</span>
                {isClaimed ? (
                  <Check className="w-4 h-4 text-primary mt-0.5" />
                ) : (
                  <>
                    <Icon type={r.type} className={`w-4 h-4 mt-0.5 ${isDay7 ? "text-amber-500" : isToday ? "text-primary" : "text-gray-400"}`} />
                    <span className="text-[9px] font-bold mt-0.5">{r.amount}</span>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {showStreakReset && (
          <p className="text-[11px] text-muted-foreground text-center mb-3">連続ログインがリセットされました</p>
        )}

        {!status.claimed_today && !result && (
          <Button onClick={handleClaim} disabled={claiming} className="w-full" size="lg">
            {claiming ? "受け取り中..." : "受け取る！"}
          </Button>
        )}
        {(status.claimed_today || result) && (
          <Button onClick={onClose} variant="outline" className="w-full" size="lg">
            閉じる
          </Button>
        )}
      </div>
    </div>
  );
};

export default LoginBonusDialog;
