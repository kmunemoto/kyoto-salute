import { useEffect, useRef, useState } from "react";
import { Bug, Worm, Snowflake, Flame, Skull, Bot, Wand2, CloudLightning, Heart, Swords, Shield as ShieldIcon, X, Loader2, Sparkles, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCombatStats } from "@/hooks/useQuestBattle";
import { useAuth } from "@/contexts/AuthContext";
import { fetchDungeonMonsters, completeDungeonRun, type DungeonMonster, type DungeonStage } from "@/hooks/useDungeon";
import { supabase } from "@/integrations/supabase/client";
import DungeonResult, { type DungeonResultData } from "./DungeonResult";
import { toast } from "sonner";

const ICON_MAP: Record<string, LucideIcon> = {
  Bug, Worm, Snowflake, Flame, Skull, Bot, Wand2, CloudLightning,
};
const getMonsterIcon = (k: string): LucideIcon => ICON_MAP[k] || Bug;

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

interface Props {
  stage: DungeonStage;
  runId: string;
  onClose: () => void;
  onFinish: () => void;
}

const DungeonBattle = ({ stage, runId, onClose, onFinish }: Props) => {
  const { user } = useAuth();
  const { stats } = useCombatStats();
  const [monsters, setMonsters] = useState<DungeonMonster[]>([]);
  const [floorIdx, setFloorIdx] = useState(0);
  const [monsterHp, setMonsterHp] = useState(0);
  const [playerHp, setPlayerHp] = useState(0);
  const [maxPlayerHp, setMaxPlayerHp] = useState(0);
  const [gaugePos, setGaugePos] = useState(0);
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);
  const [hurtFlash, setHurtFlash] = useState(false);
  const [critFlash, setCritFlash] = useState(false);
  const [floatTexts, setFloatTexts] = useState<{ id: number; text: string; color: string; target: "player" | "monster" }[]>([]);
  const [accExp, setAccExp] = useState(0);
  const [accCoins, setAccCoins] = useState(0);
  const [accMaterials, setAccMaterials] = useState<Record<string, number>>({});
  const [materialNames, setMaterialNames] = useState<Record<string, string>>({});
  const [result, setResult] = useState<DungeonResultData | null>(null);
  const gaugeDir = useRef(1);
  const finishedRef = useRef(false);

  // Load monsters and material names
  useEffect(() => {
    fetchDungeonMonsters(stage.stage_key).then((m) => {
      setMonsters(m);
      if (m[0]) setMonsterHp(m[0].hp);
    });
    (supabase as any).from("craft_materials").select("material_key,material_name").then(({ data }: any) => {
      const map: Record<string, string> = {};
      (data || []).forEach((r: any) => { map[r.material_key] = r.material_name; });
      setMaterialNames(map);
    });
  }, [stage.stage_key]);

  // Compute player stats
  useEffect(() => {
    if (!stats) return;
    const hp = stats.total_hp;
    setMaxPlayerHp(hp);
    setPlayerHp(hp);
  }, [stats]);

  // Timing gauge animation
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      const dt = t - last; last = t;
      setGaugePos((p) => {
        let next = p + (gaugeDir.current * dt) / 1000; // 1 cycle ~ 2s
        if (next > 1) { next = 1; gaugeDir.current = -1; }
        if (next < 0) { next = 0; gaugeDir.current = 1; }
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const monster = monsters[floorIdx];
  const playerAtk = stats?.total_atk ?? 1;
  const playerDef = stats?.total_def ?? 0;

  const addFloat = (text: string, color: string, target: "player" | "monster") => {
    const id = Date.now() + Math.random();
    setFloatTexts((f) => [...f, { id, text, color, target }]);
    setTimeout(() => setFloatTexts((f) => f.filter((x) => x.id !== id)), 900);
  };

  const finish = async (res: "victory" | "defeat" | "retreat", finalFloors: number) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const matsArr = Object.entries(accMaterials).map(([key, qty]) => ({ key, qty }));
    try {
      await completeDungeonRun(runId, finalFloors, accExp, accCoins, res, matsArr);
      window.dispatchEvent(new Event("avatar-updated"));
      window.dispatchEvent(new Event("stamina-updated"));
    } catch (e: any) {
      toast.error("結果の保存に失敗", { description: e.message });
    }
    setResult({
      result: res,
      floorsCleared: finalFloors,
      totalFloors: monsters.length,
      totalExp: accExp,
      totalCoins: accCoins,
      materials: matsArr.map((m) => ({ ...m, name: materialNames[m.key] || m.key })),
    });
  };

  const handleAttack = () => {
    if (busy || !monster) return;
    setBusy(true);

    // Critical zone: center 30% (0.35 - 0.65)
    const isCrit = gaugePos >= 0.35 && gaugePos <= 0.65;
    const baseDmg = Math.max(1, playerAtk - monster.def + rand(-3, 3));
    const dmg = isCrit ? Math.floor(baseDmg * 1.5) : baseDmg;

    setShake(true);
    setTimeout(() => setShake(false), 300);
    if (isCrit) {
      setCritFlash(true);
      setTimeout(() => setCritFlash(false), 250);
    }
    addFloat(isCrit ? `CRITICAL ${dmg}` : `${dmg}`, isCrit ? "#fbbf24" : "#ffffff", "monster");
    const newMonsterHp = Math.max(0, monsterHp - dmg);
    setMonsterHp(newMonsterHp);

    if (newMonsterHp <= 0) {
      // Victory on this floor
      const drops: { key: string; qty: number }[] = [];
      if (monster.drop_material_key && Math.random() < Number(monster.drop_material_rate)) {
        drops.push({ key: monster.drop_material_key, qty: 1 });
      }
      const newExp = accExp + monster.exp_reward;
      const newCoins = accCoins + monster.coin_reward;
      const newMats = { ...accMaterials };
      drops.forEach((d) => { newMats[d.key] = (newMats[d.key] || 0) + d.qty; });
      setAccExp(newExp);
      setAccCoins(newCoins);
      setAccMaterials(newMats);
      addFloat(`+${monster.exp_reward} EXP`, "#0ABAB5", "monster");

      setTimeout(() => {
        const next = floorIdx + 1;
        if (next >= monsters.length) {
          // All floors cleared
          finishWith(newExp, newCoins, newMats, "victory", next);
        } else {
          setFloorIdx(next);
          setMonsterHp(monsters[next].hp);
          setBusy(false);
        }
      }, 800);
      return;
    }

    // Monster counter-attack
    setTimeout(() => {
      const counterDmg = Math.max(1, monster.atk - playerDef + rand(-2, 2));
      setHurtFlash(true);
      setTimeout(() => setHurtFlash(false), 250);
      addFloat(`${counterDmg}`, "#ef4444", "player");
      const newPlayerHp = Math.max(0, playerHp - counterDmg);
      setPlayerHp(newPlayerHp);

      if (newPlayerHp <= 0) {
        setTimeout(() => finish("defeat", floorIdx), 600);
      } else {
        setBusy(false);
      }
    }, 500);
  };

  const finishWith = async (
    exp: number, coins: number, mats: Record<string, number>,
    res: "victory" | "defeat" | "retreat", floors: number,
  ) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const matsArr = Object.entries(mats).map(([key, qty]) => ({ key, qty }));
    try {
      await completeDungeonRun(runId, floors, exp, coins, res, matsArr);
      window.dispatchEvent(new Event("avatar-updated"));
      window.dispatchEvent(new Event("stamina-updated"));
    } catch (e: any) {
      toast.error("結果の保存に失敗", { description: e.message });
    }
    setResult({
      result: res,
      floorsCleared: floors,
      totalFloors: monsters.length,
      totalExp: exp,
      totalCoins: coins,
      materials: matsArr.map((m) => ({ ...m, name: materialNames[m.key] || m.key })),
    });
  };

  const handleRetreat = () => {
    if (busy || finishedRef.current) return;
    finish("retreat", floorIdx);
  };

  if (!monster || !stats) {
    return (
      <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center text-white">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (result) {
    return (
      <DungeonResult
        data={result}
        onRetry={() => { onFinish(); }}
        onBack={() => { onClose(); }}
      />
    );
  }

  const MonsterIcon = getMonsterIcon(monster.icon_name);
  const monsterHpPct = (monsterHp / monster.hp) * 100;
  const playerHpPct = (playerHp / maxPlayerHp) * 100;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col text-white"
      style={{ background: stage.background_css || "linear-gradient(135deg,#1a1a2e,#16213e)" }}
    >
      {/* Hurt overlay */}
      {hurtFlash && (
        <div className="absolute inset-0 pointer-events-none z-10" style={{ boxShadow: "inset 0 0 100px 20px rgba(239,68,68,0.7)" }} />
      )}
      {/* Crit overlay */}
      {critFlash && (
        <div className="absolute inset-0 pointer-events-none z-10 bg-white/40" />
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/30">
        <div>
          <p className="text-[10px] font-bold tracking-wider opacity-70">{stage.stage_name}</p>
          <p className="text-sm font-bold">フロア {floorIdx + 1} / {monsters.length}</p>
        </div>
        <button
          onClick={handleRetreat}
          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1"
        >
          <X className="w-3.5 h-3.5" /> 逃げる
        </button>
      </div>

      {/* Monster */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 relative">
        <div className={`relative ${shake ? "animate-[shake_0.3s]" : ""}`} style={{ transition: "transform 0.1s" }}>
          <div
            className="w-40 h-40 rounded-3xl flex items-center justify-center bg-white/10 border-2 border-white/20 mb-3"
            style={{ filter: monster.is_boss ? "drop-shadow(0 0 20px rgba(239,68,68,0.6))" : undefined }}
          >
            <MonsterIcon className="w-24 h-24" style={{ color: monster.is_boss ? "#fbbf24" : "#ffffff" }} />
          </div>
          {floatTexts.filter((f) => f.target === "monster").map((f) => (
            <span
              key={f.id}
              className="absolute left-1/2 top-0 -translate-x-1/2 text-xl font-extrabold pointer-events-none"
              style={{ color: f.color, animation: "float-up 0.9s ease-out forwards", textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}
            >
              {f.text}
            </span>
          ))}
        </div>
        <p className="text-lg font-bold">{monster.monster_name}{monster.is_boss && " (BOSS)"}</p>
        <div className="w-full max-w-xs mt-2">
          <div className="flex justify-between text-[11px] mb-1 opacity-80">
            <span>HP</span><span>{monsterHp} / {monster.hp}</span>
          </div>
          <div className="h-2.5 rounded-full bg-black/40 overflow-hidden">
            <div className="h-full transition-all duration-300" style={{ width: `${monsterHpPct}%`, background: "#ef4444" }} />
          </div>
          <div className="flex justify-center gap-3 text-[10px] opacity-80 mt-2">
            <span>ATK {monster.atk}</span>
            <span>DEF {monster.def}</span>
          </div>
        </div>
      </div>

      {/* Timing gauge */}
      <div className="px-4 pb-2">
        <p className="text-[10px] font-bold tracking-wider opacity-70 mb-1 text-center">タイミングゲージ</p>
        <div className="relative h-6 rounded-full bg-black/40 overflow-hidden border border-white/20">
          {/* Crit zone */}
          <div className="absolute top-0 bottom-0 bg-amber-400/30" style={{ left: "35%", width: "30%" }} />
          {/* Indicator */}
          <div
            className="absolute top-0 bottom-0 w-1.5 bg-white shadow-lg"
            style={{ left: `calc(${gaugePos * 100}% - 3px)` }}
          />
        </div>
      </div>

      {/* Attack button */}
      <div className="px-4 pb-3">
        <Button
          onClick={handleAttack}
          disabled={busy}
          className="w-full h-14 text-base font-extrabold bg-gradient-to-r from-red-500 to-orange-500 hover:opacity-90 text-white"
        >
          <Swords className="w-5 h-5 mr-2" /> 攻撃！
        </Button>
      </div>

      {/* Player stats */}
      <div className="px-4 pb-4 bg-black/30 pt-3 relative">
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-rose-400" />HP</span>
          <span>{playerHp} / {maxPlayerHp}</span>
        </div>
        <div className="h-2 rounded-full bg-black/40 overflow-hidden">
          <div className="h-full transition-all duration-300" style={{ width: `${playerHpPct}%`, background: "#0ABAB5" }} />
        </div>
        <div className="flex justify-between text-[10px] opacity-80 mt-2">
          <span className="flex items-center gap-1"><Swords className="w-3 h-3" /> ATK {playerAtk}</span>
          <span className="flex items-center gap-1"><ShieldIcon className="w-3 h-3" /> DEF {playerDef}</span>
          <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> {accExp} EXP</span>
        </div>
        {floatTexts.filter((f) => f.target === "player").map((f) => (
          <span
            key={f.id}
            className="absolute left-1/2 -top-2 -translate-x-1/2 text-xl font-extrabold pointer-events-none"
            style={{ color: f.color, animation: "float-up 0.9s ease-out forwards", textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}
          >
            {f.text}
          </span>
        ))}
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        @keyframes float-up {
          0% { opacity: 0; transform: translate(-50%, 0) scale(0.8); }
          20% { opacity: 1; transform: translate(-50%, -10px) scale(1.1); }
          100% { opacity: 0; transform: translate(-50%, -50px) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default DungeonBattle;