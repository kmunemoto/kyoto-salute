import { useEffect, useRef, useState } from "react";
import { Coins, Zap, Ticket, X, RotateCw, Sparkles, Sword, Shield as ShieldIcon, Gem, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  describeGachaReward,
  GACHA_RARITY_COLOR,
  GACHA_RARITY_GRADIENT,
  GACHA_RARITY_LABEL,
  type GachaRarity,
} from "@/lib/gachaSystem";
import type { GachaSpinResult } from "@/hooks/useGacha";

type Phase = "charge" | "reveal" | "result";

interface Props {
  open: boolean;
  /** Called by modal to actually perform the spin. Returns result or null on failure. */
  requestSpin: () => Promise<GachaSpinResult | null>;
  onClose: () => void;
  onError?: (e: any) => void;
}

const PILLAR_COLORS: Record<GachaRarity, string> = {
  common: "rgba(255,255,255,0.8)",
  rare: "rgba(10,186,181,0.85)",
  epic: "rgba(99,102,241,0.9)",
  legendary: "transparent",
};
const PILLAR_WIDTH: Record<GachaRarity, number> = {
  common: 100,
  rare: 150,
  epic: 220,
  legendary: 360,
};

// Particle helpers --------------------------------------------------
const ConvergingParticles = ({ count = 24, color = "rgba(10,186,181,0.9)" }: { count?: number; color?: string }) => {
  const items = Array.from({ length: count }).map((_, i) => {
    const angle = (i / count) * Math.PI * 2 + Math.random();
    const dist = 140 + Math.random() * 120;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    const delay = Math.random() * 0.6;
    const dur = 0.8 + Math.random() * 0.5;
    const size = 3 + Math.random() * 4;
    return (
      <span
        key={i}
        className="absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: size,
          height: size,
          background: color,
          boxShadow: `0 0 8px 2px ${color}`,
          animation: `particle-converge ${dur}s ease-in ${delay}s infinite`,
          ["--sx" as any]: `${dx}px`,
          ["--sy" as any]: `${dy}px`,
          willChange: "transform, opacity",
        }}
      />
    );
  });
  return <>{items}</>;
};

const ExplodingParticles = ({ count = 30, color = "#FBBF24" }: { count?: number; color?: string }) => {
  const items = Array.from({ length: count }).map((_, i) => {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
    const dist = 160 + Math.random() * 200;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    const delay = Math.random() * 0.2;
    const dur = 0.9 + Math.random() * 0.6;
    const size = 4 + Math.random() * 5;
    return (
      <span
        key={i}
        className="absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: size,
          height: size,
          background: color,
          boxShadow: `0 0 10px 3px ${color}`,
          animation: `particle-burst ${dur}s ease-out ${delay}s forwards`,
          ["--ex" as any]: `${dx}px`,
          ["--ey" as any]: `${dy}px`,
          willChange: "transform, opacity",
        }}
      />
    );
  });
  return <>{items}</>;
};

const FloatingParticles = ({ color = "rgba(99,102,241,0.85)", count = 16 }: { color?: string; count?: number }) => {
  const items = Array.from({ length: count }).map((_, i) => {
    const left = Math.random() * 100;
    const delay = Math.random() * 2;
    const dur = 2.4 + Math.random() * 2;
    const size = 3 + Math.random() * 4;
    return (
      <span
        key={i}
        className="absolute rounded-full"
        style={{
          left: `${left}%`,
          bottom: "-10px",
          width: size,
          height: size,
          background: color,
          boxShadow: `0 0 8px 2px ${color}`,
          animation: `particle-float ${dur}s linear ${delay}s infinite`,
          willChange: "transform, opacity",
        }}
      />
    );
  });
  return <>{items}</>;
};

const Confetti = ({ count = 28 }: { count?: number }) => {
  const colors = ["#F59E0B", "#EF4444", "#3B82F6", "#10B981", "#8B5CF6", "#FBBF24"];
  const items = Array.from({ length: count }).map((_, i) => {
    const left = Math.random() * 100;
    const delay = Math.random() * 1.2;
    const dur = 3 + Math.random() * 2.5;
    const size = 6 + Math.random() * 6;
    const sway = 20 + Math.random() * 30;
    const rot = (Math.random() * 720) | 0;
    const color = colors[i % colors.length];
    return (
      <span
        key={i}
        className="absolute"
        style={{
          left: `${left}%`,
          top: "-20px",
          width: size,
          height: size * 0.5,
          background: color,
          animation: `confetti-fall ${dur}s linear ${delay}s infinite`,
          ["--sway" as any]: `${sway}px`,
          ["--rot" as any]: `${rot}deg`,
          willChange: "transform, opacity",
          borderRadius: 1,
        }}
      />
    );
  });
  return <>{items}</>;
};

// Count-up animation ------------------------------------------------
const CountUp = ({ value, duration = 500 }: { value: number; duration?: number }) => {
  const [n, setN] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      setN(Math.floor(value * p));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setN(value);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{n.toLocaleString()}</>;
};

// Main component ----------------------------------------------------
const GachaAnimation = ({ open, requestSpin, onClose, onError }: Props) => {
  const [phase, setPhase] = useState<Phase>("charge");
  const [result, setResult] = useState<GachaSpinResult | null>(null);
  const [showCloseBtn, setShowCloseBtn] = useState(false);
  const [round, setRound] = useState(0); // 0 = first spin
  const [busy, setBusy] = useState(false);
  const cancelRef = useRef(false);

  // Lock scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  // Run a single gacha cycle
  const runCycle = async (isFirst: boolean) => {
    if (busy) return;
    setBusy(true);
    cancelRef.current = false;
    setPhase("charge");
    setResult(null);
    setShowCloseBtn(false);

    const chargeMs = isFirst ? 1500 : 500;
    const revealMs = 1000;

    try {
      const [r] = await Promise.all([
        requestSpin(),
        new Promise((res) => setTimeout(res, chargeMs)),
      ]);
      if (cancelRef.current) return;
      if (!r) {
        onError?.(new Error("チケットがありません"));
        onClose();
        return;
      }
      setResult(r);
      setPhase("reveal");

      // Vibration
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          if (r.rarity === "legendary") navigator.vibrate(200);
          else if (r.rarity === "epic") navigator.vibrate(100);
        } catch {}
      }

      await new Promise((res) => setTimeout(res, revealMs));
      if (cancelRef.current) return;
      setPhase("result");
      // Show close button after main pop animation
      setTimeout(() => !cancelRef.current && setShowCloseBtn(true), 900);
    } catch (e: any) {
      onError?.(e);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  // Kick off when modal opens
  useEffect(() => {
    if (open) {
      cancelRef.current = false;
      setRound(0);
      runCycle(true);
    } else {
      cancelRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleAgain = () => {
    setRound((r) => r + 1);
    runCycle(false);
  };

  const handleClose = () => {
    cancelRef.current = true;
    onClose();
  };

  if (!open) return null;

  const rarity = result?.rarity;
  const isLegendary = rarity === "legendary";
  const isEpic = rarity === "epic";
  const isRare = rarity === "rare";

  return (
    <div
      className="fixed inset-0 z-[200] overflow-hidden"
      style={{
        background:
          isLegendary && phase === "result"
            ? "radial-gradient(ellipse at center, rgba(120,80,0,0.85) 0%, rgba(0,0,0,0.97) 80%)"
            : "rgba(0,0,0,0.95)",
        transition: "background 0.5s ease",
      }}
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.stopPropagation()}
    >
      <style>{styles}</style>

      {/* Background radial gradient during charge */}
      {phase === "charge" && (
        <div
          className="absolute inset-0 pointer-events-none animate-gacha-bg-pulse"
          style={{
            background:
              "radial-gradient(circle at center, rgba(10,186,181,0.25) 0%, transparent 60%)",
          }}
        />
      )}

      {/* ======== STAGE 1: CHARGE ======== */}
      {phase === "charge" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            <ConvergingParticles count={round === 0 ? 26 : 14} />
            <div
              className="relative flex items-center justify-center"
              style={{
                width: 96,
                height: 96,
                animation: `coin-spin ${round === 0 ? "1500ms" : "500ms"} ease-in forwards, coin-glow ${round === 0 ? "1500ms" : "500ms"} ease-in forwards`,
                transformStyle: "preserve-3d",
              }}
            >
              <Coins className="w-16 h-16 text-yellow-300" strokeWidth={2.2} />
            </div>
          </div>
        </div>
      )}

      {/* ======== STAGE 2: REVEAL ======== */}
      {phase === "reveal" && rarity && (
        <div className="absolute inset-0 flex items-end justify-center overflow-hidden">
          {/* Coin shatter shards */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {Array.from({ length: 10 }).map((_, i) => {
              const a = (i / 10) * Math.PI * 2;
              const dx = Math.cos(a) * (80 + Math.random() * 60);
              const dy = Math.sin(a) * (80 + Math.random() * 60);
              return (
                <span
                  key={i}
                  className="absolute w-2 h-2 rounded-sm bg-yellow-300"
                  style={{
                    boxShadow: "0 0 6px rgba(252,211,77,0.9)",
                    animation: "shard-fly 0.5s ease-out forwards",
                    ["--shx" as any]: `${dx}px`,
                    ["--shy" as any]: `${dy}px`,
                  }}
                />
              );
            })}
          </div>

          {/* Legendary crack + flash */}
          {isLegendary && (
            <>
              <div className="absolute inset-0 pointer-events-none animate-screen-crack" aria-hidden>
                <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
                  <path d="M50 50 L20 0 M50 50 L80 0 M50 50 L0 30 M50 50 L100 40 M50 50 L10 100 M50 50 L90 100"
                        stroke="white" strokeWidth="0.4" fill="none" opacity="0.85"/>
                </svg>
              </div>
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: "white", animation: "screen-flash 0.5s ease-out 0.25s forwards", opacity: 0 }}
              />
            </>
          )}

          {/* Epic shake wrapper around pillar */}
          <div
            className="absolute inset-0 flex items-end justify-center pointer-events-none"
            style={{ animation: isEpic ? "screen-shake 0.3s ease-in-out 3" : undefined }}
          >
            {/* Light pillar */}
            <div
              className="relative"
              style={{
                width: PILLAR_WIDTH[rarity],
                height: "100%",
                animation: "pillar-rise 0.6s ease-out forwards",
                transformOrigin: "bottom",
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background: isLegendary
                    ? "linear-gradient(to top, #FF0000, #FF8C00, #FFD700, #00FF00, #0ABAB5, #6366F1, #8B5CF6)"
                    : `linear-gradient(to top, ${PILLAR_COLORS[rarity]} 0%, transparent 100%)`,
                  filter: "blur(2px)",
                  opacity: 0.95,
                  maskImage: "linear-gradient(to top, black 30%, transparent 100%)",
                  WebkitMaskImage: "linear-gradient(to top, black 30%, transparent 100%)",
                  animation: isLegendary ? "pillar-rainbow 1.2s linear infinite" : undefined,
                  backgroundSize: isLegendary ? "100% 200%" : undefined,
                }}
              />
            </div>
          </div>

          {/* Pillar particles */}
          {(isRare || isEpic || isLegendary) && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute left-1/2 bottom-0 -translate-x-1/2">
                <ExplodingParticles
                  count={isLegendary ? 50 : isEpic ? 24 : 12}
                  color={isLegendary ? "#FBBF24" : isEpic ? "#A5B4FC" : "#5EEAD4"}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======== STAGE 3: RESULT ======== */}
      {phase === "result" && result && rarity && (
        <ResultView
          result={result}
          rarity={rarity}
          showCloseBtn={showCloseBtn}
          onAgain={handleAgain}
          onClose={handleClose}
          busy={busy}
        />
      )}
    </div>
  );
};

// Result View -------------------------------------------------------
const ResultView = ({
  result,
  rarity,
  showCloseBtn,
  onAgain,
  onClose,
  busy,
}: {
  result: GachaSpinResult;
  rarity: GachaRarity;
  showCloseBtn: boolean;
  onAgain: () => void;
  onClose: () => void;
  busy: boolean;
}) => {
  const d = describeGachaReward(result.reward_type, result.reward_amount, rarity);
  const RewardIcon = d.iconKind === "coins" ? Coins : Zap;
  const color = GACHA_RARITY_COLOR[rarity];
  const gradient = GACHA_RARITY_GRADIENT[rarity];
  const isLegendary = rarity === "legendary";
  const isEpic = rarity === "epic";
  const isRare = rarity === "rare";
  const isFrame = result.reward_type === "frame" || result.reward_type === "frame_dup";
  const isDup = result.reward_type === "frame_dup";
  const isEquipment = result.reward_type === "equipment" || result.reward_type === "equipment_dup";
  const isEquipDup = result.reward_type === "equipment_dup";

  if (isEquipment) {
    return (
      <EquipmentResultView
        result={result}
        rarity={rarity}
        showCloseBtn={showCloseBtn}
        onAgain={onAgain}
        onClose={onClose}
        busy={busy}
        isDuplicate={isEquipDup}
      />
    );
  }

  const popClass = isLegendary
    ? "anim-legendary-pop"
    : isEpic
    ? "anim-epic-pop"
    : isRare
    ? "anim-rare-pop"
    : "anim-common-pop";

  const iconSize = isLegendary ? 120 : 80;

  return (
    <div className="absolute inset-0 flex items-center justify-center px-6">
      {/* Epic conic background */}
      {isEpic && (
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, rgba(99,102,241,0.5) 30deg, transparent 60deg, transparent 180deg, rgba(99,102,241,0.5) 210deg, transparent 240deg)",
            animation: "conic-spin 6s linear infinite",
          }}
        />
      )}
      {/* Legendary confetti */}
      {isLegendary && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <Confetti />
        </div>
      )}
      {/* Epic floating particles */}
      {isEpic && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <FloatingParticles color="rgba(165,180,252,0.9)" count={18} />
        </div>
      )}
      {/* Rare sparkles */}
      {isRare && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <FloatingParticles color="rgba(94,234,212,0.85)" count={10} />
        </div>
      )}
      {/* Legendary lasting sparkles */}
      {isLegendary && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <FloatingParticles color="rgba(251,191,36,0.95)" count={22} />
        </div>
      )}

      <div className="relative w-full max-w-sm flex flex-col items-center text-center">
        {/* Rarity label */}
        <p
          className={`text-xs font-extrabold tracking-[0.5em] anim-fade-up ${isLegendary ? "anim-gold-shine" : ""}`}
          style={{ color, textShadow: isLegendary ? "0 0 12px rgba(251,191,36,0.8)" : undefined }}
        >
          {GACHA_RARITY_LABEL[rarity]}
        </p>
        <div
          className="mx-auto mt-2 h-px w-16 anim-fade-up"
          style={{
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            animationDelay: "0.05s",
          }}
        />

        {/* Reward icon */}
        {isFrame && result.frame_image ? (
          <div className={`relative mt-6 ${popClass}`} style={{ width: 160, height: 160 }}>
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: gradient,
                boxShadow: isLegendary
                  ? "0 0 50px 12px rgba(251,191,36,0.7)"
                  : "0 0 30px 6px rgba(139,92,246,0.6)",
                opacity: 0.35,
              }}
            />
            <img
              src={result.frame_image}
              alt={result.frame_name || "frame"}
              className="relative w-full h-full object-contain z-10"
            />
          </div>
        ) : (
        <div
          className={`relative mt-6 ${popClass}`}
          style={{
            width: iconSize,
            height: iconSize,
          }}
        >
          <div
            className="w-full h-full rounded-full flex items-center justify-center"
            style={{
              background: gradient,
              boxShadow: isLegendary
                ? "0 0 50px 12px rgba(251,191,36,0.7), 0 0 120px 30px rgba(245,158,11,0.4)"
                : isEpic
                ? "0 0 30px 6px rgba(99,102,241,0.6)"
                : isRare
                ? "0 0 20px 4px rgba(10,186,181,0.5)"
                : "0 0 12px 2px rgba(255,255,255,0.15)",
              border: "2px solid rgba(255,255,255,0.25)",
            }}
          >
            <RewardIcon
              className="text-white"
              strokeWidth={2.2}
              size={iconSize * 0.55}
            />
          </div>
        </div>
        )}

        {/* Reward amount with countup */}
        {isFrame ? (
          <div className="mt-6 text-center anim-fade-up" style={{ animationDelay: "0.45s" }}>
            <p className="text-2xl font-extrabold text-white">
              {result.frame_name}
            </p>
            <p className="text-sm text-white/80 mt-1">
              {isDup
                ? `所持済み → ${result.reward_amount}コインに変換`
                : "フレームを獲得！"}
            </p>
          </div>
        ) : (
        <p
          className="mt-6 text-4xl font-extrabold text-white anim-fade-up"
          style={{ animationDelay: "0.45s", letterSpacing: "0.02em" }}
        >
          <CountUp value={result.reward_amount} />
          <span className="text-xl ml-2 opacity-80">
            {d.iconKind === "coins" ? "コイン" : "EXP"}
          </span>
        </p>
        )}

        {/* Remaining tickets */}
        <div
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full anim-fade-up"
          style={{
            animationDelay: "0.6s",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          <Ticket className="w-3.5 h-3.5 text-white/70" />
          <span className="text-xs text-white/80">
            残り <span className="font-bold text-white">{result.remaining}</span> 枚
          </span>
        </div>

        {/* Buttons */}
        <div
          className="mt-8 flex gap-3 w-full"
          style={{
            opacity: showCloseBtn ? 1 : 0,
            transform: showCloseBtn ? "translateY(0)" : "translateY(8px)",
            transition: "opacity 0.4s ease, transform 0.4s ease",
            pointerEvents: showCloseBtn ? "auto" : "none",
          }}
        >
          {result.remaining > 0 && (
            <Button
              onClick={onAgain}
              disabled={busy}
              className="flex-1 font-bold h-11 text-white border-0"
              style={{ background: "linear-gradient(135deg, #0ABAB5, #06908C)" }}
            >
              <RotateCw className="w-4 h-4 mr-1.5" />
              もう1回回す
            </Button>
          )}
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 font-bold h-11 bg-transparent text-white border-white/25 hover:bg-white/10 hover:text-white"
          >
            <X className="w-4 h-4 mr-1.5" />
            閉じる
          </Button>
        </div>
      </div>
    </div>
  );
};

// Equipment Result View ---------------------------------------------
const EquipmentResultView = ({
  result, rarity, showCloseBtn, onAgain, onClose, busy, isDuplicate,
}: {
  result: GachaSpinResult;
  rarity: GachaRarity;
  showCloseBtn: boolean;
  onAgain: () => void;
  onClose: () => void;
  busy: boolean;
  isDuplicate: boolean;
}) => {
  const color = GACHA_RARITY_COLOR[rarity];
  const gradient = GACHA_RARITY_GRADIENT[rarity];
  const TypeIcon = result.equipment_type === "weapon" ? Sword
    : result.equipment_type === "shield" ? ShieldIcon : Gem;
  const [equipping, setEquipping] = useState(false);
  const [equipped, setEquipped] = useState(false);

  const handleEquip = async () => {
    if (!result.equipment_key) return;
    setEquipping(true);
    const { data: item } = await (supabase as any)
      .from("equipment_items").select("id").eq("item_key", result.equipment_key).maybeSingle();
    if (item?.id) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.rpc("equip_item", { p_user_id: user.id, p_item_id: item.id });
        if (!error) {
          setEquipped(true);
          window.dispatchEvent(new Event("equipment-updated"));
          toast.success("装備しました");
        } else {
          toast.error("装備変更に失敗", { description: error.message });
        }
      }
    }
    setEquipping(false);
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center px-6">
      <div className="absolute inset-0 pointer-events-none opacity-40"
        style={{ background: "conic-gradient(from 0deg, transparent 0deg, rgba(139,92,246,0.5) 30deg, transparent 60deg, transparent 180deg, rgba(139,92,246,0.5) 210deg, transparent 240deg)", animation: "conic-spin 6s linear infinite" }} />
      <div className="relative w-full max-w-sm flex flex-col items-center text-center">
        <p className="text-xs font-extrabold tracking-[0.5em] anim-fade-up" style={{ color }}>
          {GACHA_RARITY_LABEL[rarity]}
        </p>
        <div className="mx-auto mt-2 h-px w-16 anim-fade-up"
          style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)`, animationDelay: "0.05s" }} />

        <div className="anim-epic-pop relative mt-6" style={{ width: 180, height: 180 }}>
          <div className="absolute inset-0 rounded-full"
            style={{ background: gradient, boxShadow: "0 0 30px 6px rgba(139,92,246,0.6)", opacity: 0.35 }} />
          {result.equipment_image ? (
            <img src={result.equipment_image} alt={result.equipment_name || ""}
              className="relative w-full h-full object-contain z-10" />
          ) : (
            <TypeIcon className="relative w-24 h-24 text-white m-auto inset-0" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
          )}
        </div>

        <p className="mt-4 text-xl font-extrabold text-white anim-fade-up" style={{ animationDelay: "0.45s" }}>
          {result.equipment_name}
        </p>

        {isDuplicate ? (
          <div className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-full anim-fade-up"
            style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.4)", animationDelay: "0.55s" }}>
            <Coins className="w-4 h-4 text-yellow-300" />
            <span className="text-sm font-bold text-yellow-200">所持済み → +{result.reward_amount}コインに変換！</span>
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-2 anim-fade-up" style={{ animationDelay: "0.55s" }}>
            {(result.equipment_atk ?? 0) > 0 && (
              <span className="px-2 py-1 rounded-md text-xs font-bold bg-red-500/20 text-red-200 inline-flex items-center gap-1">
                <Sword className="w-3 h-3" />ATK +{result.equipment_atk}
              </span>
            )}
            {(result.equipment_def ?? 0) > 0 && (
              <span className="px-2 py-1 rounded-md text-xs font-bold bg-blue-500/20 text-blue-200 inline-flex items-center gap-1">
                <ShieldIcon className="w-3 h-3" />DEF +{result.equipment_def}
              </span>
            )}
            {(result.equipment_hp ?? 0) > 0 && (
              <span className="px-2 py-1 rounded-md text-xs font-bold bg-emerald-500/20 text-emerald-200 inline-flex items-center gap-1">
                <Heart className="w-3 h-3" />HP +{result.equipment_hp}
              </span>
            )}
          </div>
        )}

        <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full anim-fade-up"
          style={{ animationDelay: "0.6s", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
          <Ticket className="w-3.5 h-3.5 text-white/70" />
          <span className="text-xs text-white/80">残り <span className="font-bold text-white">{result.remaining}</span> 枚</span>
        </div>

        <div className="mt-6 flex flex-col gap-2 w-full"
          style={{ opacity: showCloseBtn ? 1 : 0, transform: showCloseBtn ? "translateY(0)" : "translateY(8px)", transition: "opacity 0.4s ease, transform 0.4s ease", pointerEvents: showCloseBtn ? "auto" : "none" }}>
          {!isDuplicate && !equipped && (
            <Button onClick={handleEquip} disabled={equipping}
              className="w-full font-bold h-11 text-white border-0"
              style={{ background: "linear-gradient(135deg, #8B5CF6, #6366F1)" }}>
              {equipping ? "装備中..." : "装備する"}
            </Button>
          )}
          {equipped && (
            <p className="text-xs text-emerald-300 font-bold">装備完了</p>
          )}
          <div className="flex gap-3">
            {result.remaining > 0 && (
              <Button onClick={onAgain} disabled={busy}
                className="flex-1 font-bold h-11 text-white border-0"
                style={{ background: "linear-gradient(135deg, #0ABAB5, #06908C)" }}>
                <RotateCw className="w-4 h-4 mr-1.5" />もう1回
              </Button>
            )}
            <Button onClick={onClose} variant="outline"
              className="flex-1 font-bold h-11 bg-transparent text-white border-white/25 hover:bg-white/10 hover:text-white">
              <X className="w-4 h-4 mr-1.5" />閉じる
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Inline keyframes --------------------------------------------------
const styles = `
@keyframes coin-spin {
  0%   { transform: rotateY(0deg) translateY(0); }
  30%  { transform: rotateY(360deg) translateY(-4px); }
  60%  { transform: rotateY(900deg) translateY(0); }
  100% { transform: rotateY(2160deg) translateY(0); }
}
@keyframes coin-glow {
  0%   { filter: drop-shadow(0 0 4px rgba(252,211,77,0.4)); }
  100% { filter: drop-shadow(0 0 28px rgba(252,211,77,1)) drop-shadow(0 0 60px rgba(252,211,77,0.8)); }
}
@keyframes particle-converge {
  0%   { transform: translate(var(--sx), var(--sy)) scale(0.4); opacity: 0; }
  20%  { opacity: 1; }
  100% { transform: translate(0, 0) scale(1); opacity: 0; }
}
@keyframes particle-burst {
  0%   { transform: translate(0, 0) scale(0.3); opacity: 1; }
  100% { transform: translate(var(--ex), var(--ey)) scale(0.8); opacity: 0; }
}
@keyframes particle-float {
  0%   { transform: translateY(0) scale(1); opacity: 0; }
  10%  { opacity: 0.9; }
  100% { transform: translateY(-110vh) scale(0.6); opacity: 0; }
}
@keyframes confetti-fall {
  0%   { transform: translateY(0) translateX(0) rotateZ(0deg); opacity: 1; }
  50%  { transform: translateY(50vh) translateX(var(--sway)) rotateZ(calc(var(--rot) * 0.5)); }
  100% { transform: translateY(110vh) translateX(calc(var(--sway) * -1)) rotateZ(var(--rot)); opacity: 0.8; }
}
@keyframes shard-fly {
  0%   { transform: translate(0, 0) scale(1); opacity: 1; }
  100% { transform: translate(var(--shx), var(--shy)) scale(0.3); opacity: 0; }
}
@keyframes pillar-rise {
  0%   { transform: scaleY(0); opacity: 0; }
  30%  { opacity: 1; }
  100% { transform: scaleY(1); opacity: 1; }
}
@keyframes pillar-rainbow {
  0%   { background-position: 0% 0%; }
  100% { background-position: 0% 200%; }
}
@keyframes screen-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}
@keyframes screen-flash {
  0%   { opacity: 0; }
  40%  { opacity: 1; }
  100% { opacity: 0; }
}
@keyframes screen-crack {
  0%   { opacity: 0; transform: scale(0.4); }
  100% { opacity: 1; transform: scale(1.2); }
}
.animate-screen-crack { animation: screen-crack 0.3s ease-out forwards; }
@keyframes anim-gacha-bg-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.9; }
}
.animate-gacha-bg-pulse { animation: anim-gacha-bg-pulse 1.2s ease-in-out infinite; }
@keyframes conic-spin {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@keyframes anim-fade-up {
  0%   { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
}
.anim-fade-up { animation: anim-fade-up 0.5s ease-out both; }
@keyframes common-pop {
  0% { opacity: 0; transform: scale(0.9); }
  100% { opacity: 1; transform: scale(1); }
}
.anim-common-pop { animation: common-pop 0.5s ease-out both; }
@keyframes rare-pop {
  0%   { transform: scale(0.5); opacity: 0; }
  60%  { transform: scale(1.12); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
.anim-rare-pop { animation: rare-pop 0.55s cubic-bezier(.2,1.4,.4,1) both; }
@keyframes epic-pop {
  0%   { transform: scale(0.4) rotate(-180deg); opacity: 0; }
  60%  { transform: scale(1.15) rotate(20deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
.anim-epic-pop { animation: epic-pop 0.7s cubic-bezier(.2,1.4,.4,1) both; }
@keyframes legendary-pop {
  0%   { transform: scale(0); opacity: 0; }
  50%  { transform: scale(1.35); opacity: 1; }
  75%  { transform: scale(0.95); }
  100% { transform: scale(1); opacity: 1; }
}
.anim-legendary-pop { animation: legendary-pop 0.85s cubic-bezier(.2,1.6,.4,1) both; }
@keyframes gold-shine {
  0%, 100% { text-shadow: 0 0 8px rgba(251,191,36,0.7); }
  50%      { text-shadow: 0 0 22px rgba(251,191,36,1), 0 0 40px rgba(251,191,36,0.7); }
}
.anim-gold-shine { animation: gold-shine 1.4s ease-in-out infinite; }
`;

export default GachaAnimation;
