import { useState } from "react";
import type { EquippedGear, EquippedGearItem } from "@/hooks/useEquippedGear";
import { getEquipIcon, RARITY_COLOR } from "@/lib/questBosses";
import { getEquipmentImage } from "@/lib/avatarSystem";

const RARITY_GLOW: Record<string, string> = {
  common: "",
  rare: "drop-shadow(0 0 4px rgba(59,130,246,0.7))",
  epic: "drop-shadow(0 0 6px rgba(139,92,246,0.8))",
  legendary: "drop-shadow(0 0 8px rgba(245,158,11,0.9))",
};

interface Props {
  gear: EquippedGear;
  /** When true, only render the weapon (used in compact spots like ranking rows) */
  compact?: boolean;
  /** z-index base inside the avatar container. Default 20 sits above the avatar image. */
  zBase?: number;
}

const EquipmentImage = ({
  it,
  style,
  filter,
}: {
  it: EquippedGearItem;
  style: React.CSSProperties;
  filter: string;
}) => {
  const [failed, setFailed] = useState(false);
  const src = getEquipmentImage(it.item_key, it.item_type);
  if (!failed) {
    return (
      <img
        src={src}
        alt=""
        aria-hidden
        onError={() => setFailed(true)}
        className="absolute pointer-events-none object-contain pixel-avatar"
        style={{ ...style, filter, background: "transparent" }}
      />
    );
  }
  // Icon-based fallback when the equipment image is missing.
  const Icon = getEquipIcon(it.icon_name || undefined);
  const color = RARITY_COLOR[it.rarity] || "#fff";
  return (
    <div
      aria-hidden
      className="absolute pointer-events-none flex items-center justify-center"
      style={{ ...style, filter, background: "transparent" }}
    >
      <Icon className="w-full h-full" style={{ color, strokeWidth: 2.5 }} />
    </div>
  );
};

const renderItem = (
  it: EquippedGearItem,
  style: React.CSSProperties,
  filter: string,
) => <EquipmentImage key={it.item_key} it={it} style={style} filter={filter} />;

const EquipmentOverlay = ({ gear, compact = false, zBase = 20 }: Props) => {
  // In compact spots (ranking rows, small avatars) skip overlay entirely.
  if (compact) return null;
  return (
    <>
      {gear.shield && renderItem(
        gear.shield,
        { bottom: "5%", left: "-5%", height: "25%", width: "25%", zIndex: zBase, opacity: 0.95 },
        `drop-shadow(1px 1px 2px rgba(0,0,0,0.5)) ${RARITY_GLOW[gear.shield.rarity]}`,
      )}
      {gear.amulet && renderItem(
        gear.amulet,
        { top: "-8%", left: "50%", transform: "translateX(-50%)", height: "22%", width: "22%", zIndex: zBase + 2, opacity: 0.95 },
        `drop-shadow(1px 1px 2px rgba(0,0,0,0.5)) ${RARITY_GLOW[gear.amulet.rarity]}`,
      )}
      {gear.weapon && renderItem(
        gear.weapon,
        { bottom: "2%", right: "-5%", height: "30%", width: "30%", zIndex: zBase + 1, transform: "rotate(15deg)", opacity: 0.95 },
        `drop-shadow(1px 1px 2px rgba(0,0,0,0.5)) ${RARITY_GLOW[gear.weapon.rarity]}`,
      )}
    </>
  );
};

export default EquipmentOverlay;
