import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { sessions } from "@/lib/dummyData";
import { format, addDays, startOfWeek, isSameDay, parseISO } from "date-fns";
import { ja } from "date-fns/locale";

const TrainerSchedule = () => {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(2026, 3, 9), { weekStartsOn: 1 }));

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const timeSlots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

  const getSession = (day: Date, time: string) => {
    return sessions.find(s => isSameDay(parseISO(s.date), day) && s.time === time);
  };

  return (
    <div className="pb-20 md:pb-0">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-accent" />
          予約管理
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setWeekStart(addDays(weekStart, -7))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-semibold min-w-[140px] text-center">
            {format(weekStart, "M月d日", { locale: ja })} 〜 {format(addDays(weekStart, 6), "M月d日", { locale: ja })}
          </span>
          <Button variant="ghost" size="icon" onClick={() => setWeekStart(addDays(weekStart, 7))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="p-3 text-xs font-bold text-muted-foreground w-16">時間</th>
                  {weekDays.map((day) => {
                    const isToday = isSameDay(day, new Date(2026, 3, 9));
                    return (
                      <th key={day.toISOString()} className={`p-3 text-center ${isToday ? "bg-accent/10" : ""}`}>
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase">
                          {format(day, "EEE", { locale: ja })}
                        </p>
                        <p className={`text-sm font-bold mt-0.5 ${isToday ? "text-accent" : ""}`}>
                          {format(day, "d")}
                        </p>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((time) => (
                  <tr key={time} className="border-b last:border-b-0">
                    <td className="p-2 text-xs font-medium text-muted-foreground text-center border-r">{time}</td>
                    {weekDays.map((day) => {
                      const session = getSession(day, time);
                      const isToday = isSameDay(day, new Date(2026, 3, 9));
                      return (
                        <td key={day.toISOString()} className={`p-1 ${isToday ? "bg-accent/5" : ""}`}>
                          {session && (
                            <div className={`rounded-lg p-2 text-xs ${
                              session.status === 'completed'
                                ? 'bg-success/10 text-success'
                                : 'accent-gradient text-accent-foreground'
                            }`}>
                              <p className="font-bold truncate">{session.clientName}</p>
                              <p className="opacity-75 truncate">{session.type}</p>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded accent-gradient" />
          <span className="text-xs text-muted-foreground">予約あり</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-success/20" />
          <span className="text-xs text-muted-foreground">完了</span>
        </div>
      </div>
    </div>
  );
};

export default TrainerSchedule;
