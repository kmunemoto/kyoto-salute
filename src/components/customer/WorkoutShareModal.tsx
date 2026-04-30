import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { X, Download, Share2, Loader2, Moon, Sun, Image as ImageIcon } from "lucide-react";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import WorkoutShareCard, { type ShareTheme } from "./WorkoutShareCard";
import { type WorkoutSession } from "@/lib/workoutShare";
import { useToast } from "@/hooks/use-toast";
import { useGymSettings } from "@/hooks/useGymSettings";

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
  const { toast } = useToast();
  const { settings } = useGymSettings();

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

  // Capture the actual on-screen share card with html2canvas.
  // Returns a PNG data URL (base64).
  const captureCardDataUrl = async (): Promise<string> => {
    const element = document.getElementById("share-card-content");
    if (!element) throw new Error("share card element not found");

    const bg =
      theme === "dark"
        ? "#0F0F0F"
        : theme === "light"
          ? "#FAF9F6"
          : null; // null = transparent

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: bg,
      width: 1080,
      height: 1920,
      windowWidth: 1080,
      windowHeight: 1920,
      logging: false,
    });
    return canvas.toDataURL("image/png");
  };

  const openImageInNewTab = (dataUrl: string): boolean => {
    const w = window.open("", "_blank");
    if (!w) return false;
    w.document.write(`
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>トレーニングシェア</title>
  <style>
    body { margin: 0; padding: 16px; background: #000; display: flex; flex-direction: column; align-items: center; min-height: 100vh; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Hiragino Sans', sans-serif; }
    p { color: #fff; font-size: 15px; margin: 4px 0 14px; text-align: center; }
    img { max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    button { margin-top: 20px; padding: 12px 40px; background: #0ABAB5; color: #fff; border: none; border-radius: 8px; font-size: 16px; }
  </style>
</head>
<body>
  <p>↓ 画像を長押しして「写真に追加」で保存</p>
  <img src="${dataUrl}" alt="トレーニングシェア" />
  <button onclick="window.close()">閉じる</button>
</body>
</html>`);
    w.document.close();
    return true;
  };

  const handleDownload = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const dataUrl = await captureCardDataUrl();
      const opened = openImageInNewTab(dataUrl);
      if (!opened) {
        // ポップアップブロック時はモーダル内プレビューを画像に差し替え
        const preview = document.getElementById("share-card-preview");
        if (preview) {
          preview.innerHTML = "";
          const img = document.createElement("img");
          img.src = dataUrl;
          img.style.maxWidth = "100%";
          img.style.maxHeight = "100%";
          img.style.objectFit = "contain";
          preview.appendChild(img);
        }
        toast({ title: "画像を長押しして保存してください" });
      }
    } catch (e) {
      console.error("[share] capture failed", e);
      toast({ title: "画像の生成に失敗しました", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handleShare = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const dataUrl = await captureCardDataUrl();

      // Try Web Share API first (best UX on iOS Safari/PWA when supported)
      try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], `salute-workout-${session.date}.png`, {
          type: "image/png",
        });
        const canShareFiles = !!(
          navigator.canShare && navigator.canShare({ files: [file] })
        );
        if (canShareFiles && navigator.share) {
          await navigator.share({
            files: [file],
            title: "Salute御所南 トレーニング記録",
          });
          return;
        }
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        // fall through
      }

      // Fallback: open the image in a new tab for long-press save
      const opened = openImageInNewTab(dataUrl);
      if (!opened) {
        toast({ title: "ポップアップを許可してください", variant: "destructive" });
      }
    } catch (e: any) {
      console.error("[share] share failed", e);
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
      <div className="px-4 pb-[max(env(safe-area-inset-bottom),16px)] flex gap-3 shrink-0">
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
    </div>
  );
};

export default WorkoutShareModal;