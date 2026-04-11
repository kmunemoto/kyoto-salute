import { useState, useEffect } from "react";
import { ArrowLeft, Save, Dumbbell, Weight, Activity, Plus, Trash2, CalendarDays, CreditCard, MessageSquare, CheckCircle2, X, Loader2, Utensils, Flame, Beef, Droplets, Wheat, Leaf, Pencil } from "lucide-react";
import { exerciseCategories } from "@/lib/dummyData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  clientBodyMetrics, clientChatMessages,
  planOptions, planPrices, PlanType, ChatMessage,
} from "@/lib/dummyData";
import { Switch } from "@/components/ui/switch";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { toast } from "sonner";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

interface TrainerClientDetailProps {
  clientId: string;
  onBack: () => void;
}

interface SetEntry {
  weight: string;
  reps: string;
}

interface ExerciseEntry {
  exerciseId: string;
  name: string;
  sets: SetEntry[];
}

interface ExerciseMaster {
  id: string;
  name: string;
  category: string;
}

interface WorkoutRecord {
  id: string;
  workout_date: string;
  exercise_id: string;
  weight: number | null;
  reps: number | null;
  sets: { set: number; weight: number; reps: number }[] | null;
  exercise_name?: string;
}

interface MealRecord {
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

const TrainerClientDetail = ({ clientId, onBack }: TrainerClientDetailProps) => {
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [clientPlan, setClientPlan] = useState<string>('');
  const [isPaid, setIsPaid] = useState(false);
  const [bodyWeight, setBodyWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [trainingDate, setTrainingDate] = useState(new Date().toISOString().slice(0, 10));
  const [exercises, setExercises] = useState<ExerciseEntry[]>([{ exerciseId: "", name: "", sets: [{ weight: "", reps: "" }] }]);
  const [memo, setMemo] = useState("");
  const [exerciseMasters, setExerciseMasters] = useState<ExerciseMaster[]>([]);
  const [showNewExercise, setShowNewExercise] = useState<number | null>(null);
  const [newExName, setNewExName] = useState("");
  const [workoutRecords, setWorkoutRecords] = useState<WorkoutRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clientMeals, setClientMeals] = useState<MealRecord[]>([]);
  const [loadingMeals, setLoadingMeals] = useState(true);
  const [clientBookings2, setClientBookings2] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [editRecord, setEditRecord] = useState<WorkoutRecord | null>(null);
  const [editSets, setEditSets] = useState<{ weight: string; reps: string }[]>([]);
  const [editExerciseId, setEditExerciseId] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WorkoutRecord | null>(null);

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", clientId)
        .maybeSingle();
      if (data) {
        setProfile(data);
        setClientPlan(data.plan || '初回無料体験');
        setIsPaid(data.paid_this_month);
      }
      setLoadingProfile(false);
    };
    fetchProfile();
  }, [clientId]);

  // Fetch exercises master
  useEffect(() => {
    const fetchExercises = async () => {
      const { data } = await supabase
        .from("exercises")
        .select("*")
        .order("category")
        .order("name");
      if (data) setExerciseMasters(data);
    };
    fetchExercises();
  }, []);

  // Fetch workout records
  useEffect(() => {
    const fetchRecords = async () => {
      const { data } = await supabase
        .from("workouts")
        .select("*, exercises(name)")
        .eq("user_id", clientId)
        .order("workout_date", { ascending: false })
        .limit(50);
      if (data) {
        setWorkoutRecords(data.map((w: any) => ({
          ...w,
          exercise_name: w.exercises?.name || "不明",
        })));
      }
      setLoadingRecords(false);
    };
    fetchRecords();
  }, [clientId]);

  // Fetch client meals
  useEffect(() => {
    const fetchMeals = async () => {
      const { data } = await supabase
        .from("meals")
        .select("*")
        .eq("user_id", clientId)
        .order("created_at", { ascending: false });
      if (data) {
        const { resolveMealPhotoUrls } = await import("@/lib/mealPhotoUrl");
        const resolved = await resolveMealPhotoUrls(data as MealRecord[]);
        setClientMeals(resolved);
      }
      setLoadingMeals(false);
    };
    fetchMeals();
  }, [clientId]);

  // Fetch client bookings from DB
  useEffect(() => {
    const fetchBookings = async () => {
      const { data } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_id", clientId)
        .order("booking_date", { ascending: true });
      if (data) {
        setClientBookings2(data.map((row) => {
          const dt = new Date(row.booking_date);
          const h = dt.getHours();
          const m = dt.getMinutes();
          const startTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
          const endMin = h * 60 + m + 60;
          const endTime = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;
          return {
            id: row.id,
            date: row.booking_date,
            startTime,
            endTime,
            status: row.status,
            booking_type: row.booking_type,
          };
        }));
      }
      setLoadingBookings(false);
    };
    fetchBookings();
  }, [clientId]);

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>顧客情報が見つかりません</p>
        <Button variant="ghost" onClick={onBack} className="mt-4">戻る</Button>
      </div>
    );
  }

  const displayName = profile.display_name || "名前未設定";
  const initial = displayName[0];

  const getPrice = (plan: string): number => {
    if (planPrices[plan as PlanType] !== undefined) return planPrices[plan as PlanType];
    const match = planOptions.find(p => p.startsWith(plan));
    if (match) return planPrices[match];
    return 0;
  };

  // Dummy data for non-DB features
  const metrics = clientBodyMetrics[clientId] || [];
  const bookings = clientBookings2;
  const messages = clientChatMessages[clientId] || [];

  const addExercise = () => setExercises([...exercises, { exerciseId: "", name: "", sets: [{ weight: "", reps: "" }] }]);
  const updateExerciseSet = (exIdx: number, setIdx: number, field: keyof SetEntry, value: string) => {
    const updated = [...exercises];
    const updatedSets = [...updated[exIdx].sets];
    updatedSets[setIdx] = { ...updatedSets[setIdx], [field]: value };
    updated[exIdx] = { ...updated[exIdx], sets: updatedSets };
    setExercises(updated);
  };
  const addSet = (exIdx: number) => {
    const updated = [...exercises];
    updated[exIdx] = { ...updated[exIdx], sets: [...updated[exIdx].sets, { weight: "", reps: "" }] };
    setExercises(updated);
  };
  const removeSet = (exIdx: number, setIdx: number) => {
    const updated = [...exercises];
    if (updated[exIdx].sets.length <= 1) return;
    updated[exIdx] = { ...updated[exIdx], sets: updated[exIdx].sets.filter((_, i) => i !== setIdx) };
    setExercises(updated);
  };
  const removeExercise = (i: number) => {
    if (exercises.length <= 1) return;
    setExercises(exercises.filter((_, idx) => idx !== i));
  };

  const handleSelectExercise = (i: number, exerciseId: string) => {
    if (exerciseId === "__new__") {
      setShowNewExercise(i);
      setNewExName("");
      return;
    }
    const master = exerciseMasters.find(e => e.id === exerciseId);
    if (master) {
      const updated = [...exercises];
      updated[i] = { ...updated[i], exerciseId: master.id, name: master.name };
      setExercises(updated);
    }
  };

  const handleAddNewExercise = async (i: number) => {
    if (!newExName.trim()) return;
    const { data, error } = await supabase
      .from("exercises")
      .insert({ name: newExName.trim(), category: "その他" })
      .select()
      .single();
    if (error) {
      toast.error("種目の追加に失敗しました");
      return;
    }
    setExerciseMasters(prev => [...prev, data]);
    const updated = [...exercises];
    updated[i] = { ...updated[i], exerciseId: data.id, name: data.name };
    setExercises(updated);
    setShowNewExercise(null);
    setNewExName("");
    toast.success(`「${data.name}」をマスターに追加しました`);
  };

  const handleSave = async () => {
    const validEntries = exercises.filter(ex => ex.exerciseId && ex.sets.some(s => s.weight && s.reps));
    if (validEntries.length === 0) {
      toast.error("種目・重量・回数をすべて入力してください");
      return;
    }
    setSaving(true);
    const rows = validEntries.map(ex => ({
      user_id: clientId,
      exercise_id: ex.exerciseId,
      weight: parseFloat(ex.sets[0].weight) || null,
      reps: parseInt(ex.sets[0].reps, 10) || null,
      sets: ex.sets.filter(s => s.weight && s.reps).map((s, i) => ({
        set: i + 1,
        weight: parseFloat(s.weight),
        reps: parseInt(s.reps, 10),
      })),
      workout_date: trainingDate,
    }));
    const { data, error } = await supabase.from("workouts").insert(rows as any).select("*, exercises(name)");
    if (error) {
      toast.error("保存に失敗しました");
      setSaving(false);
      return;
    }
    const newRecords = (data || []).map((w: any) => ({
      ...w,
      exercise_name: w.exercises?.name || "不明",
    }));
    setWorkoutRecords(prev => [...newRecords, ...prev]);
    setExercises([{ exerciseId: "", name: "", sets: [{ weight: "", reps: "" }] }]);
    setMemo("");
    setSaving(false);
    toast.success("記録を保存しました", { description: `${displayName}さんのトレーニング記録を保存しました` });
  };

  const handlePlanChange = async (v: string) => {
    const { error } = await supabase.from("profiles").update({ plan: v }).eq("user_id", clientId);
    if (error) { toast.error("プラン変更に失敗しました"); return; }
    setClientPlan(v as PlanType);
    toast.success(`${displayName}さんのプランを「${v}」に変更しました`);
  };

  const handlePaymentToggle = async (checked: boolean) => {
    const { error } = await supabase.from("profiles").update({ paid_this_month: checked }).eq("user_id", clientId);
    if (error) { toast.error("更新に失敗しました"); return; }
    setIsPaid(checked);
    toast.success(checked ? `${displayName}さんの今月分を「支払済」にしました` : `${displayName}さんの今月分を「未払い」に戻しました`);
  };
  const openEdit = (r: WorkoutRecord) => {
    setEditRecord(r);
    setEditExerciseId(r.exercise_id);
    const setsData = r.sets || (r.weight != null ? [{ set: 1, weight: r.weight, reps: r.reps }] : [{ set: 1, weight: 0, reps: 0 }]);
    setEditSets(setsData.map((s: any) => ({ weight: String(s.weight ?? ""), reps: String(s.reps ?? "") })));
  };

  const handleEditSave = async () => {
    if (!editRecord) return;
    setEditSaving(true);
    const validSets = editSets.filter(s => s.weight && s.reps);
    if (validSets.length === 0) { toast.error("セット情報を入力してください"); setEditSaving(false); return; }
    const setsJson = validSets.map((s, i) => ({ set: i + 1, weight: parseFloat(s.weight), reps: parseInt(s.reps, 10) }));
    const { error } = await supabase.from("workouts").update({
      exercise_id: editExerciseId,
      weight: setsJson[0].weight,
      reps: setsJson[0].reps,
      sets: setsJson,
    } as any).eq("id", editRecord.id);
    if (error) { toast.error("更新に失敗しました"); setEditSaving(false); return; }
    const master = exerciseMasters.find(e => e.id === editExerciseId);
    setWorkoutRecords(prev => prev.map(r => r.id === editRecord.id ? {
      ...r, exercise_id: editExerciseId, weight: setsJson[0].weight, reps: setsJson[0].reps, sets: setsJson,
      exercise_name: master?.name || r.exercise_name,
    } : r));
    setEditRecord(null);
    setEditSaving(false);
    toast.success("記録を更新しました");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("workouts").delete().eq("id", deleteTarget.id);
    if (error) { toast.error("削除に失敗しました"); return; }
    setWorkoutRecords(prev => prev.filter(r => r.id !== deleteTarget.id));
    setDeleteTarget(null);
    toast.success("記録を削除しました");
  };


  const groupedRecords = workoutRecords.reduce((acc, r) => {
    const dateKey = r.workout_date;
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(r);
    return acc;
  }, {} as Record<string, WorkoutRecord[]>);

  const sortedDates = Object.keys(groupedRecords).sort((a, b) => b.localeCompare(a));

  return (
    <div className="pb-24 md:pb-0">
      {/* Header */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 min-h-[44px]">
        <ArrowLeft className="w-4 h-4" />
        顧客一覧に戻る
      </button>

      <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl gym-gradient flex items-center justify-center text-primary-foreground font-bold text-base sm:text-lg shrink-0">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl font-bold truncate">{displayName}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{clientPlan}</p>
        </div>
      </div>

      {/* Plan */}
      <section className="mb-4 sm:mb-6">
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5" />
          契約プラン
        </h2>
        <Card>
          <CardContent className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            <div>
              <select
                value={clientPlan}
                onChange={(e) => handlePlanChange(e.target.value)}
                className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {planOptions.map((p) => (
                  <option key={p} value={p}>{p}（¥{planPrices[p as PlanType]?.toLocaleString() ?? 0}）</option>
                ))}
              </select>
              <p className="text-sm font-bold mt-2">月額: ¥{getPrice(clientPlan).toLocaleString()}</p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`w-4 h-4 ${isPaid ? 'text-success' : 'text-muted-foreground'}`} />
                <span className="text-sm font-medium">今月分 支払い状況</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold ${isPaid ? 'text-success' : 'text-destructive'}`}>
                  {isPaid ? '支払済' : '未払い'}
                </span>
                <Switch checked={isPaid} onCheckedChange={handlePaymentToggle} />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Tabbed sections */}
      <Tabs defaultValue="training" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="overview" className="text-[10px] sm:text-xs px-1">概要</TabsTrigger>
          <TabsTrigger value="training" className="text-[10px] sm:text-xs px-1">記録</TabsTrigger>
          <TabsTrigger value="meals" className="text-[10px] sm:text-xs px-1">食事</TabsTrigger>
          <TabsTrigger value="bookings" className="text-[10px] sm:text-xs px-1">予約</TabsTrigger>
          <TabsTrigger value="chat" className="text-[10px] sm:text-xs px-1">チャット</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          <section>
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              体重・体脂肪率推移
            </h2>
            <Card>
              <CardContent className="p-3 sm:p-4">
                {metrics.length > 0 ? (
                  <div className="h-40 sm:h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={metrics}>
                        <defs>
                          <linearGradient id={`wg-${clientId}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(36, 50%, 55%)" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="hsl(36, 50%, 55%)" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id={`fg-${clientId}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(210, 40%, 58%)" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="hsl(210, 40%, 58%)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 10%, 92%)" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(220, 6%, 55%)" axisLine={false} tickLine={false} />
                        <YAxis yAxisId="w" tick={{ fontSize: 10 }} stroke="hsl(220, 6%, 55%)" axisLine={false} tickLine={false} domain={['dataMin - 2', 'dataMax + 2']} unit="kg" width={38} />
                        <YAxis yAxisId="f" orientation="right" tick={{ fontSize: 10 }} stroke="hsl(220, 6%, 55%)" axisLine={false} tickLine={false} domain={['dataMin - 2', 'dataMax + 2']} unit="%" width={38} />
                        <Tooltip contentStyle={{ background: 'hsl(0,0%,100%)', border: 'none', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '11px' }} />
                        <Area yAxisId="w" type="monotone" dataKey="weight" stroke="hsl(36, 50%, 55%)" fill={`url(#wg-${clientId})`} strokeWidth={2} name="体重(kg)" />
                        <Area yAxisId="f" type="monotone" dataKey="bodyFat" stroke="hsl(210, 40%, 58%)" fill={`url(#fg-${clientId})`} strokeWidth={2} name="体脂肪率(%)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">データなし</p>
                )}
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Weight className="w-3.5 h-3.5" />
              今日の計測
            </h2>
            <Card>
              <CardContent className="p-3 sm:p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">体重 (kg)</label>
                    <Input type="number" step="0.1" placeholder="73.5" value={bodyWeight} onChange={(e) => setBodyWeight(e.target.value)} className="h-11" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">体脂肪率 (%)</label>
                    <Input type="number" step="0.1" placeholder="18.0" value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} className="h-11" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Recent records from DB */}
          <section>
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Dumbbell className="w-3.5 h-3.5" />
              最近のトレーニング記録
            </h2>
            {loadingRecords ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-accent" /></div>
            ) : sortedDates.length > 0 ? (
              <div className="space-y-2">
                {sortedDates.slice(0, 3).map((date) => (
                  <Card key={date}>
                    <CardContent className="p-3">
                      <p className="text-xs font-bold text-muted-foreground mb-1">
                        {format(new Date(date), "M月d日（E）", { locale: ja })}
                      </p>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {groupedRecords[date].map((r) => {
                          const setsData = r.sets || (r.weight != null ? [{ set: 1, weight: r.weight, reps: r.reps }] : []);
                          return (
                            <span key={r.id} className="text-xs bg-muted rounded-lg px-2 py-1">
                              {r.exercise_name} {setsData.map((s: any) => `${s.weight}kg×${s.reps}`).join(", ")}
                            </span>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card><CardContent className="p-4 text-sm text-muted-foreground text-center">記録なし</CardContent></Card>
            )}
          </section>
        </TabsContent>

        {/* Training input */}
        <TabsContent value="training" className="space-y-4">
          <Card>
            <CardContent className="p-3 sm:p-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" /> 日付
                </label>
                <Input type="date" value={trainingDate} onChange={(e) => setTrainingDate(e.target.value)} className="w-full sm:w-48 h-11" />
              </div>

              <div className="space-y-3">
                {exercises.map((ex, i) => (
                  <div key={i} className="rounded-xl border border-border p-3 bg-muted/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-muted-foreground">種目 {i + 1}</span>
                      {exercises.length > 1 && (
                        <button onClick={() => removeExercise(i)} className="text-destructive hover:text-destructive/80 transition-colors p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <select
                      value={ex.exerciseId || ""}
                      onChange={(e) => handleSelectExercise(i, e.target.value)}
                      className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <option value="" disabled>種目を選択</option>
                      {[...exerciseCategories].map((cat) => {
                        const catExercises = exerciseMasters.filter((e) => e.category === cat);
                        if (catExercises.length === 0) return null;
                        return (
                          <optgroup key={cat} label={cat}>
                            {catExercises.map((e) => (
                              <option key={e.id} value={e.id}>{e.name}</option>
                            ))}
                          </optgroup>
                        );
                      })}
                      <option value="__new__">＋ 新しい種目を追加</option>
                    </select>
                    {showNewExercise === i && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="新しい種目名を入力"
                          value={newExName}
                          onChange={(e) => setNewExName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleAddNewExercise(i); }}
                          className="flex-1 h-11"
                          autoFocus
                        />
                        <Button size="sm" variant="outline" className="h-11" onClick={() => handleAddNewExercise(i)}>
                          確定
                        </Button>
                        <Button size="sm" variant="ghost" className="h-11" onClick={() => setShowNewExercise(null)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    {ex.sets.map((s, si) => (
                      <div key={si} className="space-y-1">
                        {ex.sets.length > 1 && (
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-muted-foreground">セット {si + 1}</span>
                            <button onClick={() => removeSet(i, si)} className="text-destructive/60 hover:text-destructive transition-colors p-0.5">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-semibold text-muted-foreground mb-0.5 block">重量 (kg)</label>
                            <Input type="number" step="0.5" placeholder="60" value={s.weight} onChange={(e) => updateExerciseSet(i, si, "weight", e.target.value)} className="h-11" />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-muted-foreground mb-0.5 block">回数 (rep)</label>
                            <Input type="number" placeholder="10" value={s.reps} onChange={(e) => updateExerciseSet(i, si, "reps", e.target.value)} className="h-11" />
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addSet(i)}
                      className="w-full text-xs text-accent font-medium py-1.5 rounded-lg border border-dashed border-accent/40 hover:bg-accent/5 transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> セットを追加
                    </button>
                  </div>
                ))}
              </div>

              <Button variant="outline" size="sm" onClick={addExercise} className="w-full gap-1.5 h-11">
                <Plus className="w-3.5 h-3.5" />
                種目を追加する
              </Button>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">メモ</label>
                <Textarea placeholder="フォームの注意点、次回への引き継ぎなど..." value={memo} onChange={(e) => setMemo(e.target.value)} rows={3} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button variant="accent" size="lg" onClick={handleSave} disabled={saving} className="gap-2 w-full sm:w-auto">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              記録を保存
            </Button>
          </div>

          {/* Past records from DB */}
          {loadingRecords ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-accent" /></div>
          ) : sortedDates.length > 0 && (
            <section>
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">過去の記録</h2>
              <div className="space-y-2">
                {sortedDates.map((date) => (
                  <Card key={date}>
                    <CardContent className="p-3">
                      <p className="text-xs font-bold text-muted-foreground mb-1.5">
                        {format(new Date(date), "yyyy年M月d日（E）", { locale: ja })}
                      </p>
                      <div className="space-y-1.5">
                        {groupedRecords[date].map((r) => {
                          const setsData = r.sets || (r.weight != null ? [{ set: 1, weight: r.weight, reps: r.reps }] : []);
                          return (
                          <div key={r.id} className="flex items-center gap-2 text-sm">
                            <Dumbbell className="w-3 h-3 text-accent shrink-0" />
                            <span className="font-medium truncate">{r.exercise_name}</span>
                            <span className="text-muted-foreground whitespace-nowrap">
                              {setsData.map((s: any, si: number) => (
                                <span key={si}>{si > 0 && " / "}{s.weight}kg×{s.reps}</span>
                              ))}
                            </span>
                            <div className="ml-auto flex items-center gap-0.5 shrink-0">
                              <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="編集">
                                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                              </button>
                              <button onClick={() => setDeleteTarget(r)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors" title="削除">
                                <Trash2 className="w-3.5 h-3.5 text-destructive/70" />
                              </button>
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </TabsContent>

        {/* Meals */}
        <TabsContent value="meals" className="space-y-4">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Utensils className="w-3.5 h-3.5" />
            食事記録
          </h2>
          {loadingMeals ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-accent" /></div>
          ) : clientMeals.length > 0 ? (
            <div className="space-y-3">
              {clientMeals.map((meal) => (
                <Card key={meal.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="relative">
                      <img src={meal.resolved_image_url || meal.image_url} alt="食事写真" className="w-full h-40 object-cover" />
                      <div className="absolute top-2 left-2 bg-foreground/70 text-primary-foreground px-2 py-0.5 rounded-lg text-xs font-bold backdrop-blur-sm">
                        {meal.meal_type}
                      </div>
                      <div className="absolute top-2 right-2 bg-foreground/70 text-primary-foreground px-2 py-0.5 rounded-lg text-xs backdrop-blur-sm">
                        {new Date(meal.created_at).toLocaleDateString("ja-JP", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    {meal.analyzed ? (
                      <div className="p-3 space-y-2">
                        <div className="grid grid-cols-5 gap-1 text-center">
                          <div><Flame className="w-3.5 h-3.5 mx-auto text-destructive" /><p className="text-[10px] text-muted-foreground">カロリー</p><p className="text-xs font-bold">{meal.calories ?? 0}</p></div>
                          <div><Beef className="w-3.5 h-3.5 mx-auto text-accent" /><p className="text-[10px] text-muted-foreground">タンパク質</p><p className="text-xs font-bold">{meal.protein ?? 0}g</p></div>
                          <div><Droplets className="w-3.5 h-3.5 mx-auto text-warning" /><p className="text-[10px] text-muted-foreground">脂質</p><p className="text-xs font-bold">{meal.fat ?? 0}g</p></div>
                          <div><Wheat className="w-3.5 h-3.5 mx-auto text-info" /><p className="text-[10px] text-muted-foreground">炭水化物</p><p className="text-xs font-bold">{meal.carbs ?? 0}g</p></div>
                          <div><Leaf className="w-3.5 h-3.5 mx-auto text-success" /><p className="text-[10px] text-muted-foreground">食物繊維</p><p className="text-xs font-bold">{meal.fiber ?? 0}g</p></div>
                        </div>
                        {meal.feedback && (
                          <div className="bg-accent/10 rounded-lg p-2">
                            <p className="text-[10px] font-bold text-accent mb-0.5">🤖 AIアドバイス</p>
                            <p className="text-xs text-foreground leading-relaxed">{meal.feedback}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3 flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-xs">AI分析中...</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card><CardContent className="p-4 text-sm text-muted-foreground text-center">食事記録なし</CardContent></Card>
          )}
        </TabsContent>

        {/* Bookings */}
        <TabsContent value="bookings">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" />
            予約一覧
          </h2>
          {loadingBookings ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-accent" /></div>
          ) : bookings.length > 0 ? (
            <div className="space-y-2">
              {bookings.map((b: any) => (
                <Card key={b.id}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl accent-gradient flex items-center justify-center shrink-0">
                      <CalendarDays className="w-4 h-4 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">
                        {format(new Date(b.date), "M月d日（E）", { locale: ja })}
                      </p>
                      <p className="text-xs text-muted-foreground">{b.startTime}〜{b.endTime}</p>
                      {b.booking_type && (
                        <span className="text-[10px] text-muted-foreground">{b.booking_type}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card><CardContent className="p-4 text-sm text-muted-foreground text-center">予約なし</CardContent></Card>
          )}
        </TabsContent>

        {/* Chat */}
        <TabsContent value="chat">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            チャット履歴
          </h2>
          {messages.length > 0 ? (
            <div className="space-y-2">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'trainer' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    msg.sender === 'trainer'
                      ? 'bg-muted text-foreground rounded-bl-md'
                      : 'accent-gradient text-accent-foreground rounded-br-md'
                  }`}>
                    <p>{msg.text}</p>
                    <p className="text-[10px] opacity-60 mt-1">{msg.date} {msg.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card><CardContent className="p-4 text-sm text-muted-foreground text-center">メッセージなし</CardContent></Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit workout dialog */}
      <Dialog open={!!editRecord} onOpenChange={(open) => { if (!open) setEditRecord(null); }}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>記録を編集</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">種目</label>
              <select
                value={editExerciseId}
                onChange={(e) => setEditExerciseId(e.target.value)}
                className="w-full h-11 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {exerciseMasters.map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>
            {editSets.map((s, si) => (
              <div key={si} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">セット {si + 1}</span>
                  {editSets.length > 1 && (
                    <button onClick={() => setEditSets(prev => prev.filter((_, i) => i !== si))} className="text-destructive/60 hover:text-destructive p-0.5">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">重量 (kg)</label>
                    <Input type="number" step="0.5" value={s.weight} onChange={(e) => { const u = [...editSets]; u[si] = { ...u[si], weight: e.target.value }; setEditSets(u); }} className="h-11" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1 block">回数 (rep)</label>
                    <Input type="number" value={s.reps} onChange={(e) => { const u = [...editSets]; u[si] = { ...u[si], reps: e.target.value }; setEditSets(u); }} className="h-11" />
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setEditSets(prev => [...prev, { weight: "", reps: "" }])}
              className="w-full text-xs text-accent font-medium py-1.5 rounded-lg border border-dashed border-accent/40 hover:bg-accent/5 transition-colors flex items-center justify-center gap-1"
            >
              <Plus className="w-3 h-3" /> セットを追加
            </button>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setEditRecord(null)} className="w-full sm:w-auto">キャンセル</Button>
            <Button variant="accent" onClick={handleEditSave} disabled={editSaving || !editExerciseId || editSets.every(s => !s.weight || !s.reps)} className="w-full sm:w-auto">
              {editSaving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>この記録を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && (() => {
                const s = deleteTarget.sets || (deleteTarget.weight != null ? [{ set: 1, weight: deleteTarget.weight, reps: deleteTarget.reps }] : []);
                return `${deleteTarget.exercise_name} ${s.map((x: any) => `${x.weight}kg×${x.reps}`).join(", ")} の記録を削除します。この操作は取り消せません。`;
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">削除する</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TrainerClientDetail;
