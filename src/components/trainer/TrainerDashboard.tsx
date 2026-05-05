import { useMemo } from "react";
import { Users, CalendarDays, TrendingUp, Clock, BarChart3, ClipboardList, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { planPrices, PlanType } from "@/lib/dummyData";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { useAllCustomerProfiles, useProfile } from "@/hooks/useProfile";
import { useAllBookings } from "@/hooks/useBookings";
import { formatJST, getJSTNow } from "@/lib/timezone";
import CounselingResponseList from "./CounselingResponseList";
import { useCounselingResponses } from "@/hooks/useCounselingResponses";
import CourseProgressBadge from "./CourseProgressBadge";
import { getBookingProgressIndex, getCycleWindow, type BookingForProgress } from "@/lib/courseProgress";

interface TrainerDashboardProps {
  onSelectClient: (clientId: string) => void;
}

const TrainerDashboard = ({ onSelectClient }: TrainerDashboardProps) => {
  const { profiles, loading } = useAllCustomerProfiles();
  const { bookings, loading: bookingsLoading } = useAllBookings();
  const { unreadCount: counselingUnread } = useCounselingResponses();
  const { profile: trainerProfile } = useProfile();
  const trainerName = trainerProfile?.display_name || "トレーナー";

  const today = formatJST(new Date(), "yyyy-MM-dd");
  const todayBookings = bookings.filter(
    (b) => b.date === today && b.status !== "キャンセル済み" && b.user_id !== "blocked" && b.user_id !== "trial-guest",
  );

  const bookingsByUser = useMemo(() => {
    const map = new Map<string, BookingForProgress[]>();
    bookings
      .filter((b) => b.user_id !== "trial-guest" && b.user_id !== "blocked")
      .forEach((b) => {
        const rows = map.get(b.user_id) || [];
        rows.push({
          id: b.id,
          booking_date: `${b.date}T${b.startTime}:00+09:00`,
          status: b.status,
        });
        map.set(b.user_id, rows);
      });
    return map;
  }, [bookings]);

  // Count this month's sessions (exclude blocked/trial guest, exclude cancellations)
  const currentMonth = formatJST(new Date(), "yyyy-MM");
  const monthBookings = bookings.filter(
    (b) =>
      b.date.startsWith(currentMonth) &&
      b.status !== "キャンセル済み" &&
      b.user_id !== "blocked" &&
      b.user_id !== "trial-guest",
  );

  // 今月売上:
  //  支払いタイミング = 各サイクルの「1回目のトレーニング実施日(予約日)」
  //  各顧客の予約履歴(キャンセル除外)を時系列に並べ、cycle_start_date 以降を
  //  プラン回数ごとに区切ったときの「各サイクル先頭の予約日」が今月にある場合のみ計上。
  //  サイクル開始日は固定addMonthsではなく、実際の予約から導出する。
  const currentMonthRevenue = profiles.reduce((sum, p) => {
    if (!p.plan || !p.cycle_start_date) return sum;
    const plan = p.plan as PlanType;
    const price = planPrices[plan] || 0;
    if (!price) return sum;

    const monthly = getMonthlySessionCount(plan); // -1=通い放題, null=未設定
    if (monthly === null) return sum;

    const userBookings = (bookingsByUser.get(p.user_id) || [])
      .filter((b) => b.status !== "キャンセル済み")
      .map((b) => new Date(b.booking_date))
      .filter((d) => formatJST(d, "yyyy-MM-dd") >= p.cycle_start_date!)
      .sort((a, b) => a.getTime() - b.getTime());

    if (userBookings.length === 0) return sum;

    // サイクル先頭となる予約日インデックスを抽出
    // 通い放題は addMonths ベース、回数制は monthly 件ごとに区切り
    const cycleStartDates: Date[] = [];
    if (monthly === -1) {
      // 通い放題: cycle_start_date から月次でローリング
      let anchor = userBookings[0];
      cycleStartDates.push(anchor);
      // 以降は実予約から「前回サイクル開始から1ヶ月以上後の最初の予約」を新サイクル開始とみなす
      for (const d of userBookings) {
        const next = new Date(anchor);
        next.setMonth(next.getMonth() + 1);
        if (d >= next) {
          cycleStartDates.push(d);
          anchor = d;
        }
      }
    } else {
      // 回数制: monthly 件ごとに区切り、その先頭が支払い日
      for (let i = 0; i < userBookings.length; i += monthly) {
        cycleStartDates.push(userBookings[i]);
      }
    }

    const hasCycleStartThisMonth = cycleStartDates.some(
      (d) => formatJST(d, "yyyy-MM") === currentMonth,
    );
    return hasCycleStartThisMonth ? sum + price : sum;
  }, 0);

  const revenueData = [
    { month: '1月', revenue: 680000 },
    { month: '2月', revenue: 720000 },
    { month: '3月', revenue: 810000 },
    { month: '4月', revenue: currentMonthRevenue },
  ];

  if (loading || bookingsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="pb-24 md:pb-0">
      {/* Header */}
      <div className="gym-gradient rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 text-primary-foreground relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-accent/10 -translate-y-12 translate-x-12" />
        <div className="relative">
          <p className="text-xs sm:text-sm opacity-75">ダッシュボード</p>
          <h1 className="text-lg sm:text-2xl font-bold mt-1">{trainerName}</h1>
          <p className="text-xs sm:text-sm opacity-75 mt-1">{formatJST(new Date(), "yyyy年M月d日（E）")}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
        {[
          { label: '本日のセッション', value: `${todayBookings.length}件`, icon: CalendarDays, color: 'text-accent' },
          { label: 'アクティブ顧客', value: `${profiles.length}名`, icon: Users, color: 'text-info' },
          { label: '月間セッション', value: `${monthBookings.length}件`, icon: Clock, color: 'text-success' },
          { label: '今月売上', value: `¥${currentMonthRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-warning' },
        ].map((stat) => (
          <Card key={stat.label} className="card-hover">
            <CardContent className="p-3 sm:p-4">
              <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color} mb-1.5 sm:mb-2`} />
              <p className="text-lg sm:text-2xl font-extrabold truncate">{stat.value}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 leading-tight">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* Today's Schedule - REAL DATA */}
        <section>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" />
            本日のスケジュール
          </h2>
          {todayBookings.length === 0 ? (
            <Card>
              <CardContent className="p-4 text-center text-sm text-muted-foreground">
                本日の予約はありません
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {todayBookings
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map((b) => {
                  const profile = profiles.find((pr) => pr.user_id === b.user_id);
                  const progress = profile
                    ? getBookingProgressIndex(b.id, profile.cycle_start_date, profile.plan, bookingsByUser.get(b.user_id) || [])
                    : null;

                  return (
                  <Card key={b.id} className="card-hover cursor-pointer" onClick={() => {
                    // Find profile by user_id for navigation
                    if (profile) onSelectClient(profile.user_id);
                  }}>
                    <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl gym-gradient flex items-center justify-center text-primary-foreground font-bold text-xs sm:text-sm shrink-0">
                        {b.clientName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{b.clientName}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                            {b.booking_type}
                          </Badge>
                          {progress && (
                            <CourseProgressBadge
                              index={progress.index}
                              total={progress.total}
                              isUnlimited={progress.isUnlimited}
                              isUnconfigured={progress.isUnconfigured}
                              isOverflow={progress.isOverflow}
                              className="mt-0"
                            />
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold">{b.startTime}</p>
                        <p className="text-xs text-muted-foreground">60分</p>
                      </div>
                    </CardContent>
                  </Card>
                  );
                })}
            </div>
          )}
        </section>

        {/* Counseling Responses */}
        <section>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <ClipboardList className="w-3.5 h-3.5" />
            新規カウンセリング回答
            {counselingUnread > 0 && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4 ml-1">
                {counselingUnread}件
              </Badge>
            )}
          </h2>
          <CounselingResponseList />
        </section>

        {/* Revenue Chart */}
        <section>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" />
            月別売上
          </h2>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="h-44 sm:h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 10%, 92%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(220, 6%, 55%)" axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(220, 6%, 55%)" axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 10000}万`} width={40} />
                    <Tooltip
                      formatter={(value: number) => [`¥${value.toLocaleString()}`, '売上']}
                      contentStyle={{
                        background: 'hsl(0, 0%, 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="revenue" fill="hsl(174, 65%, 50%)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </section>

      </div>
    </div>
  );
};

export default TrainerDashboard;
