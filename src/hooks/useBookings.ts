import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

export interface BookingRow {
  id: string;
  user_id: string;
  booking_date: string;
  status: string;
  booking_type: string;
  created_at: string;
  display_name?: string;
}

export interface BookingWithTime {
  id: string;
  user_id: string;
  date: string;
  startTime: string;
  endTime: string;
  clientName: string;
  status: string;
  booking_type: string;
}

function parseBooking(row: BookingRow): BookingWithTime {
  const dt = new Date(row.booking_date);
  const h = dt.getHours();
  const m = dt.getMinutes();
  const startTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  const endMin = h * 60 + m + 60;
  const endTime = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;
  const date = format(dt, "yyyy-MM-dd");

  return {
    id: row.id,
    user_id: row.user_id,
    date,
    startTime,
    endTime,
    clientName: row.display_name || "不明",
    status: row.status,
    booking_type: row.booking_type,
  };
}

export const useMyBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithTime[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    if (!user) {
      setBookings([]);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_id", user.id)
      .order("booking_date", { ascending: true });

    if (data) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();

      setBookings(data.map((r) => parseBooking({ ...r, display_name: profile?.display_name || "自分" })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void fetchBookings();
  }, [fetchBookings]);

  return { bookings, loading, refetch: fetchBookings };
};

export const useAllBookings = () => {
  const [bookings, setBookings] = useState<BookingWithTime[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    setLoading(true);

    const [{ data: rows, error }, { data: trialRows }] = await Promise.all([
      supabase.from("bookings").select("*").order("booking_date", { ascending: true }),
      supabase.from("trial_bookings").select("*").order("booking_date", { ascending: true }),
    ]);

    if (error) {
      console.error("Failed to fetch bookings:", error);
      setBookings([]);
      setLoading(false);
      return;
    }

    const allRows = rows || [];

    const userIds = [...new Set(allRows.map((r) => r.user_id))];
    let nameMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);
      profiles?.forEach((p) => {
        nameMap[p.user_id] = p.display_name || "不明";
      });
    }

    const parsed: BookingWithTime[] = allRows.map((r) =>
      parseBooking({ ...r, display_name: nameMap[r.user_id] || "不明" })
    );

    // Merge trial bookings as BookingWithTime entries
    trialRows?.forEach((t) => {
      if (t.status === "キャンセル済み") return;
      const dt = new Date(t.booking_date);
      const h = dt.getHours();
      const m = dt.getMinutes();
      const startTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      const endMin = h * 60 + m + 60;
      const endTime = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;
      parsed.push({
        id: t.id,
        user_id: "trial-guest",
        date: format(dt, "yyyy-MM-dd"),
        startTime,
        endTime,
        clientName: `🆕 ${t.guest_name}`,
        status: t.status,
        booking_type: t.booking_type,
      });
    });

    parsed.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
    setBookings(parsed);
    setLoading(false);
  }, []);

  const removeBooking = useCallback((bookingId: string) => {
    setBookings((current) => current.filter((booking) => booking.id !== bookingId));
  }, []);

  useEffect(() => {
    void fetchBookings();
  }, [fetchBookings]);

  return { bookings, loading, refetch: fetchBookings, removeBooking };
};

export const checkSlotBlocked = (bookings: BookingWithTime[], date: string, startTime: string): boolean => {
  const timeToMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const newMin = timeToMin(startTime);

  return bookings.some((b) => {
    if (b.date !== date || b.status === "キャンセル済み") return false;
    const bMin = timeToMin(b.startTime);
    return newMin < bMin + 75 && bMin < newMin + 75;
  });
};

export const createBooking = async (
  userId: string,
  date: string,
  startTime: string,
  bookingType: string = "通常"
) => {
  const bookingDate = `${date}T${startTime}:00+09:00`;
  const { data, error } = await supabase
    .from("bookings")
    .insert({ user_id: userId, booking_date: bookingDate, booking_type: bookingType })
    .select()
    .single();

  return { data, error };
};

export const cancelBooking = async (bookingId: string, cancelledByTrainer = false) => {
  // Fetch booking details before deleting
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, user_id, booking_date, booking_type")
    .eq("id", bookingId)
    .maybeSingle();

  const { error } = await supabase
    .from("bookings")
    .delete()
    .eq("id", bookingId);

  if (!error && booking) {
    // Send LINE cancel notification (fire-and-forget)
    sendCancelLineNotification(booking, cancelledByTrainer).catch(console.error);
  }

  return { error };
};

async function sendCancelLineNotification(
  booking: { user_id: string; booking_date: string; booking_type: string },
  cancelledByTrainer: boolean,
) {
  const dt = new Date(booking.booking_date);
  const dateStr = format(dt, "M月d日（E） HH:mm", { locale: ja });

  if (cancelledByTrainer) {
    // Trainer cancelled → notify customer via LINE
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", booking.user_id)
      .maybeSingle();
    const name = profile?.display_name || "お客";

    await supabase.functions.invoke("send-line-message", {
      body: {
        user_id: booking.user_id,
        message: `❌ 予約キャンセルのお知らせ\n\n${name}様、${dateStr}の予約（${booking.booking_type}）がキャンセルされました。\n\nご不明な点がございましたらお問い合わせください。\nパーソナルジムSalute御所南`,
      },
    });
  } else {
    // Customer cancelled → notify trainer via LINE
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", booking.user_id)
      .maybeSingle();
    const customerName = profile?.display_name || "顧客";

    // Get trainer user_id
    const { data: trainerIds } = await supabase.rpc("get_trainer_ids");
    const trainerId = trainerIds?.[0]?.user_id;
    if (!trainerId) return;

    await supabase.functions.invoke("send-line-message", {
      body: {
        user_id: trainerId,
        message: `❌ 予約キャンセル通知\n\n${customerName}様が${dateStr}の予約（${booking.booking_type}）をキャンセルしました。\n\nパーソナルジムSalute御所南`,
      },
    });
  }
}
