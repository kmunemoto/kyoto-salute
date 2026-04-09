import { useState } from "react";
import { CalendarDays, Clock, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { availableSlots } from "@/lib/dummyData";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { toast } from "sonner";

const CustomerBooking = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const dateKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
  const slots = dateKey ? availableSlots[dateKey] || [] : [];

  const availableDates = Object.keys(availableSlots).map((d) => new Date(d));

  const handleBook = () => {
    if (selectedDate && selectedSlot) {
      const slot = slots.find((s) => s.id === selectedSlot);
      toast.success(`${format(selectedDate, "M月d日", { locale: ja })} ${slot?.time} で予約しました！`);
      setSelectedSlot(null);
      setSelectedDate(undefined);
    }
  };

  return (
    <div className="px-4 py-4 space-y-5 slide-up">
      <div>
        <h1 className="text-lg font-bold flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-accent" />
          予約する
        </h1>
        <p className="text-sm text-muted-foreground mt-1">空いている日時を選んでください</p>
      </div>

      {/* Calendar */}
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
            modifiers={{ available: availableDates }}
            modifiersClassNames={{ available: "font-bold text-accent" }}
            className="pointer-events-auto"
          />
        </CardContent>
      </Card>

      {/* Time Slots */}
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
            <div className="grid grid-cols-3 gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.id}
                  disabled={!slot.available}
                  onClick={() => setSelectedSlot(slot.id)}
                  className={`relative rounded-xl p-3 text-center text-sm font-semibold transition-all duration-200 ${
                    !slot.available
                      ? "bg-muted text-muted-foreground/40 cursor-not-allowed line-through"
                      : selectedSlot === slot.id
                      ? "accent-gradient text-accent-foreground shadow-md scale-105"
                      : "bg-card border border-border hover:border-accent hover:shadow-sm"
                  }`}
                >
                  {slot.time}
                  {selectedSlot === slot.id && (
                    <Check className="w-3 h-3 absolute top-1 right-1" />
                  )}
                </button>
              ))}
            </div>
          )}

          {selectedSlot && (
            <Button
              variant="accent"
              size="lg"
              className="w-full mt-4"
              onClick={handleBook}
            >
              この時間で予約する
            </Button>
          )}
        </section>
      )}
    </div>
  );
};

export default CustomerBooking;
