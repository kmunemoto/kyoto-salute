import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, CalendarDays, Clock, CalendarPlus } from "lucide-react";
import { ja } from "date-fns/locale";
import { formatJST } from "@/lib/timezone";

interface BookingCancelledDialogProps {
  open: boolean;
  onClose: () => void;
  onNewBooking: () => void;
  date: string; // yyyy-MM-dd
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

/**
 * 予約キャンセル完了モーダル。
 * 予約完了モーダルと統一感のあるレイアウトだが、アクセントはグレー(#999)。
 */
const BookingCancelledDialog = ({
  open,
  onClose,
  onNewBooking,
  date,
  startTime,
  endTime,
}: BookingCancelledDialogProps) => {
  const formattedDate = date ? formatJST(`${date}T00:00:00+09:00`, "M月d日（E）", { locale: ja }) : "";

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm rounded-2xl p-6 gap-0 [&>button]:hidden">
        <div className="flex flex-col items-center text-center space-y-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center shadow-md"
            style={{ backgroundColor: "#999999" }}
          >
            <X className="w-9 h-9 text-white" strokeWidth={3} />
          </div>

          <DialogTitle className="text-xl font-bold">キャンセルを受け付けました</DialogTitle>
          <DialogDescription className="sr-only">予約キャンセル内容のご確認</DialogDescription>

          <div
            className="w-full rounded-xl p-4 space-y-2 border"
            style={{ backgroundColor: "rgba(153,153,153,0.06)", borderColor: "rgba(153,153,153,0.25)" }}
          >
            <div className="flex items-center justify-center gap-2 text-sm">
              <CalendarDays className="w-4 h-4 shrink-0" style={{ color: "#999999" }} />
              <span className="font-bold">{formattedDate}</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm">
              <Clock className="w-4 h-4 shrink-0" style={{ color: "#999999" }} />
              <span className="font-bold">{startTime}〜{endTime}</span>
            </div>
          </div>

          <Button
            onClick={onNewBooking}
            className="w-full h-12 rounded-xl text-base font-bold text-white hover:opacity-90"
            style={{ backgroundColor: "#999999" }}
          >
            <CalendarPlus className="w-4 h-4 mr-2" />
            新しい予約を取る
          </Button>

          <Button
            onClick={onClose}
            variant="outline"
            className="w-full h-11 rounded-xl text-sm font-semibold"
            style={{ borderColor: "#999999", color: "#666666" }}
          >
            閉じる
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingCancelledDialog;