import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ACHIEVEMENTS, getExpProgress, getRarityColor, getRarityStarCount } from "@/lib/avatarSystem";
import type { AvatarRow, ExpLogRow } from "@/hooks/useAvatar";
import { format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";
import { Coins, Trophy, Plus, Star } from "lucide-react";
import CoinShopDialog from "./CoinShopDialog";
import { getMissionDef } from "@/lib/missionSystem";
import { TITLES, getTitleDef } from "@/lib/titleSystem";

interface Props {
  open: boolean;
  onClose: () => void;
  avatar: AvatarRow;
  logs: ExpLogRow[];
  achievements: string[];
  titles?: string[];
  onEquipTitle?: (titleKey: string | null) => void | Promise<void>;
}

const reasonLabel = (reason: string): string => {
  const parts = reason.split("|");
  const head = parts[0];
  switch (head) {
    case "session": return "セッション完了";
    case "streak_bonus": return "連続来店ボーナス";
    case "pb": return "自己ベスト更新";
    case "new_exercise": return "新種目チャレンジ";
    case "monthly_goal": return "月間目標達成";
    case "combo_bonus": return "コンボボーナス";
    case "raid_reward": return "レイド撃破報酬";
    case "mission": {
      const def = getMissionDef(parts[1]);
      return def ? `ミッション: ${def.name}` : "ミッション達成";
    }
    case "mission_bonus": return "全ミッション達成ボーナス";
    default: return reason;
  }
};

const AvatarDetailDialog = ({ open, onClose, avatar, logs, achievements, titles = [], onEquipTitle }: Props) => {
  const p = getExpProgress(avatar.total_exp);
  const acquired = new Set(achievements);
  const acquiredTitles = new Set(titles);
  const equipped = avatar.equipped_title || null;
  const [shopOpen, setShopOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">アバター詳細</DialogTitle>
        <div className="flex flex-col items-center pt-2">
          <div
            className="w-44 h-44 rounded-3xl flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: `${p.rank.color}15` }}
          >
            <img src={p.rank.image} alt={p.rank.name} className="w-full h-full object-cover" />
          </div>
          <div className="mt-3 text-center">
            <p className="text-2xl font-extrabold">Lv.{p.level}</p>
            <p className="text-sm font-bold" style={{ color: p.rank.color }}>{p.rank.name}</p>
            <p className="text-xs text-muted-foreground mt-1">累計 {p.totalExp.toLocaleString()} EXP</p>
          </div>
          <div className="w-full mt-3">
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${p.percent}%`, backgroundColor: "hsl(174, 65%, 50%)" }} />
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
              <span>{p.currentLevelExp} / {p.requiredExp} EXP</span>
              <span>次のレベルまで {p.remainingExp}</span>
            </div>
          </div>
          <button
            onClick={() => setShopOpen(true)}
            className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-amber-600 px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 transition-colors"
          >
            <Coins className="w-4 h-4" />
            {avatar.coins} コイン
            <Plus className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>

        <section className="mt-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">EXP獲得履歴</h3>
          {logs.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">まだ記録がありません</p>
          ) : (
            <div className="space-y-1">
              {logs.slice(0, 10).map((l) => (
                <div key={l.id} className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-muted/50">
                  <span className="truncate">
                    {l.reference_date ? format(parseISO(l.reference_date), "M/d", { locale: ja }) : ""} {reasonLabel(l.reason)}
                  </span>
                  <span className="font-bold text-accent">+{l.exp_amount}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5" /> 実績バッジ
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {ACHIEVEMENTS.map((a) => {
              const got = acquired.has(a.key);
              const starColor = getRarityColor(a.rarity);
              const stars = getRarityStarCount(a.rarity);
              return (
                <div
                  key={a.key}
                  className={`p-2.5 rounded-xl border text-center relative ${got ? "bg-accent/10 border-accent/30" : "bg-muted/30 border-border opacity-50"}`}
                >
                  <div className="absolute top-1 right-1 flex gap-0.5">
                    {Array.from({ length: stars }).map((_, i) => (
                      <Star key={i} className="w-2.5 h-2.5" style={{ color: starColor, fill: starColor }} />
                    ))}
                  </div>
                  <p className="text-xs font-bold">{a.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 break-all">{a.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5" /> 称号
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {TITLES.map((t) => {
              const got = acquiredTitles.has(t.key);
              const isEq = equipped === t.key;
              return (
                <button
                  key={t.key}
                  disabled={!got || !onEquipTitle}
                  onClick={() => onEquipTitle?.(isEq ? null : t.key)}
                  className={`p-2.5 rounded-xl border text-center transition ${
                    isEq
                      ? "border-2"
                      : got
                      ? "bg-accent/10 border-accent/30 hover:bg-accent/20 cursor-pointer"
                      : "bg-muted/30 border-border opacity-50 cursor-default"
                  }`}
                  style={isEq ? { borderColor: "hsl(174, 65%, 50%)", backgroundColor: "hsla(174, 65%, 50%, 0.1)" } : {}}
                >
                  <p className="text-base">{t.icon}</p>
                  <p className="text-xs font-bold mt-0.5">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 break-all">{t.condition}</p>
                  {isEq && <p className="text-[10px] font-bold mt-1" style={{ color: "hsl(174, 65%, 50%)" }}>装備中</p>}
                </button>
              );
            })}
          </div>
        </section>
      </DialogContent>
      <CoinShopDialog open={shopOpen} onClose={() => setShopOpen(false)} />
    </Dialog>
  );
};

export default AvatarDetailDialog;