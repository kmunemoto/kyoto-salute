import { useQuestProgress, isStageComplete } from "@/hooks/useQuestProgress";
import { getQuestIcon } from "@/lib/questIcons";
import { ChevronRight, Sparkles } from "lucide-react";

interface Props {
  onOpen: () => void;
}

const QuestCard = ({ onOpen }: Props) => {
  const { data, loading } = useQuestProgress();
  if (loading || !data) return null;

  const stage = data.stages.find((s) => s.stage_number === data.current_stage);
  const allDone = data.completed_stage_ids.length >= 8;

  // All cleared
  if (allDone || !stage) {
    return (
      <button
        onClick={onOpen}
        className="w-full rounded-2xl p-5 text-left text-white shadow-lg transition active:scale-[0.99]"
        style={{ background: "linear-gradient(135deg, #fde68a 0%, #ffffff 100%)" }}
      >
        <div className="flex items-center gap-2 mb-1 text-foreground">
          <Sparkles className="w-4 h-4" />
          <p className="text-xs font-bold tracking-wider uppercase">王国復興クエスト</p>
        </div>
        <p className="font-bold text-foreground text-lg">ルミナス王国 完全復活</p>
        <p className="text-xs text-foreground/70 mt-1">全8エリアを取り戻しました</p>
      </button>
    );
  }

  const ready = isStageComplete(stage);
  const Icon = getQuestIcon(stage.theme_icon);

  // Card always shows the "before" (dark) state until ready, then switches to "after" (bright)
  const bg = ready
    ? `linear-gradient(135deg, ${stage.theme_gradient_from} 0%, ${stage.theme_gradient_to} 100%)`
    : `linear-gradient(135deg, ${stage.theme_dark_from} 0%, ${stage.theme_dark_to} 100%)`;

  return (
    <button
      onClick={onOpen}
      className="w-full rounded-2xl p-5 text-left text-white shadow-lg transition active:scale-[0.99] relative overflow-hidden"
      style={{ background: bg }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-wider opacity-80">王国復興クエスト 第{stage.stage_number}章</p>
            <p className="font-bold text-base leading-tight">
              {ready ? stage.name : stage.name_before}
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 opacity-70" />
      </div>

      {ready ? (
        <div className="rounded-xl bg-white/25 backdrop-blur-sm px-3 py-2 text-center">
          <p className="text-sm font-bold">復興する！タップで進む</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          <p className="text-[11px] opacity-90">光を取り戻せ</p>
          {stage.conditions.map((c) => {
            const pct = Math.min(100, (Number(c.current_value) / Number(c.target_value)) * 100);
            const done = Number(c.current_value) >= Number(c.target_value);
            return (
              <div key={c.condition_type}>
                <div className="flex items-center justify-between text-[10px] mb-0.5">
                  <span className="opacity-90 truncate">{c.display_label}</span>
                  <span className="font-bold opacity-90 shrink-0 ml-2">
                    {Math.floor(Number(c.current_value)).toLocaleString()}/{Number(c.target_value).toLocaleString()}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/15 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, background: done ? "#0ABAB5" : "rgba(255,255,255,0.7)" }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </button>
  );
};

export default QuestCard;