import { Sword, ChevronRight } from "lucide-react";

interface Props {
  onOpen: () => void;
}

const LuminasChronicleCard = ({ onOpen }: Props) => {
  return (
    <button
      onClick={onOpen}
      className="w-full rounded-2xl p-5 text-left text-white shadow-lg transition active:scale-[0.99] relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0a0a3a 0%, #1a1a5e 100%)" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Sword className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-wider opacity-80">LUMINAS CHRONICLE</p>
            <p className="font-bold text-base leading-tight break-all">ルミナス・クロニクル</p>
            <p className="text-[11px] opacity-80 mt-1 break-all">〜光の年代記〜</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 opacity-70 shrink-0" />
      </div>
    </button>
  );
};

export default LuminasChronicleCard;