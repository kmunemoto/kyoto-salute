import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, Clock, Check, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { buildGoogleCalendarUrl } from "@/lib/googleCalendar";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMyBookings, createBooking, cancelBooking, BookingWithTime } from "@/hooks/useBookings";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { toast } from "sonner";
import { trialLabel } from "@/lib/dummyData";
import { sendBookingNotification } from "@/lib/bookingNotification";

const PLAN_LABELS: Record<string, string> = {
  "初回無料体験": "初回無料体験",
  "月4回": "月4回プラン",
  "月6回": "月6回プラン",
  "月8回": "月8回プラン",
  "通い放題": "通い放題プラン",
};

const CustomerBooking = () => {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { bookings: myBookings, loading: bookingsLoading, refetch } = useMyBookings();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<BookingWithTime | null>(null);
  const [lastBooked, setLastBooked] = useState<BookingWithTime | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Booked slots fetched via SECURITY DEFINER RPC — sees ALL bookings regardless of RLS
  const [bookedSlots, setBookedSlots] = useState<{ date: string; startTime: string; endTime: string; isBlock: boolean }[]>([]);

  const dateKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";

  const fetchBookedSlots = useCallback(async (dateStr: string) => {
    const { data } = await supabase.rpc("get_booked_slots", { check_date: dateStr });
    if (!data) { setBookedSlots([]); return; }
    const slots = data
      .filter((r: { status: string }) => r.status !== "キャンセル済み")
      .map((r: { booking_date: string; end_booking_date: string; status: string }) => {
        const dt = new Date(r.booking_date);
        const endDt = new Date(r.end_booking_date);
        return {
          date: format(dt, "yyyy-MM-dd"),
          startTime: `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`,
          endTime: `${String(endDt.getHours()).padStart(2, "0")}:${String(endDt.getMinutes()).padStart(2, "0")}`,
          isBlock: r.status === "ブロック済み",
        };
      });
    setBookedSlots(slots);
  }, []);

  useEffect(() => {
    if (dateKey) fetchBookedSlots(dateKey);
  }, [dateKey, fetchBookedSlots]);

  // Logged-in customers always use their contract plan from profiles.
  const customerPlan = profile?.plan || null;
  const selectedPlan = customerPlan;

  const isSlotBlocked = (date: string, time: string): boolean => {
    const timeToMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
    const newMin = timeToMin(time);
    return bookedSlots.some((b) => {
      if (b.date !== date) return false;
      const bMin = timeToMin(b.startTime);
      const bEnd = timeToMin(b.endTime);
      return newMin < bEnd && bMin < newMin + 75;
    });
  };

  const isSlotWithin24Hours = (date: string, time: string): boolean => {
    const now = new Date();
    const [h, m] = time.split(":").map(Number);
    const slotDate = new Date(date + "T00:00:00+09:00");
    slotDate.setHours(h, m, 0, 0);
    const diffMs = slotDate.getTime() - now.getTime();
    return diffMs < 24 * 60 * 60 * 1000;
  };

  const generateSlots = () => {
    const slots: { id: string; time: string; available: boolean }[] = [];
    for (let totalMin = 600; totalMin <= 1215; totalMin += 15) {
      const h = Math.floor(totalMin / 60);
      const m = totalMin % 60;
      const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      const blocked = isSlotBlocked(dateKey, time);
      const tooSoon = isSlotWithin24Hours(dateKey, time);
      slots.push({ id: `${dateKey}-${time}`, time, available: !blocked && !tooSoon });
    }
    return slots;
  };

  const slots = dateKey ? generateSlots() : [];

  const handleBook = async () => {
    if (!selectedDate || !selectedSlot || !user || !selectedPlan) return;
    const slot = slots.find((s) => s.id === selectedSlot);
    if (!slot) return;

    if (isSlotWithin24Hours(dateKey, slot.time)) {
      toast.error("予約は24時間前までにお願いします");
      setSelectedSlot(null);
      return;
    }

    if (isSlotBlocked(dateKey, slot.time)) {
      toast.error("この時間帯はすでに予約が入っています");
      setSelectedSlot(null);
      return;
    }

    setSubmitting(true);
    const { data, error } = await createBooking(user.id, dateKey, slot.time, selectedPlan);

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
      booking_type: selectedPlan,
    };

    setLastBooked(newBooking);
    toast.success(`${format(selectedDate, "M月d日", { locale: ja })} ${slot.time}〜${endTime} で予約しました！`);
    setSelectedSlot(null);
    setSelectedDate(undefined);
    // plan is auto-assigned, no need to reset
    setSubmitting(false);
    refetch();
    fetchBookedSlots(dateKey);

    // Fire-and-forget notification email to trainer
    sendBookingNotification(data.id, profile?.display_name || "お客様", dateKey, slot.time, endTime, selectedPlan);

    // Fire-and-forget LINE message to customer
    supabase.functions.invoke("send-line-message", {
      body: {
        user_id: user.id,
        message: `✅ ご予約を受け付けました！\n\n📅 ${format(selectedDate!, "M月d日（E）", { locale: ja })} ${slot.time}〜${endTime}\n📋 ${selectedPlan}\n\nお気をつけてお越しください！\nパーソナルジムSalute御所南`,
      },
    }).catch((e) => console.error("LINE message failed:", e));

    // Fire-and-forget push notification to trainer
    supabase.rpc("get_trainer_ids").then(({ data: trainers }) => {
      if (trainers && trainers.length > 0) {
        const trainerIds = trainers.map((t) => t.user_id);
        supabase.functions.invoke("send-push-notification", {
          body: {
            user_ids: [...trainerIds, user.id],
            title: "📅 新しい予約",
            body: `${profile?.display_name || "お客様"}が${format(selectedDate!, "M月d日", { locale: ja })} ${slot.time}〜${endTime}を予約しました`,
            url: "/",
            tag: `booking-${data.id}`,
          },
        }).catch((e) => console.error("Push notification failed:", e));
      }
    });

    // Fire-and-forget confirmation email to customer
    const customerName = profile?.display_name || "お客様";
    const dateObj = new Date(dateKey + "T00:00:00");
    const formattedDate = format(dateObj, "M月d日（E）", { locale: ja });
    supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "booking-confirmation",
        recipientEmail: user.email,
        idempotencyKey: `booking-confirm-${data.id}`,
        templateData: {
          customerName,
          bookingDate: formattedDate,
          bookingTime: `${slot.time}〜${endTime}`,
          planName: selectedPlan,
        },
      },
    }).catch((e) => console.error("Failed to send booking confirmation:", e));
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
    if (dateKey) fetchBookedSlots(dateKey);
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

  const planLabel = (type: string) => PLAN_LABELS[type] || type;

  

  return (
    <>
      <div className="px-4 py-4 space-y-5 slide-up">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-accent" />
            予約する
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            ご希望の日時を選択してください
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">※ご予約は24時間前までにお願いいたします</p>
        </div>

        {/* Success banner */}
        {lastBooked && (
          <Card className="border-l-4 border-l-accent bg-accent/5 slide-up">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-accent" />
                <span className="font-bold text-sm">予約が完了しました！</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {planLabel(lastBooked.booking_type)} — {format(new Date(lastBooked.date), "M月d日（E）", { locale: ja })} {lastBooked.startTime}〜{lastBooked.endTime}（60分）
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    window.open(buildGoogleCalendarUrl(lastBooked.date, lastBooked.startTime, lastBooked.endTime, planLabel(lastBooked.booking_type)), "_blank");
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

        {/* Existing bookings */}
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
                          </p>
                          <Badge variant="outline" className="mt-1 text-[10px] px-1.5 py-0 h-4">
                            {planLabel(b.booking_type)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            window.open(buildGoogleCalendarUrl(b.date, b.startTime, b.endTime, planLabel(b.booking_type)), "_blank");
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

        {/* No plan set → block booking */}
        {!selectedPlan && (
          <Card className="border-l-4 border-l-destructive bg-destructive/5 slide-up">
            <CardContent className="p-4 space-y-2">
              <p className="font-bold text-sm text-destructive">プランが設定されていません</p>
              <p className="text-xs text-muted-foreground">
                トレーナーにお問い合わせの上、プランを設定してもらってください。
              </p>
            </CardContent>
          </Card>
        )}

        {/* Date & time selection (plan auto-assigned) */}
        {selectedPlan && (
          <section className="slide-up">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1">
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  日時を選択
                </h2>
              </div>
              <Badge variant="outline" className="text-xs shrink-0">
                {planLabel(selectedPlan)}
              </Badge>
            </div>

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
                    const now = new Date();
                    // Disable dates where the latest possible slot (20:15) is within 24 hours
                    const latestSlot = new Date(date);
                    latestSlot.setHours(20, 15, 0, 0);
                    return latestSlot.getTime() - now.getTime() < 24 * 60 * 60 * 1000;
                  }}
                  className="pointer-events-auto"
                />
              </CardContent>
            </Card>

            {selectedDate && (
              <div className="mt-4 slide-up">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {format(selectedDate, "M月d日（E）", { locale: ja })} の空き枠
                </h3>
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
                      <Badge variant="outline" className="mb-1.5">{planLabel(selectedPlan)}</Badge>
                      <br />
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
                      この内容で予約する
                    </Button>
                  </div>
                )}
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
