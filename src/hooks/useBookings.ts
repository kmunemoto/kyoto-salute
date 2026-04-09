import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO, startOfDay, endOfDay } from "date-fns";

export interface BookingRow {
  id: string;
  user_id: string;
  booking_date: string; // ISO timestamptz
  status: string;
  booking_type: string;
  created_at: string;
  display_name?: string; // joined from profiles
}

export interface BookingWithTime {
  id: string;
  user_id: string;
  date: string;        // "yyyy-MM-dd"
  startTime: string;   // "HH:mm"
  endTime: string;     // "HH:mm"
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

/** Customer: own bookings */
export const useMyBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithTime[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    if (!user) { setBookings([]); setLoading(false); return; }
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_id", user.id)
      .order("booking_date", { ascending: true });

    if (data) {
      // Get own profile for display_name
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();

      setBookings(data.map((r) => parseBooking({ ...r, display_name: profile?.display_name || "自分" })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  return { bookings, loading, refetch: fetchBookings };
};

/** Trainer: all bookings with client names */
export const useAllBookings = () => {
  const [bookings, setBookings] = useState<BookingWithTime[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    // Fetch all bookings
    const { data: rows } = await supabase
      .from("bookings")
      .select("*")
      .order("booking_date", { ascending: true });

    if (!rows) { setLoading(false); return; }

    // Fetch profiles for display names
    const userIds = [...new Set(rows.map((r) => r.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", userIds);

    const nameMap: Record<string, string> = {};
    profiles?.forEach((p) => { nameMap[p.user_id] = p.display_name || "不明"; });

    setBookings(rows.map((r) => parseBooking({ ...r, display_name: nameMap[r.user_id] || "不明" })));
    setLoading(false);
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  return { bookings, loading, refetch: fetchBookings };
};

/** Check if a time slot is blocked on a given date */
export const checkSlotBlocked = (bookings: BookingWithTime[], date: string, startTime: string): boolean => {
  const timeToMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const newMin = timeToMin(startTime);
  return bookings.some((b) => {
    if (b.date !== date || b.status === "キャンセル済み") return false;
    const bMin = timeToMin(b.startTime);
    return newMin < bMin + 75 && bMin < newMin + 75;
  });
};

/** Create a booking */
export const createBooking = async (
  userId: string,
  date: string,
  startTime: string,
  bookingType: string = "通常"
) => {
  // Construct timestamptz: "2026-04-10T10:00:00+09:00"
  const bookingDate = `${date}T${startTime}:00+09:00`;
  const { data, error } = await supabase
    .from("bookings")
    .insert({ user_id: userId, booking_date: bookingDate, booking_type: bookingType })
    .select()
    .single();

  return { data, error };
};

/** Cancel a booking */
export const cancelBooking = async (bookingId: string) => {
  const { error } = await supabase
    .from("bookings")
    .delete()
    .eq("id", bookingId);
  return { error };
};
