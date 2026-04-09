import { CalendarDays, Flame, TrendingUp, Clock, ChevronRight, Award } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { customerUpcomingSessions, customerHistory, bodyMetrics } from "@/lib/dummyData";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const CustomerView = () => {
  return (
    <div className="min-h-screen bg-background pt-14 pb-6 px-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="gym-gradient rounded-2xl p-5 mb-6 text-primary-foreground">
        <p className="text-sm opacity-80">おはようございます</p>
        <h1 className="text-xl font-bold mt-1">田中 太郎さん</h1>
        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-1.5">
            <Award className="w-4 h-4" />
            <span className="text-sm font-medium">24回</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4" />
            <span className="text-sm font-medium">3週連続</span>
          </div>
        </div>
      </div>

      {/* Next Session */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
          <CalendarDays className="w-4 h-4" />
          次回の予約
        </h2>
        <div className="space-y-3">
          {customerUpcomingSessions.map((s) => (
            <Card key={s.id} className="border-l-4 border-l-accent shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{s.type}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.date} {s.time}</p>
                  <p className="text-xs text-muted-foreground">{s.trainer}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Body Metrics Chart */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4" />
          体重推移
        </h2>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bodyMetrics}>
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Line type="monotone" dataKey="weight" stroke="hsl(var(--accent))" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(var(--accent))" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between mt-3 text-center">
              <div>
                <p className="text-lg font-bold">73.8kg</p>
                <p className="text-xs text-muted-foreground">現在</p>
              </div>
              <div>
                <p className="text-lg font-bold text-success">-4.2kg</p>
                <p className="text-xs text-muted-foreground">変化</p>
              </div>
              <div>
                <p className="text-lg font-bold">18%</p>
                <p className="text-xs text-muted-foreground">体脂肪</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Training History */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          トレーニング履歴
        </h2>
        <div className="space-y-2">
          {customerHistory.map((h) => (
            <Card key={h.id} className="shadow-sm">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{h.type}</p>
                  <p className="text-xs text-muted-foreground">{h.date} · {h.duration}分</p>
                </div>
                <div className="flex items-center gap-1 text-accent">
                  <Flame className="w-3.5 h-3.5" />
                  <span className="text-sm font-semibold">{h.calories}kcal</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

export default CustomerView;
