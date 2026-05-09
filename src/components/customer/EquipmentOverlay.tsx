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
  // In compact spots (ranking rows, small avatars) skip overlay entirely.
  if (compact) return null;
  return (
    <>
      {gear.shield && (
        <img
          src={gear.shield.image_path}
          alt=""
          aria-hidden
          className="absolute pointer-events-none object-contain"
          style={{
            bottom: "5%",
            left: "-5%",
            height: "25%",
            width: "auto",
            zIndex: zBase,
            opacity: 0.9,
            filter: `drop-shadow(1px 1px 2px rgba(0,0,0,0.5)) ${RARITY_GLOW[gear.shield.rarity]}`,
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
            right: "-5%",
            height: "30%",
            width: "auto",
            zIndex: zBase + 1,
            transform: "rotate(15deg)",
            opacity: 0.9,
            filter: `drop-shadow(1px 1px 2px rgba(0,0,0,0.5)) ${RARITY_GLOW[gear.weapon.rarity]}`,
          }}
        />
      )}
    </>
  );
};

export default EquipmentOverlay;
