import { useState } from "react";
import { ArrowLeft, Save, Dumbbell, Weight, Activity, Plus, Trash2, CalendarDays, CreditCard, MessageSquare, CheckCircle2 } from "lucide-react";
import { defaultExerciseMasters, exerciseCategories } from "@/lib/dummyData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  clients, clientBodyMetrics, clientTrainingRecords, clientBookings, clientChatMessages,
  planOptions, planPrices, clientPaymentStatus, PlanType, ChatMessage,
} from "@/lib/dummyData";
import { Switch } from "@/components/ui/switch";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { toast } from "sonner";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

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
  const [exercises, setExercises] = useState<ExerciseEntry[]>([{ name: "", weight: "", reps: "" }]);
  const [memo, setMemo] = useState("");
  const [isPaid, setIsPaid] = useState(clientPaymentStatus[clientId] || false);
  const [exerciseMasters] = useState(defaultExerciseMasters);
  const [showNewExercise, setShowNewExercise] = useState<number | null>(null);
  const [newExName, setNewExName] = useState("");

  if (!client) return null;

  const metrics = clientBodyMetrics[clientId] || [];
  const records = clientTrainingRecords[clientId] || [];
  const bookings = clientBookings[clientId] || [];
  const messages = clientChatMessages[clientId] || [];

  const addExercise = () => setExercises([...exercises, { name: "", weight: "", reps: "" }]);
  const updateExercise = (i: number, field: keyof ExerciseEntry, value: string) => {
    const updated = [...exercises];
    updated[i][field] = value;
    setExercises(updated);
  };
  const removeExercise = (i: number) => {
    if (exercises.length <= 1) return;
    setExercises(exercises.filter((_, idx) => idx !== i));
  };

  const handleSave = () => {
    toast.success("記録を保存しました", { description: `${client.name}さんのトレーニング記録を保存しました` });
  };

  return (
    <div className="pb-20 md:pb-0">
      {/* Header */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
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

      {/* Plan */}
      <section className="mb-6">
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5" />
          契約プラン
        </h2>
        <Card>
          <CardContent className="p-4 space-y-4">
            <div>
              <Select value={clientPlan} onValueChange={(v) => {
                setClientPlan(v as PlanType);
                toast.success(`${client.name}さんのプランを「${v}」に変更しました`);
              }}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {planOptions.map((p) => (
                    <SelectItem key={p} value={p}>{p}（¥{planPrices[p].toLocaleString()}）</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm font-bold mt-2">月額: ¥{planPrices[clientPlan].toLocaleString()}</p>
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
                <Switch
                  checked={isPaid}
                  onCheckedChange={(checked) => {
                    setIsPaid(checked);
                    toast.success(checked
                      ? `${client.name}さんの今月分を「支払済」にしました`
                      : `${client.name}さんの今月分を「未払い」に戻しました`
                    );
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Tabbed sections */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="overview" className="text-xs">概要</TabsTrigger>
          <TabsTrigger value="training" className="text-xs">トレーニング</TabsTrigger>
          <TabsTrigger value="bookings" className="text-xs">予約</TabsTrigger>
          <TabsTrigger value="chat" className="text-xs">チャット</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <section>
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                体重・体脂肪率推移
              </h2>
              <Card>
                <CardContent className="p-4">
                  {metrics.length > 0 ? (
                    <div className="h-48">
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
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(225, 8%, 52%)" axisLine={false} tickLine={false} />
                          <YAxis yAxisId="w" tick={{ fontSize: 11 }} stroke="hsl(225, 8%, 52%)" axisLine={false} tickLine={false} domain={['dataMin - 2', 'dataMax + 2']} unit="kg" />
                          <YAxis yAxisId="f" orientation="right" tick={{ fontSize: 11 }} stroke="hsl(225, 8%, 52%)" axisLine={false} tickLine={false} domain={['dataMin - 2', 'dataMax + 2']} unit="%" />
                          <Tooltip contentStyle={{ background: 'hsl(0,0%,100%)', border: 'none', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: '12px' }} />
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
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">体重 (kg)</label>
                      <Input type="number" step="0.1" placeholder="73.5" value={bodyWeight} onChange={(e) => setBodyWeight(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1 block">体脂肪率 (%)</label>
                      <Input type="number" step="0.1" placeholder="18.0" value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>

          {/* Recent training records */}
          <section>
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Dumbbell className="w-3.5 h-3.5" />
              最近のトレーニング記録
            </h2>
            {records.length > 0 ? (
              <div className="space-y-2">
                {records.slice(0, 3).map((r) => (
                  <Card key={r.id}>
                    <CardContent className="p-3">
                      <p className="text-xs font-bold text-muted-foreground mb-1">
                        {format(new Date(r.date), "M月d日（E）", { locale: ja })}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {r.exercises.map((ex, i) => (
                          <span key={i} className="text-xs bg-muted rounded-lg px-2 py-1">
                            {ex.name} {ex.weight}kg×{ex.reps}
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
            <CardContent className="p-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" /> 日付
                </label>
                <Input type="date" value={trainingDate} onChange={(e) => setTrainingDate(e.target.value)} className="w-48" />
              </div>

              <div className="space-y-3">
                {exercises.map((ex, i) => (
                  <div key={i} className="rounded-xl border border-border p-3 bg-muted/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-muted-foreground">種目 {i + 1}</span>
                      {exercises.length > 1 && (
                        <button onClick={() => removeExercise(i)} className="text-destructive hover:text-destructive/80 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Select
                        value={ex.name}
                        onValueChange={(v) => {
                          if (v === "__new__") {
                            setShowNewExercise(i);
                            setNewExName("");
                          } else {
                            updateExercise(i, "name", v);
                          }
                        }}
                      >
                        <SelectTrigger className="flex-1 h-11">
                          <SelectValue placeholder="種目を選択" />
                        </SelectTrigger>
                        <SelectContent>
                          {exerciseCategories.map((cat) => {
                            const catExercises = exerciseMasters.filter((e) => e.category === cat);
                            if (catExercises.length === 0) return null;
                            return (
                              <div key={cat}>
                                <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{cat}</div>
                                {catExercises.map((e) => (
                                  <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>
                                ))}
                              </div>
                            );
                          })}
                          <SelectItem value="__new__" className="text-accent font-semibold">＋ 新しい種目を追加</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {showNewExercise === i && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="新しい種目名を入力"
                          value={newExName}
                          onChange={(e) => setNewExName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && newExName.trim()) {
                              updateExercise(i, "name", newExName.trim());
                              setShowNewExercise(null);
                              setNewExName("");
                              toast.success(`「${newExName.trim()}」を設定しました`);
                            }
                          }}
                          className="flex-1"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (newExName.trim()) {
                              updateExercise(i, "name", newExName.trim());
                              setShowNewExercise(null);
                              setNewExName("");
                              toast.success(`「${newExName.trim()}」を設定しました`);
                            }
                          }}
                        >
                          確定
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setShowNewExercise(null)}>
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-muted-foreground mb-0.5 block">重量 (kg)</label>
                        <Input type="number" step="0.5" placeholder="60" value={ex.weight} onChange={(e) => updateExercise(i, "weight", e.target.value)} />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-muted-foreground mb-0.5 block">回数 (rep)</label>
                        <Input type="number" placeholder="10" value={ex.reps} onChange={(e) => updateExercise(i, "reps", e.target.value)} />
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
                <Textarea placeholder="フォームの注意点、次回への引き継ぎなど..." value={memo} onChange={(e) => setMemo(e.target.value)} rows={3} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button variant="accent" size="lg" onClick={handleSave} className="gap-2">
              <Save className="w-4 h-4" />
              記録を保存
            </Button>
          </div>

          {/* Past records */}
          {records.length > 0 && (
            <section>
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">過去の記録</h2>
              <div className="space-y-2">
                {records.map((r) => (
                  <Card key={r.id}>
                    <CardContent className="p-3">
                      <p className="text-xs font-bold text-muted-foreground mb-1.5">
                        {format(new Date(r.date), "yyyy年M月d日（E）", { locale: ja })}
                      </p>
                      <div className="space-y-1">
                        {r.exercises.map((ex, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <Dumbbell className="w-3 h-3 text-accent shrink-0" />
                            <span className="font-medium">{ex.name}</span>
                            <span className="text-muted-foreground">{ex.weight}kg × {ex.reps}rep</span>
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
                    <div className="w-10 h-10 rounded-xl accent-gradient flex items-center justify-center">
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
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
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
