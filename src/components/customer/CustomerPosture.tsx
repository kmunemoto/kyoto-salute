import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Camera, Upload, Loader2, RotateCcw, AlertCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PostureFeedbackCard from "./posture/PostureFeedbackCard";
import SkeletalTypeCard from "./posture/SkeletalTypeCard";
import TrainingRecommendationCard from "./posture/TrainingRecommendationCard";
import { analyzePosture } from "./posture/postureAnalysis";
import { diagnoseSkeletalType } from "./posture/skeletalDiagnosis";
import type { Keypoint } from "./posture/types";

// BlazePose 33-keypoint skeleton edges
const SKELETON_EDGES: [number, number][] = [
  // Face
  [0, 1], [1, 2], [2, 3], [3, 7],
  [0, 4], [4, 5], [5, 6], [6, 8],
  [9, 10],
  // Shoulders
  [11, 12],
  // Left arm
  [11, 13], [13, 15],
  // Right arm
  [12, 14], [14, 16],
  // Left hand
  [15, 17], [15, 19], [15, 21],
  // Right hand
  [16, 18], [16, 20], [16, 22],
  // Torso
  [11, 23], [12, 24], [23, 24],
  // Left leg
  [23, 25], [25, 27],
  // Right leg
  [24, 26], [26, 28],
  // Left foot
  [27, 29], [29, 31], [27, 31],
  // Right foot
  [28, 30], [30, 32], [28, 32],
];

const MIN_SCORE = 0.3;

const CustomerPosture = () => {
  const { user } = useAuth();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [keypoints, setKeypoints] = useState<Keypoint[]>([]);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0, natW: 0, natH: 0 });
  const [saved, setSaved] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const detectorRef = useRef<any>(null);

  const getDetector = useCallback(async () => {
    if (detectorRef.current) return detectorRef.current;
    setModelLoading(true);
    try {
      const tf = await import("@tensorflow/tfjs");
      await tf.ready();
      const poseDetection = await import("@tensorflow-models/pose-detection");
      const detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.BlazePose,
        {
          runtime: "tfjs" as const,
          modelType: "lite",
        }
      );
      detectorRef.current = detector;
      return detector;
    } catch (e) {
      console.error("Model load error:", e);
      toast.error("AIモデルの読み込みに失敗しました");
      return null;
    } finally {
      setModelLoading(false);
    }
  }, []);

  const normalizeImage = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const tempImg = new Image();
      tempImg.onload = () => {
        const offscreen = document.createElement("canvas");
        offscreen.width = tempImg.naturalWidth;
        offscreen.height = tempImg.naturalHeight;
        const ctx = offscreen.getContext("2d");
        if (!ctx) { reject(new Error("Canvas context failed")); return; }
        // Drawing from <img> applies EXIF rotation automatically
        ctx.drawImage(tempImg, 0, 0);
        offscreen.toBlob((blob) => {
          URL.revokeObjectURL(tempImg.src);
          if (!blob) { reject(new Error("Blob creation failed")); return; }
          resolve(URL.createObjectURL(blob));
        }, "image/jpeg", 0.92);
      };
      tempImg.onerror = () => { URL.revokeObjectURL(tempImg.src); reject(new Error("Image load failed")); };
      tempImg.src = URL.createObjectURL(file);
    });
  }, []);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("画像ファイルを選択してください");
      return;
    }
    setKeypoints([]);
    try {
      const normalized = await normalizeImage(file);
      setImageUrl(normalized);
    } catch (e) {
      console.error("Image normalization error:", e);
      toast.error("画像の読み込みに失敗しました");
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = "";
  };

  const analyze = useCallback(async () => {
    if (!imgRef.current) return;
    setAnalyzing(true);
    try {
      const detector = await getDetector();
      if (!detector) return;
      const poses = await detector.estimatePoses(imgRef.current);
      if (poses.length === 0 || !poses[0].keypoints?.length) {
        toast.error("姿勢を検出できませんでした。全身が映った写真をお試しください。");
        return;
      }
      setKeypoints(poses[0].keypoints);
      toast.success("姿勢解析が完了しました！");
    } catch (e) {
      console.error("Pose estimation error:", e);
      toast.error("解析中にエラーが発生しました");
    } finally {
      setAnalyzing(false);
    }
  }, [getDetector]);

  const syncCanvasSize = useCallback(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img) return;
    const w = img.clientWidth;
    const h = img.clientHeight;
    setImgSize({
      w,
      h,
      natW: img.naturalWidth,
      natH: img.naturalHeight,
    });
    if (canvas) {
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    }
  }, []);

  const onImgLoad = useCallback(() => {
    syncCanvasSize();
    analyze();
  }, [analyze, syncCanvasSize]);

  // Resize handler
  useEffect(() => {
    const handleResize = () => syncCanvasSize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [syncCanvasSize]);

  // Draw skeleton
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || keypoints.length === 0 || imgSize.natW === 0) return;
    // Set canvas internal resolution to image's natural size
    canvas.width = imgSize.natW;
    canvas.height = imgSize.natH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw using raw coordinates — CSS handles scaling
    const lineW = Math.max(3, imgSize.natW / 200);
    const dotR = Math.max(5, imgSize.natW / 150);

    ctx.strokeStyle = "hsl(36, 50%, 55%)";
    ctx.lineWidth = lineW;
    ctx.lineCap = "round";
    for (const [i, j] of SKELETON_EDGES) {
      const a = keypoints[i];
      const b = keypoints[j];
      if (!a || !b) continue;
      if ((a.score ?? 1) < MIN_SCORE || (b.score ?? 1) < MIN_SCORE) continue;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    for (const kp of keypoints) {
      if ((kp.score ?? 1) < MIN_SCORE) continue;
      ctx.beginPath();
      ctx.arc(kp.x, kp.y, dotR, 0, 2 * Math.PI);
      ctx.fillStyle = "hsl(36, 40%, 42%)";
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = Math.max(2, lineW * 0.6);
      ctx.stroke();
    }
  }, [keypoints, imgSize]);

  const feedbacks = useMemo(
    () => (keypoints.length > 0 ? analyzePosture(keypoints, imgSize.natH) : []),
    [keypoints, imgSize.natH]
  );

  const skeletalDiagnosis = useMemo(
    () => (keypoints.length > 0 ? diagnoseSkeletalType(keypoints, imgSize.natH) : null),
    [keypoints, imgSize.natH]
  );

  /** Merge the photo and skeleton canvas into a single image blob */
  const captureOverlayBlob = useCallback(async (): Promise<Blob | null> => {
    const img = imgRef.current;
    const skeletonCanvas = canvasRef.current;
    if (!img || !skeletonCanvas) return null;

    const offscreen = document.createElement("canvas");
    offscreen.width = img.naturalWidth;
    offscreen.height = img.naturalHeight;
    const ctx = offscreen.getContext("2d");
    if (!ctx) return null;

    // Draw original image at natural size
    ctx.drawImage(img, 0, 0);
    // Draw skeleton canvas scaled up to natural size
    ctx.drawImage(skeletonCanvas, 0, 0, offscreen.width, offscreen.height);

    return new Promise((resolve) =>
      offscreen.toBlob((blob) => resolve(blob), "image/jpeg", 0.85)
    );
  }, []);

  const saveDiagnosis = useCallback(async () => {
    if (!user || !skeletalDiagnosis || saved) return;
    try {
      // 1. Capture overlay image
      let imageUrlToSave: string | null = null;
      const blob = await captureOverlayBlob();
      if (blob) {
        const fileName = `${user.id}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("posture-photos")
          .upload(fileName, blob, { contentType: "image/jpeg" });
        if (uploadError) {
          console.warn("Image upload failed:", uploadError);
        } else {
          imageUrlToSave = fileName;
        }
      }

      // 2. Save diagnosis record
      const { error } = await supabase.from("skeletal_diagnoses" as any).insert({
        user_id: user.id,
        skeletal_type: skeletalDiagnosis.type,
        confidence: skeletalDiagnosis.confidence,
        scores: skeletalDiagnosis.scores,
        metrics: skeletalDiagnosis.metrics,
        image_url: imageUrlToSave,
      });
      if (error) throw error;
      setSaved(true);
      toast.success("診断結果を保存しました");
    } catch (e) {
      console.error("Save diagnosis error:", e);
      toast.error("診断結果の保存に失敗しました");
    }
  }, [user, skeletalDiagnosis, saved, captureOverlayBlob]);

  const reset = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(null);
    setKeypoints([]);
    setSaved(false);
  };

  const isLoading = analyzing || modelLoading;

  return (
    <div className="px-4 py-4 space-y-4 slide-up">
      <h2 className="text-lg font-bold">姿勢チェック・骨格診断（AI）</h2>
      <p className="text-xs text-muted-foreground">
        全身が映った写真をアップロードすると、AIが33箇所の関節ポイントを解析し、姿勢チェックと骨格タイプ診断を行います。
      </p>

      {!imageUrl ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-col items-center gap-3">
              <Button onClick={() => fileRef.current?.click()} className="w-full" size="lg">
                <Upload className="w-4 h-4 mr-2" />
                写真をアップロード
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (fileRef.current) {
                    fileRef.current.setAttribute("capture", "environment");
                    fileRef.current.click();
                    fileRef.current.removeAttribute("capture");
                  }
                }}
                className="w-full"
                size="lg"
              >
                <Camera className="w-4 h-4 mr-2" />
                カメラで撮影
              </Button>
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>全身が映った正面の写真が最適です。骨格タイプ診断には肩・腰・足首が見える写真が必要です。</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <Card className="overflow-hidden">
            <div className="relative w-full">
              <img
                ref={imgRef}
                src={imageUrl}
                alt="姿勢解析用画像"
                className="block w-full h-auto"
                onLoad={onImgLoad}
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 pointer-events-none"
              />
              {isLoading && (
                <div className="absolute inset-0 bg-background/60 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-accent" />
                  <span className="text-sm font-medium">
                    {modelLoading ? "AIモデル読み込み中…" : "姿勢・骨格を解析中…"}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {keypoints.length > 0 && (
            <Card>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">
                  検出ポイント：{keypoints.filter((k) => (k.score ?? 1) >= MIN_SCORE).length} / {keypoints.length}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Skeletal type diagnosis */}
          <SkeletalTypeCard diagnosis={skeletalDiagnosis} />

          {/* Training recommendations */}
          <TrainingRecommendationCard skeletalType={skeletalDiagnosis?.type ?? null} />

          {/* Posture feedback */}
          <PostureFeedbackCard feedbacks={feedbacks} />

          <div className="flex gap-2">
            <Button variant="outline" onClick={reset} className="flex-1">
              <RotateCcw className="w-4 h-4 mr-1" />
              やり直す
            </Button>
            {skeletalDiagnosis && user && (
              <Button
                onClick={saveDiagnosis}
                disabled={saved}
                variant={saved ? "outline" : "default"}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-1" />
                {saved ? "保存済み" : "結果を保存"}
              </Button>
            )}
            <Button onClick={analyze} disabled={isLoading} variant="outline" className="flex-1">
              再解析
            </Button>
          </div>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />
    </div>
  );
};

export default CustomerPosture;
