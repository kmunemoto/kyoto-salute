import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, TrendingDown, TrendingUp, Minus, Award, Utensils, Bone, MessageSquare, Sparkles, Loader2, CalendarDays, Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useStreak } from "@/hooks/useStreak";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, subMonths, addMonths, isBefore, parseISO } from "date-fns";
import { ja } from "date-fns/locale";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";

const planMaxSessions: Record<string, number> = {
  '月4回': 4, '月6回': 6, '月8回': 8, '通い放題': 15,
};

const PIE_COLORS = ["hsl(36, 50%, 55%)", "hsl(210, 40%, 58%)", "hsl(150, 40%, 50%)"];

interface Props {
  onBack: () => void;
}

const CustomerMonthlyReport = ({ onBack }: Props) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [targetMonth, setTargetMonth] = useState(() => startOfMonth(new Date()));
  const [bookings, setBookings] = useState<any[]>([]);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [meals, setMeals] = useState<any[]>([]);
  const [diagnoses, setDiagnoses] = useState<any[]>([]);
  const [prevDiagnoses, setPrevDiagnoses] = useState<any[]>([]);
  const [prevBookings, setPrevBookings] = useState<any[]>([]);
  const [trainerComment, setTrainerComment] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const monthStart = startOfMonth(targetMonth);
  const monthEnd = endOfMonth(targetMonth);
  const prevMonthStart = startOfMonth(subMonths(targetMonth, 1));
  const prevMonthEnd = endOfMonth(subMonths(targetMonth, 1));
  const canGoNext = isBefore(addMonths(monthStart, 1), addMonths(startOfMonth(new Date()), 1));

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      setLoading(true);
      const msStr = format(monthStart, "yyyy-MM-dd");
      const meStr = format(monthEnd, "yyyy-MM-dd");
      const pmsStr = format(prevMonthStart, "yyyy-MM-dd");
      const pmeStr = format(prevMonthEnd, "yyyy-MM-dd");

      const [bRes, mRes, mlRes, dRes, pdRes, pbRes, tcRes] = await Promise.all([
        supabase.from("bookings").select("*").eq("user_id", user.id).gte("booking_date", msStr).lte("booking_date", meStr + "T23:59:59").neq("status", "キャンセル済み"),
        supabase.from("user_measurements").select("*").eq("user_id", user.id).gte("measured_date", msStr).lte("measured_date", meStr).order("measured_date", { ascending: true }),
        supabase.from("meals").select("*").eq("user_id", user.id).gte("created_at", msStr).lte("created_at", meStr + "T23:59:59"),
        supabase.from("skeletal_diagnoses").select("*").eq("user_id", user.id).gte("created_at", msStr).lte("created_at", meStr + "T23:59:59").order("created_at", { ascending: true }),
        supabase.from("skeletal_diagnoses").select("*").eq("user_id", user.id).gte("created_at", pmsStr).lte("created_at", pmeStr + "T23:59:59").order("created_at", { ascending: false }).limit(1),
        supabase.from("bookings").select("*").eq("user_id", user.id).gte("booking_date", pmsStr).lte("booking_date", pmeStr + "T23:59:59").neq("status", "キャンセル済み"),
        supabase.from("monthly_reports" as any).select("*").eq("user_id", user.id).eq("month", msStr).maybeSingle(),
      ]);

      setBookings(bRes.data || []);
      setMeasurements(mRes.data || []);
      setMeals(mlRes.data || []);
      setDiagnoses(dRes.data || []);
      setPrevDiagnoses(pdRes.data || []);
      setPrevBookings(pbRes.data || []);
      setTrainerComment((tcRes.data as any)?.trainer_comment || null);
      setLoading(false);
    };
    fetchAll();
  }, [user, targetMonth]);

  const currentPlan = profile?.plan;
  const hasPlan = !!currentPlan && currentPlan !== '初回無料体験';
  const maxSessions = hasPlan ? (planMaxSessions[currentPlan] || 4) : 0;
  const now = new Date();
  const visitedBookings = bookings.filter(b => new Date(b.booking_date) < now);
  const scheduledBookings = bookings.filter(b => new Date(b.booking_date) >= now);
  const sessionCount = visitedBookings.length;
  const prevSessionCount = prevBookings.length;
  const achieveRate = maxSessions > 0 ? Math.min(100, Math.round((sessionCount / maxSessions) * 100)) : 0;
  const sessionDiff = sessionCount - prevSessionCount;

  // Measurements
  const firstM = measurements.length > 0 ? measurements[0] : null;
  const lastM = measurements.length > 0 ? measurements[measurements.length - 1] : null;
  const weightChange = firstM && lastM && firstM.weight != null && lastM.weight != null ? (lastM.weight - firstM.weight) : null;
  const fatChange = firstM && lastM && firstM.body_fat != null && lastM.body_fat != null ? (lastM.body_fat - firstM.body_fat) : null;

  const measurementChartData = measurements.filter(m => m.weight != null).map(m => {
    const d = new Date(m.measured_date);
    return { date: `${d.getDate()}日`, weight: m.weight, bodyFat: m.body_fat };
  });

  // Meals
  const analyzedMeals = meals.filter(m => m.analyzed);
  const mealDays = new Set(meals.map(m => format(new Date(m.created_at), "yyyy-MM-dd"))).size;
  const daysInMonth = monthEnd.getDate();
  const avgCalories = analyzedMeals.length > 0 ? Math.round(analyzedMeals.reduce((s, m) => s + (m.calories || 0), 0) / analyzedMeals.length) : null;
  const avgProtein = analyzedMeals.length > 0 ? Math.round(analyzedMeals.reduce((s, m) => s + (m.protein || 0), 0) / analyzedMeals.length * 10) / 10 : null;
  const avgFat = analyzedMeals.length > 0 ? Math.round(analyzedMeals.reduce((s, m) => s + (m.fat || 0), 0) / analyzedMeals.length * 10) / 10 : null;
  const avgCarbs = analyzedMeals.length > 0 ? Math.round(analyzedMeals.reduce((s, m) => s + (m.carbs || 0), 0) / analyzedMeals.length * 10) / 10 : null;

  const pfcData = avgProtein != null && avgFat != null && avgCarbs != null ? [
    { name: "タンパク質", value: avgProtein },
    { name: "脂質", value: avgFat },
    { name: "炭水化物", value: avgCarbs },
  ] : null;

  // Skeletal
  const latestDiag = diagnoses.length > 0 ? diagnoses[diagnoses.length - 1] : null;
  const prevDiag = prevDiagnoses.length > 0 ? prevDiagnoses[0] : null;

  // AI advice
  const generateAdvice = () => {
    const parts: string[] = [];
    if (maxSessions > 0 && achieveRate >= 100) {
      parts.push("素晴らしい！今月はプランの回数を全て達成しました。");
    } else if (maxSessions > 0 && achieveRate >= 75) {
      parts.push("良いペースです！あと少しで全回数達成できます。");
    } else if (maxSessions > 0 && achieveRate < 50 && sessionCount > 0) {
      parts.push("来月はもう少しペースを上げてみましょう。");
    } else if (sessionCount === 0) {
      parts.push("今月はお休みでしたね。来月はまた一緒に頑張りましょう！");
    }

    if (weightChange != null && weightChange < -0.5) {
      parts.push("体重も順調に減少しています。この調子で続けましょう！");
    } else if (weightChange != null && weightChange > 0.5) {
      parts.push("体重が少し増加していますが、筋肉量の増加の可能性もあります。");
    }

    if (mealDays > daysInMonth * 0.7) {
      parts.push("食事記録もしっかりつけられていて素晴らしいです。");
    } else if (mealDays > 0 && mealDays < daysInMonth * 0.3) {
      parts.push("食事記録をもう少しこまめにつけると、より効果的です。");
    }

    if (parts.length === 0) {
      parts.push("コツコツ続けることが大切です。来月も一緒に頑張りましょう！");
    }

    return parts.join(" ");
  };

  if (loading) {
    return (
      <div className="px-4 py-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> 戻る
        </Button>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-accent" />
        </div>
      </div>
    );
  }

  const hasTraining = sessionCount > 0 || scheduledBookings.length > 0;
  const hasMeasurements = measurements.length > 0;
  const hasMeals = meals.length > 0;
  const hasDiagnosis = !!latestDiag;
  const hasComment = !!trainerComment;

  return (
    <div className="px-4 py-4 space-y-5 slide-up">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-lg font-bold flex-1 text-center">月間レポート</h1>
        <div className="w-8" />
      </div>

      {/* Month selector */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setTargetMonth(subMonths(targetMonth, 1))}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <span className="text-base font-bold">{format(targetMonth, "yyyy年M月", { locale: ja })}</span>
        <Button variant="ghost" size="icon" onClick={() => setTargetMonth(addMonths(targetMonth, 1))} disabled={!canGoNext}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* ① Training Summary */}
      {hasTraining && (
        <section>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5" />
            トレーニングサマリー
          </h2>
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">来店済み</span>
                <span className="text-2xl font-extrabold">
                  {sessionCount}
                  {maxSessions > 0 && <span className="text-sm font-normal text-muted-foreground">/{maxSessions}回</span>}
                </span>
              </div>
              {maxSessions > 0 && (
                <>
                  <Progress value={achieveRate} className="h-2.5" />
                  <p className="text-sm font-bold text-center">
                    {achieveRate >= 100 ? "達成！🎉" : `あと${maxSessions - sessionCount}回！`}
                  </p>
                </>
              )}
              {scheduledBookings.length > 0 && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5" />
                    今月の予約予定
                  </span>
                  <span className="text-sm font-bold">あと{scheduledBookings.length}回</span>
                </div>
              )}
              {sessionDiff !== 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  先月より{sessionDiff > 0 ? `+${sessionDiff}` : sessionDiff}回
                </p>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {/* ② Weight/Body Fat */}
      {hasMeasurements && (
        <section>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5" />
            体重・体脂肪の変化
          </h2>
          <Card>
            <CardContent className="p-4 space-y-3">
              {firstM && lastM && firstM.weight != null && lastM.weight != null && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">体重</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{firstM.weight}kg → {lastM.weight}kg</span>
                    <span className={`text-xs font-bold flex items-center gap-0.5 ${weightChange! < 0 ? 'text-success' : weightChange! > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      ({weightChange! > 0 ? '+' : ''}{weightChange!.toFixed(1)}kg
                      {weightChange! < 0 ? <TrendingDown className="w-3 h-3" /> : weightChange! > 0 ? <TrendingUp className="w-3 h-3" /> : <Minus className="w-3 h-3" />})
                    </span>
                  </div>
                </div>
              )}
              {firstM && lastM && firstM.body_fat != null && lastM.body_fat != null && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">体脂肪率</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{firstM.body_fat}% → {lastM.body_fat}%</span>
                    <span className={`text-xs font-bold flex items-center gap-0.5 ${fatChange! < 0 ? 'text-success' : fatChange! > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      ({fatChange! > 0 ? '+' : ''}{fatChange!.toFixed(1)}%
                      {fatChange! < 0 ? <TrendingDown className="w-3 h-3" /> : fatChange! > 0 ? <TrendingUp className="w-3 h-3" /> : <Minus className="w-3 h-3" />})
                    </span>
                  </div>
                </div>
              )}
              {weightChange != null && weightChange > 0 && (
                <p className="text-xs text-muted-foreground">筋肉量が増えている可能性があります 💪</p>
              )}
              {measurementChartData.length > 1 && (
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={measurementChartData}>
                      <defs>
                        <linearGradient id="rptWeightG" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(36, 50%, 55%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(36, 50%, 55%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(220, 6%, 55%)" axisLine={false} tickLine={false} />
                      <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={32} />
                      <Tooltip contentStyle={{ background: 'hsl(0,0%,100%)', border: 'none', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', fontSize: '11px' }} />
                      <Area type="monotone" dataKey="weight" stroke="hsl(36, 50%, 55%)" strokeWidth={2} fill="url(#rptWeightG)" isAnimationActive={false} dot={{ r: 3, fill: "hsl(36, 50%, 55%)", strokeWidth: 1, stroke: "hsl(0,0%,100%)" }} name="体重(kg)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {/* ③ Meal Summary */}
      {hasMeals && (
        <section>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Utensils className="w-3.5 h-3.5" />
            食事記録サマリー
          </h2>
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">記録日数</span>
                <span className="text-base font-bold">{mealDays}/{daysInMonth}日</span>
              </div>
              {avgCalories != null && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">平均カロリー</span>
                  <span className="text-base font-bold">{avgCalories}kcal</span>
                </div>
              )}
              {avgProtein != null && (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">P (タンパク質)</p>
                    <p className="text-sm font-bold">{avgProtein}g</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">F (脂質)</p>
                    <p className="text-sm font-bold">{avgFat}g</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">C (炭水化物)</p>
                    <p className="text-sm font-bold">{avgCarbs}g</p>
                  </div>
                </div>
              )}
              {pfcData && (
                <div className="h-36 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pfcData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={55} innerRadius={30} strokeWidth={2} isAnimationActive={false}>
                        {pfcData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => `${v}g`} contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {/* ④ Skeletal */}
      {hasDiagnosis && (
        <section>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Bone className="w-3.5 h-3.5" />
            骨格診断の変化
          </h2>
          <Card>
            <CardContent className="p-4 space-y-2">
              <p className="text-sm">骨格タイプ: <span className="font-bold">{latestDiag.skeletal_type}</span></p>
              <p className="text-sm">信頼度: <span className="font-bold">{latestDiag.confidence}%</span></p>
              {prevDiag && latestDiag.confidence !== prevDiag.confidence && (
                <p className="text-sm text-accent font-bold">
                  スコアが{latestDiag.confidence - prevDiag.confidence > 0 ? '+' : ''}{latestDiag.confidence - prevDiag.confidence}点変化しました！
                </p>
              )}
              {latestDiag.image_url && prevDiag?.image_url && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">前月</p>
                    <img src={prevDiag.image_url} alt="前月" className="rounded-lg w-full aspect-[3/4] object-cover" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">今月</p>
                    <img src={latestDiag.image_url} alt="今月" className="rounded-lg w-full aspect-[3/4] object-cover" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {/* ⑤ Trainer Comment */}
      {hasComment && (
        <section>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            トレーナーからのコメント
          </h2>
          <Card className="border-l-4 border-l-accent">
            <CardContent className="p-4">
              <p className="text-sm whitespace-pre-wrap">{trainerComment}</p>
            </CardContent>
          </Card>
        </section>
      )}

      {/* ⑥ AI Advice */}
      <section>
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          AIからのアドバイス
        </h2>
        <Card className="gym-gradient text-primary-foreground">
          <CardContent className="p-4">
            <p className="text-sm">{generateAdvice()}</p>
          </CardContent>
        </Card>
      </section>

      {/* Empty state */}
      {!hasTraining && !hasMeasurements && !hasMeals && !hasDiagnosis && (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            この月のデータはまだありません。
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomerMonthlyReport;
