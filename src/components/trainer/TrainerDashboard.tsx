import { Users, CalendarDays, TrendingUp, Clock, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { sessions, clients } from "@/lib/dummyData";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

const todaySessions = sessions.filter(s => s.date === '2026-04-09');
const revenueData = [
  { month: '1月', revenue: 680000 },
  { month: '2月', revenue: 720000 },
  { month: '3月', revenue: 810000 },
  { month: '4月', revenue: 540000 },
];

interface TrainerDashboardProps {
  onSelectClient: (clientId: string) => void;
}

const TrainerDashboard = ({ onSelectClient }: TrainerDashboardProps) => {
  return (
    <div className="pb-8 md:pb-0">
      {/* Header */}
      <div className="gym-gradient rounded-2xl p-6 mb-6 text-primary-foreground relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-accent/10 -translate-y-12 translate-x-12" />
        <div className="relative">
          <p className="text-sm opacity-75">ダッシュボード</p>
          <h1 className="text-2xl font-bold mt-1">山本 コーチ</h1>
          <p className="text-sm opacity-75 mt-1">2026年4月9日（水）</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: '本日のセッション', value: `${todaySessions.length}件`, icon: CalendarDays, color: 'text-accent' },
          { label: 'アクティブ顧客', value: `${clients.length}名`, icon: Users, color: 'text-info' },
          { label: '月間セッション', value: '42件', icon: Clock, color: 'text-success' },
          { label: '今月売上', value: '¥540K', icon: TrendingUp, color: 'text-warning' },
        ].map((stat) => (
          <Card key={stat.label} className="card-hover">
            <CardContent className="p-4">
              <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
              <p className="text-2xl font-extrabold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <section>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" />
            本日のスケジュール
          </h2>
          <div className="space-y-2">
            {todaySessions.map((s) => (
              <Card key={s.id} className="card-hover cursor-pointer" onClick={() => {
                const client = clients.find(c => c.name === s.clientName);
                if (client) onSelectClient(client.id);
              }}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl gym-gradient flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                    {s.clientAvatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{s.clientName}</p>
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
            <CardContent className="p-4">
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 12%, 90%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(225, 8%, 52%)" axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(225, 8%, 52%)" axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 10000}万`} />
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
      </div>
    </div>
  );
};

export default TrainerDashboard;
