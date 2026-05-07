export type RankKey = "rookie" | "regular" | "athlete" | "elite" | "legend";

export interface RankInfo {
  key: RankKey;
  name: string;
  image: string;
  color: string;
}

export type AchievementRarity = "normal" | "rare" | "epic";

export const ACHIEVEMENTS: { key: string; name: string; description: string; rarity: AchievementRarity }[] = [
  // Normal
  { key: "first_step", name: "はじめの一歩", description: "初回トレーニング完了", rarity: "normal" },
  { key: "power_up", name: "パワーアップ", description: "初めて重量の自己ベスト更新", rarity: "normal" },
  { key: "multiplayer", name: "マルチプレイヤー", description: "5種類以上の種目を記録", rarity: "normal" },
  { key: "mission_clear", name: "ミッションクリア🎯", description: "デイリーミッション初達成", rarity: "normal" },
  // Rare
  { key: "regular_visitor", name: "常連", description: "累計10セッション達成", rarity: "rare" },
  { key: "ton_club", name: "1トンクラブ", description: "1セッションの総挙上量1,000kg超え", rarity: "rare" },
  { key: "balance_master", name: "バランスマスター", description: "1ヶ月で5部位以上をトレーニング", rarity: "rare" },
  { key: "mission_master", name: "ミッションマスター🏅", description: "デイリーミッション累計30回達成", rarity: "rare" },
  { key: "perfect_day", name: "パーフェクトデイ⭐", description: "1日で3ミッション全達成", rarity: "rare" },
  { key: "fifty_sessions", name: "50回達成5️⃣", description: "累計50セッション", rarity: "rare" },
  { key: "all_rounder", name: "オールラウンダー🔰", description: "1ヶ月で全7部位をトレーニング", rarity: "rare" },
  { key: "three_months", name: "3ヶ月継続🗓️", description: "12週連続来店", rarity: "rare" },
  // Epic
  { key: "habit_formed", name: "習慣化", description: "4週連続来店", rarity: "epic" },
  { key: "perfect_week", name: "パーフェクトウィーク🌟", description: "1週間で全セッションのミッション全達成", rarity: "epic" },
  { key: "hundred_sessions", name: "100回達成💯", description: "累計100セッション", rarity: "epic" },
  { key: "half_year", name: "半年継続📅", description: "26週連続来店", rarity: "epic" },
  { key: "ten_ton_club", name: "10トンクラブ🏋️", description: "1セッションの総挙上量10,000kg超え", rarity: "epic" },
  // Gacha
  { key: "gacha_beginner", name: "初ガチャ🎰", description: "ガチャを初めて回す", rarity: "normal" },
  { key: "gacha_lucky", name: "ラッキー🍀", description: "epicまたはlegendaryを引く", rarity: "rare" },
  { key: "gacha_legend", name: "ジャックポット🎰", description: "legendaryを引く", rarity: "epic" },
];

export const getRarityColor = (rarity: AchievementRarity): string => {
  switch (rarity) {
    case "normal": return "#999999";
    case "rare": return "hsl(174, 65%, 50%)";
    case "epic": return "#D4AF37";
  }
};

export const getRarityStarCount = (rarity: AchievementRarity): number => {
  return rarity === "normal" ? 1 : rarity === "rare" ? 2 : 3;
};

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
  if (level <= 5) return { key: "rookie", name: "ルーキー", image: "/avatars/rookie.png", color: "#10b981" };
  if (level <= 15) return { key: "regular", name: "レギュラー", image: "/avatars/regular.png", color: "#3b82f6" };
  if (level <= 30) return { key: "athlete", name: "アスリート", image: "/avatars/athlete.png", color: "#8b5cf6" };
  if (level <= 50) return { key: "elite", name: "エリート", image: "/avatars/elite.png", color: "#f59e0b" };
  return { key: "legend", name: "レジェンド", image: "/avatars/legend.png", color: "#d4af37" };
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