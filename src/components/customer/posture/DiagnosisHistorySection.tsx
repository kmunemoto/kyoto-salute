import { useState, useEffect } from "react";
import { Bone, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

type DiagnosisRow = {
  id: string;
  skeletal_type: string;
  confidence: number;
  scores: { straight: number; wave: number; natural: number };
  metrics: Record<string, number>;
  created_at: string;
};

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  straight: { label: "ストレート", color: "hsl(36, 50%, 55%)" },
  wave: { label: "ウェーブ", color: "hsl(280, 45%, 55%)" },
  natural: { label: "ナチュラル", color: "hsl(160, 40%, 45%)" },
};

type Props = { userId: string | undefined };

const DiagnosisHistorySection = ({ userId }: Props) => {
  const [diagnoses, setDiagnoses] = useState<DiagnosisRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const fetch = async () => {
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
    fetch();
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
            return (
              <Card key={d.id} className="opacity-90">
                <CardContent className="p-3 flex items-center gap-3">
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
                  <div className="text-right text-[10px] text-muted-foreground space-y-0.5 shrink-0">
                    <p>S:{d.scores?.straight}%</p>
                    <p>W:{d.scores?.wave}%</p>
                    <p>N:{d.scores?.natural}%</p>
                  </div>
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
