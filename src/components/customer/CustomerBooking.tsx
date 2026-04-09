import { useState, useEffect } from "react";
import { CalendarDays, Clock, Check, CreditCard, Trash2, ExternalLink, Sparkles, Loader2 } from "lucide-react";
import { buildGoogleCalendarUrl } from "@/lib/googleCalendar";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { useMyBookings, checkSlotBlocked, createBooking, cancelBooking, useAllBookings, BookingWithTime } from "@/hooks/useBookings";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { toast } from "sonner";
import { trialLabel } from "@/lib/dummyData";

const CustomerBooking = () => {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { bookings: myBookings, loading: bookingsLoading, refetch } = useMyBookings();
  // Fetch ALL bookings for slot blocking (need to see other users' bookings too)
  const { bookings: allBookings, refetch: refetchAll } = useAllBookings();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<BookingWithTime | null>(null);
  const [lastBooked, setLastBooked] = useState<BookingWithTime | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isTrialUser = profile ? !profile.trial_completed : false;
  const currentPlan = profile?.plan || "月4回プラン";

  const dateKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";

  // Generate time slots for selected date (10:00 - 20:15, 15-min intervals)
  const generateSlots = () => {
    const slots: { id: string; time: string; available: boolean }[] = [];
    for (let totalMin = 600; totalMin <= 1215; totalMin += 15) {
      const h = Math.floor(totalMin / 60);
      const m = totalMin % 60;
      const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      const blocked = checkSlotBlocked(allBookings, dateKey, time);
      slots.push({ id: `${dateKey}-${time}`, time, available: !blocked });
    }
    return slots;
  };

  const slots = dateKey ? generateSlots() : [];

  const handleBook = async () => {
    if (!selectedDate || !selectedSlot || !user) return;
    const slot = slots.find((s) => s.id === selectedSlot);
    if (!slot) return;

    if (checkSlotBlocked(allBookings, dateKey, slot.time)) {
      toast.error("この時間帯はすでに予約が入っています");
      setSelectedSlot(null);
      return;
    }

    setSubmitting(true);
    const bookingType = isTrialUser ? "初回体験" : "通常";
    const { data, error } = await createBooking(user.id, dateKey, slot.time, bookingType);

    if (error) {
      toast.error("予約に失敗しました");
      setSubmitting(false);
      return;
    }

    const [h, m] = slot.time.split(":").map(Number);
    const endMin = h * 60 + m + 60;
    const endTime = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;

    const newBooking: BookingWithTime = {
      id: data.id,
      user_id: user.id,
      date: dateKey,
      startTime: slot.time,
      endTime,
      clientName: profile?.display_name || "自分",
      status: "予約済み",
      booking_type: bookingType,
    };

    setLastBooked(newBooking);
    toast.success(`${format(selectedDate, "M月d日", { locale: ja })} ${slot.time}〜${endTime} で予約しました！`);
    setSelectedSlot(null);
    setSelectedDate(undefined);
    setSubmitting(false);
    refetch();
    refetchAll();
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    const { error } = await cancelBooking(cancelTarget.id);
    if (error) {
      toast.error("キャンセルに失敗しました");
      return;
    }
    toast.success("予約をキャンセルしました");
    setCancelTarget(null);
    refetch();
    refetchAll();
  };

  const activeBookings = myBookings.filter((b) => b.status !== "キャンセル済み");

  const cancelDescription = cancelTarget
    ? `${format(new Date(cancelTarget.date), "M月d日（E）", { locale: ja })} ${cancelTarget.startTime}〜${cancelTarget.endTime} の予約をキャンセルします。`
    : "予約をキャンセルします。";

  if (profileLoading || bookingsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <>
      <div className="px-4 py-4 space-y-5 slide-up">
        {/* Trial user: special banner / Regular user: plan badge */}
        {isTrialUser ? (
          <Card className="border-2 border-accent bg-gradient-to-r from-accent/10 to-accent/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl accent-gradient flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="font-bold text-base">{trialLabel}</p>
                  <p className="text-xs text-muted-foreground">初めての方限定</p>
                </div>
              </div>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-2xl font-extrabold text-accent">無料</span>
                <span className="text-xs text-muted-foreground">（¥0）</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                カウンセリング＋パーソナルトレーニング60分の無料体験セッションです。下のカレンダーからご希望の日時をお選びください。
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-l-4 border-l-accent bg-accent/5">
            <CardContent className="p-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-accent" />
              <span className="text-sm font-bold">現在のプラン：{currentPlan}</span>
            </CardContent>
          </Card>
        )}

        <div>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-accent" />
            {isTrialUser ? "初回無料体験を予約する" : "予約する"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isTrialUser
              ? "ご希望の日時を選んでください（無料体験60分）"
              : "空いている日時を選んでください（1コマ60分＋休憩15分）"}
          </p>
        </div>

        {lastBooked && (
          <Card className="border-l-4 border-l-accent bg-accent/5 slide-up">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-accent" />
                <span className="font-bold text-sm">
                  {lastBooked.booking_type === "初回体験" ? "初回無料体験の予約が完了しました！" : "予約が完了しました！"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {format(new Date(lastBooked.date), "M月d日（E）", { locale: ja })} {lastBooked.startTime}〜{lastBooked.endTime}（60分）
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    window.open(buildGoogleCalendarUrl(lastBooked.date, lastBooked.startTime, lastBooked.endTime, lastBooked.booking_type === "初回体験" ? "初回無料体験" : currentPlan), "_blank");
                  }}
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1" />
                  Googleカレンダーに追加
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setLastBooked(null)}>
                  閉じる
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeBookings.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
              予約済み（{activeBookings.length}件）
            </h2>
            <div className="space-y-2">
              {[...activeBookings]
                .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
                .map((b) => (
                  <Card key={b.id} className="card-hover">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl accent-gradient flex items-center justify-center">
                          <CalendarDays className="w-4 h-4 text-accent-foreground" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">
                            {format(new Date(b.date), "M月d日（E）", { locale: ja })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {b.startTime}〜{b.endTime}
                            {b.booking_type === "初回体験" && (
                              <span className="ml-1 text-accent font-bold">（無料体験）</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            window.open(buildGoogleCalendarUrl(b.date, b.startTime, b.endTime, b.booking_type === "初回体験" ? "初回無料体験" : currentPlan), "_blank");
                          }}
                          className="text-muted-foreground hover:text-accent transition-colors p-2"
                          title="Googleカレンダーに追加"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCancelTarget(b)}
                          className="text-destructive hover:text-destructive/80 transition-colors p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </section>
        )}

        <Card>
          <CardContent className="p-3 flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => {
                setSelectedDate(d);
                setSelectedSlot(null);
              }}
              locale={ja}
              disabled={(date) => {
                // Disable past dates
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return date < today;
              }}
              className="pointer-events-auto"
            />
          </CardContent>
        </Card>

        {selectedDate && (
          <section className="slide-up">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {format(selectedDate, "M月d日（E）", { locale: ja })} の空き枠
            </h2>
            <div className="grid grid-cols-4 gap-1.5">
              {slots.map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  disabled={!slot.available}
                  onClick={() => setSelectedSlot(slot.id)}
                  className={`relative rounded-lg p-2 text-center text-xs font-semibold transition-all duration-200 min-h-[44px] ${
                    !slot.available
                      ? "bg-muted text-muted-foreground/40 cursor-not-allowed"
                      : selectedSlot === slot.id
                        ? "accent-gradient text-accent-foreground shadow-md scale-105"
                        : "bg-card border border-border hover:border-accent hover:shadow-sm"
                  }`}
                >
                  <span>{slot.time}</span>
                  {!slot.available && (
                    <span className="block text-[9px] text-destructive/70 font-medium">満枠</span>
                  )}
                  {selectedSlot === slot.id && (
                    <Check className="w-2.5 h-2.5 absolute top-0.5 right-0.5" />
                  )}
                </button>
              ))}
            </div>

            {selectedSlot && (
              <div className="mt-3 p-3 rounded-xl bg-accent/10 border border-accent/20">
                <p className="text-sm text-center mb-3">
                  {isTrialUser && (
                    <span className="block text-xs font-bold text-accent mb-1">
                      {trialLabel} — 無料
                    </span>
                  )}
                  <span className="font-bold">{slots.find((s) => s.id === selectedSlot)?.time}</span>
                  〜
                  <span className="font-bold">
                    {(() => {
                      const t = slots.find((s) => s.id === selectedSlot)?.time;
                      if (!t) return "";
                      const [h, m] = t.split(":").map(Number);
                      const end = h * 60 + m + 60;
                      return `${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`;
                    })()}
                  </span>
                  （60分）
                </p>
                <Button variant="accent" size="lg" className="w-full" onClick={handleBook} disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {isTrialUser ? "初回無料体験を予約する" : "この時間で予約する"}
                </Button>
              </div>
            )}
          </section>
        )}
      </div>

      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 px-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-lg">
            <div className="space-y-2 text-center sm:text-left">
              <h3 className="text-lg font-semibold">予約をキャンセルしますか？</h3>
              <p className="text-sm text-muted-foreground">{cancelDescription}</p>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-2">
              <Button variant="outline" onClick={() => setCancelTarget(null)}>
                戻る
              </Button>
              <Button onClick={handleCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                キャンセルする
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CustomerBooking;
