import { Menu } from "lucide-react";
import TileMapCanvas from "./TileMapCanvas";
import { testVillage } from "./maps/testVillage";

interface Props {
  onBack: () => void;
}

const LuminasChronicle = ({ onBack }: Props) => {
  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-start pt-3 pb-4 overflow-hidden">
      <button
        onClick={onBack}
        className="absolute top-2 right-2 z-10 w-10 h-10 rounded-full bg-black/70 text-white flex items-center justify-center active:bg-black/90"
        aria-label="メニュー"
      >
        <Menu className="w-5 h-5" />
      </button>
      <div className="text-center mb-2">
        <p className="text-[9px] tracking-[0.3em] text-white/50">LUMINAS CHRONICLE</p>
        <p className="text-[11px] font-bold text-white/80 break-all">{testVillage.name}</p>
      </div>
      <div className="px-1">
        <TileMapCanvas map={testVillage} viewTilesX={11} viewTilesY={11} />
      </div>
    </div>
  );
};

export default LuminasChronicle;