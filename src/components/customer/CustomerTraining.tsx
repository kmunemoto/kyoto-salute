import { useState, useMemo } from "react";
import { Dumbbell, TrendingUp, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { trainingRecords } from "@/lib/dummyData";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";

const CustomerTraining = () => {
  // Extract all unique exercise names for the filter
  const exerciseNames = useMemo(() => {
    const names = new Set<string>();
    trainingRecords.forEach((r) => r.exercises.forEach((e) => names.add(e.name)));
    return Array.from(names).sort();
  }, []);

  const [selectedExercise, setSelectedExercise] = useState(exerciseNames[0] || "ベンチプレス");

  // Build chart data for selected exercise
  const chartData = useMemo(() => {
    const points: { date: string; weight: number; reps: number }[] = [];
    [...trainingRecords].reverse().forEach((record) => {
      record.exercises.forEach((ex) => {
        if (ex.name === selectedExercise) {
          const d = new Date(record.date);
          points.push({
            date: `${d.getMonth() + 1}/${d.getDate()}`,
            weight: ex.weight,
            reps: ex.reps,
          });
        }
      });
    });
    return points;
  }, [selectedExercise]);

  return (
    <div className="px-4 py-4 space-y-5 slide-up">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl accent-gradient flex items-center justify-center">
          <Dumbbell className="w-4.5 h-4.5 text-accent-foreground" />
        </div>
        <h1 className="text-lg font-bold">トレーニング記録</h1>
      </div>

      {/* Growth Chart */}
      <section>
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" />
          成長グラフ
        </h2>
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {exerciseNames.map((name) => {
                const isActive = selectedExercise === name;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setSelectedExercise(name)}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-border bg-background text-foreground hover:border-accent/50"
                    }`}
                  >
                    {name}
                  </button>
                );
              })}
            </div>

            {chartData.length > 1 ? (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <defs>
                      <linearGradient id="trainWeightGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(18, 90%, 55%)" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="hsl(18, 90%, 55%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="w"
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                      axisLine={false}
                      tickLine={false}
                      unit="kg"
                      domain={["dataMin - 5", "dataMax + 5"]}
                      width={45}
                    />
                    <YAxis
                      yAxisId="r"
                      orientation="right"
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                      axisLine={false}
                      tickLine={false}
                      unit="回"
                      width={40}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                        fontSize: "12px",
                      }}
                    />
                    <Line
                      key={`${selectedExercise}-weight`}
                      yAxisId="w"
                      type="monotone"
                      dataKey="weight"
                      stroke="hsl(18, 90%, 55%)"
                      strokeWidth={2.5}
                      isAnimationActive={false}
                      dot={{
                        r: 5,
                        fill: "hsl(18, 90%, 55%)",
                        strokeWidth: 2,
                        stroke: "hsl(var(--background))",
                      }}
                      activeDot={{ r: 7 }}
                      name="重量(kg)"
                    />
                    <Line
                      key={`${selectedExercise}-reps`}
                      yAxisId="r"
                      type="monotone"
                      dataKey="reps"
                      stroke="hsl(210, 80%, 55%)"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      isAnimationActive={false}
                      dot={{
                        r: 4,
                        fill: "hsl(210, 80%, 55%)",
                        strokeWidth: 2,
                        stroke: "hsl(var(--background))",
                      }}
                      name="回数"
                    />
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
                  <div className="w-3 h-0.5 rounded bg-[hsl(18,90%,55%)]" />
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
          {trainingRecords.map((record) => {
            const d = new Date(record.date);
            const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
            const dateStr = `${d.getMonth() + 1}月${d.getDate()}日（${dayNames[d.getDay()]}）`;

            return (
              <Card key={record.id} className="card-hover">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg gym-gradient flex items-center justify-center">
                      <Dumbbell className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <span className="font-bold text-sm">{dateStr}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {record.exercises.length}種目
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {record.exercises.map((ex, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-sm py-1.5 px-3 rounded-lg bg-muted/50"
                      >
                        <span className="font-medium">{ex.name}</span>
                        <span className="text-muted-foreground">
                          <span className="font-bold text-foreground">{ex.weight}</span>kg ×{" "}
                          <span className="font-bold text-foreground">{ex.reps}</span>回
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default CustomerTraining;
