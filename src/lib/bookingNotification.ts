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
  customerUserId?: string,
) => {
  try {
    // Find the trainer via secure RPC (avoids exposing user_roles table)
    const { data: trainerRoles } = await supabase.rpc("get_trainer_ids");
    const trainerRole = trainerRoles?.[0] ?? null;

    const dateObj = new Date(date + "T00:00:00+09:00");
    const formattedDate = format(dateObj, "M月d日（E）", { locale: ja });
    const bookingTime = `${startTime}〜${endTime}`;

    // Notify trainer
    if (trainerRole) {
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "new-booking-notification",
          recipientEmail: "_resolve_trainer_",
          idempotencyKey: `booking-notify-${bookingId}`,
          templateData: {
            customerName,
            bookingDate: formattedDate,
            bookingTime,
            planName,
            dashboardUrl: window.location.origin,
            trainerUserId: trainerRole.user_id,
          },
        },
      });
    } else {
      console.warn("No trainer found for booking notification");
    }

    // Notify customer (booking confirmation email)
    if (customerUserId) {
      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "booking-confirmation",
          recipientEmail: "_resolve_user_",
          idempotencyKey: `booking-confirm-customer-${bookingId}`,
          templateData: {
            customerName,
            bookingDate: formattedDate,
            bookingTime,
            planName,
            resolveUserId: customerUserId,
          },
        },
      });
    }
  } catch (e) {
    console.error("Failed to send booking notification email:", e);
  }
};
