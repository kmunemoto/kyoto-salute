import { useState, useRef, useEffect } from "react";
import { Camera, Loader2, Utensils, Flame, Beef, Droplets, Wheat, Leaf } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { resolveMealPhotoUrls } from "@/lib/mealPhotoUrl";

interface Meal {
  id: string;
  image_url: string;
  resolved_image_url?: string;
  meal_type: string;
  calories: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
  fiber: number | null;
  feedback: string | null;
  analyzed: boolean;
  created_at: string;
}

const mealTypeEmoji: Record<string, string> = {
  "朝食": "🌅",
  "昼食": "☀️",
  "夕食": "🌙",
  "間食": "🍎",
  "食事": "🍽️",
};

const CustomerMeals = () => {
  const { user } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMeals = async () => {
    const { data, error } = await supabase
      .from("meals")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      const resolved = await resolveMealPhotoUrls(data as Meal[]);
      setMeals(resolved);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMeals();
  }, []);

  const convertToJpeg = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      if (file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/webp" || file.type === "image/gif") {
        resolve(file);
        return;
      }
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas not supported")); return; }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          if (!blob) { reject(new Error("Conversion failed")); return; }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
        }, "image/jpeg", 0.9);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image load failed")); };
      img.src = url;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setUploading(true);
    try {
      // Convert to JPEG if needed (HEIC etc.)
      const convertedFile = await convertToJpeg(file);

      // Upload to storage (user-scoped path)
      const storagePath = `${user!.id}/${Date.now()}-${convertedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("meal-photos")
        .upload(storagePath, convertedFile);
      if (uploadError) throw uploadError;

      // Insert meal record with storage path
      const { data: mealData, error: insertError } = await supabase
        .from("meals")
        .insert({ image_url: storagePath, user_id: user?.id })
        .select()
        .single();
      if (insertError) throw insertError;

      const { getMealPhotoUrl } = await import("@/lib/mealPhotoUrl");
      const resolvedUrl = await getMealPhotoUrl(storagePath);
      const newMeal = { ...mealData as Meal, resolved_image_url: resolvedUrl };
      setMeals((prev) => [newMeal, ...prev]);
      toast.success("写真をアップロードしました。AI分析中...");

      // Trigger AI analysis
      const { data: fnData, error: fnError } = await supabase.functions.invoke("analyze-meal", {
        body: { mealId: newMeal.id, imageUrl: storagePath },
      });

      const isFallback = fnError || fnData?.fallback || fnData?.error;

      if (isFallback) {
        console.warn("AI analysis failed, using dummy data:", fnError || fnData?.error);
        // Fallback: update with dummy data so UI doesn't stay stuck
        const dummyAnalysis = {
          meal_type: "食事",
          calories: 500,
          protein: 20.0,
          fat: 15.0,
          carbs: 60.0,
          fiber: 5.0,
          feedback: "AI分析に一時的に接続できませんでした。ダミーデータを表示しています。",
          analyzed: true,
        };
        await supabase.from("meals").update(dummyAnalysis).eq("id", newMeal.id);
        toast.info("ダミーの分析結果を表示しています");
        fetchMeals();
      } else {
        toast.success("AI分析が完了しました！");
        fetchMeals();
      }
    } catch (err) {
      console.error(err);
      toast.error("アップロードに失敗しました");
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  return (
    <div className="px-4 py-4 space-y-5 slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Utensils className="w-5 h-5 text-accent" />
            食事管理
          </h1>
          <p className="text-sm text-muted-foreground mt-1">写真を撮るだけでAIが自動分析</p>
        </div>
        <Button
          variant="accent"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          {uploading ? "分析中..." : "写真を撮る"}
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : meals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Camera className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">食事の写真を撮って記録を始めましょう</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {meals.map((meal) => (
            <Card key={meal.id} className="overflow-hidden card-hover">
              <CardContent className="p-0">
                {/* Photo */}
                <div className="relative">
                  <img
                    src={meal.resolved_image_url || meal.image_url}
                    alt="食事写真"
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-foreground/70 text-primary-foreground px-2.5 py-1 rounded-lg text-xs font-bold backdrop-blur-sm">
                    {mealTypeEmoji[meal.meal_type] || "🍽️"} {meal.meal_type}
                  </div>
                  <div className="absolute top-2 right-2 bg-foreground/70 text-primary-foreground px-2.5 py-1 rounded-lg text-xs backdrop-blur-sm">
                    {formatDate(meal.created_at)}
                  </div>
                </div>

                {/* Analysis Results */}
                {meal.analyzed ? (
                  <div className="p-4 space-y-3">
                    {/* Nutrient Grid */}
                    <div className="grid grid-cols-5 gap-2">
                      <NutrientBadge icon={Flame} label="カロリー" value={`${meal.calories ?? 0}`} unit="kcal" color="text-destructive" />
                      <NutrientBadge icon={Beef} label="タンパク質" value={`${meal.protein ?? 0}`} unit="g" color="text-accent" />
                      <NutrientBadge icon={Droplets} label="脂質" value={`${meal.fat ?? 0}`} unit="g" color="text-warning" />
                      <NutrientBadge icon={Wheat} label="炭水化物" value={`${meal.carbs ?? 0}`} unit="g" color="text-info" />
                      <NutrientBadge icon={Leaf} label="食物繊維" value={`${meal.fiber ?? 0}`} unit="g" color="text-success" />
                    </div>

                    {/* AI Feedback */}
                    {meal.feedback && (
                      <div className="bg-accent/10 rounded-xl p-3">
                        <p className="text-xs font-bold text-accent mb-1">🤖 AIアドバイス</p>
                        <p className="text-sm text-foreground leading-relaxed">{meal.feedback}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">AI分析中...</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const NutrientBadge = ({
  icon: Icon,
  label,
  value,
  unit,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  unit: string;
  color: string;
}) => (
  <div className="text-center">
    <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
    <p className="text-xs text-muted-foreground leading-none mb-0.5">{label}</p>
    <p className="text-sm font-bold">{value}</p>
    <p className="text-[10px] text-muted-foreground">{unit}</p>
  </div>
);

export default CustomerMeals;
