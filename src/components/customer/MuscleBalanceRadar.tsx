import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { addMonths, parseISO, format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { getJSTNow } from "@/lib/timezone";
import { getMuscleGroup, loadMuscleGroupMap, subscribeMuscleGroup } from "@/lib/muscleGroup";

const MUSCLE_GROUPS = ["胸", "背中", "肩", "脚", "臀部", "腕", "腹筋"] as const;

const getCycleWindow = (cycleStartDate: string, targetDate: Date) => {
  let cycleStart = parseISO(cycleStartDate);
  while (addMonths(cycleStart, 1) <= targetDate) cycleStart = addMonths(cycleStart, 1);
  while (cycleStart > targetDate) cycleStart = addMonths(cycleStart, -1);
  return { start: cycleStart, end: addMonths(cycleStart, 1) };
};

interface WorkoutRow {
  workout_date: string;
  weight: number | null;
  reps: number | null;
  sets: Array<{ set: number; weight: number; reps: number }> | null;
  exercise_name: string;
}

const MuscleBalanceRadar = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [cycleOffset, setCycleOffset] = useState(0);
  const [workouts, setWorkouts] = useState<WorkoutRow[]>([]);
  const [, force] = useState(0);

  useEffect(() => {
    loadMuscleGroupMap().catch(() => {});
    const unsub = subscribeMuscleGroup(() => force((n) => n + 1));
    return () => { unsub(); };
  }, []);

  const { start, end } = useMemo(() => {
    const now = getJSTNow();
    if (profile?.cycle_start_date) {
      const current = getCycleWindow(profile.cycle_start_date, now);
      return {
        start: addMonths(current.start, cycleOffset),
        end: addMonths(current.end, cycleOffset),
      };
    }
    const base = new Date(now.getFullYear(), now.getMonth(), 1);
    const shifted = addMonths(base, cycleOffset);
    return { start: shifted, end: addMonths(shifted, 1) };
  }, [profile?.cycle_start_date, cycleOffset]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const startStr = format(start, "yyyy-MM-dd");
      const endStr = format(end, "yyyy-MM-dd");
      const { data } = await supabase
        .from("workouts")
        .select("workout_date, weight, reps, sets, exercises(name)")
        .eq("user_id", user.id)
        .gte("workout_date", startStr)
        .lt("workout_date", endStr);
      if (data) {
        setWorkouts(
          data.map((w: any) => ({
            workout_date: w.workout_date,
            weight: w.weight,
            reps: w.reps,
            sets: w.sets,
            exercise_name: w.exercises?.name || "不明",
          }))
        );
      } else {
        setWorkouts([]);
      }
    };
    fetch();
  }, [user, start, end]);

  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    MUSCLE_GROUPS.forEach((g) => (counts[g] = 0));
    let total = 0;
    workouts.forEach((w) => {
      const group = getMuscleGroup(w.exercise_name);
      if (group === "その他") return;
      const setCount = w.sets?.length || (w.weight != null ? 1 : 0);
      if (counts[group] !== undefined) {
        counts[group] += setCount;
        total += setCount;
      }
    });
    return {
      data: MUSCLE_GROUPS.map((g) => ({
        group: g,
        value: total > 0 ? Math.round((counts[g] / total) * 100) : 0,
      })),
      total,
    };
  }, [workouts]);

  const periodLabel = `${format(start, "M/d")}〜${format(addMonths(start, 1), "M/d")}`;
  const isCurrent = cycleOffset === 0;

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-accent" />
            <h3 className="font-bold text-sm">部位バランス</h3>
          </div>
          <span className="text-xs" style={{ color: "#999" }}>{periodLabel}</span>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => setCycleOffset((n) => n - 1)}
            className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition"
            aria-label="前の期間"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-muted-foreground">
            {isCurrent ? "今期間" : `${cycleOffset}期間前`}
          </span>
          <button
            onClick={() => setCycleOffset((n) => Math.min(0, n + 1))}
            disabled={isCurrent}
            className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition disabled:opacity-30"
            aria-label="次の期間"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {chartData.total > 0 ? (
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={chartData.data} outerRadius="75%">
                <PolarGrid stroke="#E5E5E5" />
                <PolarAngleAxis
                  dataKey="group"
                  tick={{ fontSize: 13, fill: "#333" }}
                />
                <Radar
                  dataKey="value"
                  stroke="#0ABAB5"
                  strokeWidth={2}
                  fill="#0ABAB5"
                  fillOpacity={0.2}
                  isAnimationActive={false}
                  dot={{ r: 3, fill: "#0ABAB5", strokeWidth: 0 }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">
            トレーニング記録がありません
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MuscleBalanceRadar;