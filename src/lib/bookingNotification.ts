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
    // Find the trainer's email by looking up user_roles
    const { data: trainerRole } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "trainer")
      .maybeSingle();

    if (!trainerRole) {
      console.warn("No trainer found for booking notification");
      return;
    }

    // Get trainer's auth email via profiles - we can't access auth.users,
    // so we'll pass the trainer user_id and let the Edge Function resolve it.
    // Actually, pass recipientEmail — we need to get it somehow.
    // The simplest: use supabase admin to get email in the edge function.
    // For now, pass trainer user_id in templateData and resolve in edge function.

    const dateObj = new Date(date + "T00:00:00");
    const formattedDate = format(dateObj, "M月d日（E）", { locale: ja });

    await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "new-booking-notification",
        recipientEmail: "_resolve_trainer_", // placeholder — edge function resolves
        idempotencyKey: `booking-notify-${bookingId}`,
        templateData: {
          customerName,
          bookingDate: formattedDate,
          bookingTime: `${startTime}〜${endTime}`,
          planName,
          dashboardUrl: window.location.origin,
          trainerUserId: trainerRole.user_id,
        },
      },
    });
  } catch (e) {
    console.error("Failed to send booking notification email:", e);
  }
};
