import { useState } from "react";
import { ArrowLeft, Lock, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuestProgress, isStageComplete, type QuestStage } from "@/hooks/useQuestProgress";
import { getQuestIcon } from "@/lib/questIcons";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import QuestStageClearDialog from "./QuestStageClearDialog";

const CustomerQuest = ({ onBack }: { onBack: () => void }) => {
  const { user } = useAuth();
  const { data, loading, refetch } = useQuestProgress();
  const [completing, setCompleting] = useState(false);
  const [clearedStage, setClearedStage] = useState<QuestStage | null>(null);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  const completedSet = new Set(data.completed_stage_ids);
  const currentStage = data.stages.find((s) => s.stage_number === data.current_stage);
  const allDone = completedSet.size >= 8;
  const restorePct = Math.round((completedSet.size / 8) * 100);

  const headerBg = currentStage && !allDone
    ? `linear-gradient(135deg, ${currentStage.theme_dark_from} 0%, ${currentStage.theme_dark_to} 100%)`
    : `linear-gradient(135deg, #fde68a 0%, #ffffff 100%)`;

  const handleComplete = async (stageId: number) => {
    if (!user || completing) return;
    setCompleting(true);
    try {
      const { error } = await supabase.rpc("complete_quest_stage", { p_user_id: user.id, p_stage_id: stageId });
      if (error) throw error;
      const stage = data.stages.find((s) => s.id === stageId)!;
      setClearedStage(stage);
      await refetch();
      window.dispatchEvent(new Event("quest-progress-updated"));
    } catch (e: any) {
      toast.error(e.message || "クリア処理に失敗しました");
    } finally {
      setCompleting(false);
    }
  };

  const nextStageOf = (stageNum: number) => data.stages.find((s) => s.stage_number === stageNum + 1);

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div
        className="px-4 py-6 text-white relative"
        style={{ background: headerBg }}
      >
        <button onClick={onBack} className="flex items-center gap-1 text-sm font-bold mb-3 opacity-90">
          <ArrowLeft className="w-4 h-4" /> 戻る
        </button>
        <h1 className="text-2xl font-bold">ルミナス王国</h1>
        <p className="text-sm opacity-90 mt-1">復興率 {restorePct}%（{completedSet.size}/8 エリア）</p>
        <div className="h-2 mt-3 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white/80 transition-all" style={{ width: `${restorePct}%` }} />
        </div>
      </div>

      <div className="px-4 py-6 space-y-3">
        {data.stages.map((stage, i) => {
          const isCompleted = completedSet.has(stage.id);
          const isCurrent = !isCompleted && stage.stage_number === data.current_stage;
          const isLocked = !isCompleted && !isCurrent;
          const ready = isCurrent && isStageComplete(stage);
          const Icon = getQuestIcon(stage.theme_icon);

          let bg: string;
          if (isCompleted) {
            bg = `linear-gradient(135deg, ${stage.theme_gradient_from} 0%, ${stage.theme_gradient_to} 100%)`;
          } else if (isCurrent) {
            bg = `linear-gradient(90deg, ${stage.theme_dark_from} 0%, ${stage.theme_dark_to} 50%, ${stage.theme_gradient_from} 50%, ${stage.theme_gradient_to} 100%)`;
          } else {
            bg = `linear-gradient(135deg, #e5e7eb 0%, #9ca3af 100%)`;
          }

          return (
            <div key={stage.id} className="relative">
              {i > 0 && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 w-1 h-3"
                  style={{
                    background: completedSet.has(stage.id - 1) ? "#0ABAB5" : "transparent",
                    borderLeft: completedSet.has(stage.id - 1) ? "none" : "2px dashed #d1d5db",
                  }}
                />
              )}
              <div
                className={`rounded-2xl p-5 text-white shadow-md ${isLocked ? "opacity-60" : ""} ${isCompleted ? "animate-pulse" : ""}`}
                style={{ background: bg }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/25 backdrop-blur flex items-center justify-center shrink-0">
                    {isLocked ? <Lock className="w-5 h-5" /> : isCompleted ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold tracking-wider opacity-80">第{stage.stage_number}章</p>
                    <p className="font-bold text-base leading-tight break-all">
                      {isLocked ? "？？？" : isCompleted ? stage.name : stage.name_before}
                    </p>
                  </div>
                </div>

                {isCurrent && (
                  <div className="mt-3 space-y-1.5">
                    {stage.conditions.map((c) => {
                      const pct = Math.min(100, (Number(c.current_value) / Number(c.target_value)) * 100);
                      const done = Number(c.current_value) >= Number(c.target_value);
                      return (
                        <div key={c.condition_type}>
                          <div className="flex items-center justify-between text-[11px] mb-0.5">
                            <span className="opacity-90 truncate">{c.display_label}</span>
                            <span className="font-bold opacity-90 shrink-0 ml-2">
                              {Math.floor(Number(c.current_value)).toLocaleString()}/{Number(c.target_value).toLocaleString()}
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-black/25 overflow-hidden">
                            <div className="h-full transition-all" style={{ width: `${pct}%`, background: done ? "#0ABAB5" : "rgba(255,255,255,0.85)" }} />
                          </div>
                        </div>
                      );
                    })}
                    {ready && (
                      <Button
                        className="w-full mt-3 bg-white text-foreground hover:bg-white/90 font-bold"
                        onClick={() => handleComplete(stage.id)}
                        disabled={completing}
                      >
                        {completing ? <Loader2 className="w-4 h-4 animate-spin" /> : "復興する！"}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {clearedStage && (
        <QuestStageClearDialog
          stage={clearedStage}
          nextStage={nextStageOf(clearedStage.stage_number)}
          open={!!clearedStage}
          onClose={() => setClearedStage(null)}
        />
      )}
    </div>
  );
};

export default CustomerQuest;