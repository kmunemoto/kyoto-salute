import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

/**
 * Send a booking notification email to the trainer.
 * Fire-and-forget — errors are logged but never block the UI.
 */
export const sendBookingNotification = async (
  bookingId: string,
  customerName: string,
  date: string,
  startTime: string,
  endTime: string,
  planName: string,
) => {
  try {
    const dateObj = new Date(date + "T00:00:00");
    const formattedDate = format(dateObj, "M月d日（E）", { locale: ja });

    await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "new-booking-notification",
        recipientEmail: "trainer@placeholder.com", // template.to will override
        idempotencyKey: `booking-notify-${bookingId}`,
        templateData: {
          customerName,
          bookingDate: formattedDate,
          bookingTime: `${startTime}〜${endTime}`,
          planName,
          dashboardUrl: window.location.origin,
        },
      },
    });
  } catch (e) {
    console.error("Failed to send booking notification email:", e);
  }
};
