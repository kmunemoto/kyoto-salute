import { Map, Zap, ChevronRight } from "lucide-react";
import { useStamina } from "@/hooks/useDungeon";

interface Props {
  onOpen: () => void;
}

const DungeonCard = ({ onOpen }: Props) => {
  const { stamina } = useStamina();
  return (
    <button
      onClick={onOpen}
      className="w-full rounded-2xl p-5 text-left text-white shadow-lg transition active:scale-[0.99] relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #4a1a4e 100%)" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
            <Map className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-wider opacity-80">ダンジョン探索</p>
            <p className="font-bold text-base leading-tight">未知の地を冒険しよう</p>
            <div className="flex items-center gap-1 mt-1 text-[11px] opacity-90">
              <Zap className="w-3 h-3 text-amber-300" />
              <span className="font-bold">
                {stamina ? `${stamina.current_stamina} / ${stamina.max_stamina}` : "..."}
              </span>
              <span className="opacity-70">スタミナ</span>
            </div>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 opacity-70 shrink-0" />
      </div>
    </button>
  );
};

export default DungeonCard;