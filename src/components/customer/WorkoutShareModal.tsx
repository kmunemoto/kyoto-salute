import { useEffect, useRef, useState } from "react";
import { X, Download, Share2, Loader2, Moon, Sun, Image as ImageIcon } from "lucide-react";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import WorkoutShareCard, { type ShareTheme } from "./WorkoutShareCard";
import type { WorkoutSession } from "@/lib/workoutShare";
import { useToast } from "@/hooks/use-toast";

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
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open || !session) return null;

  const renderCanvas = async (): Promise<HTMLCanvasElement | null> => {
    if (!cardRef.current) return null;
    return await html2canvas(cardRef.current, {
      backgroundColor: theme === "transparent" ? null : null,
      scale: 1,
      useCORS: true,
      allowTaint: false,
      logging: false,
      width: 1080,
      height: 1920,
    });
  };

  const handleDownload = async () => {
    setBusy(true);
    try {
      const canvas = await renderCanvas();
      if (!canvas) return;
      const link = document.createElement("a");
      link.download = `salute-workout-${session.date}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast({ title: "画像を保存しました" });
    } catch (e) {
      toast({ title: "画像の保存に失敗しました", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handleShare = async () => {
    setBusy(true);
    try {
      const canvas = await renderCanvas();
      if (!canvas) return;
      const blob: Blob | null = await new Promise((res) => canvas.toBlob((b) => res(b), "image/png"));
      if (!blob) throw new Error("blob failed");
      const file = new File([blob], `salute-workout-${session.date}.png`, { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Workout Complete",
          text: `${session.totalVolume.toLocaleString()}kg / ${session.exerciseCount}種目 完了！ #SaluteGoshonan`,
        });
      } else {
        const link = document.createElement("a");
        link.download = `salute-workout-${session.date}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        toast({ title: "共有に対応していないため、ダウンロードしました" });
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        toast({ title: "共有に失敗しました", variant: "destructive" });
      }
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
        background: "rgba(0,0,0,0.92)",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
      }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 sticky top-0 z-10" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
        <span className="text-white text-sm font-bold">トレーニング シェア</span>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-white/25"
          aria-label="閉じる"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Card preview area (scaled) */}
      <div className="flex-1 flex items-center justify-center px-4 py-4">
        <div
          style={{
            width: "min(360px, 90vw)",
            aspectRatio: "9 / 16",
            position: "relative",
            overflow: "hidden",
            borderRadius: 24,
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            background: theme === "transparent" ? "#333" : "transparent",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              transform: "scale(calc(min(360px, 90vw) / 1080))",
              transformOrigin: "top left",
            }}
          >
            <WorkoutShareCard
              ref={cardRef}
              session={session}
              theme={theme}
              streakWeeks={streakWeeks}
              totalSessions={totalSessions}
            />
          </div>
        </div>
      </div>

      {/* Theme switcher */}
      <div className="flex items-center justify-center gap-3 px-4 pb-3">
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
      <div className="px-4 pb-[max(env(safe-area-inset-bottom),16px)] flex gap-3">
        <Button
          variant="outline"
          className="flex-1 h-12 bg-white/15 text-white border-white/30 hover:bg-white/25 hover:text-white"
          onClick={handleDownload}
          disabled={busy}
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          画像を保存
        </Button>
        <Button
          variant="accent"
          className="flex-1 h-12"
          onClick={handleShare}
          disabled={busy}
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
          共有
        </Button>
      </div>
    </div>
  );
};

export default WorkoutShareModal;