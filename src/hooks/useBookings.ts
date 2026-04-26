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
  isBlocked?: boolean;
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

    const [{ data: rows, error }, { data: trialRows }, { data: blockedRows }] = await Promise.all([
      supabase.from("bookings").select("*").order("booking_date", { ascending: true }),
      supabase.from("trial_bookings").select("*").order("booking_date", { ascending: true }),
      supabase.from("blocked_slots").select("*"),
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

    // Merge blocked slots
    blockedRows?.forEach((bs) => {
      const dt = new Date(bs.blocked_date);
      const endDt = new Date(bs.end_blocked_date);
      const h = dt.getHours();
      const m = dt.getMinutes();
      const startTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      const eh = endDt.getHours();
      const em = endDt.getMinutes();
      const endTime = `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
      parsed.push({
        id: bs.id,
        user_id: "blocked",
        date: format(dt, "yyyy-MM-dd"),
        startTime,
        endTime,
        clientName: bs.reason || "ブロック",
        status: "ブロック済み",
        booking_type: "ブロック",
        isBlocked: true,
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

export const checkSlotBlocked = (bookings: BookingWithTime[], date: string, startTime: string, endTimeOverride?: string): boolean => {
  const BUFFER_MINUTES = 15;
  const timeToMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const newMin = timeToMin(startTime);
  const newEnd = endTimeOverride ? timeToMin(endTimeOverride) : newMin + 75;

  return bookings.some((b) => {
    if (b.date !== date || b.status === "キャンセル済み") return false;
    const bMin = timeToMin(b.startTime);
    const bEnd = timeToMin(b.endTime) + (b.isBlocked ? 0 : BUFFER_MINUTES);
    return newMin < bEnd && bMin < newEnd;
  });
};

export const createBooking = async (
  userId: string,
  date: string,
  startTime: string,
  bookingType: string = "通常",
  isProxyBooking = false,
) => {
  const bookingDate = `${date}T${startTime}:00+09:00`;
  const { data, error } = await supabase
    .from("bookings")
    .insert({ user_id: userId, booking_date: bookingDate, booking_type: bookingType })
    .select()
    .single();

  if (!error && data) {
    // Always notify customer about their booking
    sendBookingConfirmationToCustomer(userId, date, startTime, bookingType, isProxyBooking).catch(console.error);
    // Always notify trainer about new bookings (skip if trainer is the one booking for themselves)
    sendNewBookingLineToTrainer(userId, date, startTime, bookingType).catch(console.error);

    // Sync to Google Calendar (fire-and-forget)
    supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data: prof }) => {
        supabase.functions.invoke("google-calendar-sync", {
          body: {
            action: "create",
            booking_id: data.id,
            booking_date: data.booking_date,
            booking_type: bookingType,
            client_name: prof?.display_name || "顧客",
          },
        }).catch(console.error);
      });
  }

  return { data, error };
};

async function sendBookingConfirmationToCustomer(
  userId: string,
  date: string,
  startTime: string,
  bookingType: string,
  isProxyBooking: boolean,
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("user_id", userId)
    .maybeSingle();
  const name = profile?.display_name || "お客";

  const dt = new Date(`${date}T${startTime}:00+09:00`);
  const md = format(dt, "M/d", { locale: ja });
  const dow = format(dt, "E", { locale: ja });
  const hm = format(dt, "HH:mm", { locale: ja });

  const proxyNote = isProxyBooking ? "\n※トレーナーが代理で予約を登録しました。" : "";

  await supabase.functions.invoke("send-line-message", {
    body: {
      user_id: userId,
      message: `✅ 予約確定\n\n${md}（${dow}）${hm}\n\n${name}様、トレーニングのご予約が完了しました。${proxyNote}\n\nプラン：${bookingType}\n\nパーソナルジムSalute御所南`,
    },
  });
}

async function sendNewBookingLineToTrainer(
  userId: string,
  date: string,
  startTime: string,
  bookingType: string,
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("user_id", userId)
    .maybeSingle();
  const customerName = profile?.display_name || "顧客";

  const { data: trainerIds } = await supabase.rpc("get_trainer_ids");
  const trainerId = trainerIds?.[0]?.user_id;
  if (!trainerId) return;

  const dt = new Date(`${date}T${startTime}:00+09:00`);
  const dateStr = format(dt, "M月d日（E） HH:mm", { locale: ja });

  await supabase.functions.invoke("send-line-message", {
    body: {
      user_id: trainerId,
      message: `📅 新規予約通知\n\n${dateStr}\n\n${customerName}様から予約が入りました。\n\nプラン：${bookingType}\n\nパーソナルジムSalute御所南`,
    },
  });
}

export const cancelBooking = async (bookingId: string, cancelledByTrainer = false) => {
  // Fetch booking details before deleting
  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("id, user_id, booking_date, booking_type, google_event_id")
    .eq("id", bookingId)
    .maybeSingle();

  if (fetchError || !booking) {
    console.error("cancelBooking: 予約情報の取得に失敗", fetchError, bookingId);
  }

  const { error } = await supabase
    .from("bookings")
    .delete()
    .eq("id", bookingId);

  if (!error && booking) {
    console.log("LINE通知送信開始", booking.id, { cancelledByTrainer });
    // Send LINE cancel notification (fire-and-forget)
    sendCancelLineNotification(booking, cancelledByTrainer).catch((e) =>
      console.error("sendCancelLineNotification failed:", e)
    );

    // Delete from Google Calendar (fire-and-forget)
    if (booking.google_event_id) {
      supabase.functions.invoke("google-calendar-sync", {
        body: { action: "delete", google_event_id: booking.google_event_id },
      }).catch(console.error);
    }
  } else if (error) {
    console.error("cancelBooking: 削除エラー", error);
  }

  return { error };
};

async function sendCancelLineNotification(
  booking: { user_id: string; booking_date: string; booking_type: string },
  cancelledByTrainer: boolean,
) {
  const dt = new Date(booking.booking_date);
  const dateStr = format(dt, "M月d日（E） HH:mm", { locale: ja });
  const md = format(dt, "M/d", { locale: ja });
  const dow = format(dt, "E", { locale: ja });
  const hm = format(dt, "HH:mm", { locale: ja });

  // Always fetch customer name & trainer id (needed for both paths)
  const [{ data: profile }, { data: trainerIds }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("user_id", booking.user_id).maybeSingle(),
    supabase.rpc("get_trainer_ids"),
  ]);
  const customerName = profile?.display_name || "顧客";
  const trainerId = trainerIds?.[0]?.user_id;

  if (cancelledByTrainer) {
    // Notify customer
    console.log("LINE送信: 顧客へキャンセル通知", booking.user_id);
    const custRes = await supabase.functions.invoke("send-line-message", {
      body: {
        user_id: booking.user_id,
        message: `❌ キャンセル完了\n\n${md}（${dow}）${hm}\n\n${customerName}様、上記ご予約をキャンセルしました。\n\nプラン：${booking.booking_type}\n\nパーソナルジムSalute御所南`,
      },
    });
    console.log("LINE送信結果(顧客):", custRes);

    // Notify trainer (self-confirmation)
    if (trainerId) {
      console.log("LINE送信: トレーナーへキャンセル確認通知", trainerId);
      const trRes = await supabase.functions.invoke("send-line-message", {
        body: {
          user_id: trainerId,
          message: `✅ キャンセル処理完了\n\n${dateStr}\n\n${customerName}様の予約をキャンセルしました。\n\nプラン：${booking.booking_type}\n\nパーソナルジムSalute御所南`,
        },
      });
      console.log("LINE送信結果(トレーナー):", trRes);
    }
  } else {
    // Customer cancelled → notify both
    if (trainerId) {
      console.log("LINE送信: トレーナーへキャンセル通知", trainerId);
      await supabase.functions.invoke("send-line-message", {
        body: {
          user_id: trainerId,
          message: `❌ 予約キャンセル通知\n\n${dateStr}\n\n${customerName}様がキャンセルしました。\n\nプラン：${booking.booking_type}\n\nパーソナルジムSalute御所南`,
        },
      });
    }

    // Notify customer (cancellation confirmation)
    console.log("LINE送信: 顧客へキャンセル確認通知", booking.user_id);
    await supabase.functions.invoke("send-line-message", {
      body: {
        user_id: booking.user_id,
        message: `❌ キャンセル完了\n\n${md}（${dow}）${hm}\n\n${customerName}様、上記ご予約をキャンセルしました。\n\nプラン：${booking.booking_type}\n\nパーソナルジムSalute御所南`,
      },
    });
  }
}
