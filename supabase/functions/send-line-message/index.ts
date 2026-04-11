import { corsHeaders } from "@supabase/supabase-js/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const LINE_API = "https://api.line.me/v2/bot/message/push";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN");
    if (!accessToken) {
      return new Response(JSON.stringify({ error: "LINE_CHANNEL_ACCESS_TOKEN not set" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { user_id, line_user_id, message } = await req.json();

    // If line_user_id not provided, look it up from profiles
    let targetLineId = line_user_id;
    if (!targetLineId && user_id) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, serviceRoleKey);

      const { data: profile } = await supabase
        .from("profiles")
        .select("line_user_id")
        .eq("user_id", user_id)
        .maybeSingle();

      targetLineId = profile?.line_user_id;
    }

    if (!targetLineId) {
      return new Response(JSON.stringify({ skipped: true, reason: "no LINE linked" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch(LINE_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        to: targetLineId,
        messages: [{ type: "text", text: message }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("LINE API error:", err);
      return new Response(JSON.stringify({ error: err }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-line-message error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
