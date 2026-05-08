import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEquipmentInventory } from "@/hooks/useQuestBattle";
import { getEquipIcon, RARITY_COLOR, RARITY_LABEL } from "@/lib/questBosses";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
}

const TYPES: Array<{ key: "weapon" | "shield" | "amulet"; label: string }> = [
  { key: "weapon", label: "武器" },
  { key: "shield", label: "盾" },
  { key: "amulet", label: "護符" },
];

const EquipmentDialog = ({ open, onClose }: Props) => {
  const { user } = useAuth();
  const { items, loading, refetch } = useEquipmentInventory();
  const [busy, setBusy] = useState<string | null>(null);

  if (!open) return null;

  const equip = async (item_id: string) => {
    if (!user) return;
    setBusy(item_id);
    const { error } = await supabase.rpc("equip_item", { p_user_id: user.id, p_item_id: item_id });
    setBusy(null);
    if (error) {
      toast.error("装備変更に失敗", { description: error.message });
      return;
    }
    await refetch();
    window.dispatchEvent(new Event("equipment-updated"));
    toast.success("装備を変更しました");
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl bg-[#1a1a2e] text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-[#1a1a2e] flex items-center justify-between px-4 py-3 border-b border-white/10 z-10">
          <h2 className="text-base font-bold">装備</h2>
          <button onClick={onClose} className="p-1 hover:opacity-70"><X className="w-5 h-5" /></button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : (
          <div className="p-4 space-y-5">
            {TYPES.map((t) => {
              const list = items.filter((i: any) => i.item_type === t.key);
              const equipped = list.find((i: any) => i.equipped);
              return (
                <div key={t.key}>
                  <h3 className="text-xs font-bold tracking-wider opacity-70 mb-2">{t.label}</h3>
                  {list.length === 0 ? (
                    <p className="text-xs opacity-60 px-2 py-3 text-center bg-white/5 rounded-lg">未所持</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {list.map((it: any) => {
                        const Icon = getEquipIcon(it.icon_name);
                        const color = RARITY_COLOR[it.rarity];
                        const isEq = it.equipped;
                        return (
                          <button
                            key={it.owned_id}
                            onClick={() => !isEq && equip(it.id)}
                            disabled={isEq || busy === it.id}
                            className={`relative rounded-xl p-3 text-left transition ${isEq ? "ring-2" : "hover:bg-white/10"} bg-white/5`}
                            style={{ boxShadow: `inset 0 0 0 1px ${color}40`, ...(isEq ? { ["--tw-ring-color" as any]: color } : {}) }}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Icon className="w-4 h-4" style={{ color }} />
                              <span className="text-[9px] font-bold uppercase" style={{ color }}>{RARITY_LABEL[it.rarity]}</span>
                            </div>
                            <p className="text-xs font-bold leading-tight break-all">{it.item_name}</p>
                            <div className="text-[10px] opacity-80 mt-1 space-y-0.5">
                              {it.atk_bonus > 0 && <p>ATK +{it.atk_bonus}</p>}
                              {it.def_bonus > 0 && <p>DEF +{it.def_bonus}</p>}
                              {it.hp_bonus > 0 && <p>HP +{it.hp_bonus}</p>}
                            </div>
                            {isEq && <span className="absolute top-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-white text-[#1a1a2e]">装備中</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="sticky bottom-0 bg-[#1a1a2e] p-3 border-t border-white/10">
          <Button onClick={onClose} className="w-full bg-white text-[#1a1a2e] hover:bg-white/90 font-bold">閉じる</Button>
        </div>
      </div>
    </div>
  );
};

export default EquipmentDialog;