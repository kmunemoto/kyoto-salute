import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getJSTToday, toJSTDate } from "@/lib/timezone";
import { Sword, Swords, Users, Gift, Sparkles } from "lucide-react";
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
  boss_image_url: string | null;
}

// Boss visuals now use Lucide Swords icon for all bosses (no emoji).

const RaidBossCard = () => {
  const { user } = useAuth();
  const [raid, setRaid] = useState<RaidRow | null>(null);
  const [upcoming, setUpcoming] = useState<RaidRow | null>(null);
  const [teaserDaysUntil, setTeaserDaysUntil] = useState<number>(0);
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

      // upcoming raid (any future un-defeated boss) for teaser display
      let nextRaid: RaidRow | null = null;
      let daysUntil = 0;
      if (!activeRaid) {
        const { data: ups } = await supabase
          .from("raid_bosses")
          .select("*")
          .gt("start_date", today)
          .eq("defeated", false)
          .order("start_date", { ascending: true })
          .limit(1);
        if (ups && ups[0]) {
          const cand = ups[0] as RaidRow;
          const todayJST = toJSTDate(new Date());
          todayJST.setHours(0, 0, 0, 0);
          const startJST = toJSTDate(cand.start_date + "T00:00:00+09:00");
          startJST.setHours(0, 0, 0, 0);
          daysUntil = differenceInDays(startJST, todayJST);
          // Show teaser only within 10 days before start
          if (daysUntil >= 1 && daysUntil <= 10) {
            nextRaid = cand;
          }
        }
      }

      if (cancelled) return;
      setRaid(activeRaid);
      setUpcoming(nextRaid);
      setTeaserDaysUntil(daysUntil);

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
    const phase2 = teaserDaysUntil >= 1 && teaserDaysUntil <= 3;
    const progressPct = Math.max(0, Math.min(100, ((10 - teaserDaysUntil) / 10) * 100));
    const formatMD = (d: string) => {
      const dt = toJSTDate(d + "T00:00:00+09:00");
      const wd = ["日", "月", "火", "水", "木", "金", "土"][dt.getDay()];
      return `${dt.getMonth() + 1}/${dt.getDate()}（${wd}）`;
    };
    return (
      <>
        <style>{`
          @keyframes raid-teaser-pulse-1 {
            0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.2); }
            50% { box-shadow: 0 0 24px 4px rgba(239,68,68,0.2); }
          }
          @keyframes raid-teaser-pulse-2 {
            0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.3); }
            50% { box-shadow: 0 0 28px 6px rgba(239,68,68,0.3); }
          }
          .raid-teaser-1 { animation: raid-teaser-pulse-1 2.4s ease-in-out infinite; }
          .raid-teaser-2 { animation: raid-teaser-pulse-2 2s ease-in-out infinite; }
        `}</style>
        <Card
          className={`overflow-hidden border-0 ${phase2 ? "raid-teaser-2" : "raid-teaser-1"}`}
          style={{
            background: phase2
              ? "linear-gradient(135deg, #1a1a2e 0%, #1e3a5f 100%)"
              : "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
          }}
        >
          <CardContent className="p-4 text-white">
            <p className="text-[12px] font-bold tracking-[0.18em] flex items-center gap-1.5">
              <Swords className="w-3.5 h-3.5" />
              RAID BOSS{phase2 ? " 出現予告" : ""}
            </p>

            <div className="flex flex-col items-center my-3">
              {phase2 ? (
                upcoming.boss_image_url ? (
                  <img
                    src={upcoming.boss_image_url}
                    alt={upcoming.boss_name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center"
                    style={{ background: "#374151" }}
                  >
                    <Swords size={48} color="#EF4444" />
                  </div>
                )
              ) : (
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: "#000" }}
                >
                  <Swords size={44} color="#333" />
                </div>
              )}
              {phase2 ? (
                <>
                  <p className="text-[18px] font-bold mt-2">{upcoming.boss_name}</p>
                  <p className="text-[16px] font-bold mt-1" style={{ color: "#EF4444" }}>
                    HP: {upcoming.boss_hp.toLocaleString()} kg
                  </p>
                  <p className="text-[14px] font-bold mt-1" style={{ color: "#0ABAB5" }}>
                    {formatMD(upcoming.start_date)}〜{formatMD(upcoming.end_date)}の1週間！
                  </p>
                  <p className="text-[14px] mt-1.5">ジム全体の総挙上量でHPを削れ！</p>
                </>
              ) : (
                <>
                  <p className="text-[16px] font-bold mt-2">？？？</p>
                  <p
                    className="text-[14px] mt-1 italic"
                    style={{ color: "#9CA3AF" }}
                  >
                    強大な敵の気配が近づいている…
                  </p>
                </>
              )}
            </div>

            <p className="text-[14px] text-center mt-2">
              出現まで あと{" "}
              <span className="text-[20px] font-bold">{teaserDaysUntil}</span> 日
            </p>
            <div
              className="mt-2 h-1 rounded-full overflow-hidden"
              style={{ background: "#374151" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${progressPct}%`,
                  background: "linear-gradient(90deg, #EF4444, #DC2626)",
                }}
              />
            </div>
          </CardContent>
        </Card>
      </>
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
            <div className={`w-20 h-20 rounded-full flex items-center justify-center bg-red-50 ${raid.defeated ? "raid-defeated" : ""}`}>
              <Swords className="w-12 h-12 text-red-600" />
            </div>
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
            <p className="text-center text-sm font-bold mt-3 flex items-center justify-center gap-1" style={{ color: "#D4AF37" }}>
              <Sparkles className="w-4 h-4" />おめでとう！全員に+{raid.reward_exp} EXP +{raid.reward_coins} コインを配布しました
            </p>
          )}

          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
            <div className="rounded-lg p-2" style={{ backgroundColor: "rgba(220, 38, 38, 0.05)" }}>
              <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-0.5"><Sword className="w-3 h-3" />あなた</p>
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