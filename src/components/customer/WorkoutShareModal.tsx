import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { X, Download, Loader2, Moon, Sun, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import WorkoutShareCard, { type ShareTheme } from "./WorkoutShareCard";
import { formatShareDate, type WorkoutSession } from "@/lib/workoutShare";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  open: boolean;
  onClose: () => void;
  session: WorkoutSession | null;
  streakWeeks: number;
  totalSessions: number;
}

const WorkoutShareModal = ({ open, onClose, session, streakWeeks, totalSessions }: Props) => {
  const [theme, setTheme] = useState<ShareTheme>("dark");
  const [busy, setBusy] = useState(false);
  const previewBoxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);
  const [fullScreenImageSrc, setFullScreenImageSrc] = useState<string | null>(null);
  const { toast } = useToast();

  // Cleanup any blob URLs we create
  useEffect(() => {
    return () => {
      if (fullScreenImageSrc?.startsWith("blob:")) {
        URL.revokeObjectURL(fullScreenImageSrc);
      }
    };
  }, [fullScreenImageSrc]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Compute scale so the card fits inside the available preview area
  useLayoutEffect(() => {
    if (!open) return;
    const compute = () => {
      const box = previewBoxRef.current;
      if (!box) return;
      const w = box.clientWidth;
      const h = box.clientHeight;
      if (w <= 0 || h <= 0) return;
      const s = Math.min(w / 1080, h / 1920);
      setScale(s > 0 ? s : 0.3);
    };
    compute();
    window.addEventListener("resize", compute);
    const t = setTimeout(compute, 50);
    return () => {
      window.removeEventListener("resize", compute);
      clearTimeout(t);
    };
  }, [open, session?.date]);

  if (!open || !session) return null;

  const handleSaveImage = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const payload = {
        exercises: session.exercises.slice(0, 6).map((ex) => ({
          name: ex.exercise_name,
          weight: ex.maxWeight,
          reps: ex.totalReps,
        })),
        date: formatShareDate(session.date),
        duration: session.durationMin,
        theme,
      };
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const token = authSession?.access_token ?? supabaseKey;
      const response = await fetch(
        `${supabaseUrl}/functions/v1/generate-share-image`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: supabaseKey,
          },
          body: JSON.stringify(payload),
        },
      );
      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(errText || "画像生成に失敗しました");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      if (fullScreenImageSrc?.startsWith("blob:")) {
        URL.revokeObjectURL(fullScreenImageSrc);
      }
      setFullScreenImageSrc(url);
    } catch (e) {
      console.error("[share] generate failed", e);
      toast({ title: "画像の生成に失敗しました", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(0,0,0,0.94)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", paddingTop: "max(env(safe-area-inset-top), 12px)" }}
      >
        <span className="text-white text-sm font-bold">トレーニング シェア</span>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-white/25"
          aria-label="閉じる"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Card preview area (scaled to fit) */}
      <div
        ref={previewBoxRef}
        id="share-card-preview"
        className="flex-1 min-h-0 flex items-center justify-center px-4 py-3"
      >
        <div
          style={{
            width: 1080 * scale,
            height: 1920 * scale,
            position: "relative",
            borderRadius: 24 * scale,
            overflow: "hidden",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
            background:
              theme === "transparent"
                ? "#333333"
                : "transparent",
          }}
        >
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              width: 1080,
              height: 1920,
            }}
          >
            <WorkoutShareCard
              session={session}
              theme={theme}
              streakWeeks={streakWeeks}
              totalSessions={totalSessions}
            />
          </div>
        </div>
      </div>

      {/* Theme switcher */}
      <div className="flex items-center justify-center gap-3 px-4 pb-3 shrink-0">
        {([
          { k: "dark" as const, icon: Moon, label: "Dark" },
          { k: "light" as const, icon: Sun, label: "Light" },
          { k: "transparent" as const, icon: ImageIcon, label: "透過" },
        ]).map(({ k, icon: Icon, label }) => (
          <button
            key={k}
            onClick={() => setTheme(k)}
            className={`flex items-center gap-1.5 px-4 h-10 rounded-full text-xs font-bold transition ${
              theme === k ? "bg-accent text-accent-foreground" : "bg-white/15 text-white hover:bg-white/25"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="px-4 pb-[max(env(safe-area-inset-bottom),16px)] shrink-0">
        <Button
          variant="accent"
          className="w-full h-12"
          onClick={handleSaveImage}
          disabled={busy}
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          画像を保存
        </Button>
      </div>

      {/* Full-screen loading overlay while the share image is being generated */}
      {busy && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 110,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            color: "#fff",
          }}
        >
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <p className="text-sm font-bold">シェア画像を生成中...</p>
        </div>
      )}

      {/* Full-screen image view for long-press save */}
      {fullScreenImageSrc && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 120,
            backgroundColor: "#000",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            paddingTop: "max(env(safe-area-inset-top), 20px)",
            paddingBottom: "max(env(safe-area-inset-bottom), 20px)",
          }}
        >
          <p style={{ color: "#aaa", fontSize: 14, marginBottom: 16, textAlign: "center" }}>
            ↓ 画像を長押しして「写真に追加」で保存
          </p>
          <img
            src={fullScreenImageSrc}
            alt="トレーニングシェア"
            style={{
              maxWidth: "100%",
              maxHeight: "70vh",
              borderRadius: 8,
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            }}
          />
          <button
            onClick={() => setFullScreenImageSrc(null)}
            style={{
              marginTop: 24,
              padding: "12px 60px",
              backgroundColor: "#0ABAB5",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            戻る
          </button>
        </div>
      )}
    </div>
  );
};

export default WorkoutShareModal;