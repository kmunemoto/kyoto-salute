import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, booking_id, booking_date, booking_type, client_name, google_event_id } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get trainer's Google Calendar tokens
    const { data: trainerIds } = await supabase.rpc("get_trainer_ids");
    const trainerId = trainerIds?.[0]?.user_id;
    if (!trainerId) {
      return new Response(JSON.stringify({ skipped: true, reason: "no trainer" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: tokenRow } = await supabase
      .from("google_calendar_tokens")
      .select("*")
      .eq("user_id", trainerId)
      .maybeSingle();

    if (!tokenRow) {
      return new Response(JSON.stringify({ skipped: true, reason: "no google calendar linked" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Refresh token if expired
    let accessToken = tokenRow.access_token;
    if (new Date(tokenRow.expires_at) <= new Date()) {
      const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: tokenRow.refresh_token,
          grant_type: "refresh_token",
        }),
      });
      const refreshData = await refreshRes.json();
      if (!refreshRes.ok || !refreshData.access_token) {
        console.error("Token refresh failed:", refreshData);
        return new Response(JSON.stringify({ error: "Token refresh failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      accessToken = refreshData.access_token;
      const newExpiry = new Date(Date.now() + refreshData.expires_in * 1000).toISOString();
      await supabase
        .from("google_calendar_tokens")
        .update({ access_token: accessToken, expires_at: newExpiry })
        .eq("user_id", trainerId);
    }

    const calendarId = tokenRow.calendar_id || "primary";
    const baseUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;

    if (action === "create") {
      const startDt = new Date(booking_date);
      const endDt = new Date(startDt.getTime() + 60 * 60 * 1000); // 60 min session

      const event = {
        summary: `🏋️ ${client_name || "顧客"} - ${booking_type || "トレーニング"}`,
        description: `プラン: ${booking_type}\nお客様: ${client_name}\n\nパーソナルジムSalute御所南`,
        start: { dateTime: startDt.toISOString(), timeZone: "Asia/Tokyo" },
        end: { dateTime: endDt.toISOString(), timeZone: "Asia/Tokyo" },
        reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 30 }] },
      };

      const createRes = await fetch(baseUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      });

      const created = await createRes.json();
      if (!createRes.ok) {
        console.error("Google Calendar create error:", created);
        return new Response(JSON.stringify({ error: "Failed to create event", detail: created }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Save event ID to booking
      if (booking_id && created.id) {
        await supabase
          .from("bookings")
          .update({ google_event_id: created.id })
          .eq("id", booking_id);
      }

      return new Response(JSON.stringify({ success: true, event_id: created.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (action === "delete") {
      if (!google_event_id) {
        return new Response(JSON.stringify({ skipped: true, reason: "no event id" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const deleteRes = await fetch(`${baseUrl}/${google_event_id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!deleteRes.ok && deleteRes.status !== 404) {
        const errText = await deleteRes.text();
        console.error("Google Calendar delete error:", errText);
        return new Response(JSON.stringify({ error: "Failed to delete event" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (action === "sync_all") {
      // Sync all existing bookings that don't have a google_event_id yet
      const { data: bookings } = await supabase
        .from("bookings")
        .select("id, booking_date, booking_type, user_id, google_event_id")
        .is("google_event_id", null)
        .neq("status", "キャンセル済み")
        .gte("booking_date", new Date().toISOString());

      if (!bookings || bookings.length === 0) {
        return new Response(JSON.stringify({ success: true, synced: 0 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get customer names
      const userIds = [...new Set(bookings.map((b) => b.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);
      const nameMap: Record<string, string> = {};
      profiles?.forEach((p) => (nameMap[p.user_id] = p.display_name || "顧客"));

      let synced = 0;
      for (const booking of bookings) {
        const startDt = new Date(booking.booking_date);
        const endDt = new Date(startDt.getTime() + 60 * 60 * 1000);
        const cName = nameMap[booking.user_id] || "顧客";

        const event = {
          summary: `🏋️ ${cName} - ${booking.booking_type || "トレーニング"}`,
          description: `プラン: ${booking.booking_type}\nお客様: ${cName}\n\nパーソナルジムSalute御所南`,
          start: { dateTime: startDt.toISOString(), timeZone: "Asia/Tokyo" },
          end: { dateTime: endDt.toISOString(), timeZone: "Asia/Tokyo" },
          reminders: { useDefault: false, overrides: [{ method: "popup", minutes: 30 }] },
        };

        const createRes = await fetch(baseUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
        });

        if (createRes.ok) {
          const created = await createRes.json();
          await supabase
            .from("bookings")
            .update({ google_event_id: created.id })
            .eq("id", booking.id);
          synced++;
        } else {
          const errText = await createRes.text();
          console.error(`Failed to sync booking ${booking.id}:`, errText);
        }
      }

      return new Response(JSON.stringify({ success: true, synced }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("google-calendar-sync error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
