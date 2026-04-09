import { useState } from "react";
import { ArrowLeft, Save, Dumbbell, Weight, Activity, Plus, Trash2, CalendarDays, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { clients, bodyMetrics, planOptions, PlanType } from "@/lib/dummyData";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { toast } from "sonner";

interface TrainerClientDetailProps {
  clientId: string;
  onBack: () => void;
}

interface ExerciseEntry {
  name: string;
  weight: string;
  reps: string;
}

const TrainerClientDetail = ({ clientId, onBack }: TrainerClientDetailProps) => {
  const client = clients.find(c => c.id === clientId);
  const [clientPlan, setClientPlan] = useState<PlanType>(client?.plan || '月4回プラン');
  const [bodyWeight, setBodyWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [trainingDate, setTrainingDate] = useState(new Date().toISOString().slice(0, 10));
  const [exercises, setExercises] = useState<ExerciseEntry[]>([
    { name: "", weight: "", reps: "" },
  ]);
  const [memo, setMemo] = useState("");

  if (!client) return null;

  const addExercise = () => {
    setExercises([...exercises, { name: "", weight: "", reps: "" }]);
  };

  const updateExercise = (index: number, field: keyof ExerciseEntry, value: string) => {
    const updated = [...exercises];
    updated[index][field] = value;
    setExercises(updated);
  };

  const removeExercise = (index: number) => {
    if (exercises.length <= 1) return;
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    toast.success("記録を保存しました", {
      description: `${client.name}さんのトレーニング記録を保存しました`,
    });
  };

  return (
    <div className="pb-20 md:pb-0">
      {/* Header */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        顧客一覧に戻る
      </button>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl gym-gradient flex items-center justify-center text-primary-foreground font-bold text-lg">
          {client.avatar}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{client.name}</h1>
          <p className="text-sm text-muted-foreground">{client.goal} · 入会 {client.memberSince}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-extrabold">{client.totalSessions}<span className="text-xs text-muted-foreground ml-0.5">回</span></p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Progress value={client.progress} className="h-1.5 w-16" />
            <span className="text-[10px] font-bold text-muted-foreground">{client.progress}%</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Body metrics chart */}
        <section>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            体重・体脂肪率推移
          </h2>
          <Card>
            <CardContent className="p-4">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={bodyMetrics}>
                    <defs>
                      <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(18, 90%, 55%)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(18, 90%, 55%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="fatGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(210, 80%, 55%)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(210, 80%, 55%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 12%, 90%)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(225, 8%, 52%)" axisLine={false} tickLine={false} />
                    <YAxis yAxisId="w" tick={{ fontSize: 11 }} stroke="hsl(225, 8%, 52%)" axisLine={false} tickLine={false} domain={['dataMin - 2', 'dataMax + 2']} unit="kg" />
                    <YAxis yAxisId="f" orientation="right" tick={{ fontSize: 11 }} stroke="hsl(225, 8%, 52%)" axisLine={false} tickLine={false} domain={['dataMin - 2', 'dataMax + 2']} unit="%" />
                    <Tooltip contentStyle={{ background: 'hsl(0,0%,100%)', border: 'none', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                    <Area yAxisId="w" type="monotone" dataKey="weight" stroke="hsl(18, 90%, 55%)" fill="url(#weightGrad)" strokeWidth={2} name="体重(kg)" />
                    <Area yAxisId="f" type="monotone" dataKey="bodyFat" stroke="hsl(210, 80%, 55%)" fill="url(#fatGrad)" strokeWidth={2} name="体脂肪率(%)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Body measurement input */}
        <section>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Weight className="w-3.5 h-3.5" />
            今日の計測
          </h2>
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">体重 (kg)</label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="73.5"
                    value={bodyWeight}
                    onChange={(e) => setBodyWeight(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">体脂肪率 (%)</label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="18.0"
                    value={bodyFat}
                    onChange={(e) => setBodyFat(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Training record */}
      <section className="mt-6">
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Dumbbell className="w-3.5 h-3.5" />
          トレーニング記録
        </h2>
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Date picker */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block flex items-center gap-1">
                <CalendarDays className="w-3 h-3" /> 日付
              </label>
              <Input
                type="date"
                value={trainingDate}
                onChange={(e) => setTrainingDate(e.target.value)}
                className="w-48"
              />
            </div>

            {/* Exercise entries */}
            <div className="space-y-3">
              {exercises.map((ex, i) => (
                <div key={i} className="rounded-xl border border-border p-3 bg-muted/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground">種目 {i + 1}</span>
                    {exercises.length > 1 && (
                      <button
                        onClick={() => removeExercise(i)}
                        className="text-destructive hover:text-destructive/80 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <Input
                    placeholder="種目名（例：ベンチプレス）"
                    value={ex.name}
                    onChange={(e) => updateExercise(i, "name", e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground mb-0.5 block">重量 (kg)</label>
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="60"
                        value={ex.weight}
                        onChange={(e) => updateExercise(i, "weight", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-muted-foreground mb-0.5 block">回数 (rep)</label>
                      <Input
                        type="number"
                        placeholder="10"
                        value={ex.reps}
                        onChange={(e) => updateExercise(i, "reps", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button variant="outline" size="sm" onClick={addExercise} className="w-full gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              種目を追加する
            </Button>

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">メモ</label>
              <Textarea
                placeholder="フォームの注意点、次回への引き継ぎなど..."
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Save button */}
      <div className="mt-6 flex justify-end">
        <Button variant="accent" size="lg" onClick={handleSave} className="gap-2">
          <Save className="w-4 h-4" />
          記録を保存
        </Button>
      </div>
    </div>
  );
};

export default TrainerClientDetail;
