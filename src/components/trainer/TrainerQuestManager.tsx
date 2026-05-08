import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Castle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserProgress {
  user_id: string;
  display_name: string | null;
  current_stage: number;
  completed_count: number;
}

const TrainerQuestManager = () => {
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [users, setUsers] = useState<UserProgress[]>([]);

  const fetchData = async () => {
    setLoading(true);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name");
    const { data: progress } = await supabase
      .from("user_quest_progress")
      .select("user_id, current_stage");
    const { data: completions } = await supabase
      .from("user_quest_stage_completions")
      .select("user_id, stage_id");

    const progMap = new Map((progress || []).map((p: any) => [p.user_id, p.current_stage]));
    const compMap = new Map<string, number>();
    (completions || []).forEach((c: any) => {
      compMap.set(c.user_id, (compMap.get(c.user_id) || 0) + 1);
    });

    const list: UserProgress[] = (profiles || [])
      .map((p: any) => ({
        user_id: p.user_id,
        display_name: p.display_name,
        current_stage: progMap.get(p.user_id) || 1,
        completed_count: compMap.get(p.user_id) || 0,
      }))
      .sort((a, b) => b.completed_count - a.completed_count);
    setUsers(list);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleInitialize = async () => {
    if (!confirm("全会員のクエスト進行状況を、既存の実績から自動算出します。よろしいですか？")) return;
    setRunning(true);
    const { data, error } = await supabase.rpc("initialize_quest_progress");
    setRunning(false);
    if (error) {
      toast.error("初期化に失敗しました", { description: error.message });
      return;
    }
    const result = data as { users?: number; completions?: number } | null;
    toast.success(
      `初期化完了: ${result?.users ?? 0}名 / クリア記録 ${result?.completions ?? 0}件`,
    );
    fetchData();
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center gap-2">
        <Castle className="w-6 h-6 text-accent" />
        <h1 className="text-xl font-extrabold">クエスト管理</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        会員のクエスト「眠れる王国を取り戻せ」の進行状況を管理します。
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">既存実績から進行状況を初期化</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            既存のセッション・ミッション・レイド・ガチャ等の累計実績を元に、達成済みステージを自動で記録します。実行はいつでも安全（重複登録なし）。
          </p>
          <Button onClick={handleInitialize} disabled={running}>
            {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            進行状況を再計算
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">会員の進行状況 ({users.length}名)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-accent" />
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((u) => (
                <div
                  key={u.user_id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50"
                >
                  <span className="text-sm font-semibold truncate">
                    {u.display_name || "(名前未設定)"}
                  </span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-muted-foreground">
                      クリア <span className="font-bold text-foreground">{u.completed_count}</span>/8
                    </span>
                    <span className="px-2 py-1 rounded-md bg-accent/10 text-accent font-bold">
                      ステージ {Math.min(u.current_stage, 8)}
                    </span>
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">会員がいません</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TrainerQuestManager;