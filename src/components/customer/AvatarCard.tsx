import { useState } from "react";
import { useAvatar } from "@/hooks/useAvatar";
import { getExpProgress } from "@/lib/avatarSystem";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import AvatarDetailDialog from "./AvatarDetailDialog";
import AvatarLevelUpDialog from "./AvatarLevelUpDialog";
import { getComboColor, getComboFlameCount, getComboMultiplier } from "@/lib/comboSystem";
import { getTitleDef } from "@/lib/titleSystem";
import BadgeIcon from "./BadgeIcon";
import { Flame } from "lucide-react";

const AvatarCard = () => {
  const { avatar, logs, achievements, titles, loading, levelUp, clearLevelUp, equipTitle } = useAvatar(true);
  const [open, setOpen] = useState(false);

  if (loading || !avatar) {
    return (
      <Card>
        <CardContent className="p-4 flex items-center justify-center">
          <Loader2 className="w-4 h-4 animate-spin text-accent" />
        </CardContent>
      </Card>
    );
  }

  const gender = (avatar.gender as "male" | "female") ?? "female";
  const hairColor = (avatar.hair_color as any) ?? "orange";
  const p = getExpProgress(avatar.total_exp, gender, hairColor);
  const combo = avatar.combo_count || 0;
  const equipped = getTitleDef(avatar.equipped_title);

  return (
    <>
      <Card
        onClick={() => setOpen(true)}
        className="card-hover cursor-pointer overflow-hidden"
      >
        <CardContent className="p-3 flex items-center gap-3">
          <div
            className="w-20 h-20 rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: `${p.rank.color}15` }}
          >
            <img src={p.rank.image} alt={p.rank.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-base font-extrabold">Lv.{p.level}</span>
              <span className="text-xs font-bold" style={{ color: p.rank.color }}>{p.rank.name}</span>
            </div>
            {equipped && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <BadgeIcon type="title" iconKey={equipped.key} equipped size={20} />
                <span className="text-[11px] font-bold" style={{ color: "hsl(174, 65%, 50%)" }}>
                  {equipped.name}
                </span>
              </div>
            )}
            <p className="text-[11px] text-muted-foreground mt-0.5">EXP: {p.totalExp.toLocaleString()}</p>
            {combo >= 2 && (
              <p
                className={`text-[11px] font-extrabold mt-0.5 flex items-center gap-0.5 ${combo >= 5 ? "animate-pulse" : ""}`}
                style={{ color: getComboColor(combo) }}
              >
                {Array.from({ length: getComboFlameCount(combo) }).map((_, i) => (
                  <Flame key={i} className="w-3 h-3" style={{ color: getComboColor(combo) }} />
                ))}
                <span className="ml-1">{combo}コンボ！EXP {getComboMultiplier(combo)}倍</span>
              </p>
            )}
            <div className="mt-1.5 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${p.percent}%`, backgroundColor: "hsl(174, 65%, 50%)" }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              次のレベルまで {p.remainingExp} EXP
            </p>
          </div>
        </CardContent>
      </Card>
      <AvatarDetailDialog
        open={open}
        onClose={() => setOpen(false)}
        avatar={avatar}
        logs={logs}
        achievements={achievements}
        titles={titles}
        onEquipTitle={equipTitle}
      />
      <AvatarLevelUpDialog
        open={!!levelUp}
        onClose={clearLevelUp}
        newLevel={levelUp?.newLevel ?? 1}
        earnedCoins={levelUp?.earnedCoins ?? 0}
        gender={gender}
        hairColor={hairColor}
      />
    </>
  );
};

export default AvatarCard;