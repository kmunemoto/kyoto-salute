import { useState, useEffect } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAllBookings, checkSlotBlocked, createBooking } from "@/hooks/useBookings";
import { useAllCustomerProfiles } from "@/hooks/useProfile";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { ja } from "date-fns/locale";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TrainerSchedule = () => {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [proxyDialogOpen, setProxyDialogOpen] = useState(false);
  const [proxyDate, setProxyDate] = useState<Date | undefined>();
  const [proxyTime, setProxyTime] = useState<string>("");
  const [proxyClient, setProxyClient] = useState<string>("");
  const [proxyBookingType, setProxyBookingType] = useState<string>("通常");
  const [submitting, setSubmitting] = useState(false);

  const { bookings, loading, refetch } = useAllBookings();
  const { profiles } = useAllCustomerProfiles();

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  // Generate 15-min interval slots matching booking system (10:00–20:15)
  const timeSlots = (() => {
    const slots: string[] = [];
    for (let min = 600; min <= 1215; min += 15) {
      const h = Math.floor(min / 60);
      const m = min % 60;
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
    return slots;
  })();

  const getSession = (day: Date, time: string) => {
    const dateStr = format(day, "yyyy-MM-dd");
    return bookings.find((b) => b.date === dateStr && b.startTime === time && b.status !== "キャンセル済み");
  };

  const proxyDateKey = proxyDate ? format(proxyDate, "yyyy-MM-dd") : "";

  const handleProxyBook = async () => {
    if (!proxyDate || !proxyTime || !proxyClient) {
      toast.error("日付・時間・お客様を選択してください");
      return;
    }

    if (checkSlotBlocked(bookings, proxyDateKey, proxyTime)) {
      toast.error("すでに予約が入っています。別の時間を選んでください。");
      return;
    }

    setSubmitting(true);
    const { error } = await createBooking(proxyClient, proxyDateKey, proxyTime, proxyBookingType);

    if (error) {
      toast.error("予約の追加に失敗しました");
      setSubmitting(false);
      return;
    }

    const client = profiles.find((p) => p.user_id === proxyClient);
    toast.success(`${client?.display_name || "顧客"}さんの予約を追加しました（${format(proxyDate, "M/d")} ${proxyTime}）`);
    setProxyDialogOpen(false);
    setProxyDate(undefined);
    setProxyTime("");
    setProxyClient("");
    setProxyBookingType("通常");
    setSubmitting(false);
    refetch();
  };

  const getDayBookings = (day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd");
    return bookings.filter((b) => b.date === dateStr && b.status !== "キャンセル済み");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

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
                      const isToday = isSameDay(day, new Date());
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
                  {timeSlots.map((time) => {
                    const hasAnySession = weekDays.some((day) => getSession(day, time));
                    // Hide empty rows to keep the table compact
                    if (!hasAnySession) return null;
                    return (
                    <tr key={time} className="border-b last:border-b-0">
                      <td className="p-2 text-xs font-medium text-muted-foreground text-center border-r">{time}</td>
                      {weekDays.map((day) => {
                        const session = getSession(day, time);
                        const isToday = isSameDay(day, new Date());
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile: day-based list view */}
      <div className="md:hidden space-y-3">
        {weekDays.map((day) => {
          const isToday = isSameDay(day, new Date());
          const dayBookings = getDayBookings(day);
          return (
            <div key={day.toISOString()}>
              <div className={`flex items-center gap-2 mb-1.5 ${isToday ? "text-accent" : "text-muted-foreground"}`}>
                <span className="text-xs font-bold uppercase">
                  {format(day, "M/d（E）", { locale: ja })}
                </span>
                {isToday && <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded-full font-bold">今日</span>}
              </div>
              {dayBookings.length > 0 ? (
                <div className="space-y-1.5">
                  {dayBookings
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map((b) => (
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
                  {profiles.map((p) => (
                    <SelectItem key={p.user_id} value={p.user_id}>{p.display_name || "不明"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">予約プラン</label>
              <Select value={proxyBookingType} onValueChange={setProxyBookingType}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="初回無料体験">初回無料体験</SelectItem>
                  <SelectItem value="月4回">月4回</SelectItem>
                  <SelectItem value="月6回">月6回</SelectItem>
                  <SelectItem value="月8回">月8回</SelectItem>
                  <SelectItem value="通い放題">通い放題</SelectItem>
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
                      const blocked = checkSlotBlocked(bookings, proxyDateKey, time);
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
            <Button variant="accent" onClick={handleProxyBook} disabled={!proxyDate || !proxyTime || !proxyClient || submitting} className="w-full sm:w-auto">
              {submitting && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              予約する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrainerSchedule;
