import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { X, Download, Loader2, Moon, Sun, Image as ImageIcon, Camera } from "lucide-react";
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
  const [photoCompositeSrc, setPhotoCompositeSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Cleanup any blob URLs we create
  useEffect(() => {
    return () => {
      if (fullScreenImageSrc?.startsWith("blob:")) {
        URL.revokeObjectURL(fullScreenImageSrc);
      }
    };
  }, [fullScreenImageSrc]);

  // Cleanup composite blob URL
  useEffect(() => {
    return () => {
      if (photoCompositeSrc?.startsWith("blob:")) {
        URL.revokeObjectURL(photoCompositeSrc);
      }
    };
  }, [photoCompositeSrc]);

  // Reset composite when modal closes or session changes
  useEffect(() => {
    if (!open) {
      if (photoCompositeSrc?.startsWith("blob:")) {
        URL.revokeObjectURL(photoCompositeSrc);
      }
      setPhotoCompositeSrc(null);
    }
  }, [open]);

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

  const handleThemeChange = (k: ShareTheme) => {
    // Switching theme cancels photo composite mode
    if (photoCompositeSrc?.startsWith("blob:")) {
      URL.revokeObjectURL(photoCompositeSrc);
    }
    setPhotoCompositeSrc(null);
    setTheme(k);
  };

  const renderPhotoComposite = async (file: File): Promise<Blob> => {
    const photoUrl = URL.createObjectURL(file);
    try {
      const photo = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("photo load failed"));
        img.src = photoUrl;
      });

      // Wait for fonts before drawing text
      try {
        await (document as any).fonts?.ready;
      } catch {}

      const W = 1080;
      const H = 1920;
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d")!;

      // Cover-fit the photo
      const photoAspect = photo.width / photo.height;
      const canvasAspect = W / H;
      let sx = 0, sy = 0, sw = photo.width, sh = photo.height;
      if (photoAspect > canvasAspect) {
        sw = photo.height * canvasAspect;
        sx = (photo.width - sw) / 2;
      } else {
        sh = photo.width / canvasAspect;
        sy = (photo.height - sh) / 2;
      }
      ctx.drawImage(photo, sx, sy, sw, sh, 0, 0, W, H);

      // Dark overlay for legibility
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(0, 0, W, H);

      const FONT =
        "'Noto Sans JP', -apple-system, BlinkMacSystemFont, 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', sans-serif";

      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 2;

      // Time label
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.font = `300 32px ${FONT}`;
      ctx.fillText("トレーニング時間", W / 2, 320);

      // Time value
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 84px ${FONT}`;
      ctx.fillText(`${session.durationMin}分`, W / 2, 420);

      // Exercises
      const visible = session.exercises.slice(0, 6);
      let y = 560;
      for (const ex of visible) {
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `600 42px ${FONT}`;
        ctx.fillText(ex.exercise_name, W / 2, y);
        y += 56;
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.font = `400 34px ${FONT}`;
        ctx.fillText(`${ex.maxWeight}kg × ${ex.totalReps}`, W / 2, y);
        y += 80;
      }
      const hidden = session.exercises.length - visible.length;
      if (hidden > 0) {
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.font = `300 28px ${FONT}`;
        ctx.fillText(`+${hidden} more`, W / 2, y);
        y += 50;
      }

      // Date
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = `300 28px ${FONT}`;
      ctx.fillText(formatShareDate(session.date), W / 2, y + 30);

      // Footer
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      const footerY = H - 130;
      ctx.textAlign = "center";
      ctx.font = `700 36px ${FONT}`;
      const saluteText = "Salute";
      const goshoText = " 御所南";
      const sw2 = ctx.measureText(saluteText).width;
      const gw2 = ctx.measureText(goshoText).width;
      const totalW = sw2 + gw2;
      const startX = W / 2 - totalW / 2;
      ctx.textAlign = "left";
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 10;
      ctx.fillStyle = "#0ABAB5";
      ctx.fillText(saluteText, startX, footerY);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(goshoText, startX + sw2, footerY);

      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = `300 22px ${FONT}`;
      ctx.fillText("PERSONAL  GYM", W / 2, footerY + 36);

      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png", 0.95),
      );
      if (!blob) throw new Error("blob failed");
      return blob;
    } finally {
      URL.revokeObjectURL(photoUrl);
    }
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      const blob = await renderPhotoComposite(file);
      const url = URL.createObjectURL(blob);
      if (photoCompositeSrc?.startsWith("blob:")) {
        URL.revokeObjectURL(photoCompositeSrc);
      }
      setPhotoCompositeSrc(url);
    } catch (err) {
      console.error("[share] photo composite failed", err);
      toast({ title: "写真の読み込みに失敗しました", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handleSaveImage = async () => {
    if (busy) return;
    // If a photo composite is active, just open it full-screen
    if (photoCompositeSrc) {
      setFullScreenImageSrc(photoCompositeSrc);
      return;
    }
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