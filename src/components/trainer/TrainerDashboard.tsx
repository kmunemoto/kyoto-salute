import { Users, CalendarDays, TrendingUp, Clock, BarChart3, Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { sessions, clients as dummyClients, planPrices, PlanType } from "@/lib/dummyData";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { useAllCustomerProfiles } from "@/hooks/useProfile";
import { Loader2 } from "lucide-react";

const todaySessions = sessions.filter(s => s.date === '2026-04-09');

interface TrainerDashboardProps {
  onSelectClient: (clientId: string) => void;
}

const TrainerDashboard = ({ onSelectClient }: TrainerDashboardProps) => {
  const { profiles, loading } = useAllCustomerProfiles();

  const currentMonthRevenue = profiles.reduce((sum, p) => {
    const plan = p.plan as PlanType;
    return sum + (planPrices[plan] || 0);
  }, 0);

  const revenueData = [
    { month: '1月', revenue: 680000 },
    { month: '2月', revenue: 720000 },
    { month: '3月', revenue: 810000 },
    { month: '4月', revenue: currentMonthRevenue },
  ];

  if (loading) {
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
          <h1 className="text-lg sm:text-2xl font-bold mt-1">山本 コーチ</h1>
          <p className="text-xs sm:text-sm opacity-75 mt-1">2026年4月9日（水）</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
        {[
          { label: '本日のセッション', value: `${todaySessions.length}件`, icon: CalendarDays, color: 'text-accent' },
          { label: 'アクティブ顧客', value: `${profiles.length}名`, icon: Users, color: 'text-info' },
          { label: '月間セッション', value: '42件', icon: Clock, color: 'text-success' },
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
        {/* Today's Schedule */}
        <section>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" />
            本日のスケジュール
          </h2>
          <div className="space-y-2">
            {todaySessions.map((s) => (
              <Card key={s.id} className="card-hover cursor-pointer" onClick={() => {
                const client = dummyClients.find((c) => c.name === s.clientName);
                if (client) onSelectClient(client.id);
              }}>
                <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl gym-gradient flex items-center justify-center text-primary-foreground font-bold text-xs sm:text-sm shrink-0">
                    {s.clientAvatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{s.clientName}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold">{s.time}</p>
                    <p className="text-xs text-muted-foreground">{s.duration}分</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 12%, 90%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(225, 8%, 52%)" axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(225, 8%, 52%)" axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 10000}万`} width={40} />
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
                    <Bar dataKey="revenue" fill="hsl(18, 90%, 55%)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Reminder Notification Status */}
        <section>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5" />
            リマインド通知ステータス
          </h2>
          <Card>
            <CardContent className="p-3 sm:p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">24時間前リマインド</span>
                <span className="text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">有効</span>
              </div>
              <div className="text-xs text-muted-foreground space-y-1.5">
                <p>予約の前日に各顧客へリマインド通知が自動送信されます。</p>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span>通知オン中の顧客</span>
                  <span className="font-bold text-foreground">{profiles.length}名 / {profiles.length}名</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>本日送信済みリマインド</span>
                  <span className="font-bold text-foreground">{todaySessions.length}件</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default TrainerDashboard;
