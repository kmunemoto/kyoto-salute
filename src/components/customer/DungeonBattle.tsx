import { useEffect, useRef, useState, useCallback } from "react";
import {
  Bug, Worm, Snowflake, Flame, Skull, Bot, Wand2, CloudLightning, Heart, HeartPulse, HeartHandshake,
  Swords, Shield as ShieldIcon, X, Loader2, Sparkles, Sword, Package, Bomb, Zap, Target,
  Leaf, Droplet, TreeDeciduous, Pill, Cat, ChevronRight, type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCombatStats } from "@/hooks/useQuestBattle";
import { useEquippedGear } from "@/hooks/useEquippedGear";
import { useAvatar } from "@/hooks/useAvatar";
import { getAvatarImage, handleAvatarImgError, getRankInfo } from "@/lib/avatarSystem";
import EquipmentOverlay from "./EquipmentOverlay";
import {
  fetchPlayerSkills, fetchBattleItems, fetchUserItems, fetchActiveCompanion,
  fetchStageStory, consumeItem, usePlayerMp, persistMp,
  type PlayerSkill, type BattleItem, type UserCompanion, type StoryLine, type MonsterSkill,
} from "@/hooks/useDungeonBattle";
import {
  fetchDungeonMonsters, completeDungeonRun,
  type DungeonMonster, type DungeonStage,
} from "@/hooks/useDungeon";
import { supabase } from "@/integrations/supabase/client";
import DungeonResult, { type DungeonResultData } from "./DungeonResult";
import { toast } from "sonner";

const MONSTER_ICON: Record<string, LucideIcon> = {
  Bug, Worm, Snowflake, Flame, Skull, Bot, Wand2, CloudLightning,
};
const SKILL_ICON: Record<string, LucideIcon> = {
  Flame, Heart, Zap, ShieldIcon, Target, CloudLightning, HeartPulse, Swords, Bomb, HeartHandshake, Sparkles,
};
const ITEM_ICON: Record<string, LucideIcon> = {
  Leaf, Droplet, TreeDeciduous, Pill, Package,
};
const COMPANION_ICON: Record<string, LucideIcon> = { Droplet, Cat, Flame, Sparkles, Bug };

const ELEMENT_COLOR: Record<string, string> = {
  water: "#60a5fa", fire: "#f97316", earth: "#a16207", wind: "#34d399", neutral: "#cbd5e1",
};

// Color-variant monsters reuse base images via CSS hue-rotate filter
const MONSTER_IMAGE_BASE: Record<string, string> = {
  slime_2: "slime",
  goblin_3: "goblin",
  skeleton_4: "skeleton",
  stone_golem_5: "stone_golem",
};
const MONSTER_FILTER: Record<string, string> = {
  slime_2: "hue-rotate(120deg) saturate(1.5)",
  goblin_3: "hue-rotate(30deg) brightness(1.2)",
  skeleton_4: "hue-rotate(-60deg) saturate(2)",
  stone_golem_5: "hue-rotate(180deg)",
};
const getMonsterImageKey = (key: string): string => MONSTER_IMAGE_BASE[key] || key;
const getMonsterFilter = (key: string): string => MONSTER_FILTER[key] || "none";

const rand = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;

type Phase =
  | "loading" | "intro" | "appear" | "command" | "skill_select" | "item_select"
  | "action" | "boss_intro" | "floor_clear" | "boss_defeat" | "victory" | "defeat" | "revive_prompt" | "target_select";

interface Buff { type: string; multiplier: number; turnsLeft: number; }

interface Props {
  stage: DungeonStage;
  runId: string;
  onClose: () => void;
  onFinish: () => void;
}

const DungeonBattle = ({ stage, runId, onClose, onFinish }: Props) => {
  const { user } = useAuth();
  const { stats } = useCombatStats();
  const { avatar } = useAvatar(false);
  const { gear } = useEquippedGear(user?.id);
  const { mp, setMp } = usePlayerMp(user?.id);

  // Master data
  const [monsters, setMonsters] = useState<DungeonMonster[]>([]);
  const [skills, setSkills] = useState<PlayerSkill[]>([]);
  const [itemMaster, setItemMaster] = useState<Record<string, BattleItem>>({});
  const [items, setItems] = useState<Record<string, number>>({});
  const [companion, setCompanion] = useState<UserCompanion | null>(null);
  const [story, setStory] = useState<Record<string, StoryLine[]>>({});
  const [materialNames, setMaterialNames] = useState<Record<string, string>>({});

  // Battle state
  const [phase, setPhase] = useState<Phase>("loading");
  const [floorIdx, setFloorIdx] = useState(0);
  const [playerHp, setPlayerHp] = useState(0);
  const [maxHp, setMaxHp] = useState(0);
  const [compHp, setCompHp] = useState(0);
  const [compMaxHp, setCompMaxHp] = useState(0);
  const [monsterHps, setMonsterHps] = useState<number[]>([]);
  const [pendingAction, setPendingAction] = useState<{ kind: "attack" } | { kind: "skill"; skill: PlayerSkill } | null>(null);
  const [buffs, setBuffs] = useState<Buff[]>([]);
  const [enemyDebuffs, setEnemyDebuffs] = useState<Buff[]>([]);
  const [defending, setDefending] = useState(false);
  const [accExp, setAccExp] = useState(0);
  const [accCoins, setAccCoins] = useState(0);
  const [accMaterials, setAccMaterials] = useState<Record<string, number>>({});
  const [result, setResult] = useState<DungeonResultData | null>(null);

  // Visuals
  const [shake, setShake] = useState(false);
  const [hurtFlash, setHurtFlash] = useState(false);
  const [critFlash, setCritFlash] = useState(false);
  const [bossFlash, setBossFlash] = useState(false);
  const [floats, setFloats] = useState<{ id: number; text: string; color: string; target: "player" | "monster" | "comp" }[]>([]);
  const [spellFx, setSpellFx] = useState<{ id: number; kind: string } | null>(null);

  // Image load failures (fallback to gradient/icon)
  const [bgImgError, setBgImgError] = useState(false);
  const [monsterImgError, setMonsterImgError] = useState<Record<string, boolean>>({});

  // Message system
  const [msgQueue, setMsgQueue] = useState<string[]>([]);
  const [currentMsg, setCurrentMsg] = useState("");
  const [shown, setShown] = useState("");
  const [waitingTap, setWaitingTap] = useState(false);
  const onMsgDoneRef = useRef<(() => void) | null>(null);

  const finishedRef = useRef(false);
  const compNameRef = useRef("コンパニオン");

  const monster = monsters[floorIdx];
  const monsterCount = monster?.monster_count ?? 1;
  const aliveIndices = monsterHps.map((h, i) => (h > 0 ? i : -1)).filter((i) => i >= 0);
  const monsterLabel = (i: number) => monsterCount > 1 ? `${monster!.monster_name} ${["A","B","C","D"][i] || (i+1)}` : monster!.monster_name;
  const BG_BASE = "https://clsvdhovzqrkojvkvekw.supabase.co/storage/v1/object/public/avatars/dungeon";
  const bgImageUrl = `${BG_BASE}/bg_${stage.stage_key}.png`;
  const monsterImageUrl = monster ? `${BG_BASE}/monsters/${monster.monster_key}.png` : "";
  const playerName = avatar?.equipped_title ? "あなた" : "あなた";

  // ---- Initial load ----
  useEffect(() => {
    (async () => {
      if (!user) return;
      const lvl = avatar?.level ?? 1;
      const [m, sk, im, it, cp, st] = await Promise.all([
        fetchDungeonMonsters(stage.stage_key),
        fetchPlayerSkills(lvl || 1),
        fetchBattleItems(),
        fetchUserItems(user.id),
        fetchActiveCompanion(user.id),
        fetchStageStory(stage.stage_key),
      ]);
      setMonsters(m);
      setSkills(sk);
      setItemMaster(im);
      setItems(it);
      setCompanion(cp);
      setStory(st);
      if (cp) {
        compNameRef.current = cp.companion_name;
        const cMax = cp.base_hp + cp.level * 5;
        setCompHp(cMax); setCompMaxHp(cMax);
      }
      const { data: mats } = await (supabase as any).from("craft_materials").select("material_key,material_name");
      const mm: Record<string, string> = {};
      (mats || []).forEach((r: any) => { mm[r.material_key] = r.material_name; });
      setMaterialNames(mm);
    })();
  }, [stage.stage_key, user, avatar?.level]);

  // Initialize player HP once stats arrive
  useEffect(() => {
    if (!stats || maxHp > 0) return;
    setMaxHp(stats.total_hp);
    setPlayerHp(stats.total_hp);
  }, [stats, maxHp]);

  // Start intro once everything loaded
  useEffect(() => {
    if (phase !== "loading") return;
    if (!stats || monsters.length === 0 || maxHp === 0) return;
    // Initialize first monster HP
    setMonsterHp(monsters[0].hp);
    // Push intro story + appear
    const intro = (story.intro || []).map((s) => formatLine(s));
    pushMessages([...intro, `${monsters[0].monster_name}が あらわれた！`], () => setPhase("command"));
    setPhase("intro");
  }, [phase, stats, monsters, maxHp, story]);

  // ---- Message typewriter ----
  useEffect(() => {
    if (msgQueue.length === 0 || currentMsg) return;
    const next = msgQueue[0];
    setMsgQueue((q) => q.slice(1));
    setCurrentMsg(next);
    setShown("");
    setWaitingTap(false);
  }, [msgQueue, currentMsg]);

  useEffect(() => {
    if (!currentMsg) return;
    if (shown.length >= currentMsg.length) {
      setWaitingTap(true);
      return;
    }
    const t = setTimeout(() => setShown(currentMsg.slice(0, shown.length + 1)), 28);
    return () => clearTimeout(t);
  }, [currentMsg, shown]);

  const advanceMessage = () => {
    if (!currentMsg) return;
    if (shown.length < currentMsg.length) { setShown(currentMsg); return; }
    // Move to next message
    setCurrentMsg("");
    setShown("");
    setWaitingTap(false);
    if (msgQueue.length === 0) {
      const cb = onMsgDoneRef.current;
      onMsgDoneRef.current = null;
      if (cb) cb();
    }
  };

  const pushMessages = (msgs: string[], onDone?: () => void) => {
    setMsgQueue((q) => [...q, ...msgs]);
    if (onDone) onMsgDoneRef.current = onDone;
  };

  function formatLine(s: StoryLine): string {
    return s.speaker ? `${s.speaker}「${s.message}」` : s.message;
  }

  // ---- Stat helpers ----
  const getEffectiveAtk = () => {
    let a = stats?.total_atk ?? 1;
    buffs.filter((b) => b.type === "player_atk").forEach((b) => (a *= b.multiplier));
    return Math.floor(a);
  };
  const getEffectiveDef = () => {
    let d = stats?.total_def ?? 0;
    buffs.filter((b) => b.type === "player_def").forEach((b) => (d *= b.multiplier));
    return Math.floor(d);
  };
  const getEnemyDef = (base: number) => {
    let d = base;
    enemyDebuffs.filter((b) => b.type === "enemy_def").forEach((b) => (d *= b.multiplier));
    return Math.floor(d);
  };

  const addFloat = (text: string, color: string, target: "player" | "monster" | "comp") => {
    const id = Date.now() + Math.random();
    setFloats((f) => [...f, { id, text, color, target }]);
    setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 900);
  };

  const triggerSpellFx = (kind: string) => {
    const id = Date.now();
    setSpellFx({ id, kind });
    setTimeout(() => setSpellFx((s) => (s?.id === id ? null : s)), 700);
  };

  // ---- Combat actions ----
  const handleAttack = () => {
    if (!monster) return;
    setPhase("action");
    const eAtk = getEffectiveAtk();
    const eDef = getEnemyDef(monster.def);
    const isCrit = Math.random() < 0.05;
    const base = Math.max(1, eAtk - eDef + rand(-3, 3));
    const dmg = isCrit ? Math.floor(base * 1.5) : base;

    pushMessages([`あなたの こうげき！`], () => {
      setShake(true); setTimeout(() => setShake(false), 300);
      if (isCrit) { setCritFlash(true); setTimeout(() => setCritFlash(false), 250); }
      addFloat(isCrit ? `CRITICAL ${dmg}` : `${dmg}`, isCrit ? "#fbbf24" : "#ffffff", "monster");
      const nh = Math.max(0, monsterHp - dmg);
      setMonsterHp(nh);
      const msgs = [
        ...(isCrit ? ["会心の一撃！"] : []),
        `${monster.monster_name}に ${dmg}の ダメージ！`,
      ];
      pushMessages(msgs, () => afterPlayerAction(nh));
    });
  };

  const handleSkill = (sk: PlayerSkill) => {
    if (!monster) return;
    if (mp.current < sk.mp_cost) return;
    setPhase("action");
    setMp({ current: mp.current - sk.mp_cost, max: mp.max });

    pushMessages([`あなたは ${sk.skill_name}を 唱えた！`], async () => {
      triggerSpellFx(sk.skill_key);
      if (sk.skill_type === "attack") {
        const eAtk = getEffectiveAtk();
        const eDef = getEnemyDef(monster.def);
        const dmg = Math.max(1, Math.floor((eAtk - eDef) * sk.power) + rand(-2, 2));
        setShake(true); setTimeout(() => setShake(false), 300);
        addFloat(`${dmg}`, "#ffffff", "monster");
        const nh = Math.max(0, monsterHp - dmg);
        setMonsterHp(nh);
        pushMessages([`${monster.monster_name}に ${dmg}の ダメージ！`], () => afterPlayerAction(nh));
      } else if (sk.skill_type === "heal") {
        const heal = sk.heal_amount === 9999 ? maxHp : (sk.heal_amount ?? 0);
        const nh = Math.min(maxHp, playerHp + heal);
        const actual = nh - playerHp;
        setPlayerHp(nh);
        addFloat(`+${actual}`, "#34d399", "player");
        pushMessages([`HPが ${actual} 回復した！`], () => afterPlayerAction(monsterHp));
      } else if (sk.skill_type === "buff") {
        setBuffs((b) => [...b, { type: sk.buff_type!, multiplier: Number(sk.buff_multiplier), turnsLeft: sk.buff_turns }]);
        const label = sk.buff_type === "player_atk" ? "攻撃力" : "守備力";
        pushMessages([`あなたの ${label}が 上がった！`], () => afterPlayerAction(monsterHp));
      } else if (sk.skill_type === "debuff") {
        setEnemyDebuffs((b) => [...b, { type: sk.buff_type!, multiplier: Number(sk.buff_multiplier), turnsLeft: sk.buff_turns }]);
        pushMessages([`${monster.monster_name}の 守備力が 下がった！`], () => afterPlayerAction(monsterHp));
      }
    });
  };

  const handleDefend = () => {
    setDefending(true);
    setPhase("action");
    pushMessages([`あなたは 身構えた！`], () => afterPlayerAction(monsterHp));
  };

  const handleItem = async (key: string) => {
    const it = itemMaster[key];
    if (!it || !user) return;
    if ((items[key] ?? 0) <= 0) return;
    setPhase("action");
    await consumeItem(user.id, key);
    setItems((s) => ({ ...s, [key]: Math.max(0, (s[key] ?? 0) - 1) }));
    pushMessages([`あなたは ${it.item_name}を 使った！`], () => {
      if (it.effect_type === "heal_hp") {
        const nh = Math.min(maxHp, playerHp + it.effect_amount);
        const a = nh - playerHp;
        setPlayerHp(nh);
        addFloat(`+${a}`, "#34d399", "player");
        pushMessages([`HPが ${a} 回復した！`], () => afterPlayerAction(monsterHp));
      } else if (it.effect_type === "heal_mp") {
        const nm = Math.min(mp.max, mp.current + it.effect_amount);
        const a = nm - mp.current;
        setMp({ current: nm, max: mp.max });
        pushMessages([`MPが ${a} 回復した！`], () => afterPlayerAction(monsterHp));
      } else {
        afterPlayerAction(monsterHp);
      }
    });
  };

  const handleRetreat = () => {
    if (finishedRef.current) return;
    setPhase("action");
    if (Math.random() < 0.5) {
      pushMessages([`あなたは 戦場から撤退した！`], () => finishRun("retreat", floorIdx));
    } else {
      pushMessages([`しかし 回り込まれてしまった！`], () => enemyTurn(monsterHp));
    }
  };

  // ---- After player action: companion → enemy → next turn ----
  const afterPlayerAction = (curMonHp: number) => {
    if (curMonHp <= 0) { onFloorClear(); return; }
    // Companion attacks
    if (companion && compHp > 0) {
      const cAtk = companion.base_atk + companion.level + (companion.level >= 10 && Math.random() < 0.2 ? Math.floor((companion.base_atk + companion.level) * 0.3) : 0);
      const eDef = getEnemyDef(monster!.def);
      const dmg = Math.max(1, cAtk - eDef + rand(-2, 2));
      pushMessages([`${companion.companion_name}の こうげき！`], () => {
        setShake(true); setTimeout(() => setShake(false), 250);
        addFloat(`${dmg}`, "#a3e635", "monster");
        const nh = Math.max(0, curMonHp - dmg);
        setMonsterHp(nh);
        pushMessages([`${monster!.monster_name}に ${dmg}の ダメージ！`], () => {
          if (nh <= 0) { onFloorClear(); return; }
          enemyTurn(nh);
        });
      });
    } else {
      enemyTurn(curMonHp);
    }
  };

  const enemyTurn = (curMonHp: number) => {
    if (curMonHp <= 0) { onFloorClear(); return; }
    const m = monster!;
    const skillList: MonsterSkill[] = (m as any).monster_skills && Array.isArray((m as any).monster_skills) && (m as any).monster_skills.length > 0
      ? (m as any).monster_skills
      : [{ action: "attack", weight: 100, message: "の こうげき！" }];
    const total = skillList.reduce((a, s) => a + s.weight, 0);
    let roll = Math.random() * total;
    let chosen: MonsterSkill = skillList[0];
    for (const s of skillList) { roll -= s.weight; if (roll <= 0) { chosen = s; break; } }

    pushMessages([`${m.monster_name}${chosen.message}`], () => {
      if (chosen.action === "defend") { tickAndContinue(); return; }
      if (chosen.dispel) {
        setBuffs([]);
        pushMessages([`強化が 消し去られた！`], () => tickAndContinue());
        return;
      }
      if (chosen.heal && chosen.heal > 0) {
        const nh = Math.min(m.hp, curMonHp + chosen.heal);
        setMonsterHp(nh);
        addFloat(`+${chosen.heal}`, "#34d399", "monster");
        pushMessages([`${m.monster_name}は ${chosen.heal} 回復した！`], () => tickAndContinue());
        return;
      }
      const power = chosen.power ?? 1;
      const hits = chosen.hits ?? 1;
      const eDef = getEffectiveDef();
      let totalDmg = 0;
      for (let i = 0; i < hits; i++) {
        let d = Math.max(1, Math.floor((m.atk * power) - eDef) + rand(-2, 2));
        if (defending) d = Math.floor(d / 2);
        totalDmg += d;
      }
      setHurtFlash(true); setTimeout(() => setHurtFlash(false), 250);
      addFloat(`${totalDmg}`, "#ef4444", "player");
      const nh = Math.max(0, playerHp - totalDmg);
      setPlayerHp(nh);
      const msgs: string[] = [];
      if (defending) msgs.push(`しかし あなたは 身構えていた！ ダメージが軽減された！`);
      msgs.push(`あなたは ${totalDmg}の ダメージを 受けた！`);
      pushMessages(msgs, () => {
        if (nh <= 0) { onPlayerDown(); return; }
        // Companion may also be hit slightly
        tickAndContinue();
      });
    });
  };

  const tickAndContinue = () => {
    setDefending(false);
    setBuffs((bs) => bs.map((b) => ({ ...b, turnsLeft: b.turnsLeft - 1 })).filter((b) => b.turnsLeft > 0));
    setEnemyDebuffs((bs) => bs.map((b) => ({ ...b, turnsLeft: b.turnsLeft - 1 })).filter((b) => b.turnsLeft > 0));
    setPhase("command");
  };

  // ---- Floor clear ----
  const onFloorClear = () => {
    const m = monster!;
    const drops: { key: string; qty: number }[] = [];
    if (m.drop_material_key && Math.random() < Number(m.drop_material_rate)) {
      drops.push({ key: m.drop_material_key, qty: 1 });
    }
    const newExp = accExp + m.exp_reward;
    const newCoins = accCoins + m.coin_reward;
    const newMats = { ...accMaterials };
    drops.forEach((d) => { newMats[d.key] = (newMats[d.key] || 0) + d.qty; });
    setAccExp(newExp); setAccCoins(newCoins); setAccMaterials(newMats);

    const msgs: string[] = [
      `${m.monster_name}を 倒した！`,
      `経験値 ${m.exp_reward}ポイント 獲得！`,
      `${m.coin_reward}コインを 手に入れた！`,
    ];
    drops.forEach((d) => msgs.push(`${materialNames[d.key] || d.key}を 手に入れた！`));

    const isLast = floorIdx + 1 >= monsters.length;
    if (m.is_boss) {
      const bd = (story.boss_defeat || []).map(formatLine);
      msgs.push(...bd);
    }

    pushMessages(msgs, () => {
      if (isLast) {
        finishRun("victory", monsters.length);
      } else {
        const nextIdx = floorIdx + 1;
        setFloorIdx(nextIdx);
        const next = monsters[nextIdx];
        setMonsterHp(next.hp);
        setBuffs([]); setEnemyDebuffs([]); setDefending(false);
        if (next.is_boss) {
          setBossFlash(true); setTimeout(() => setBossFlash(false), 600);
          const bi = (story.boss_intro || []).map(formatLine);
          pushMessages([...bi, `${next.monster_name}が あらわれた！`], () => setPhase("command"));
        } else {
          pushMessages([`${next.monster_name}が あらわれた！`], () => setPhase("command"));
        }
      }
    });
  };

  const onPlayerDown = () => {
    const hasRevive = (items["revival_leaf"] ?? 0) > 0;
    if (hasRevive) {
      setPhase("revive_prompt");
    } else {
      pushMessages([`あなたは 力尽きた...`], () => finishRun("defeat", floorIdx));
    }
  };

  const useRevive = async () => {
    if (!user) return;
    await consumeItem(user.id, "revival_leaf");
    setItems((s) => ({ ...s, revival_leaf: Math.max(0, (s.revival_leaf ?? 0) - 1) }));
    const nh = Math.floor(maxHp / 2);
    setPlayerHp(nh);
    pushMessages([`蘇りの葉の力で あなたは 蘇った！`], () => setPhase("command"));
  };

  const declineRevive = () => {
    pushMessages([`あなたは 力尽きた...`], () => finishRun("defeat", floorIdx));
  };

  const finishRun = async (res: "victory" | "defeat" | "retreat", floors: number) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const matsArr = Object.entries(accMaterials).map(([key, qty]) => ({ key, qty }));
    try {
      await completeDungeonRun(runId, floors, accExp, accCoins, res, matsArr);
      if (user) await persistMp(user.id, mp.current, mp.max);
      window.dispatchEvent(new Event("avatar-updated"));
      window.dispatchEvent(new Event("stamina-updated"));
    } catch (e: any) {
      toast.error("結果の保存に失敗", { description: e?.message });
    }
    setResult({
      result: res, floorsCleared: floors, totalFloors: monsters.length,
      totalExp: accExp, totalCoins: accCoins,
      materials: matsArr.map((m) => ({ ...m, name: materialNames[m.key] || m.key })),
    });
  };

  // ---- Render ----
  if (result) {
    return <DungeonResult data={result} onRetry={onFinish} onBack={onClose} />;
  }

  if (phase === "loading" || !stats || !monster || !avatar) {
    return (
      <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center text-white">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const rank = getRankInfo(avatar.level ?? 1, (avatar.gender as any) ?? "male", avatar.hair_color as any);
  const MIcon = MONSTER_ICON[monster.icon_name] || Bug;
  const monPct = (monsterHp / monster.hp) * 100;
  const hpPct = (playerHp / Math.max(1, maxHp)) * 100;
  const mpPct = (mp.current / Math.max(1, mp.max)) * 100;
  const compPct = (compHp / Math.max(1, compMaxHp)) * 100;

  const showCommand = phase === "command";
  const showSkillMenu = phase === "skill_select";
  const showItemMenu = phase === "item_select";

  const messageContent = currentMsg
    ? shown
    : (msgQueue.length === 0 && showCommand ? "コマンドを 選んでください" : "");

  const tappable = !!currentMsg;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col text-white select-none"
      style={{
        background: stage.background_css || "linear-gradient(135deg,#1a1a2e,#16213e)",
        fontFamily: "'Hiragino Sans', 'Yu Gothic', sans-serif",
      }}
      onClick={tappable ? advanceMessage : undefined}
    >
      {/* Background image (with dark overlay for readability) */}
      {!bgImgError && (
        <img
          src={bgImageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          onError={() => setBgImgError(true)}
        />
      )}
      <div className="absolute inset-0 pointer-events-none bg-black/50" />

      {hurtFlash && <div className="absolute inset-0 pointer-events-none z-10" style={{ boxShadow: "inset 0 0 100px 20px rgba(239,68,68,0.7)" }} />}
      {critFlash && <div className="absolute inset-0 pointer-events-none z-10 bg-white/40" />}
      {bossFlash && <div className="absolute inset-0 pointer-events-none z-20 bg-red-600/40 animate-pulse" />}

      {/* Header */}
      <div className="relative flex items-center justify-between px-3 py-2 bg-black/40">
        <div>
          <p className="text-[10px] font-bold tracking-wider opacity-70">{stage.stage_name}</p>
          <p className="text-xs font-bold">フロア {floorIdx + 1} / {monsters.length}</p>
        </div>
        <div className="text-[10px] opacity-70">ターン制バトル</div>
      </div>

      {/* Battle field */}
      <div className="relative flex-1 flex flex-col items-center justify-between px-3 py-2 overflow-hidden">
        {/* Monster */}
        <div className="flex flex-col items-center mt-2 relative">
          <div className={`relative ${shake ? "animate-[battle-shake_0.3s]" : ""}`}>
            <div
              className="w-32 h-32 rounded-3xl flex items-center justify-center bg-white/10 border-2 border-white/20 overflow-hidden"
              style={{ filter: monster.is_boss ? "drop-shadow(0 0 16px rgba(239,68,68,0.7))" : undefined }}
            >
              {!monsterImgError[monster.monster_key] ? (
                <img
                  src={monsterImageUrl}
                  alt={monster.monster_name}
                  className="w-full h-full object-contain"
                  style={{ imageRendering: "pixelated" }}
                  onError={() => setMonsterImgError((s) => ({ ...s, [monster.monster_key]: true }))}
                />
              ) : (
                <MIcon className="w-20 h-20" style={{ color: monster.is_boss ? "#fbbf24" : "#fff" }} />
              )}
            </div>
            {floats.filter((f) => f.target === "monster").map((f) => (
              <span key={f.id} className="absolute left-1/2 top-0 -translate-x-1/2 text-xl font-extrabold pointer-events-none"
                style={{ color: f.color, animation: "battle-float 0.9s ease-out forwards", textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>
                {f.text}
              </span>
            ))}
            {/* Spell FX overlay */}
            {spellFx && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-32 h-32 rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${spellColor(spellFx.kind)} 0%, transparent 70%)`,
                    animation: "spell-burst 0.7s ease-out forwards",
                  }} />
              </div>
            )}
          </div>
          <p className="text-sm font-bold mt-2">{monster.monster_name}{monster.is_boss && "（ボス）"}</p>
          <div className="w-48 mt-1">
            <div className="h-2 rounded-full bg-black/50 overflow-hidden border border-white/20">
              <div className="h-full transition-all duration-300" style={{ width: `${monPct}%`, background: "#ef4444" }} />
            </div>
            <p className="text-[10px] text-center opacity-80 mt-0.5">{monsterHp} / {monster.hp}</p>
          </div>
        </div>

        {/* Player + Companion */}
        <div className="flex items-end justify-center gap-4 py-2">
          <div className="relative" style={{ width: 72, height: 72 }}>
            <img src={rank.image} className="w-full h-full object-contain pixel-avatar" onError={handleAvatarImgError} alt="" />
            <EquipmentOverlay gear={gear} zBase={10} />
            {floats.filter((f) => f.target === "player").map((f) => (
              <span key={f.id} className="absolute left-1/2 top-0 -translate-x-1/2 text-lg font-extrabold pointer-events-none"
                style={{ color: f.color, animation: "battle-float 0.9s ease-out forwards", textShadow: "0 2px 8px rgba(0,0,0,0.8)" }}>
                {f.text}
              </span>
            ))}
            <p className="text-center text-[9px] text-white/80 mt-0.5">Lv.{avatar.level ?? 1}</p>
          </div>
          {companion && (
            <div className="relative" style={{ width: 56 }}>
              {(() => {
                const CIcon = COMPANION_ICON[companion.icon_name] || Cat;
                return (
                  <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                    <CIcon className="w-9 h-9" style={{ color: ELEMENT_COLOR[companion.element] || "#fff" }} />
                  </div>
                );
              })()}
              <p className="text-center text-[9px] text-white/80 mt-0.5 truncate">{companion.companion_name}</p>
              <div className="w-full h-1 bg-white/20 rounded mt-0.5 overflow-hidden">
                <div className="h-full bg-emerald-400" style={{ width: `${compPct}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Message window */}
      <div className="relative px-3 pt-2">
        <div
          className="relative rounded-lg px-4 py-3 min-h-[72px] text-sm leading-relaxed"
          style={{
            background: "linear-gradient(180deg,#0a0a3a 0%,#050520 100%)",
            border: "3px solid #c0c0e0",
            outline: "2px solid #4040a0",
            fontFamily: "monospace",
          }}
        >
          <p className="whitespace-pre-wrap break-all">{messageContent}</p>
          {waitingTap && currentMsg && (
            <ChevronRight className="absolute bottom-2 right-2 w-4 h-4 text-white animate-pulse" />
          )}
        </div>
      </div>

      {/* Command area */}
      <div className="relative px-3 py-2">
        {showCommand && !currentMsg && (
          <div className="grid grid-cols-2 gap-2">
            <CmdBtn icon={Sword} label="たたかう" onClick={handleAttack} />
            <CmdBtn icon={Sparkles} label="星詠み" onClick={() => setPhase("skill_select")} />
            <CmdBtn icon={ShieldIcon} label="防御する" onClick={handleDefend} />
            <CmdBtn icon={Package} label="道具" onClick={() => setPhase("item_select")} />
          </div>
        )}
        {showSkillMenu && (
          <SubMenu onBack={() => setPhase("command")}>
            {skills.length === 0 && <p className="text-xs text-white/60 px-2 py-3">習得した呪文がありません</p>}
            {skills.map((sk) => {
              const SI = SKILL_ICON[sk.icon_name] || Sparkles;
              const disabled = mp.current < sk.mp_cost;
              return (
                <button key={sk.skill_key} disabled={disabled} onClick={() => handleSkill(sk)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-white border-b border-white/10 last:border-0 disabled:opacity-40 hover:bg-white/10">
                  <span className="flex items-center gap-2"><SI className="w-4 h-4" />{sk.skill_name}</span>
                  <span className="text-[11px] opacity-80">MP{sk.mp_cost}</span>
                </button>
              );
            })}
          </SubMenu>
        )}
        {showItemMenu && (
          <SubMenu onBack={() => setPhase("command")}>
            {Object.entries(items).filter(([, q]) => q > 0).length === 0 && (
              <p className="text-xs text-white/60 px-2 py-3">所持アイテムがありません</p>
            )}
            {Object.entries(items).filter(([, q]) => q > 0).map(([key, qty]) => {
              const it = itemMaster[key];
              if (!it) return null;
              const II = ITEM_ICON[it.icon_name] || Package;
              return (
                <button key={key} onClick={() => handleItem(key)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-white border-b border-white/10 last:border-0 hover:bg-white/10">
                  <span className="flex items-center gap-2"><II className="w-4 h-4" />{it.item_name}</span>
                  <span className="text-[11px] opacity-80">×{qty}</span>
                </button>
              );
            })}
          </SubMenu>
        )}
        {phase === "revive_prompt" && (
          <div className="rounded-lg p-3" style={{ background: "linear-gradient(180deg,#0a0a3a,#050520)", border: "3px solid #c0c0e0" }}>
            <p className="text-sm mb-2">蘇りの葉を 使いますか？</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={useRevive} className="py-2 rounded bg-emerald-600 text-white text-sm font-bold">はい</button>
              <button onClick={declineRevive} className="py-2 rounded bg-white/10 text-white text-sm font-bold">いいえ</button>
            </div>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="relative flex items-center justify-between px-3 py-2 bg-black/80 border-t border-white/20">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-[9px] text-white/60">HP</p>
            <div className="w-20 h-2 bg-white/20 rounded overflow-hidden">
              <div className="h-full transition-all" style={{ width: `${hpPct}%`, background: hpPct > 50 ? "#4ade80" : hpPct > 25 ? "#facc15" : "#ef4444" }} />
            </div>
            <p className="text-[9px] text-white">{playerHp}/{maxHp}</p>
          </div>
          <div>
            <p className="text-[9px] text-white/60">MP</p>
            <div className="w-16 h-2 bg-white/20 rounded overflow-hidden">
              <div className="h-full bg-blue-400 transition-all" style={{ width: `${mpPct}%` }} />
            </div>
            <p className="text-[9px] text-white">{mp.current}/{mp.max}</p>
          </div>
        </div>
        <button onClick={handleRetreat}
          disabled={phase !== "command"}
          className="text-[10px] text-white/60 hover:text-white disabled:opacity-30 flex items-center gap-1">
          撤退 <X className="w-3 h-3" />
        </button>
      </div>

      <style>{`
        @keyframes battle-shake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-8px); } 40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); } 80% { transform: translateX(6px); }
        }
        @keyframes battle-float {
          0% { opacity: 0; transform: translate(-50%,0) scale(0.8); }
          20% { opacity: 1; transform: translate(-50%,-10px) scale(1.1); }
          100% { opacity: 0; transform: translate(-50%,-50px) scale(1); }
        }
        @keyframes spell-burst {
          0% { opacity: 0; transform: scale(0.3); }
          40% { opacity: 1; transform: scale(1.2); }
          100% { opacity: 0; transform: scale(1.6); }
        }
      `}</style>
    </div>
  );
};

const CmdBtn = ({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) => (
  <button onClick={onClick}
    className="flex items-center justify-center gap-2 py-3 rounded-lg text-white text-sm font-bold active:scale-95 transition-transform"
    style={{ background: "linear-gradient(180deg,#0a0a3a,#050520)", border: "2px solid #c0c0e0", outline: "1px solid #4040a0" }}>
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

const SubMenu = ({ children, onBack }: { children: React.ReactNode; onBack: () => void }) => (
  <div className="rounded-lg overflow-hidden" style={{ background: "linear-gradient(180deg,#0a0a3a,#050520)", border: "3px solid #c0c0e0", outline: "2px solid #4040a0" }}>
    <div className="max-h-48 overflow-y-auto">{children}</div>
    <button onClick={onBack} className="w-full py-2 text-xs text-white/80 bg-black/40 border-t border-white/20">もどる</button>
  </div>
);

const spellColor = (key: string): string => {
  if (key.includes("heal")) return "rgba(52,211,153,0.7)";
  if (key === "iron_guard") return "rgba(96,165,250,0.7)";
  if (key === "power_charge") return "rgba(248,113,113,0.7)";
  if (key === "weak_point") return "rgba(168,85,247,0.7)";
  if (key === "thunder_ray") return "rgba(250,204,21,0.8)";
  if (key === "luminas_ray") return "rgba(253,224,71,0.9)";
  if (key === "nova_burst") return "rgba(255,255,255,0.9)";
  if (key === "light_blade") return "rgba(255,255,255,0.85)";
  return "rgba(251,146,60,0.8)";
};

export default DungeonBattle;