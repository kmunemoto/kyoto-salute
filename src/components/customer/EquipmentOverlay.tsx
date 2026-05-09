import type { EquippedGear } from "@/hooks/useEquippedGear";

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

const EquipmentOverlay = ({ gear, compact = false, zBase = 20 }: Props) => {
  return (
    <>
      {gear.shield && !compact && (
        <img
          src={gear.shield.image_path}
          alt=""
          aria-hidden
          className="absolute pointer-events-none object-contain"
          style={{
            bottom: "8%",
            left: "-4%",
            height: "42%",
            width: "auto",
            zIndex: zBase,
            filter: RARITY_GLOW[gear.shield.rarity],
          }}
        />
      )}
      {gear.weapon && (
        <img
          src={gear.weapon.image_path}
          alt=""
          aria-hidden
          className="absolute pointer-events-none object-contain"
          style={{
            bottom: "2%",
            right: "-6%",
            height: compact ? "60%" : "55%",
            width: "auto",
            zIndex: zBase + 1,
            transform: "rotate(15deg)",
            filter: RARITY_GLOW[gear.weapon.rarity],
          }}
        />
      )}
      {gear.amulet && !compact && (
        <img
          src={gear.amulet.image_path}
          alt=""
          aria-hidden
          className="absolute pointer-events-none object-contain"
          style={{
            top: "32%",
            left: "50%",
            transform: "translateX(-50%)",
            height: "22%",
            width: "auto",
            zIndex: zBase + 2,
            filter: RARITY_GLOW[gear.amulet.rarity],
          }}
        />
      )}
    </>
  );
};

export default EquipmentOverlay;
