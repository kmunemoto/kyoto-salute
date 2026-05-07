export type MissionKey =
  | "full_power"
  | "volume_king"
  | "three_parts"
  | "rep_master"
  | "new_record"
  | "complete_sets"
  | "morning_training"
  | "night_fighter";

export interface MissionDef {
  key: MissionKey;
  name: string;
  /** Lucide icon registry name */
  icon: string;
  description: string;
  exp: number;
}

export const MISSIONS: MissionDef[] = [
  { key: "full_power", name: "フルパワー", icon: "Dumbbell", description: "全種目で前回以上の重量を挙げる", exp: 20 },
  { key: "volume_king", name: "ボリュームキング", icon: "Crown", description: "総挙上量5,000kg以上", exp: 25 },
  { key: "three_parts", name: "3部位チャレンジ", icon: "Target", description: "3つ以上の異なる部位をトレーニング", exp: 15 },
  { key: "rep_master", name: "レップマスター", icon: "Repeat", description: "全セットで10回以上", exp: 15 },
  { key: "new_record", name: "新記録ハンター", icon: "Trophy", description: "いずれかの種目で自己ベスト更新", exp: 30 },
  { key: "complete_sets", name: "コンプリートセット", icon: "CheckCircle2", description: "全種目3セット以上", exp: 15 },
  { key: "morning_training", name: "早起きトレーニング", icon: "Sunrise", description: "12:00前のセッション", exp: 10 },
  { key: "night_fighter", name: "ナイトファイター", icon: "Moon", description: "19:00以降のセッション", exp: 10 },
];

export const MISSION_BONUS_EXP = 50;

export const getMissionDef = (key: string): MissionDef | undefined =>
  MISSIONS.find((m) => m.key === key);

/**
 * Pick 3 random missions. Avoid having both morning_training and night_fighter together.
 */
export const pickDailyMissions = (): MissionKey[] => {
  const pool = [...MISSIONS];
  // Shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const picked: MissionKey[] = [];
  for (const m of pool) {
    if (picked.length >= 3) break;
    if (
      (m.key === "morning_training" && picked.includes("night_fighter")) ||
      (m.key === "night_fighter" && picked.includes("morning_training"))
    ) {
      continue;
    }
    picked.push(m.key);
  }
  return picked;
};