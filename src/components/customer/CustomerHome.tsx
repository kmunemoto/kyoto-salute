import { TrendingDown, TrendingUp, CalendarDays, Flame, Target, CreditCard, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart } from "recharts";
import { useProfile } from "@/hooks/useProfile";
import { useMyBookings } from "@/hooks/useBookings";
import { useMeasurements } from "@/hooks/useMeasurements";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { format, parseISO, addMonths, differenceInDays } from "date-fns";
import { ja } from "date-fns/locale";

const planMaxSessions: Record<string, number> = {
  '月4回': 4,
  '月6回': 6,
  '月8回': 8,
  '通い放題': 15,
};

const CustomerHome = () => {
  const { user } = useAuth();
  const { profile, loading } = useProfile();
  const { bookings, loading: bookingsLoading } = useMyBookings();
  const { chartData, latest, loading: metricsLoading } = useMeasurements(user?.id);

  const displayName = profile?.display_name || "ゲスト";
  const currentPlan = profile?.plan;
  const hasPlan = !!currentPlan && currentPlan !== '初回無料体験';

  // Filter future bookings only
  const now = new Date();
  const todayStr = format(now, "yyyy-MM-dd");
  const nowTimeStr = format(now, "HH:mm");

  const futureBookings = bookings.filter((b) => {
    if (b.status === "キャンセル済み") return false;
    if (b.date > todayStr) return true;
    if (b.date === todayStr && b.startTime > nowTimeStr) return true;
    return false;
  });

  const nextBooking = futureBookings.length > 0 ? futureBookings[0] : null;

  // Count this month's completed/upcoming sessions
  const currentMonth = format(now, "yyyy-MM");
  const monthSessions = bookings.filter(
    (b) => b.date.startsWith(currentMonth) && b.status !== "キャンセル済み"
  ).length;
  const maxSessions = hasPlan ? (planMaxSessions[currentPlan] || 4) : 0;

  if (loading || bookingsLoading || metricsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  // Format next booking date for display
  const formatBookingDate = (b: typeof nextBooking) => {
    if (!b) return "";
    const d = parseISO(b.date);
    return `${format(d, "M月d日（E）", { locale: ja })} ${b.startTime} - ${b.endTime}`;
  };

  // Compute weight/fat changes from first to latest
  const first = chartData.length > 0 ? chartData[0] : null;
  const weightChange = latest && first && latest.weight != null && first.weight != null
    ? (latest.weight - first.weight).toFixed(1) : null;
  const fatChange = latest && first && latest.body_fat != null && first.bodyFat != null
    ? (latest.body_fat - (first.bodyFat as number)).toFixed(1) : null;

  return (
    <div className="px-4 py-4 space-y-5 slide-up">
      {/* Greeting Header */}
      <div className="gym-gradient rounded-2xl p-5 text-primary-foreground relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-accent/10 -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-accent/5 translate-y-6 -translate-x-4" />
        <div className="relative">
          <p className="text-sm opacity-75">Good Morning 🔥</p>
          <h1 className="text-xl font-bold mt-1">{displayName}さん</h1>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-1.5 bg-primary-foreground/15 rounded-full px-3 py-1">
              <Target className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">{bookings.length}回達成</span>
            </div>
            <div className="flex items-center gap-1.5 bg-primary-foreground/15 rounded-full px-3 py-1">
              <Flame className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">継続中</span>
            </div>
          </div>
        </div>
      </div>


      {/* Plan badge - only show if user has a plan */}
      {hasPlan && (
        <Card className="border-l-4 border-l-accent bg-accent/5">
          <CardContent className="p-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-accent" />
            <span className="text-sm font-bold">現在のプラン：{currentPlan}</span>
          </CardContent>
        </Card>
      )}

      {/* Membership Period Card */}
      {hasPlan && profile?.cycle_start_date && (() => {
        const startDate = parseISO(profile.cycle_start_date);
        const endDate = addMonths(startDate, 1);
        const remaining = differenceInDays(endDate, now);
        const isExpiringSoon = remaining >= 0 && remaining <= 3;
        const isExpired = remaining < 0;
        return (
          <Card className={`border-l-4 ${isExpired ? 'border-l-destructive bg-destructive/5' : isExpiringSoon ? 'border-l-warning bg-warning/5' : 'border-l-accent bg-accent/5'}`}>
            <CardContent className="p-3 flex items-center gap-2">
              <Clock className={`w-4 h-4 ${isExpired ? 'text-destructive' : isExpiringSoon ? 'text-warning' : 'text-accent'}`} />
              <div className="flex-1">
                <p className="text-sm font-bold">
                  今回の利用期間：{format(startDate, "M月d日", { locale: ja })} 〜 {format(endDate, "M月d日", { locale: ja })}
                </p>
                {isExpired ? (
                  <p className="text-xs font-bold text-destructive mt-0.5">利用期限が過ぎています</p>
                ) : isExpiringSoon ? (
                  <p className="text-xs font-bold text-warning mt-0.5">残り{remaining}日で期限切れ</p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-0.5">残り{remaining}日</p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Next Booking - real data */}
      <section>
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5" />
          次回の予約
        </h2>
        {nextBooking ? (
          <Card className="card-hover border-l-4 border-l-accent">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-base">{formatBookingDate(nextBooking)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {nextBooking.booking_type === "初回無料体験" ? "初回無料体験" : "トレーニング"}
                  </p>
                  {hasPlan && maxSessions > 0 && (
                    <p className="text-xs font-semibold text-accent mt-1.5">
                      今月 {monthSessions}/{maxSessions}回目
                    </p>
                  )}
                </div>
                <div className="w-12 h-12 rounded-xl accent-gradient flex items-center justify-center pulse-glow">
                  <CalendarDays className="w-5 h-5 text-accent-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-4 text-center text-sm text-muted-foreground">
              予約はありません
            </CardContent>
          </Card>
        )}
      </section>

      {/* Stats Cards */}
      {latest && (latest.weight != null || latest.body_fat != null) && (
        <div className="grid grid-cols-2 gap-3">
          {latest.weight != null && (
            <Card className="card-hover">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-extrabold">{latest.weight}<span className="text-sm font-medium text-muted-foreground">kg</span></p>
                <p className="text-xs text-muted-foreground mt-1">現在の体重</p>
                {weightChange && (
                  <div className="flex items-center justify-center gap-1 mt-1.5">
                    {parseFloat(weightChange) <= 0 ? (
                      <TrendingDown className="w-3 h-3 text-success" />
                    ) : (
                      <TrendingUp className="w-3 h-3 text-destructive" />
                    )}
                    <span className={`text-xs font-bold ${parseFloat(weightChange) <= 0 ? 'text-success' : 'text-destructive'}`}>{weightChange}kg</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {latest.body_fat != null && (
            <Card className="card-hover">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-extrabold">{latest.body_fat}<span className="text-sm font-medium text-muted-foreground">%</span></p>
                <p className="text-xs text-muted-foreground mt-1">体脂肪率</p>
                {fatChange && (
                  <div className="flex items-center justify-center gap-1 mt-1.5">
                    {parseFloat(fatChange) <= 0 ? (
                      <TrendingDown className="w-3 h-3 text-success" />
                    ) : (
                      <TrendingUp className="w-3 h-3 text-destructive" />
                    )}
                    <span className={`text-xs font-bold ${parseFloat(fatChange) <= 0 ? 'text-success' : 'text-destructive'}`}>{fatChange}%</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Weight Chart */}
      {chartData.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">体重推移</h2>
          <Card>
            <CardContent className="p-4">
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(36, 50%, 55%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(36, 50%, 55%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(220, 6%, 55%)" axisLine={false} tickLine={false} />
                    <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 11 }} stroke="hsl(220, 6%, 55%)" axisLine={false} tickLine={false} width={35} />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(0, 0%, 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        fontSize: '12px',
                      }}
                    />
                    <Area type="monotone" dataKey="weight" stroke="hsl(36, 50%, 55%)" strokeWidth={2.5} fill="url(#weightGradient)" isAnimationActive={false} dot={{ r: 4, fill: "hsl(36, 50%, 55%)", strokeWidth: 2, stroke: "hsl(0, 0%, 100%)" }} name="体重(kg)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Body Fat Chart */}
      {chartData.some(d => d.bodyFat != null) && (
        <section>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">体脂肪率推移</h2>
          <Card>
            <CardContent className="p-4">
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="fatGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(210, 40%, 58%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(210, 40%, 58%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(220, 6%, 55%)" axisLine={false} tickLine={false} />
                    <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 11 }} stroke="hsl(220, 6%, 55%)" axisLine={false} tickLine={false} width={35} />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(0, 0%, 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        fontSize: '12px',
                      }}
                    />
                    <Area type="monotone" dataKey="bodyFat" stroke="hsl(210, 40%, 58%)" strokeWidth={2.5} fill="url(#fatGradient)" isAnimationActive={false} dot={{ r: 4, fill: "hsl(210, 40%, 58%)", strokeWidth: 2, stroke: "hsl(0, 0%, 100%)" }} name="体脂肪率(%)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* No data message */}
      {chartData.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            まだ計測データがありません。トレーナーがデータを入力すると、ここに表示されます。
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomerHome;
