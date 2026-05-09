import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Coins, Star, Ticket, Lock, Check, Crown, Award, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useSeasonPass, type SeasonLevel } from "@/hooks/useSeasonPass";
import { toast } from "sonner";
import { differenceInCalendarDays, parseISO } from "date-fns";

const RewardIcon = ({ type, className }: { type: string | null; className?: string }) => {
  if (type === "coins") return <Coins className={className} />;
  if (type === "exp") return <Star className={className} />;
  if (type === "gacha_ticket") return <Ticket className={className} />;
  if (type === "title") return <Award className={className} />;
  if (type === "badge") return <Award className={className} />;
  if (type === "frame") return <ImageIcon className={className} />;
  return null;
};

const rewardLabel = (type: string | null, amount: number, key: string | null) => {
  if (type === "coins") return `${amount} コイン`;
  if (type === "exp") return `${amount} EXP`;
  if (type === "gacha_ticket") return `ガチャチケット ${amount}枚`;
  if (type === "title") return `称号「${key === "pass_holder" ? "パスホルダー" : key}」`;
  if (type === "badge") return `バッジ「${key === "season_master" ? "シーズンマスター" : key}」`;
  if (type === "frame") return `フレーム「${key === "season_champion" ? "シーズンチャンピオン" : key}」`;
  return "—";
};

const SeasonPassPage = () => {
  const navigate = useNavigate();
  const { config, levels, pass, claimedSet, loading, claimReward, purchasePremium } = useSeasonPass();
  const [busy, setBusy] = useState<string | null>(null);

  const currentLevel = pass?.current_level ?? 0;
  const currentPoints = pass?.current_points ?? 0;
  const isPremium = pass?.is_premium ?? false;

  const nextLevelPoints = useMemo(() => {
    const next = levels.find((l) => l.level === currentLevel + 1);
    return next?.required_points ?? null;
  }, [levels, currentLevel]);

  const prevLevelPoints = useMemo(() => {
    if (currentLevel === 0) return 0;
    const cur = levels.find((l) => l.level === currentLevel);
    return cur?.required_points ?? 0;
  }, [levels, currentLevel]);

  const progressPct = nextLevelPoints
    ? Math.min(100, ((currentPoints - prevLevelPoints) / (nextLevelPoints - prevLevelPoints)) * 100)
    : 100;

  const daysLeft = config ? Math.max(0, differenceInCalendarDays(parseISO(config.end_date), new Date())) : 0;

  const onClaim = async (lv: number, track: "free" | "premium") => {
    setBusy(`${lv}:${track}`);
    try {
      await claimReward(lv, track);
      toast.success("報酬を受け取りました");
    } catch (e: any) {
      toast.error(e?.message?.replace("ERROR: ", "") || "受け取りに失敗しました");
    } finally {
      setBusy(null);
    }
  };

  const onPurchase = async () => {
    if (!config) return;
    if (!confirm(`${config.premium_cost_coins}コインでプレミアムパスを購入しますか？`)) return;
    setBusy("purchase");
    try {
      await purchasePremium();
      toast.success("プレミアムパスを購入しました");
    } catch (e: any) {
      toast.error(e?.message?.replace("ERROR: ", "") || "購入に失敗しました");
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <div className="p-8 text-center text-sm text-muted-foreground">読み込み中...</div>;
  if (!config) return (
    <div className="p-8 text-center">
      <p className="text-sm text-muted-foreground mb-4">現在開催中のシーズンパスはありません</p>
      <Button variant="outline" onClick={() => navigate(-1)}>戻る</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background w-full max-w-md mx-auto pb-10">
      {/* header */}
      <div className="sticky top-0 z-40 bg-white border-b border-border">
        <div className="flex items-center gap-2 p-3">
          <button onClick={() => navigate(-1)} aria-label="戻る">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold">シーズンパス</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="rounded-2xl p-4 bg-gradient-to-br from-primary/10 to-amber-100/40 border border-primary/20">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <p className="text-[11px] text-muted-foreground">{config.month}</p>
              <h2 className="text-base font-bold break-all">{config.name}</h2>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] text-muted-foreground">残り</p>
              <p className="text-sm font-bold">{daysLeft}日</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold">Lv.{currentLevel}</span>
            <span className="text-muted-foreground">
              {currentPoints} / {nextLevelPoints ?? currentPoints} pt
            </span>
          </div>
          <Progress value={progressPct} className="h-2" />

          {!isPremium && (
            <Button
              onClick={onPurchase}
              disabled={busy === "purchase"}
              className="w-full mt-3 bg-amber-500 hover:bg-amber-600 text-white"
            >
              <Crown className="w-4 h-4" />
              プレミアムにアップグレード（{config.premium_cost_coins}コイン）
            </Button>
          )}
          {isPremium && (
            <div className="flex items-center justify-center gap-1.5 mt-3 py-1.5 rounded-lg bg-amber-400 text-white text-xs font-bold">
              <Crown className="w-3.5 h-3.5" />
              プレミアム会員 (EXP×{config.premium_exp_multiplier})
            </div>
          )}
        </div>

        <div className="space-y-2">
          {levels.map((l: SeasonLevel) => {
            const reached = currentLevel >= l.level;
            const freeClaimed = claimedSet.has(`${l.level}:free`);
            const premiumClaimed = claimedSet.has(`${l.level}:premium`);
            const isCurrent = l.level === currentLevel + 1 || (l.level === currentLevel && currentLevel > 0);
            return (
              <div
                key={l.id}
                className={`rounded-xl border p-2.5 ${isCurrent ? "border-primary border-2" : "border-border"} bg-white`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-bold ${reached ? "text-primary" : "text-muted-foreground"}`}>
                    Lv. {l.level}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{l.required_points} pt</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {/* Free track */}
                  <div className={`rounded-lg p-2 ${freeClaimed ? "bg-primary/10" : reached ? "bg-primary/5 border border-primary/30" : "bg-gray-50"}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <RewardIcon type={l.free_reward_type} className={`w-3.5 h-3.5 ${reached ? "text-primary" : "text-gray-400"}`} />
                      <span className="text-[10px] font-bold text-muted-foreground">無料</span>
                    </div>
                    <p className="text-[11px] font-bold mb-1.5 break-all">
                      {rewardLabel(l.free_reward_type, l.free_reward_amount, l.free_reward_key)}
                    </p>
                    {freeClaimed ? (
                      <div className="flex items-center justify-center text-primary text-xs font-bold gap-1">
                        <Check className="w-3.5 h-3.5" />受取済
                      </div>
                    ) : reached && l.free_reward_type ? (
                      <Button size="sm" className="w-full h-7 text-[11px]" onClick={() => onClaim(l.level, "free")} disabled={busy === `${l.level}:free`}>
                        受取
                      </Button>
                    ) : (
                      <div className="flex items-center justify-center text-muted-foreground text-xs gap-1">
                        <Lock className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  {/* Premium track */}
                  <div className={`rounded-lg p-2 ${premiumClaimed ? "bg-amber-100" : "bg-gradient-to-br from-amber-50 to-amber-100/60 border border-amber-300"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <RewardIcon type={l.premium_reward_type} className="w-3.5 h-3.5 text-amber-600" />
                        <span className="text-[10px] font-bold text-amber-700">PREMIUM</span>
                      </div>
                      {!isPremium && <Lock className="w-3 h-3 text-amber-700" />}
                    </div>
                    <p className="text-[11px] font-bold mb-1.5 break-all">
                      {rewardLabel(l.premium_reward_type, l.premium_reward_amount, l.premium_reward_key)}
                    </p>
                    {premiumClaimed ? (
                      <div className="flex items-center justify-center text-amber-700 text-xs font-bold gap-1">
                        <Check className="w-3.5 h-3.5" />受取済
                      </div>
                    ) : isPremium && reached && l.premium_reward_type ? (
                      <Button
                        size="sm"
                        className="w-full h-7 text-[11px] bg-amber-500 hover:bg-amber-600 text-white"
                        onClick={() => onClaim(l.level, "premium")}
                        disabled={busy === `${l.level}:premium`}
                      >
                        受取
                      </Button>
                    ) : (
                      <div className="flex items-center justify-center text-amber-700 text-xs gap-1">
                        <Lock className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SeasonPassPage;
