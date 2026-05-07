import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getJSTToday } from "@/lib/timezone";
import { Sword, Users, Gift, Loader2 } from "lucide-react";
import { differenceInDays, differenceInHours, parseISO } from "date-fns";

interface RaidRow {
  id: string;
  boss_name: string;
  boss_hp: number;
  current_damage: number;
  start_date: string;
  end_date: string;
  defeated: boolean;
  defeated_at: string | null;
  reward_exp: number;
  reward_coins: number;
}

const BOSS_EMOJI: Record<string, string> = {
  ゴブリン: "👺",
  オーク戦士: "👹",
  ドラゴン: "🐉",
};

const RaidBossCard = () => {
  const { user } = useAuth();
  const [raid, setRaid] = useState<RaidRow | null>(null);
  const [upcoming, setUpcoming] = useState<RaidRow | null>(null);
  const [myDamage, setMyDamage] = useState(0);
  const [participants, setParticipants] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      const today = getJSTToday();
      // active raid (today within range, OR within 1 day after end if still showing defeat)
      const { data: actives } = await supabase
        .from("raid_bosses")
        .select("*")
        .lte("start_date", today)
        .gte("end_date", today)
        .order("start_date", { ascending: false })
        .limit(1);
      let activeRaid: RaidRow | null = (actives && actives[0]) ? (actives[0] as any) : null;

      // If no in-range raid, check for raids ended in last 1 day (to show defeat / failure)
      if (!activeRaid) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const ystr = yesterday.toISOString().substring(0, 10);
        const { data: recent } = await supabase
          .from("raid_bosses")
          .select("*")
          .gte("end_date", ystr)
          .lt("end_date", today)
          .order("end_date", { ascending: false })
          .limit(1);
        if (recent && recent[0]) activeRaid = recent[0] as any;
      }

      // upcoming raid in next 3 days
      let nextRaid: RaidRow | null = null;
      if (!activeRaid) {
        const in3 = new Date();
        in3.setDate(in3.getDate() + 3);
        const in3str = in3.toISOString().substring(0, 10);
        const { data: ups } = await supabase
          .from("raid_bosses")
          .select("*")
          .gt("start_date", today)
          .lte("start_date", in3str)
          .order("start_date", { ascending: true })
          .limit(1);
        if (ups && ups[0]) nextRaid = ups[0] as any;
      }

      if (cancelled) return;
      setRaid(activeRaid);
      setUpcoming(nextRaid);

      if (activeRaid) {
        const { data: dmg } = await supabase
          .from("raid_damage_logs")
          .select("user_id, damage")
          .eq("raid_id", activeRaid.id);
        const rows = (dmg || []) as { user_id: string; damage: number }[];
        setMyDamage(rows.filter((r) => r.user_id === user.id).reduce((s, r) => s + r.damage, 0));
        setParticipants(new Set(rows.map((r) => r.user_id)).size);
      }
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [user]);

  if (loading) return null;

  if (!raid && upcoming) {
    return (
      <Card className="border-l-4 border-l-amber-400 bg-amber-50">
        <CardContent className="p-3 flex items-center gap-2">
          <Sword className="w-4 h-4 text-amber-600" />
          <div className="flex-1">
            <p className="text-sm font-bold">⚔️ レイドボス出現予告！</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {upcoming.start_date.substring(5).replace("-", "/")} 〜 {upcoming.end_date.substring(5).replace("-", "/")}
            </p>
            <p className="text-xs mt-0.5">「{upcoming.boss_name}」が襲来！みんなで倒そう！</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!raid) return null;

  const today = getJSTToday();
  const isWithin = raid.start_date <= today && today <= raid.end_date;
  const endDate = parseISO(raid.end_date + "T23:59:59");
  const now = new Date();
  const daysLeft = differenceInDays(endDate, now);
  const hoursLeft = differenceInHours(endDate, now);
  const expired = today > raid.end_date;

  const hp = Math.max(0, raid.boss_hp - raid.current_damage);
  const pct = Math.min(100, Math.round((raid.current_damage / raid.boss_hp) * 100));
  const emoji = BOSS_EMOJI[raid.boss_name] || "👾";

  if (expired && !raid.defeated) {
    return (
      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-sm font-bold text-muted-foreground">ボスは逃げた…次回リベンジ！</p>
        </CardContent>
      </Card>
    );
  }

  const remainingLabel = raid.defeated
    ? "DEFEATED!"
    : daysLeft >= 1
    ? `残り${daysLeft + 1}日`
    : hoursLeft >= 1
    ? `あと${hoursLeft}時間！`
    : "最終日！";

  return (
    <>
      <style>{`
        @keyframes raid-explode {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); filter: brightness(1.5); }
        }
        .raid-defeated { animation: raid-explode 1.5s ease-in-out infinite; }
      `}</style>
      <Card className={raid.defeated ? "border-amber-400 bg-amber-50" : ""}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Sword className="w-4 h-4 text-red-600" />
              <h3 className="text-sm font-bold">レイドボス出現中！</h3>
            </div>
            <span className={`text-xs font-bold ${daysLeft <= 0 ? "text-red-600" : "text-muted-foreground"}`}>
              {remainingLabel}
            </span>
          </div>

          <div className="flex flex-col items-center my-3">
            <div className={`text-7xl ${raid.defeated ? "raid-defeated" : ""}`}>{emoji}</div>
            <p className="text-base font-extrabold mt-1">{raid.boss_name}</p>
          </div>

          <div className="space-y-1">
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full transition-all"
                style={{
                  width: `${pct}%`,
                  background: "linear-gradient(90deg, #DC2626 0%, #F97316 100%)",
                }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-semibold">
              <span style={{ color: "#DC2626" }}>HP {pct}%</span>
              <span className="text-muted-foreground">
                {raid.current_damage.toLocaleString()} / {raid.boss_hp.toLocaleString()} kg
              </span>
            </div>
          </div>

          {raid.defeated && (
            <p className="text-center text-sm font-bold mt-3" style={{ color: "#D4AF37" }}>
              🎉 おめでとう！全員に+{raid.reward_exp} EXP +{raid.reward_coins} コインを配布しました
            </p>
          )}

          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
            <div className="rounded-lg p-2" style={{ backgroundColor: "rgba(220, 38, 38, 0.05)" }}>
              <p className="text-[10px] text-muted-foreground">🗡️ あなた</p>
              <p className="text-xs font-extrabold mt-0.5">{myDamage.toLocaleString()} kg</p>
            </div>
            <div className="rounded-lg p-2" style={{ backgroundColor: "rgba(10, 186, 181, 0.05)" }}>
              <p className="text-[10px] text-muted-foreground"><Users className="w-3 h-3 inline" /> 参加者</p>
              <p className="text-xs font-extrabold mt-0.5">{participants}人</p>
            </div>
            <div className="rounded-lg p-2" style={{ backgroundColor: "rgba(212, 175, 55, 0.08)" }}>
              <p className="text-[10px] text-muted-foreground"><Gift className="w-3 h-3 inline" /> 報酬</p>
              <p className="text-xs font-extrabold mt-0.5">{raid.reward_exp}EXP</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default RaidBossCard;