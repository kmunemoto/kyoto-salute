export type RankKey = "rookie" | "regular" | "athlete" | "elite" | "legend";

export interface RankInfo {
  key: RankKey;
  name: string;
  image: string;
  color: string;
}

export const ACHIEVEMENTS: { key: string; name: string; description: string }[] = [
  { key: "first_step", name: "はじめの一歩", description: "初回トレーニング完了" },
  { key: "regular_visitor", name: "常連", description: "累計10セッション達成" },
  { key: "habit_formed", name: "習慣化", description: "4週連続来店" },
  { key: "power_up", name: "パワーアップ", description: "初めて重量の自己ベスト更新" },
  { key: "multiplayer", name: "マルチプレイヤー", description: "5種類以上の種目を記録" },
  { key: "ton_club", name: "1トンクラブ", description: "1セッションの総挙上量1,000kg超え" },
  { key: "balance_master", name: "バランスマスター", description: "1ヶ月で5部位以上をトレーニング" },
];

export const getRequiredExp = (level: number): number => 250 + level * 50;

export const calculateLevel = (totalExp: number): number => {
  let level = 1;
  let cumulative = 0;
  while (totalExp >= cumulative + getRequiredExp(level)) {
    cumulative += getRequiredExp(level);
    level++;
    if (level > 999) break;
  }
  return level;
};

export const getRankInfo = (level: number): RankInfo => {
  if (level <= 5) return { key: "rookie", name: "ルーキー", image: "/avatars/rookie.svg", color: "#10b981" };
  if (level <= 15) return { key: "regular", name: "レギュラー", image: "/avatars/regular.svg", color: "#3b82f6" };
  if (level <= 30) return { key: "athlete", name: "アスリート", image: "/avatars/athlete.svg", color: "#8b5cf6" };
  if (level <= 50) return { key: "elite", name: "エリート", image: "/avatars/elite.svg", color: "#f59e0b" };
  return { key: "legend", name: "レジェンド", image: "/avatars/legend.svg", color: "#d4af37" };
};

export interface ExpProgress {
  level: number;
  rank: RankInfo;
  totalExp: number;
  currentLevelExp: number;
  requiredExp: number;
  percent: number;
  remainingExp: number;
}

export const getExpProgress = (totalExp: number): ExpProgress => {
  const level = calculateLevel(totalExp);
  let cumulative = 0;
  for (let l = 1; l < level; l++) cumulative += getRequiredExp(l);
  const required = getRequiredExp(level);
  const currentLevelExp = totalExp - cumulative;
  const percent = Math.min(100, Math.round((currentLevelExp / required) * 100));
  return {
    level,
    rank: getRankInfo(level),
    totalExp,
    currentLevelExp,
    requiredExp: required,
    percent,
    remainingExp: Math.max(0, required - currentLevelExp),
  };
};