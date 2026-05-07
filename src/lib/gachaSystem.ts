export type GachaRarity = "common" | "rare" | "epic" | "legendary";

export interface GachaRewardDef {
  type: "coins" | "exp";
  amount: number;
  rarity: GachaRarity;
  name: string;
  icon: string;
}

export const GACHA_RARITY_LABEL: Record<GachaRarity, string> = {
  common: "ノーマル",
  rare: "レア！",
  epic: "エピック！！",
  legendary: "レジェンダリー！！！",
};

export const GACHA_RARITY_COLOR: Record<GachaRarity, string> = {
  common: "#999999",
  rare: "#3B82F6",
  epic: "#8B5CF6",
  legendary: "#D4AF37",
};

export const GACHA_RARITY_FLASH: Record<GachaRarity, string> = {
  common: "rgba(255,255,255,0.85)",
  rare: "rgba(59,130,246,0.4)",
  epic: "rgba(139,92,246,0.5)",
  legendary: "rgba(212,175,55,0.6)",
};

export const describeGachaReward = (
  rewardType: string,
  amount: number,
  rarity: GachaRarity,
): { name: string; icon: string } => {
  if (rewardType === "coins") {
    const icon = rarity === "legendary" ? "👑" : rarity === "epic" ? "💎" : rarity === "rare" ? "💰" : "🪙";
    return { name: `${amount}コイン`, icon };
  }
  const icon = rarity === "legendary" ? "🔥" : rarity === "epic" ? "🌟" : rarity === "rare" ? "⭐" : "✨";
  return { name: `${amount} EXP`, icon };
};