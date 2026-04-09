import { useState, useEffect } from "react";
import { ArrowLeft, Save, Dumbbell, Weight, Activity, Plus, Trash2, CalendarDays, CreditCard, MessageSquare, CheckCircle2, X, Loader2, Utensils, Flame, Beef, Droplets, Wheat, Leaf, Pencil } from "lucide-react";
import { exerciseCategories } from "@/lib/dummyData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  clientBodyMetrics, clientBookings, clientChatMessages,
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

interface ExerciseEntry {
  exerciseId: string;
  name: string;
  weight: string;
  reps: string;
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
  exercise_name?: string;
}

interface MealRecord {
  id: string;
  image_url: string;
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
  const [clientPlan, setClientPlan] = useState<PlanType>('月4回プラン');
  const [isPaid, setIsPaid] = useState(false);
  const [bodyWeight, setBodyWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [trainingDate, setTrainingDate] = useState(new Date().toISOString().slice(0, 10));
  const [exercises, setExercises] = useState<ExerciseEntry[]>([{ exerciseId: "", name: "", weight: "", reps: "" }]);
  const [memo, setMemo] = useState("");
  const [exerciseMasters, setExerciseMasters] = useState<ExerciseMaster[]>([]);
  const [showNewExercise, setShowNewExercise] = useState<number | null>(null);
  const [newExName, setNewExName] = useState("");
  const [workoutRecords, setWorkoutRecords] = useState<WorkoutRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clientMeals, setClientMeals] = useState<MealRecord[]>([]);
  const [loadingMeals, setLoadingMeals] = useState(true);
  const [editRecord, setEditRecord] = useState<WorkoutRecord | null>(null);
  const [editWeight, setEditWeight] = useState("");
  const [editReps, setEditReps] = useState("");
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
        // Normalize plan name to match planOptions keys
        const matchedPlan = planOptions.find(p => p === data.plan || p.startsWith(data.plan)) || planOptions[0];
        setClientPlan(matchedPlan);
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
      if (data) setClientMeals(data as MealRecord[]);
      setLoadingMeals(false);
    };
    fetchMeals();
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
  const bookings = clientBookings[clientId] || [];
  const messages = clientChatMessages[clientId] || [];

  const addExercise = () => setExercises([...exercises, { exerciseId: "", name: "", weight: "", reps: "" }]);
  const updateExercise = (i: number, field: keyof ExerciseEntry, value: string) => {
    const updated = [...exercises];
    updated[i] = { ...updated[i], [field]: value };
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
    const validEntries = exercises.filter(ex => ex.exerciseId && ex.weight && ex.reps);
    if (validEntries.length === 0) {
      toast.error("種目・重量・回数をすべて入力してください");
      return;
    }
    setSaving(true);
    const rows = validEntries.map(ex => ({
      user_id: clientId,
      exercise_id: ex.exerciseId,
      weight: parseFloat(ex.weight),
      reps: parseInt(ex.reps, 10),
      workout_date: trainingDate,
    }));
    const { data, error } = await supabase.from("workouts").insert(rows).select("*, exercises(name)");
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
    setExercises([{ exerciseId: "", name: "", weight: "", reps: "" }]);
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
    setEditWeight(r.weight?.toString() || "");
    setEditReps(r.reps?.toString() || "");
  };

  const handleEditSave = async () => {
    if (!editRecord) return;
    setEditSaving(true);
    const { error } = await supabase.from("workouts").update({
      exercise_id: editExerciseId,
      weight: parseFloat(editWeight),
      reps: parseInt(editReps, 10),
    }).eq("id", editRecord.id);
    if (error) { toast.error("更新に失敗しました"); setEditSaving(false); return; }
    const master = exerciseMasters.find(e => e.id === editExerciseId);
    setWorkoutRecords(prev => prev.map(r => r.id === editRecord.id ? {
      ...r, exercise_id: editExerciseId, weight: parseFloat(editWeight), reps: parseInt(editReps, 10),
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
              <Select value={clientPlan} onValueChange={handlePlanChange}>
                <SelectTrigger className="w-full h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {planOptions.map((p) => (
                    <SelectItem key={p} value={p}>{p}（¥{planPrices[p].toLocaleString()}）</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                            <stop offset="0%" stopColor="hsl(18, 90%, 55%)" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="hsl(18, 90%, 55%)" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id={`fg-${clientId}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(210, 80%, 55%)" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="hsl(210, 80%, 55%)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 12%, 90%)" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(225, 8%, 52%)" axisLine={false} tickLine={false} />
                        <YAxis yAxisId="w" tick={{ fontSize: 10 }} stroke="hsl(225, 8%, 52%)" axisLine={false} tickLine={false} domain={['dataMin - 2', 'dataMax + 2']} unit="kg" width={38} />
                        <YAxis yAxisId="f" orientation="right" tick={{ fontSize: 10 }} stroke="hsl(225, 8%, 52%)" axisLine={false} tickLine={false} domain={['dataMin - 2', 'dataMax + 2']} unit="%" width={38} />
                        <Tooltip contentStyle={{ background: 'hsl(0,0%,100%)', border: 'none', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '11px' }} />
                        <Area yAxisId="w" type="monotone" dataKey="weight" stroke="hsl(18, 90%, 55%)" fill={`url(#wg-${clientId})`} strokeWidth={2} name="体重(kg)" />
                        <Area yAxisId="f" type="monotone" dataKey="bodyFat" stroke="hsl(210, 80%, 55%)" fill={`url(#fg-${clientId})`} strokeWidth={2} name="体脂肪率(%)" />
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
                        {groupedRecords[date].map((r) => (
                          <span key={r.id} className="text-xs bg-muted rounded-lg px-2 py-1">
                            {r.exercise_name} {r.weight}kg×{r.reps}
                          </span>
                        ))}
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
                    <Select
                      value={ex.exerciseId || undefined}
                      onValueChange={(v) => handleSelectExercise(i, v)}
                    >
                      <SelectTrigger className="w-full h-11">
                        <SelectValue placeholder="種目を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {[...exerciseCategories].map((cat) => {
                          const catExercises = exerciseMasters.filter((e) => e.category === cat);
                          if (catExercises.length === 0) return null;
                          return (
                            <div key={cat}>
                              <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{cat}</div>
                              {catExercises.map((e) => (
                                <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                              ))}
                            </div>
                          );
                        })}
                        <SelectItem value="__new__" className="text-accent font-semibold">＋ 新しい種目を追加</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-muted-foreground mb-0.5 block">重量 (kg)</label>
                        <Input type="number" step="0.5" placeholder="60" value={ex.weight} onChange={(e) => updateExercise(i, "weight", e.target.value)} className="h-11" />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-muted-foreground mb-0.5 block">回数 (rep)</label>
                        <Input type="number" placeholder="10" value={ex.reps} onChange={(e) => updateExercise(i, "reps", e.target.value)} className="h-11" />
                      </div>
                    </div>
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
                      <div className="space-y-1">
                        {groupedRecords[date].map((r) => (
                          <div key={r.id} className="flex items-center gap-2 text-sm flex-wrap">
                            <Dumbbell className="w-3 h-3 text-accent shrink-0" />
                            <span className="font-medium">{r.exercise_name}</span>
                            <span className="text-muted-foreground">{r.weight}kg × {r.reps}rep</span>
                          </div>
                        ))}
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
                      <img src={meal.image_url} alt="食事写真" className="w-full h-40 object-cover" />
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
          {bookings.length > 0 ? (
            <div className="space-y-2">
              {bookings.map((b) => (
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
    </div>
  );
};

export default TrainerClientDetail;
