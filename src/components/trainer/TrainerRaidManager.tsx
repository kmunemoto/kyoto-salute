import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Sword, Trash2, Plus } from "lucide-react";

interface RaidRow {
  id: string;
  boss_name: string;
  boss_hp: number;
  current_damage: number;
  start_date: string;
  end_date: string;
  defeated: boolean;
  reward_exp: number;
  reward_coins: number;
}

interface ContribRow {
  user_id: string;
  damage: number;
  display_name?: string;
}

const TrainerRaidManager = () => {
  const [raids, setRaids] = useState<RaidRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ boss_name: "", boss_hp: 200000, start_date: "", end_date: "", reward_exp: 300, reward_coins: 30 });
  const [contribs, setContribs] = useState<Record<string, ContribRow[]>>({});

  const refresh = async () => {
    const { data } = await supabase
      .from("raid_bosses")
      .select("*")
      .order("start_date", { ascending: false });
    setRaids((data || []) as any);
    setLoading(false);

    const { data: dmg } = await supabase.from("raid_damage_logs").select("raid_id, user_id, damage");
    if (!dmg) return;
    const grouped: Record<string, Record<string, number>> = {};
    (dmg as any[]).forEach((r) => {
      grouped[r.raid_id] = grouped[r.raid_id] || {};
      grouped[r.raid_id][r.user_id] = (grouped[r.raid_id][r.user_id] || 0) + r.damage;
    });
    const userIds = [...new Set((dmg as any[]).map((r) => r.user_id))];
    const { data: profs } = await supabase.from("profiles").select("user_id, display_name").in("user_id", userIds);
    const nameMap = new Map((profs || []).map((p: any) => [p.user_id, p.display_name]));
    const final: Record<string, ContribRow[]> = {};
    Object.entries(grouped).forEach(([raidId, byUser]) => {
      final[raidId] = Object.entries(byUser)
        .map(([user_id, damage]) => ({ user_id, damage, display_name: nameMap.get(user_id) || "—" }))
        .sort((a, b) => b.damage - a.damage);
    });
    setContribs(final);
  };

  useEffect(() => { refresh(); }, []);

  const handleCreate = async () => {
    if (!form.boss_name || !form.start_date || !form.end_date || !form.boss_hp) {
      toast.error("全項目を入力してください");
      return;
    }
    setCreating(true);
    const { error } = await supabase.from("raid_bosses").insert({
      boss_name: form.boss_name,
      boss_hp: Number(form.boss_hp),
      start_date: form.start_date,
      end_date: form.end_date,
      reward_exp: Number(form.reward_exp),
      reward_coins: Number(form.reward_coins),
    });
    setCreating(false);
    if (error) { toast.error("作成に失敗しました"); return; }
    toast.success("レイドボスを作成しました");
    setForm({ boss_name: "", boss_hp: 200000, start_date: "", end_date: "", reward_exp: 300, reward_coins: 30 });
    refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("このレイドを削除しますか？")) return;
    await supabase.from("raid_bosses").delete().eq("id", id);
    toast.success("削除しました");
    refresh();
  };

  if (loading) return <Loader2 className="w-6 h-6 animate-spin text-accent mx-auto mt-10" />;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold flex items-center gap-2"><Sword className="w-6 h-6 text-red-600" /> レイド管理</h1>
        <p className="text-sm text-muted-foreground mt-1">週間レイドボスの作成・管理を行います</p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="text-sm font-bold flex items-center gap-1.5"><Plus className="w-4 h-4" /> 新規レイド作成</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">ボス名</Label>
              <Input value={form.boss_name} onChange={(e) => setForm({ ...form, boss_name: e.target.value })} placeholder="ゴブリンキング" />
            </div>
            <div>
              <Label className="text-xs">HP (kg)</Label>
              <Input type="number" value={form.boss_hp} onChange={(e) => setForm({ ...form, boss_hp: Number(e.target.value) })} />
            </div>
            <div>
              <Label className="text-xs">開始日</Label>
              <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">終了日</Label>
              <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">報酬 EXP</Label>
              <Input type="number" value={form.reward_exp} onChange={(e) => setForm({ ...form, reward_exp: Number(e.target.value) })} />
            </div>
            <div>
              <Label className="text-xs">報酬 コイン</Label>
              <Input type="number" value={form.reward_coins} onChange={(e) => setForm({ ...form, reward_coins: Number(e.target.value) })} />
            </div>
          </div>
          <Button onClick={handleCreate} disabled={creating} className="w-full">
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "作成"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-sm font-bold">レイド一覧</h2>
        {raids.map((r) => {
          const pct = Math.min(100, Math.round((r.current_damage / r.boss_hp) * 100));
          const list = contribs[r.id] || [];
          return (
            <Card key={r.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold">{r.boss_name} {r.defeated && <span className="text-amber-600 text-xs ml-2">撃破済み</span>}</p>
                    <p className="text-xs text-muted-foreground">{r.start_date} 〜 {r.end_date}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #DC2626, #F97316)" }} />
                </div>
                <p className="text-xs">{r.current_damage.toLocaleString()} / {r.boss_hp.toLocaleString()} kg ({pct}%) ／ 報酬 +{r.reward_exp}EXP +{r.reward_coins}コイン</p>
                {list.length > 0 && (
                  <div className="border-t pt-2 mt-2">
                    <p className="text-xs font-bold mb-1">貢献ランキング ({list.length}人)</p>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {list.map((c, i) => (
                        <div key={c.user_id} className="flex items-center justify-between text-xs">
                          <span>{i + 1}. {c.display_name}</span>
                          <span className="font-bold">{c.damage.toLocaleString()} kg</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default TrainerRaidManager;