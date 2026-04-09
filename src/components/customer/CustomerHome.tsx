import { TrendingDown, CalendarDays, Flame, Target, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { bodyMetrics, currentPlan, myBookings } from "@/lib/dummyData";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart } from "recharts";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

const planMaxSessions: Record<string, number> = {
  '月4回プラン': 4,
  '月6回プラン': 6,
  '月8回プラン': 8,
  '通い放題プラン (月15回まで)': 15,
};

const CustomerHome = () => {
  const latestMetric = bodyMetrics[bodyMetrics.length - 1];
  const firstMetric = bodyMetrics[0];
  const weightChange = (latestMetric.weight - firstMetric.weight).toFixed(1);
  const fatChange = (latestMetric.bodyFat - firstMetric.bodyFat).toFixed(1);

  // Dummy: current month usage count
  const usedSessions = 3;
  const maxSessions = planMaxSessions[currentPlan] || 4;

  return (
    <div className="px-4 py-4 space-y-5 slide-up">
      {/* Greeting Header */}
      <div className="gym-gradient rounded-2xl p-5 text-primary-foreground relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-accent/10 -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-accent/5 translate-y-6 -translate-x-4" />
        <div className="relative">
          <p className="text-sm opacity-75">Good Morning 🔥</p>
          <h1 className="text-xl font-bold mt-1">田中 太郎さん</h1>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-1.5 bg-primary-foreground/15 rounded-full px-3 py-1">
              <Target className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">24回達成</span>
            </div>
            <div className="flex items-center gap-1.5 bg-primary-foreground/15 rounded-full px-3 py-1">
              <Flame className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">3週連続</span>
            </div>
          </div>
        </div>
      </div>

      {/* Plan badge */}
      <Card className="border-l-4 border-l-accent bg-accent/5">
        <CardContent className="p-3 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-accent" />
          <span className="text-sm font-bold">現在のプラン：{currentPlan}</span>
        </CardContent>
      </Card>

      {/* Next Booking */}
      <section>
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5" />
          次回の予約
        </h2>
        <Card className="card-hover border-l-4 border-l-accent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-base">上半身トレーニング</p>
                <p className="text-sm text-muted-foreground mt-1">4月9日（水）10:00 - 11:00</p>
                <p className="text-xs text-muted-foreground mt-0.5">山本 コーチ</p>
              </div>
              <div className="w-12 h-12 rounded-xl accent-gradient flex items-center justify-center pulse-glow">
                <CalendarDays className="w-5 h-5 text-accent-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="card-hover">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-extrabold">{latestMetric.weight}<span className="text-sm font-medium text-muted-foreground">kg</span></p>
            <p className="text-xs text-muted-foreground mt-1">現在の体重</p>
            <div className="flex items-center justify-center gap-1 mt-1.5">
              <TrendingDown className="w-3 h-3 text-success" />
              <span className="text-xs font-bold text-success">{weightChange}kg</span>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-extrabold">{latestMetric.bodyFat}<span className="text-sm font-medium text-muted-foreground">%</span></p>
            <p className="text-xs text-muted-foreground mt-1">体脂肪率</p>
            <div className="flex items-center justify-center gap-1 mt-1.5">
              <TrendingDown className="w-3 h-3 text-success" />
              <span className="text-xs font-bold text-success">{fatChange}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weight Chart */}
      <section>
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">体重推移</h2>
        <Card>
          <CardContent className="p-4">
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={bodyMetrics}>
                  <defs>
                    <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(18, 90%, 55%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(18, 90%, 55%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(225, 8%, 52%)" axisLine={false} tickLine={false} />
                  <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 11 }} stroke="hsl(225, 8%, 52%)" axisLine={false} tickLine={false} width={35} />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(0, 0%, 100%)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      fontSize: '12px',
                    }}
                  />
                  <Area type="monotone" dataKey="weight" stroke="hsl(18, 90%, 55%)" strokeWidth={2.5} fill="url(#weightGradient)" dot={{ r: 4, fill: "hsl(18, 90%, 55%)", strokeWidth: 2, stroke: "hsl(0, 0%, 100%)" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Body Fat Chart */}
      <section>
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">体脂肪率推移</h2>
        <Card>
          <CardContent className="p-4">
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={bodyMetrics}>
                  <defs>
                    <linearGradient id="fatGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(210, 80%, 55%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(210, 80%, 55%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(225, 8%, 52%)" axisLine={false} tickLine={false} />
                  <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 11 }} stroke="hsl(225, 8%, 52%)" axisLine={false} tickLine={false} width={35} />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(0, 0%, 100%)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      fontSize: '12px',
                    }}
                  />
                  <Area type="monotone" dataKey="bodyFat" stroke="hsl(210, 80%, 55%)" strokeWidth={2.5} fill="url(#fatGradient)" dot={{ r: 4, fill: "hsl(210, 80%, 55%)", strokeWidth: 2, stroke: "hsl(0, 0%, 100%)" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default CustomerHome;
