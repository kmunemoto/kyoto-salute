import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ClipboardList, Loader2, Eye, ChevronRight } from "lucide-react";
import { useCounselingResponses, type CounselingResponse } from "@/hooks/useCounselingResponses";
import { format } from "date-fns";

const purposeLabels: Record<string, string> = {
  diet: "ダイエット", muscle: "筋力アップ", health: "健康維持",
  posture: "姿勢改善", flexibility: "柔軟性向上",
  rehab: "リハビリ", performance: "パフォーマンス向上",
};

const CounselingResponseList = () => {
  const { responses, isLoading, markReviewed } = useCounselingResponses();
  const [selected, setSelected] = useState<CounselingResponse | null>(null);

  const handleOpen = (r: CounselingResponse) => {
    setSelected(r);
    if (!r.reviewed) markReviewed.mutate(r.id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-5 h-5 animate-spin text-accent" />
      </div>
    );
  }

  if (responses.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-sm text-muted-foreground">
          カウンセリング回答はまだありません
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {responses.slice(0, 10).map((r) => (
          <Card key={r.id} className="card-hover cursor-pointer" onClick={() => handleOpen(r)}>
            <CardContent className="p-3 sm:p-4 flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm truncate">
                    {r.last_name} {r.first_name}
                  </p>
                  {!r.reviewed && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                      NEW
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {r.purposes?.map((p) => purposeLabels[p] || p).join("・") || "目的未入力"}
                </p>
              </div>
              <div className="text-right shrink-0 flex items-center gap-1">
                <p className="text-xs text-muted-foreground">
                  {format(new Date(r.created_at), "M/d HH:mm")}
                </p>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-accent" />
              カウンセリング回答詳細
            </DialogTitle>
          </DialogHeader>
          {selected && <CounselingDetail data={selected} />}
        </DialogContent>
      </Dialog>
    </>
  );
};

const CounselingDetail = ({ data }: { data: CounselingResponse }) => {
  const rows: { label: string; value: string | null | undefined }[] = [
    { label: "氏名", value: `${data.last_name} ${data.first_name}` },
    { label: "フリガナ", value: data.last_name_kana && data.first_name_kana ? `${data.last_name_kana} ${data.first_name_kana}` : null },
    { label: "年齢", value: data.age },
    { label: "性別", value: data.gender },
    { label: "電話番号", value: data.phone },
    { label: "メール", value: data.email },
    { label: "目的", value: data.purposes?.map((p) => purposeLabels[p] || p).join("、") },
    { label: "運動経験", value: data.experience_level },
    { label: "希望頻度", value: data.target_frequency },
    { label: "運動習慣", value: data.exercise_habit },
    { label: "食事パターン", value: data.diet_pattern },
    { label: "睡眠時間", value: data.sleep_hours },
    { label: "痛みのある部位", value: data.pain_areas?.join("、") },
    { label: "既往歴", value: data.medical_history },
    { label: "備考", value: data.notes },
    { label: "回答日時", value: format(new Date(data.created_at), "yyyy年M月d日 HH:mm") },
  ];

  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.label} className="border-b border-border pb-2 last:border-0">
          <p className="text-xs text-muted-foreground">{r.label}</p>
          <p className="text-sm font-medium mt-0.5">{r.value || "—"}</p>
        </div>
      ))}
    </div>
  );
};

const purposeLabelsForDetail: Record<string, string> = purposeLabels;

export default CounselingResponseList;
