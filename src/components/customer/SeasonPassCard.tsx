import { ChevronRight, Crown, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSeasonPass } from "@/hooks/useSeasonPass";

const SeasonPassCard = () => {
  const navigate = useNavigate();
  const { config, pass, levels, claimedSet, loading } = useSeasonPass();
  if (loading || !config) return null;

  const level = pass?.current_level ?? 0;
  const isPremium = pass?.is_premium ?? false;
  // unclaimed reachable rewards
  const hasUnclaimed = levels.some((l) => {
    if (l.level > level) return false;
    if (l.free_reward_type && !claimedSet.has(`${l.level}:free`)) return true;
    if (isPremium && l.premium_reward_type && !claimedSet.has(`${l.level}:premium`)) return true;
    return false;
  });

  return (
    <button
      onClick={() => navigate("/season-pass")}
      className="w-full flex items-center justify-between gap-3 p-3.5 rounded-xl bg-gradient-to-r from-primary/10 to-amber-100/40 border border-primary/20 hover:shadow-md transition-all relative"
    >
      <div className="flex items-center gap-2.5">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isPremium ? "bg-amber-400" : "bg-primary"}`}>
          {isPremium ? <Crown className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4 text-white" />}
        </div>
        <div className="text-left">
          <p className="text-[11px] text-muted-foreground font-medium">{config.name}</p>
          <p className="text-sm font-bold flex items-center gap-1.5">
            Lv.{level}
            {isPremium && <span className="text-[9px] bg-amber-400 text-white px-1.5 py-0.5 rounded-full font-extrabold">PREMIUM</span>}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {hasUnclaimed && <span className="w-2 h-2 rounded-full bg-red-500" />}
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
    </button>
  );
};

export default SeasonPassCard;
