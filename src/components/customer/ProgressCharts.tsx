import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Dumbbell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMeasurements } from "@/hooks/useMeasurements";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { subMonths, subYears, format } from "date-fns";

const PERIODS = [
  { label: "1ヶ月", value: "1m" },
  { label: "3ヶ月", value: "3m" },
  { label: "6ヶ月", value: "6m" },
  { label: "1年", value: "1y" },
  { label: "全期間", value: "all" },
] as const;

type PeriodValue = (typeof PERIODS)[number]["value"];

const EXERCISE_COLORS = ["#C4A265", "#6BA3BE", "#B07AA1", "#76B947", "#E8834A"];

function getPeriodStart(period: PeriodValue): Date | null {
  const now = new Date();
  switch (period) {
    case "1m": return subMonths(now, 1);
    case "3m": return subMonths(now, 3);
    case "6m": return subMonths(now, 6);
    case "1y": return subYears(now, 1);
    case "all": return null;
  }
}

interface SetData { set: number; weight: number; reps: number }

const ProgressCharts = () => {
  const { user } = useAuth();
  const { measurements } = useMeasurements(user?.id);
  const [period, setPeriod] = useState<PeriodValue>("3m");
  const [workouts, setWorkouts] = useState<
    { workout_date: string; weight: number | null; reps: number | null; sets: SetData[] | null; exercise_name: string }[]
  >([]);
  const [hiddenExercises, setHiddenExercises] = useState<Set<string>>(new Set());

  // Fetch workouts
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("workouts")
        .select("*, exercises(name)")
        .eq("user_id", user.id)
        .order("workout_date", { ascending: true });
      if (data) {
        setWorkouts(
          data.map((w: any) => ({
            workout_date: w.workout_date,
            weight: w.weight,
            reps: w.reps,
            sets: w.sets || (w.weight != null ? [{ set: 1, weight: w.weight, reps: w.reps }] : null),
            exercise_name: w.exercises?.name || "不明",
          }))
        );
      }
    })();
  }, [user]);

  const periodStart = getPeriodStart(period);

  // ---- Weight / Body Fat ----
  const filteredMeasurements = useMemo(() => {
    return measurements.filter((m) => {
      if (!periodStart) return true;
      return new Date(m.measured_date) >= periodStart;
    });
  }, [measurements, periodStart]);

  const weightChartData = useMemo(() => {
    return filteredMeasurements
      .filter((m) => m.weight != null || m.body_fat != null)
      .map((m) => {
        const d = new Date(m.measured_date);
        return {
          date: format(d, "M/d"),
          weight: m.weight,
          bodyFat: m.body_fat,
        };
      });
  }, [filteredMeasurements]);

  const weightFirst = weightChartData.length > 0 ? weightChartData[0] : null;
  const weightLast = weightChartData.length > 0 ? weightChartData[weightChartData.length - 1] : null;
  const weightDiff =
    weightFirst?.weight != null && weightLast?.weight != null
      ? (weightLast.weight - weightFirst.weight).toFixed(1)
      : null;
  const fatDiff =
    weightFirst?.bodyFat != null && weightLast?.bodyFat != null
      ? (weightLast.bodyFat - weightFirst.bodyFat).toFixed(1)
      : null;

  // ---- Training ----
  const filteredWorkouts = useMemo(() => {
    return workouts.filter((w) => {
      if (!periodStart) return true;
      return new Date(w.workout_date) >= periodStart;
    });
  }, [workouts, periodStart]);

  // Top exercises by frequency
  const topExercises = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredWorkouts.forEach((w) => {
      counts[w.exercise_name] = (counts[w.exercise_name] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);
  }, [filteredWorkouts]);

  // Chart data: date -> { exerciseName: maxWeight }
  const trainingChartData = useMemo(() => {
    const dateMap: Record<string, Record<string, number>> = {};
    filteredWorkouts.forEach((w) => {
      if (!topExercises.includes(w.exercise_name)) return;
      if (hiddenExercises.has(w.exercise_name)) return;
      const setsData = w.sets || (w.weight != null ? [{ set: 1, weight: w.weight!, reps: w.reps! }] : []);
      if (setsData.length === 0) return;
      const maxW = Math.max(...setsData.map((s) => s.weight));
      if (!dateMap[w.workout_date]) dateMap[w.workout_date] = {};
      const existing = dateMap[w.workout_date][w.exercise_name];
      if (!existing || maxW > existing) {
        dateMap[w.workout_date][w.exercise_name] = maxW;
      }
    });
    return Object.entries(dateMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => {
        const d = new Date(date);
        return { date: format(d, "M/d"), ...vals };
      });
  }, [filteredWorkouts, topExercises, hiddenExercises]);

  // Exercise summaries
  const exerciseSummaries = useMemo(() => {
    return topExercises.map((name) => {
      const exWorkouts = filteredWorkouts
        .filter((w) => w.exercise_name === name)
        .sort((a, b) => a.workout_date.localeCompare(b.workout_date));
      if (exWorkouts.length === 0) return { name, first: 0, max: 0, diff: 0 };
      const getMax = (w: (typeof exWorkouts)[0]) => {
        const setsData = w.sets || (w.weight != null ? [{ set: 1, weight: w.weight!, reps: w.reps! }] : []);
        return setsData.length > 0 ? Math.max(...setsData.map((s) => s.weight)) : 0;
      };
      const first = getMax(exWorkouts[0]);
      const last = getMax(exWorkouts[exWorkouts.length - 1]);
      return { name, first, max: last, diff: last - first };
    });
  }, [topExercises, filteredWorkouts]);

  const visibleExercises = topExercises.filter((n) => !hiddenExercises.has(n));

  const toggleExercise = (name: string) => {
    setHiddenExercises((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const hasWeightData = weightChartData.length > 0;
  const hasTrainingData = topExercises.length > 0;

  if (!hasWeightData && !hasTrainingData) return null;

  return (
    <div className="space-y-4">
      {/* Period Selector */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
              period === p.value
                ? "bg-[#C4A265] text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Weight / Body Fat Section */}
      {hasWeightData && (
        <section>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
            体重・体脂肪率
          </h2>

          {/* Summary chips */}
          {weightChartData.length >= 2 && (weightDiff || fatDiff) && (
            <div className="flex gap-3 mb-3">
              {weightDiff && (
                <div className="flex items-center gap-1">
                  {parseFloat(weightDiff) <= 0 ? (
                    <TrendingDown className="w-3.5 h-3.5 text-success" />
                  ) : (
                    <TrendingUp className="w-3.5 h-3.5 text-destructive" />
                  )}
                  <span
                    className={`text-sm font-bold ${
                      parseFloat(weightDiff) <= 0 ? "text-success" : "text-destructive"
                    }`}
                  >
                    {parseFloat(weightDiff) > 0 ? "+" : ""}
                    {weightDiff}kg
                  </span>
                </div>
              )}
              {fatDiff && (
                <div className="flex items-center gap-1">
                  {parseFloat(fatDiff) <= 0 ? (
                    <TrendingDown className="w-3.5 h-3.5 text-success" />
                  ) : (
                    <TrendingUp className="w-3.5 h-3.5 text-destructive" />
                  )}
                  <span
                    className={`text-sm font-bold ${
                      parseFloat(fatDiff) <= 0 ? "text-success" : "text-destructive"
                    }`}
                  >
                    {parseFloat(fatDiff) > 0 ? "+" : ""}
                    {fatDiff}%
                  </span>
                </div>
              )}
            </div>
          )}

          {weightChartData.length >= 2 ? (
            <Card>
              <CardContent className="p-4">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weightChartData}>
                      <defs>
                        <linearGradient id="pgWeightGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#C4A265" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#C4A265" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="pgFatGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#888" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#888" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: "#888" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        yAxisId="w"
                        tick={{ fontSize: 10, fill: "#888" }}
                        axisLine={false}
                        tickLine={false}
                        width={38}
                        unit="kg"
                        domain={["dataMin - 1", "dataMax + 1"]}
                      />
                      {weightChartData.some((d) => d.bodyFat != null) && (
                        <YAxis
                          yAxisId="f"
                          orientation="right"
                          tick={{ fontSize: 10, fill: "#888" }}
                          axisLine={false}
                          tickLine={false}
                          width={35}
                          unit="%"
                          domain={["dataMin - 1", "dataMax + 1"]}
                        />
                      )}
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "12px",
                          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                          fontSize: "12px",
                        }}
                      />
                      <Area
                        yAxisId="w"
                        type="monotone"
                        dataKey="weight"
                        stroke="#C4A265"
                        strokeWidth={2.5}
                        fill="url(#pgWeightGrad)"
                        isAnimationActive={false}
                        dot={{ r: 3, fill: "#C4A265", strokeWidth: 2, stroke: "hsl(var(--background))" }}
                        name="体重(kg)"
                        connectNulls
                      />
                      {weightChartData.some((d) => d.bodyFat != null) && (
                        <Area
                          yAxisId="f"
                          type="monotone"
                          dataKey="bodyFat"
                          stroke="#888"
                          strokeWidth={2}
                          fill="url(#pgFatGrad)"
                          isAnimationActive={false}
                          dot={{ r: 3, fill: "#888", strokeWidth: 2, stroke: "hsl(var(--background))" }}
                          name="体脂肪率(%)"
                          connectNulls
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-5 mt-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 rounded" style={{ background: "#C4A265" }} />
                    体重
                  </div>
                  {weightChartData.some((d) => d.bodyFat != null) && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-0.5 rounded" style={{ background: "#888" }} />
                      体脂肪率
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : weightChartData.length === 1 ? (
            <Card>
              <CardContent className="p-4 text-center text-sm text-muted-foreground">
                {weightChartData[0].weight != null && (
                  <p>体重: <span className="font-bold text-foreground">{weightChartData[0].weight}kg</span></p>
                )}
                {weightChartData[0].bodyFat != null && (
                  <p>体脂肪率: <span className="font-bold text-foreground">{weightChartData[0].bodyFat}%</span></p>
                )}
                <p className="text-xs mt-1">2件以上のデータでグラフが表示されます</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-4 text-center text-sm text-muted-foreground">
                この期間のデータはありません。別の期間を選択してください。
              </CardContent>
            </Card>
          )}
        </section>
      )}

      {/* Training Weight Section */}
      {hasTrainingData && (
        <section>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Dumbbell className="w-3.5 h-3.5" />
            トレーニング重量
          </h2>

          {/* Exercise summaries */}
          <div className="space-y-1 mb-3">
            {exerciseSummaries
              .filter((s) => !hiddenExercises.has(s.name))
              .map((s) => (
                <div key={s.name} className="flex items-center justify-between text-xs">
                  <span className="font-medium truncate mr-2">{s.name}</span>
                  <span className="shrink-0">
                    {s.first}kg → {s.max}kg
                    {s.diff !== 0 && (
                      <span
                        className={`ml-1 font-bold ${
                          s.diff > 0 ? "text-success" : "text-destructive"
                        }`}
                      >
                        ({s.diff > 0 ? "+" : ""}
                        {s.diff}kg{s.diff > 0 ? "↑" : "↓"})
                      </span>
                    )}
                  </span>
                </div>
              ))}
          </div>

          {trainingChartData.length >= 2 ? (
            <Card>
              <CardContent className="p-4">
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trainingChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: "#888" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "#888" }}
                        axisLine={false}
                        tickLine={false}
                        width={40}
                        unit="kg"
                        domain={["dataMin - 5", "dataMax + 5"]}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "12px",
                          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                          fontSize: "12px",
                        }}
                      />
                      {visibleExercises.map((name, i) => (
                        <Line
                          key={name}
                          type="monotone"
                          dataKey={name}
                          stroke={EXERCISE_COLORS[i % EXERCISE_COLORS.length]}
                          strokeWidth={2}
                          isAnimationActive={false}
                          dot={{ r: 3, fill: EXERCISE_COLORS[i % EXERCISE_COLORS.length], strokeWidth: 2, stroke: "hsl(var(--background))" }}
                          connectNulls
                          name={name}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Exercise filter */}
                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
                  {topExercises.map((name, i) => (
                    <label key={name} className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <Checkbox
                        checked={!hiddenExercises.has(name)}
                        onCheckedChange={() => toggleExercise(name)}
                        className="h-3.5 w-3.5"
                      />
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: EXERCISE_COLORS[i % EXERCISE_COLORS.length] }}
                      />
                      <span className="truncate max-w-[100px]">{name}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : filteredWorkouts.length > 0 ? (
            <Card>
              <CardContent className="p-4 text-center text-sm text-muted-foreground">
                データが2件以上あるとグラフが表示されます
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-4 text-center text-sm text-muted-foreground">
                この期間のデータはありません。別の期間を選択してください。
              </CardContent>
            </Card>
          )}
        </section>
      )}
    </div>
  );
};

export default ProgressCharts;
