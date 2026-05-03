/**
 * Map exercise name to a muscle group (Japanese label).
 * Unknown exercises return "その他".
 */
export const muscleGroupMap: Record<string, string> = {
  // 胸
  "ベンチプレス": "胸",
  "インクラインベンチプレス": "胸",
  "インクラインダンベルプレス": "胸",
  "ダンベルフライ": "胸",
  "ダンベルプレス": "胸",
  "チェストプレス": "胸",
  "ケーブルフライ": "胸",
  // 背中
  "ラットプルダウン": "背中",
  "シーテッドロー": "背中",
  "デッドリフト": "背中",
  "ベントオーバーロー": "背中",
  "チンニング": "背中",
  "ワンハンドロー": "背中",
  "懸垂": "背中",
  // 肩
  "ショルダープレス": "肩",
  "サイドレイズ": "肩",
  "フロントレイズ": "肩",
  "リアレイズ": "肩",
  "アーノルドプレス": "肩",
  // 脚
  "スクワット": "脚",
  "スミススクワット": "脚",
  "レッグプレス": "脚",
  "レッグエクステンション": "脚",
  "レッグカール": "脚",
  "ブルガリアンスクワット": "脚",
  "ワイドスクワット": "脚",
  "ランジ": "脚",
  // 臀部
  "ヒップスラスト": "臀部",
  "ヒップアブダクション": "臀部",
  // 腕
  "アームカール": "腕",
  "ハンマーカール": "腕",
  "トライセプスエクステンション": "腕",
  "ケーブルカール": "腕",
  "キックバック": "腕",
  // 腹筋
  "クランチ": "腹筋",
  "レッグレイズ": "腹筋",
  "プランク": "腹筋",
  "アブローラー": "腹筋",
};

export const getMuscleGroup = (exerciseName: string): string => {
  return muscleGroupMap[exerciseName] || "その他";
};

/**
 * Given a list of exercise names, return unique muscle groups joined by "・".
 * Order follows first appearance.
 */
export const summarizeMuscleGroups = (exerciseNames: string[]): string => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const n of exerciseNames) {
    const g = getMuscleGroup(n);
    if (!seen.has(g)) {
      seen.add(g);
      out.push(g);
    }
  }
  return out.join("・");
};