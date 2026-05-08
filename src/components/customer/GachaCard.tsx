import { useState, useEffect } from "react";
import { Sparkles, Ticket, Coins, Zap, X, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGacha, type GachaSpinResult } from "@/hooks/useGacha";
import {
  describeGachaReward,
  GACHA_RARITY_COLOR,
  GACHA_RARITY_FLASH,
  GACHA_RARITY_GRADIENT,
  GACHA_RARITY_LABEL,
} from "@/lib/gachaSystem";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ACHIEVEMENTS } from "@/lib/avatarSystem";

const SPIN_DURATION = 1800;

const GachaCard = () => {
  const { ticketCount, loading, spinning, spin } = useGacha();
  const { user } = useAuth();
  const [epicBonus, setEpicBonus] = useState(0);
  useEffect(() => {
    if (!user) return;
    supabase
      .from("avatar_achievements")
      .select("achievement_key")
      .eq("user_id", user.id)
      .then(({ data }) => {
        const keys = ((data as any[]) || []).map((r) => r.achievement_key as string);
        const epicSet = new Set(ACHIEVEMENTS.filter((a) => a.rarity === "epic").map((a) => a.key));
        const epicCount = keys.filter((k) => epicSet.has(k)).length;
        setEpicBonus(epicCount >= 10 ? 2 : epicCount >= 5 ? 1 : 0);
      });
  }, [user]);
  const [phase, setPhase] = useState<"idle" | "spinning" | "result">("idle");
  const [revealed, setRevealed] = useState<GachaSpinResult | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  if (loading || ticketCount <= 0) return null;

  const runSpin = async () => {
    setOpen(true);
    setPhase("spinning");
    setRevealed(null);
    try {
      const [r] = await Promise.all([spin(), new Promise((res) => setTimeout(res, SPIN_DURATION))]);
      if (r) {
        setRevealed(r);
        setPhase("result");
      } else {
        toast.error("チケットがありません");
        setOpen(false);
        setPhase("idle");
      }
    } catch (e: any) {
      toast.error("ガチャに失敗しました", { description: e.message });
      setOpen(false);
      setPhase("idle");
    }
  };

  const close = () => {
    setOpen(false);
    setPhase("idle");
    setRevealed(null);
  };

  const emphasize = ticketCount >= 2;

  return (
    <>
      <style>{`
        @keyframes gacha-cap-spin {
          0% { transform: rotate(0) translateY(0); }
          25% { transform: rotate(180deg) translateY(-10px); }
          50% { transform: rotate(360deg) translateY(0); }
          75% { transform: rotate(540deg) translateY(-6px); }
          100% { transform: rotate(720deg) translateY(0); }
        }
        @keyframes gacha-ring-rotate {
          0% { transform: rotate(0); }
          100% { transform: rotate(360deg); }
        }
        @keyframes gacha-orb-pulse {
          0%, 100% { transform: scale(1); opacity: 0.55; }
          50% { transform: scale(1.18); opacity: 0.95; }
        }
        @keyframes gacha-flash {
          0% { opacity: 0; }
          15% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes gacha-pop {
          0% { transform: scale(0.5); opacity: 0; }
          55% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes gacha-pop-soft {
          0% { transform: translateY(12px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes legendary-glow {
          0%, 100% { box-shadow: 0 0 30px 6px rgba(245,158,11,0.55), 0 0 80px 18px rgba(245,158,11,0.25); }
          50% { box-shadow: 0 0 50px 12px rgba(245,158,11,0.85), 0 0 120px 28px rgba(245,158,11,0.45); }
        }
        @keyframes epic-glow {
          0%, 100% { box-shadow: 0 0 24px 4px rgba(99,102,241,0.45); }
          50% { box-shadow: 0 0 40px 10px rgba(99,102,241,0.75); }
        }
        @keyframes rare-glow {
          0%, 100% { box-shadow: 0 0 18px 2px rgba(10,186,181,0.35); }
          50% { box-shadow: 0 0 30px 6px rgba(10,186,181,0.6); }
        }
        @keyframes particle-rise {
          0% { transform: translate(0, 0) scale(0); opacity: 0; }
          15% { opacity: 1; }
          100% { transform: translate(var(--dx), var(--dy)) scale(1); opacity: 0; }
        }
        @keyframes ticket-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
        @keyframes label-shine {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .gacha-capsule { animation: gacha-cap-spin ${SPIN_DURATION}ms cubic-bezier(.25,.8,.4,1); }
        .gacha-ring { animation: gacha-ring-rotate 2.4s linear infinite; }
        .gacha-orb { animation: gacha-orb-pulse 1.4s ease-in-out infinite; }
        .gacha-flash-anim { animation: gacha-flash 0.7s ease-out; }
        .gacha-pop { animation: gacha-pop 0.55s cubic-bezier(.2,1.4,.4,1); }
        .gacha-pop-soft { animation: gacha-pop-soft 0.5s ease-out both; }
        .legendary-glow { animation: legendary-glow 1.6s ease-in-out infinite; }
        .epic-glow { animation: epic-glow 1.6s ease-in-out infinite; }
        .rare-glow { animation: rare-glow 1.6s ease-in-out infinite; }
        .ticket-cta { animation: ticket-pulse 1.6s ease-in-out infinite; }
        .label-shine {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: label-shine 2.2s linear infinite;
        }
      `}</style>

      {/* Card */}
      <div
        className="rounded-2xl p-4 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0ABAB5 0%, #06908C 100%)" }}
      >
        <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-4 w-24 h-24 rounded-full bg-white/5" />
        <div className="relative flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold leading-tight">トレーニングガチャ</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Ticket className="w-3.5 h-3.5 opacity-90" />
              <p className={`text-xs ${emphasize ? "font-extrabold" : "opacity-95"}`}>
                未使用チケット <span className="text-base font-extrabold">{ticketCount}</span> 枚
              </p>
            </div>
          </div>
        </div>
        <Button
          onClick={runSpin}
          disabled={spinning || open}
          className={`mt-3 w-full font-bold bg-white text-[#06908C] hover:bg-white/90 ${emphasize ? "ticket-cta" : ""}`}
        >
          ガチャを回す
        </Button>
      </div>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center px-6"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(15,23,42,0.92) 0%, rgba(0,0,0,0.97) 100%)",
          }}
        >
          {/* Rarity flash overlay */}
          {phase === "result" && revealed && (
            <div
              className="absolute inset-0 pointer-events-none gacha-flash-anim"
              style={{ backgroundColor: GACHA_RARITY_FLASH[revealed.rarity] }}
            />
          )}

          {/* Spinning */}
          {phase === "spinning" && (
            <div className="relative flex flex-col items-center">
              {/* Outer rotating ring */}
              <div className="relative w-56 h-56 flex items-center justify-center">
                <div
                  className="absolute inset-0 rounded-full gacha-ring"
                  style={{
                    background:
                      "conic-gradient(from 0deg, transparent 0deg, rgba(10,186,181,0.0) 60deg, rgba(10,186,181,0.9) 180deg, transparent 360deg)",
                    mask: "radial-gradient(circle, transparent 60%, black 62%, black 70%, transparent 72%)",
                    WebkitMask:
                      "radial-gradient(circle, transparent 60%, black 62%, black 70%, transparent 72%)",
                  }}
                />
                {/* Inner orb glow */}
                <div
                  className="absolute w-32 h-32 rounded-full gacha-orb"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(10,186,181,0.85) 0%, rgba(10,186,181,0) 70%)",
                  }}
                />
                {/* Capsule */}
                <div className="relative w-24 h-24 gacha-capsule">
                  <div
                    className="absolute inset-0 rounded-full overflow-hidden shadow-2xl"
                    style={{
                      background:
                        "linear-gradient(180deg, #0ABAB5 0%, #0ABAB5 50%, #f8fafc 50%, #e2e8f0 100%)",
                      border: "2px solid rgba(255,255,255,0.4)",
                    }}
                  >
                    {/* highlight */}
                    <div
                      className="absolute top-2 left-3 w-5 h-8 rounded-full opacity-70"
                      style={{ background: "rgba(255,255,255,0.6)", filter: "blur(2px)" }}
                    />
                    {/* seam */}
                    <div
                      className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px]"
                      style={{ background: "rgba(0,0,0,0.15)" }}
                    />
                  </div>
                </div>
              </div>
              <p className="mt-8 tracking-[0.4em] text-sm font-bold label-shine">
                OPENING
              </p>
            </div>
          )}

          {/* Result */}
          {phase === "result" && revealed && (() => {
            const d = describeGachaReward(revealed.reward_type, revealed.reward_amount, revealed.rarity);
            const color = GACHA_RARITY_COLOR[revealed.rarity];
            const gradient = GACHA_RARITY_GRADIENT[revealed.rarity];
            const isLegendary = revealed.rarity === "legendary";
            const isEpic = revealed.rarity === "epic";
            const isRare = revealed.rarity === "rare";
            const RewardIcon = d.iconKind === "coins" ? Coins : Zap;

            const glowClass = isLegendary
              ? "legendary-glow"
              : isEpic
              ? "epic-glow"
              : isRare
              ? "rare-glow"
              : "";

            // Particles for legendary
            const particles = isLegendary
              ? Array.from({ length: 18 }).map((_, i) => {
                  const angle = (i / 18) * Math.PI * 2;
                  const dist = 140 + Math.random() * 60;
                  const dx = Math.cos(angle) * dist;
                  const dy = Math.sin(angle) * dist;
                  const delay = Math.random() * 0.4;
                  return (
                    <span
                      key={i}
                      className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full"
                      style={{
                        background: "#FBBF24",
                        boxShadow: "0 0 8px 2px rgba(245,158,11,0.8)",
                        animation: `particle-rise 1.4s ease-out ${delay}s infinite`,
                        ["--dx" as any]: `${dx}px`,
                        ["--dy" as any]: `${dy}px`,
                      }}
                    />
                  );
                })
              : null;

            return (
              <div className="relative w-full max-w-sm flex flex-col items-center text-center">
                {/* particle layer */}
                {particles && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="relative w-1 h-1">{particles}</div>
                  </div>
                )}

                {/* Rarity label */}
                <div className="gacha-pop-soft" style={{ animationDelay: "0.05s" }}>
                  <p
                    className="text-xs font-extrabold tracking-[0.5em]"
                    style={{ color }}
                  >
                    {GACHA_RARITY_LABEL[revealed.rarity]}
                  </p>
                  <div
                    className="mx-auto mt-2 h-px w-16"
                    style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
                  />
                </div>

                {/* Reward icon */}
                <div className="relative mt-6 gacha-pop">
                  <div
                    className={`w-36 h-36 rounded-full flex items-center justify-center ${glowClass}`}
                    style={{
                      background: gradient,
                      border: "2px solid rgba(255,255,255,0.2)",
                    }}
                  >
                    <div
                      className="w-28 h-28 rounded-full flex items-center justify-center"
                      style={{
                        background: "rgba(0,0,0,0.18)",
                        backdropFilter: "blur(2px)",
                      }}
                    >
                      <RewardIcon className="w-14 h-14 text-white" strokeWidth={2.2} />
                    </div>
                  </div>
                </div>

                {/* Reward amount */}
                <p
                  className="mt-7 text-3xl font-extrabold text-white gacha-pop-soft"
                  style={{ animationDelay: "0.25s", letterSpacing: "0.01em" }}
                >
                  {d.name}
                </p>

                {/* Remaining */}
                <div
                  className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full gacha-pop-soft"
                  style={{
                    animationDelay: "0.4s",
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                >
                  <Ticket className="w-3.5 h-3.5 text-white/70" />
                  <span className="text-xs text-white/80">
                    残り <span className="font-bold text-white">{revealed.remaining}</span> 枚
                  </span>
                </div>

                {/* Buttons */}
                <div
                  className="mt-8 flex gap-3 w-full gacha-pop-soft"
                  style={{ animationDelay: "0.55s" }}
                >
                  {revealed.remaining > 0 && (
                    <Button
                      onClick={runSpin}
                      disabled={spinning}
                      className="flex-1 font-bold h-11 text-white border-0"
                      style={{ background: "linear-gradient(135deg, #0ABAB5, #06908C)" }}
                    >
                      <RotateCw className="w-4 h-4 mr-1.5" />
                      もう1回回す
                    </Button>
                  )}
                  <Button
                    onClick={close}
                    variant="outline"
                    className="flex-1 font-bold h-11 bg-transparent text-white border-white/25 hover:bg-white/10 hover:text-white"
                  >
                    <X className="w-4 h-4 mr-1.5" />
                    閉じる
                  </Button>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </>
  );
};

export default GachaCard;
