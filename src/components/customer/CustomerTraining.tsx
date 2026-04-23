import { useState, useMemo, useEffect } from "react";
import { Dumbbell, TrendingUp, Calendar, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface SetData {
  set: number;
  weight: number;
  reps: number;
}

interface WorkoutWithExercise {
  id: string;
  workout_date: string;
  weight: number | null;
  reps: number | null;
  sets: SetData[] | null;
  exercise_name: string;
}

const CustomerTraining = () => {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<WorkoutWithExercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("workouts")
        .select("*, exercises(name)")
        .eq("user_id", user.id)
        .order("workout_date", { ascending: false })
        .limit(200);
      if (data) {
        setWorkouts(data.map((w: any) => ({
          id: w.id,
          workout_date: w.workout_date,
          weight: w.weight,
          reps: w.reps,
          sets: w.sets || (w.weight != null ? [{ set: 1, weight: w.weight, reps: w.reps }] : null),
          exercise_name: w.exercises?.name || "不明",
        })));
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const exerciseNames = useMemo(() => {
    const names = new Set<string>();
    workouts.forEach((w) => names.add(w.exercise_name));
    return Array.from(names).sort();
  }, [workouts]);

  const [selectedExercise, setSelectedExercise] = useState("");

  useEffect(() => {
    if (exerciseNames.length > 0 && !selectedExercise) {
      setSelectedExercise(exerciseNames[0]);
    }
  }, [exerciseNames, selectedExercise]);

  const chartData = useMemo(() => {
    const points: { date: string; weight: number; reps: number }[] = [];
    [...workouts].reverse().forEach((w) => {
      if (w.exercise_name === selectedExercise) {
        const setsData = w.sets || (w.weight != null ? [{ set: 1, weight: w.weight!, reps: w.reps! }] : []);
        if (setsData.length === 0) return;
        // Use max weight set for graph
        const best = setsData.reduce((a, b) => (b.weight > a.weight ? b : a), setsData[0]);
        if (best.weight == null || best.reps == null) return;
        const d = new Date(w.workout_date);
        points.push({
          date: `${d.getMonth() + 1}/${d.getDate()}`,
          weight: best.weight,
          reps: best.reps,
        });
      }
    });
    return points;
  }, [selectedExercise, workouts]);

  // Group by date for history
  const groupedByDate = useMemo(() => {
    const map: Record<string, WorkoutWithExercise[]> = {};
    workouts.forEach((w) => {
      if (!map[w.workout_date]) map[w.workout_date] = [];
      map[w.workout_date].push(w);
    });
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, [workouts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-5 slide-up">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl accent-gradient flex items-center justify-center">
          <Dumbbell className="w-4.5 h-4.5 text-accent-foreground" />
        </div>
        <h1 className="text-lg font-bold">トレーニング記録</h1>
      </div>

      {workouts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Dumbbell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">まだトレーニング記録がありません</p>
            <p className="text-xs mt-1">トレーナーが記録を入力すると、ここに表示されます</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Growth Chart */}
          <section>
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              成長グラフ
            </h2>
            <Card>
              <CardContent className="p-4 space-y-3">
                <Select value={selectedExercise} onValueChange={setSelectedExercise}>
                  <SelectTrigger className="w-full h-11 text-sm font-medium">
                    <SelectValue placeholder="種目を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {exerciseNames.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {chartData.length > 1 ? (
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                        <YAxis yAxisId="w" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} unit="kg" domain={["dataMin - 5", "dataMax + 5"]} width={45} />
                        <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} unit="回" width={40} />
                        <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: "12px" }} />
                        <Line key={`${selectedExercise}-weight`} yAxisId="w" type="monotone" dataKey="weight" stroke="hsl(174, 65%, 50%)" strokeWidth={2.5} isAnimationActive={false} dot={{ r: 5, fill: "hsl(174, 65%, 50%)", strokeWidth: 2, stroke: "hsl(var(--background))" }} activeDot={{ r: 7 }} name="重量(kg)" />
                        <Line key={`${selectedExercise}-reps`} yAxisId="r" type="monotone" dataKey="reps" stroke="hsl(210, 40%, 58%)" strokeWidth={2} strokeDasharray="5 5" isAnimationActive={false} dot={{ r: 4, fill: "hsl(210, 40%, 58%)", strokeWidth: 2, stroke: "hsl(var(--background))" }} name="回数" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">
                    データが2件以上あるとグラフが表示されます
                  </div>
                )}

                {chartData.length > 0 && (
                  <div className="flex justify-center gap-6 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-0.5 rounded bg-[hsl(174,65%,50%)]" />
                      重量(kg)
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-0.5 rounded bg-[hsl(210,80%,55%)] border-dashed" style={{ borderTop: "2px dashed hsl(210,80%,55%)", height: 0 }} />
                      回数
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* History List */}
          <section>
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              トレーニング履歴
            </h2>
            <div className="space-y-3">
              {groupedByDate.map(([date, records]) => {
                const d = new Date(date);
                const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
                const dateStr = `${d.getMonth() + 1}月${d.getDate()}日（${dayNames[d.getDay()]}）`;

                return (
                  <Card key={date} className="card-hover">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg gym-gradient flex items-center justify-center">
                          <Dumbbell className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <span className="font-bold text-sm">{dateStr}</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {records.length}種目
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {records.map((r) => {
                          const setsData = r.sets || (r.weight != null ? [{ set: 1, weight: r.weight!, reps: r.reps! }] : []);
                          return (
                          <div key={r.id} className="text-sm py-1.5 px-3 rounded-lg bg-muted/50">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{r.exercise_name}</span>
                              {setsData.length === 1 && (
                                <span className="text-muted-foreground">
                                  <span className="font-bold text-foreground">{setsData[0].weight}</span>kg ×{" "}
                                  <span className="font-bold text-foreground">{setsData[0].reps}</span>回
                                </span>
                              )}
                            </div>
                            {setsData.length > 1 && (
                              <div className="mt-1 space-y-0.5">
                                {setsData.map((s, si) => (
                                  <div key={si} className="flex items-center justify-between text-xs text-muted-foreground pl-2">
                                    <span>セット{s.set}</span>
                                    <span>
                                      <span className="font-bold text-foreground">{s.weight}</span>kg ×{" "}
                                      <span className="font-bold text-foreground">{s.reps}</span>回
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default CustomerTraining;
