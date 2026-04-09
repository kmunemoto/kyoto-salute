import { useState, useSyncExternalStore } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { sessions, clients, availableSlots } from "@/lib/dummyData";
import { bookingStore } from "@/stores/bookingStore";
import { format, addDays, startOfWeek, isSameDay, parseISO } from "date-fns";
import { ja } from "date-fns/locale";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TrainerSchedule = () => {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(2026, 3, 9), { weekStartsOn: 1 }));
  const [proxyDialogOpen, setProxyDialogOpen] = useState(false);
  const [proxyDate, setProxyDate] = useState<Date | undefined>();
  const [proxyTime, setProxyTime] = useState<string>("");
  const [proxyClient, setProxyClient] = useState<string>("");

  const bookings = useSyncExternalStore(bookingStore.subscribe, bookingStore.getBookings);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const timeSlots = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];

  const getSession = (day: Date, time: string) => {
    const dateStr = format(day, "yyyy-MM-dd");
    return bookings.find((b) => b.date === dateStr && b.startTime === time);
  };

  const proxyDateKey = proxyDate ? format(proxyDate, "yyyy-MM-dd") : "";
  const proxySlots = proxyDateKey ? (availableSlots[proxyDateKey] || []) : [];

  const handleProxyBook = () => {
    if (!proxyDate || !proxyTime || !proxyClient) {
      toast.error("日付・時間・お客様を選択してください");
      return;
    }

    if (bookingStore.isSlotBlocked(proxyDateKey, proxyTime)) {
      toast.error("すでに予約が入っています。別の時間を選んでください。");
      return;
    }

    const [h, m] = proxyTime.split(":").map(Number);
    const endMin = h * 60 + m + 60;
    const endTime = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;
    const client = clients.find((c) => c.id === proxyClient);

    bookingStore.addBooking({
      id: `proxy-${Date.now()}`,
      date: proxyDateKey,
      startTime: proxyTime,
      endTime,
      clientName: client?.name || "不明",
    });

    toast.success(`${client?.name}さんの予約を追加しました（${format(proxyDate, "M/d")} ${proxyTime}）`);
    setProxyDialogOpen(false);
    setProxyDate(undefined);
    setProxyTime("");
    setProxyClient("");
  };

  // Mobile: day list view
  const getDayBookings = (day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd");
    return bookings.filter((b) => b.date === dateStr);
  };

  return (
    <div className="pb-24 md:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-accent" />
          予約管理
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setProxyDialogOpen(true)} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            代理予約
          </Button>
          <div className="flex items-center gap-1 ml-auto sm:ml-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWeekStart(addDays(weekStart, -7))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs sm:text-sm font-semibold min-w-[120px] sm:min-w-[140px] text-center">
              {format(weekStart, "M/d", { locale: ja })} 〜 {format(addDays(weekStart, 6), "M/d", { locale: ja })}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWeekStart(addDays(weekStart, 7))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop: table view */}
      <div className="hidden md:block">
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
                              <div className="accent-gradient text-accent-foreground rounded-lg p-2 text-xs">
                                <p className="font-bold truncate">{session.clientName}</p>
                                <p className="opacity-75 truncate">{session.startTime}〜{session.endTime}</p>
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
      </div>

      {/* Mobile: day-based list view */}
      <div className="md:hidden space-y-3">
        {weekDays.map((day) => {
          const isToday = isSameDay(day, new Date(2026, 3, 9));
          const dayBookings = getDayBookings(day);
          return (
            <div key={day.toISOString()}>
              <div className={`flex items-center gap-2 mb-1.5 ${isToday ? "text-accent" : "text-muted-foreground"}`}>
                <span className={`text-xs font-bold uppercase`}>
                  {format(day, "M/d（E）", { locale: ja })}
                </span>
                {isToday && <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded-full font-bold">今日</span>}
              </div>
              {dayBookings.length > 0 ? (
                <div className="space-y-1.5">
                  {dayBookings.map((b) => (
                    <Card key={b.id} className="card-hover">
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl accent-gradient flex items-center justify-center text-accent-foreground text-xs font-bold shrink-0">
                          {b.clientName[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">{b.clientName}</p>
                          <p className="text-xs text-muted-foreground">{b.startTime}〜{b.endTime}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground pl-1 mb-1">予約なし</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded accent-gradient" />
          <span className="text-xs text-muted-foreground">予約あり</span>
        </div>
      </div>

      {/* Proxy booking dialog */}
      <Dialog open={proxyDialogOpen} onOpenChange={setProxyDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>代理予約</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">お客様</label>
              <Select value={proxyClient} onValueChange={setProxyClient}>
                <SelectTrigger className="h-11"><SelectValue placeholder="選択してください" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">日付</label>
              <Calendar
                mode="single"
                selected={proxyDate}
                onSelect={(d) => { setProxyDate(d); setProxyTime(""); }}
                locale={ja}
                className="pointer-events-auto border rounded-lg mx-auto"
              />
            </div>
            {proxyDate && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">開始時間</label>
                <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto">
                  {(() => {
                    const slots: { time: string; blocked: boolean }[] = [];
                    for (let totalMin = 600; totalMin <= 1215; totalMin += 15) {
                      const h = Math.floor(totalMin / 60);
                      const m = totalMin % 60;
                      const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
                      const blocked = bookingStore.isSlotBlocked(proxyDateKey, time);
                      slots.push({ time, blocked });
                    }
                    return slots.map((s) => (
                      <button
                        key={s.time}
                        disabled={s.blocked}
                        onClick={() => setProxyTime(s.time)}
                        className={`rounded-lg p-2.5 text-xs font-semibold transition-all min-h-[44px] ${
                          s.blocked
                            ? "bg-muted text-muted-foreground/40 cursor-not-allowed"
                            : proxyTime === s.time
                            ? "accent-gradient text-accent-foreground shadow-md"
                            : "bg-card border border-border hover:border-accent"
                        }`}
                      >
                        {s.time}
                        {s.blocked && <span className="block text-[9px] text-destructive/70">満枠</span>}
                      </button>
                    ));
                  })()}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setProxyDialogOpen(false)} className="w-full sm:w-auto">キャンセル</Button>
            <Button variant="accent" onClick={handleProxyBook} disabled={!proxyDate || !proxyTime || !proxyClient} className="w-full sm:w-auto">
              予約する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrainerSchedule;
