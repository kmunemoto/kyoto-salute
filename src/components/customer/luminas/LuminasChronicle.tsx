import { ArrowLeft } from "lucide-react";
import TileMapCanvas from "./TileMapCanvas";
import { testVillage } from "./maps/testVillage";

interface Props {
  onBack: () => void;
}

const LuminasChronicle = ({ onBack }: Props) => {
  return (
    <div className="min-h-screen pb-20 bg-background">
      <div className="px-4 py-4 flex items-center gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm font-bold opacity-80"
          aria-label="戻る"
        >
          <ArrowLeft className="w-4 h-4" /> 戻る
        </button>
        <div className="flex-1 text-center">
          <p className="text-[10px] tracking-[0.2em] opacity-60">LUMINAS CHRONICLE</p>
          <p className="text-sm font-bold break-all">ルミナス・クロニクル 〜光の年代記〜</p>
        </div>
        <div className="w-12" />
      </div>
      <p className="text-center text-[11px] opacity-60 mb-3 break-all">
        {testVillage.name}
      </p>
      <div className="px-2">
        <TileMapCanvas map={testVillage} viewTilesX={11} viewTilesY={13} />
      </div>
      <p className="text-center text-[10px] opacity-50 mt-3 px-4 break-all">
        十字キーで移動できます (PCは矢印キー / WASD)
      </p>
    </div>
  );
};

export default LuminasChronicle;