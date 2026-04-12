import { useState, useEffect, useMemo } from "react";
import { Bone, Loader2, ChevronDown, Dumbbell, Target, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { SkeletalType } from "./types";

type DiagnosisRow = {
  id: string;
  skeletal_type: string;
  confidence: number;
  scores: { straight: number; wave: number; natural: number };
  metrics: { shoulderHipRatio?: number; upperBodyRatio?: number; limbTorsoRatio?: number };
  created_at: string;
};

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  straight: { label: "ストレート", color: "hsl(36, 50%, 55%)" },
  wave: { label: "ウェーブ", color: "hsl(280, 45%, 55%)" },
  natural: { label: "ナチュラル", color: "hsl(160, 40%, 45%)" },
};

const TRAINING_TIPS: Record<string, { area: string; exercises: string[] }[]> = {
  straight: [
    { area: "体幹・腹筋", exercises: ["プランク", "デッドバグ", "ケーブルクランチ"] },
    { area: "背中", exercises: ["ラットプルダウン", "シーテッドロウ"] },
    { area: "下半身", exercises: ["スクワット", "ヒップスラスト"] },
  ],
  wave: [
    { area: "肩・上半身", exercises: ["ショルダープレス", "サイドレイズ", "プッシュアップ"] },
    { area: "下半身・ヒップ", exercises: ["ブルガリアンスクワット", "カーフレイズ"] },
    { area: "体幹", exercises: ["ヒップリフト", "サイドプランク"] },
  ],
  natural: [
    { area: "全身", exercises: ["デッドリフト", "ケトルベルスイング"] },
    { area: "胸・肩", exercises: ["ベンチプレス", "フェイスプル"] },
    { area: "柔軟性", exercises: ["ヨガ", "ダイナミックストレッチ"] },
  ],
};

type Props = { userId: string | undefined };

const DiagnosisHistorySection = ({ userId }: Props) => {
  const [diagnoses, setDiagnoses] = useState<DiagnosisRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    const fetchData = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("skeletal_diagnoses" as any)
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);
      setDiagnoses((data as unknown as DiagnosisRow[] | null) ?? []);
      setLoading(false);
    };
    fetchData();
  }, [userId]);

  return (
    <section>
      <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
        <Bone className="w-3.5 h-3.5" />
        骨格診断履歴
      </h2>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : diagnoses.length === 0 ? (
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">まだ診断履歴はありません</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {diagnoses.map((d) => {
            const info = TYPE_LABELS[d.skeletal_type] ?? { label: d.skeletal_type, color: "gray" };
            const dt = new Date(d.created_at);
            const isExpanded = expandedId === d.id;
            const tips = TRAINING_TIPS[d.skeletal_type] ?? [];

            return (
              <Card
                key={d.id}
                className="opacity-90 cursor-pointer transition-all"
                onClick={() => setExpandedId(isExpanded ? null : d.id)}
              >
                <CardContent className="p-3">
                  {/* Summary row */}
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: info.color }}
                    >
                      {info.label.slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold" style={{ color: info.color }}>
                          {info.label}タイプ
                        </p>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {d.confidence}%
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {format(dt, "yyyy年M月d日 HH:mm", { locale: ja })}
                      </p>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-border/50 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      {/* Score bars */}
                      <div className="space-y-1.5">
                        {(["straight", "wave", "natural"] as const).map((t) => {
                          const ti = TYPE_LABELS[t];
                          const val = d.scores?.[t] ?? 0;
                          return (
                            <div key={t} className="flex items-center gap-2">
                              <span className="text-[11px] font-medium w-16">{ti.label}</span>
                              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{ width: `${val}%`, backgroundColor: ti.color }}
                                />
                              </div>
                              <span className="text-[11px] text-muted-foreground w-8 text-right">{val}%</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Metrics */}
                      {d.metrics && (
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-muted/40 rounded-lg p-2 text-center">
                            <p className="text-[10px] text-muted-foreground">肩/ヒップ比</p>
                            <p className="text-sm font-bold">{d.metrics.shoulderHipRatio ?? "-"}</p>
                          </div>
                          <div className="bg-muted/40 rounded-lg p-2 text-center">
                            <p className="text-[10px] text-muted-foreground">上半身比率</p>
                            <p className="text-sm font-bold">
                              {d.metrics.upperBodyRatio != null ? `${(d.metrics.upperBodyRatio * 100).toFixed(0)}%` : "-"}
                            </p>
                          </div>
                          <div className="bg-muted/40 rounded-lg p-2 text-center">
                            <p className="text-[10px] text-muted-foreground">四肢/胴比</p>
                            <p className="text-sm font-bold">{d.metrics.limbTorsoRatio ?? "-"}</p>
                          </div>
                        </div>
                      )}

                      {/* Training recommendations */}
                      {tips.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5">
                            <Target className="w-3.5 h-3.5 text-accent" />
                            <span className="text-[11px] font-bold">おすすめトレーニング</span>
                          </div>
                          {tips.map((tip, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <Dumbbell className="w-3 h-3 mt-0.5 shrink-0" style={{ color: info.color }} />
                              <div>
                                <span className="text-[11px] font-medium">{tip.area}：</span>
                                <span className="text-[11px] text-muted-foreground">
                                  {tip.exercises.join("、")}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default DiagnosisHistorySection;
