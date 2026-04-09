import { useState, useRef } from "react";
import { Plus, Camera, Clock, Utensils } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Meal {
  id: string;
  type: "朝食" | "昼食" | "夕食" | "間食";
  imageUrl: string;
  note: string;
  time: string;
  date: string;
}

const dummyMeals: Meal[] = [
  { id: "1", type: "朝食", imageUrl: "", note: "オートミール、プロテイン、バナナ", time: "07:30", date: "4月9日" },
  { id: "2", type: "昼食", imageUrl: "", note: "鶏むね肉のサラダ、玄米おにぎり", time: "12:00", date: "4月9日" },
  { id: "3", type: "朝食", imageUrl: "", note: "卵焼き、味噌汁、ご飯", time: "07:15", date: "4月8日" },
  { id: "4", type: "昼食", imageUrl: "", note: "サーモン定食", time: "12:30", date: "4月8日" },
  { id: "5", type: "夕食", imageUrl: "", note: "ささみとブロッコリーの炒め物", time: "19:00", date: "4月8日" },
];

const mealTypeColors: Record<string, string> = {
  "朝食": "from-warning/20 to-accent/10",
  "昼食": "from-success/20 to-info/10",
  "夕食": "from-info/20 to-primary/10",
  "間食": "from-accent/20 to-warning/10",
};

const mealTypeEmoji: Record<string, string> = {
  "朝食": "🌅",
  "昼食": "☀️",
  "夕食": "🌙",
  "間食": "🍎",
};

const CustomerMeals = () => {
  const [meals, setMeals] = useState<Meal[]>(dummyMeals);
  const [selectedType, setSelectedType] = useState<Meal["type"]>("朝食");
  const [note, setNote] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    }
    e.target.value = "";
  };

  const handleSubmit = () => {
    const newMeal: Meal = {
      id: String(Date.now()),
      type: selectedType,
      imageUrl: previewUrl || "",
      note: note || "（メモなし）",
      time: new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }),
      date: "4月9日",
    };
    setMeals((prev) => [newMeal, ...prev]);
    setNote("");
    setPreviewUrl(null);
    setShowForm(false);
    toast.success("食事を記録しました！");
  };

  // Group by date
  const grouped = meals.reduce<Record<string, Meal[]>>((acc, meal) => {
    if (!acc[meal.date]) acc[meal.date] = [];
    acc[meal.date].push(meal);
    return acc;
  }, {});

  return (
    <div className="px-4 py-4 space-y-5 slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Utensils className="w-5 h-5 text-accent" />
            食事管理
          </h1>
          <p className="text-sm text-muted-foreground mt-1">食事を写真で記録しましょう</p>
        </div>
        <Button variant="accent" size="sm" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" />
          記録する
        </Button>
      </div>

      {/* Add Meal Form */}
      {showForm && (
        <Card className="border-accent/30 slide-up">
          <CardContent className="p-4 space-y-4">
            <p className="font-bold text-sm">食事を記録</p>

            {/* Meal Type Selector */}
            <div className="flex gap-2">
              {(["朝食", "昼食", "夕食", "間食"] as Meal["type"][]).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                    selectedType === type
                      ? "accent-gradient text-accent-foreground shadow-md"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {mealTypeEmoji[type]} {type}
                </button>
              ))}
            </div>

            {/* Photo Upload */}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            {previewUrl ? (
              <div className="relative rounded-xl overflow-hidden">
                <img src={previewUrl} alt="食事写真" className="w-full h-48 object-cover" />
                <button
                  onClick={() => { setPreviewUrl(null); }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-foreground/60 text-primary-foreground flex items-center justify-center text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 rounded-xl border-2 border-dashed border-border hover:border-accent flex flex-col items-center justify-center gap-2 transition-colors"
              >
                <Camera className="w-8 h-8 text-muted-foreground/40" />
                <span className="text-xs text-muted-foreground font-medium">写真を撮る / 選ぶ</span>
              </button>
            )}

            {/* Note */}
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="メニュー内容をメモ（例: 鶏むね肉のサラダ）"
              className="w-full bg-secondary rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent/30 transition-all placeholder:text-muted-foreground"
            />

            {/* Buttons */}
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" className="flex-1" onClick={() => { setShowForm(false); setPreviewUrl(null); setNote(""); }}>
                キャンセル
              </Button>
              <Button variant="accent" size="sm" className="flex-1" onClick={handleSubmit}>
                記録する
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Meal Timeline */}
      {Object.entries(grouped).map(([date, dateMeals]) => (
        <section key={date}>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">{date}</h2>
          <div className="space-y-2">
            {dateMeals.map((meal) => (
              <Card key={meal.id} className="card-hover overflow-hidden">
                <CardContent className="p-0 flex">
                  {/* Image */}
                  <div className="w-20 h-20 shrink-0">
                    {meal.imageUrl ? (
                      <img src={meal.imageUrl} alt={meal.note} className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${mealTypeColors[meal.type]} flex items-center justify-center`}>
                        <span className="text-2xl">{mealTypeEmoji[meal.type]}</span>
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 p-3 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-accent">{meal.type}</span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {meal.time}
                      </span>
                    </div>
                    <p className="text-sm font-medium mt-1 truncate">{meal.note}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default CustomerMeals;
