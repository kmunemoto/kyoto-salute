export type RankKey = "rookie" | "regular" | "athlete" | "elite" | "legend";
export type Gender = "male" | "female";
export type HairColor = "orange" | "black";

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
  { key: "mission_clear", name: "ミッションクリア", description: "デイリーミッション初達成", rarity: "normal" },
  // Rare
  { key: "regular_visitor", name: "常連", description: "累計10セッション達成", rarity: "rare" },
  { key: "ton_club", name: "1トンクラブ", description: "1セッションの総挙上量1,000kg超え", rarity: "rare" },
  { key: "balance_master", name: "バランスマスター", description: "1ヶ月で5部位以上をトレーニング", rarity: "rare" },
  { key: "mission_master", name: "ミッションマスター", description: "デイリーミッション累計30回達成", rarity: "rare" },
  { key: "perfect_day", name: "パーフェクトデイ", description: "1日で3ミッション全達成", rarity: "rare" },
  { key: "fifty_sessions", name: "50回達成", description: "累計50セッション", rarity: "rare" },
  { key: "all_rounder", name: "オールラウンダー", description: "1ヶ月で全7部位をトレーニング", rarity: "rare" },
  { key: "three_months", name: "3ヶ月継続", description: "12週連続来店", rarity: "rare" },
  // Epic
  { key: "habit_formed", name: "習慣化", description: "4週連続来店", rarity: "epic" },
  { key: "perfect_week", name: "パーフェクトウィーク", description: "1週間で全セッションのミッション全達成", rarity: "epic" },
  { key: "hundred_sessions", name: "100回達成", description: "累計100セッション", rarity: "epic" },
  { key: "half_year", name: "半年継続", description: "26週連続来店", rarity: "epic" },
  { key: "ten_ton_club", name: "10トンクラブ", description: "1セッションの総挙上量10,000kg超え", rarity: "epic" },
  // Gacha
  { key: "gacha_beginner", name: "初ガチャ", description: "ガチャを初めて回す", rarity: "normal" },
  { key: "gacha_lucky", name: "ラッキー", description: "epicまたはlegendaryを引く", rarity: "rare" },
  { key: "gacha_legend", name: "ジャックポット", description: "legendaryを引く", rarity: "epic" },
  // === New: ★1 (common) ===
  { key: "first_session", name: "初セッション", description: "初回トレーニング完了", rarity: "normal" },
  { key: "first_pb", name: "初ベスト更新", description: "初めて自己ベストを更新", rarity: "normal" },
  { key: "combo_starter", name: "コンボ入門", description: "コンボ3回達成", rarity: "normal" },
  { key: "first_raid", name: "初レイド参加", description: "レイドボスに初めてダメージ", rarity: "normal" },
  { key: "month_50k", name: "月間5万kg突破", description: "月間総挙上量50,000kg以上", rarity: "normal" },
  { key: "level_10", name: "Lv10到達", description: "アバターレベル10到達", rarity: "normal" },
  { key: "first_event", name: "イベント初参加", description: "シーズンイベント初クリア", rarity: "normal" },
  { key: "first_shot", name: "ファーストショット", description: "初のビフォーアフター写真", rarity: "normal" },
  // === New: ★2 (rare) ===
  { key: "best_hunter", name: "ベストハンター", description: "自己ベスト累計10回更新", rarity: "rare" },
  { key: "combo_master_ach", name: "コンボマスター", description: "コンボ5回達成を3回記録", rarity: "rare" },
  { key: "level_25", name: "Lv25到達", description: "アバターレベル25到達", rarity: "rare" },
  { key: "coin_collector", name: "コインコレクター", description: "累計コイン獲得500枚以上", rarity: "rare" },
  { key: "event_master", name: "イベントマスター", description: "シーズンイベント3回クリア", rarity: "rare" },
  { key: "gacha_addict", name: "ガチャ中毒", description: "ガチャ累計30回実行", rarity: "rare" },
  // === New: ★3 (epic) ===
  { key: "record_breaker", name: "記録破壊王", description: "自己ベスト累計30回更新", rarity: "epic" },
  { key: "two_hundred_sessions", name: "200回達成", description: "累計200セッション", rarity: "epic" },
  { key: "one_year", name: "1年継続", description: "52週連続来店", rarity: "epic" },
  { key: "combo_king", name: "コンボキング", description: "最大コンボ10到達", rarity: "epic" },
  { key: "raid_mvp", name: "レイドMVP", description: "1回のレイドで最大貢献者", rarity: "epic" },
  { key: "month_200k", name: "月間20万kg突破", description: "月間総挙上量200,000kg以上", rarity: "epic" },
  { key: "level_50", name: "Lv50到達", description: "アバターレベル50到達", rarity: "epic" },
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

export const getAvatarImage = (
  rank: RankKey,
  gender: Gender = "female",
  hairColor: HairColor = "orange"
): string => `/avatars/${gender}_${rank}_${hairColor}.png`;

export const getRankInfo = (
  level: number,
  gender: Gender = "female",
  hairColor: HairColor = "orange"
): RankInfo => {
  if (level <= 5) return { key: "rookie", name: "ルーキー", image: getAvatarImage("rookie", gender, hairColor), color: "#10b981" };
  if (level <= 15) return { key: "regular", name: "レギュラー", image: getAvatarImage("regular", gender, hairColor), color: "#3b82f6" };
  if (level <= 30) return { key: "athlete", name: "アスリート", image: getAvatarImage("athlete", gender, hairColor), color: "#8b5cf6" };
  if (level <= 50) return { key: "elite", name: "エリート", image: getAvatarImage("elite", gender, hairColor), color: "#f59e0b" };
  return { key: "legend", name: "レジェンド", image: getAvatarImage("legend", gender, hairColor), color: "#d4af37" };
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

export const getExpProgress = (
  totalExp: number,
  gender: Gender = "female",
  hairColor: HairColor = "orange"
): ExpProgress => {
  const level = calculateLevel(totalExp);
  let cumulative = 0;
  for (let l = 1; l < level; l++) cumulative += getRequiredExp(l);
  const required = getRequiredExp(level);
  const currentLevelExp = totalExp - cumulative;
  const percent = Math.min(100, Math.round((currentLevelExp / required) * 100));
  return {
    level,
    rank: getRankInfo(level, gender, hairColor),
    totalExp,
    currentLevelExp,
    requiredExp: required,
    percent,
    remainingExp: Math.max(0, required - currentLevelExp),
  };
};