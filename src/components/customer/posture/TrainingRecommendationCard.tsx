import { Dumbbell, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { SkeletalType } from "./types";

type TrainingTip = {
  area: string;
  exercises: string[];
  reason: string;
};

const RECOMMENDATIONS: Record<SkeletalType, { summary: string; tips: TrainingTip[] }> = {
  straight: {
    summary: "上半身に厚みがあるストレートタイプは、体幹を引き締めつつ全身のバランスを整えるトレーニングが効果的です。",
    tips: [
      {
        area: "体幹・腹筋",
        exercises: ["プランク", "デッドバグ", "ケーブルクランチ"],
        reason: "厚みのある上半身を引き締め、メリハリのあるラインを作ります",
      },
      {
        area: "背中",
        exercises: ["ラットプルダウン", "シーテッドロウ", "ベントオーバーロウ"],
        reason: "背中の筋肉を強化し、姿勢改善とウエストの引き締め効果を高めます",
      },
      {
        area: "下半身",
        exercises: ["スクワット", "レッグプレス", "ヒップスラスト"],
        reason: "下半身を鍛えて上半身とのバランスを整えます",
      },
    ],
  },
  wave: {
    summary: "華奢な上半身が特徴のウェーブタイプは、上半身の筋力強化と下半身の引き締めを組み合わせたトレーニングがおすすめです。",
    tips: [
      {
        area: "肩・上半身",
        exercises: ["ショルダープレス", "サイドレイズ", "プッシュアップ"],
        reason: "華奢な上半身にボリュームを加え、全体のバランスを改善します",
      },
      {
        area: "下半身・ヒップ",
        exercises: ["ブルガリアンスクワット", "ヒップアブダクション", "カーフレイズ"],
        reason: "重心が低めの下半身を引き締め、脚のラインを整えます",
      },
      {
        area: "体幹",
        exercises: ["ヒップリフト", "バードドッグ", "サイドプランク"],
        reason: "ウエスト周りを引き締め、くびれを強調します",
      },
    ],
  },
  natural: {
    summary: "骨格フレームがしっかりしたナチュラルタイプは、柔軟性を高めながら全身を均等に鍛えるトレーニングが効果的です。",
    tips: [
      {
        area: "全身・コンパウンド",
        exercises: ["デッドリフト", "クリーン", "ケトルベルスイング"],
        reason: "しっかりした骨格を活かし、全身の筋力をバランスよく強化します",
      },
      {
        area: "胸・肩",
        exercises: ["ベンチプレス", "ダンベルフライ", "フェイスプル"],
        reason: "フレーム感のある肩周りに筋肉をつけ、立体感を出します",
      },
      {
        area: "柔軟性・モビリティ",
        exercises: ["ヨガ", "フォームローラー", "ダイナミックストレッチ"],
        reason: "関節が目立ちやすいタイプのため、柔軟性を高めて可動域を広げます",
      },
    ],
  },
};

const TYPE_COLORS: Record<SkeletalType, string> = {
  straight: "hsl(36, 50%, 55%)",
  wave: "hsl(280, 45%, 55%)",
  natural: "hsl(160, 40%, 45%)",
};

type Props = {
  skeletalType: SkeletalType | null;
};

const TrainingRecommendationCard = ({ skeletalType }: Props) => {
  if (!skeletalType) return null;

  const rec = RECOMMENDATIONS[skeletalType];
  const color = TYPE_COLORS[skeletalType];

  return (
    <Card className="border-accent/30">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-accent" />
          <span className="text-sm font-bold">おすすめトレーニング</span>
        </div>

        <p className="text-xs text-muted-foreground">{rec.summary}</p>

        <div className="space-y-3">
          {rec.tips.map((tip, i) => (
            <div key={i} className="bg-muted/40 rounded-lg p-3 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Dumbbell className="w-3.5 h-3.5 shrink-0" style={{ color }} />
                <span className="text-xs font-bold">{tip.area}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {tip.exercises.map((ex) => (
                  <span
                    key={ex}
                    className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: `${color}20`, color }}
                  >
                    {ex}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">{tip.reason}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TrainingRecommendationCard;
