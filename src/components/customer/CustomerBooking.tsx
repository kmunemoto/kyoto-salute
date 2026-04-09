import { useState, useSyncExternalStore } from "react";
import { CalendarDays, Clock, Check, CreditCard, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { availableSlots, currentPlan } from "@/lib/dummyData";
import { bookingStore, Booking } from "@/stores/bookingStore";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { toast } from "sonner";

const CustomerBooking = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);

  const bookings = useSyncExternalStore(bookingStore.subscribe, bookingStore.getBookings);
  const myBookings = bookings.filter((b) => b.clientName === "田中 太郎");

  const dateKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
  const slots = dateKey ? availableSlots[dateKey] || [] : [];

  const availableDates = Object.keys(availableSlots).map((d) => new Date(d));
  const bookedDates = myBookings.map((b) => new Date(b.date));

  const handleBook = () => {
    if (selectedDate && selectedSlot) {
      const slot = slots.find((s) => s.id === selectedSlot);
      if (!slot) return;

      if (bookingStore.isSlotBlocked(dateKey, slot.time)) {
        toast.error("この時間帯はすでに予約が入っています");
        setSelectedSlot(null);
        return;
      }

      const [h, m] = slot.time.split(":").map(Number);
      const endMin = h * 60 + m + 60;
      const endTime = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;

      bookingStore.addBooking({
        id: `b-${Date.now()}`,
        date: dateKey,
        startTime: slot.time,
        endTime,
        clientName: "田中 太郎",
      });
      toast.success(`${format(selectedDate, "M月d日", { locale: ja })} ${slot.time}〜${endTime} で予約しました！`);
      setSelectedSlot(null);
      setSelectedDate(undefined);
    }
  };

  const handleCancel = () => {
    if (!cancelTarget) return;
    bookingStore.removeBooking(cancelTarget.id);
    toast.success("予約をキャンセルしました");
    setCancelTarget(null);
  };

  const isSlotAvailable = (slot: { available: boolean; time: string }) => {
    if (!slot.available) return false;
    return !bookingStore.isSlotBlocked(dateKey, slot.time);
  };

  const cancelDescription = cancelTarget
    ? `${format(new Date(cancelTarget.date), "M月d日（E）", { locale: ja })} ${cancelTarget.startTime}〜${cancelTarget.endTime} の予約をキャンセルします。`
    : "予約をキャンセルします。";

  return (
    <>
      <div className="px-4 py-4 space-y-5 slide-up">
        <Card className="border-l-4 border-l-accent bg-accent/5">
          <CardContent className="p-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-accent" />
            <span className="text-sm font-bold">現在のプラン：{currentPlan}</span>
          </CardContent>
        </Card>

        <div>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-accent" />
            予約する
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            空いている日時を選んでください（1コマ60分＋休憩15分）
          </p>
        </div>

        {myBookings.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
              予約済み（{myBookings.length}件）
            </h2>
            <div className="space-y-2">
              {[...myBookings]
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
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCancelTarget(b)}
                        className="text-destructive hover:text-destructive/80 transition-colors p-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
                const key = format(date, "yyyy-MM-dd");
                return !availableSlots[key];
              }}
              modifiers={{ available: availableDates, booked: bookedDates }}
              modifiersClassNames={{ available: "font-bold text-accent", booked: "ring-2 ring-accent ring-inset" }}
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
            {slots.length === 0 ? (
              <Card>
                <CardContent className="p-4 text-center text-sm text-muted-foreground">
                  この日の空き枠はありません
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-4 gap-1.5">
                {slots.map((slot) => {
                  const available = isSlotAvailable(slot);
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={!available}
                      onClick={() => setSelectedSlot(slot.id)}
                      className={`relative rounded-lg p-2 text-center text-xs font-semibold transition-all duration-200 ${
                        !available
                          ? "bg-muted text-muted-foreground/40 cursor-not-allowed"
                          : selectedSlot === slot.id
                            ? "accent-gradient text-accent-foreground shadow-md scale-105"
                            : "bg-card border border-border hover:border-accent hover:shadow-sm"
                      }`}
                    >
                      <span>{slot.time}</span>
                      {!available && (
                        <span className="block text-[9px] text-destructive/70 font-medium">満枠</span>
                      )}
                      {selectedSlot === slot.id && (
                        <Check className="w-2.5 h-2.5 absolute top-0.5 right-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {selectedSlot && (
              <div className="mt-3 p-3 rounded-xl bg-accent/10 border border-accent/20">
                <p className="text-sm text-center mb-3">
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
                <Button variant="accent" size="lg" className="w-full" onClick={handleBook}>
                  この時間で予約する
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
