import { useState } from "react";
import { useAvatar } from "@/hooks/useAvatar";
import { getExpProgress } from "@/lib/avatarSystem";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import AvatarDetailDialog from "./AvatarDetailDialog";

const AvatarCard = () => {
  const { avatar, logs, achievements, loading } = useAvatar(true);
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

  const p = getExpProgress(avatar.total_exp);

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
            <img src={p.rank.image} alt={p.rank.name} className="w-full h-full object-contain" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-base font-extrabold">Lv.{p.level}</span>
              <span className="text-xs font-bold" style={{ color: p.rank.color }}>{p.rank.name}</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">EXP: {p.totalExp.toLocaleString()}</p>
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
      />
    </>
  );
};

export default AvatarCard;