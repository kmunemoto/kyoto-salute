// sync-trial-booking-from-gymboard
// GymBoard 側で体験予約 (trial_bookings) がキャンセルされたことを受け取り、
// Salute(本プロジェクト) の trial_bookings を「キャンセル済み」にする受信関数。
//
// 背景:
//   予約サイト(初回無料体験)の空き枠は Salute の trial_bookings を参照している。
//   トレーナーが GymBoard 側で体験予約をキャンセルしても、これまでは Salute に
//   伝わらず、サイト上は満枠のままだった。本関数で Salute 側を「キャンセル済み」に
//   することで、サイトの該当枠が解放される。
//
// - 認証: x-migration-secret ヘッダ (MIGRATION_SHARED_SECRET と一致必須)
// - 突合キー: booking_date + guest_name
//   (体験予約はゲスト予約で user_id を持たず、両DBで id も異なるため)
// - service_role で実行 (RLS 回避)
// - 冪等: 再送しても結果は同じ (既にキャンセル済みなら 0 件更新)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-migration-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CANCELLED = "キャンセル済み";

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

type Payload = {
  booking_date?: string;
  guest_name?: string;
  action?: string; // "cancel" / "delete"
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

  try {
    const SHARED_SECRET = Deno.env.get("MIGRATION_SHARED_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!SHARED_SECRET) {
      return json({ ok: false, error: "Server misconfigured: MIGRATION_SHARED_SECRET missing" }, 500);
    }

    const provided = req.headers.get("x-migration-secret") ?? "";
    if (provided !== SHARED_SECRET) {
      return json({ ok: false, error: "Unauthorized" }, 401);
    }

    let body: Payload;
    try {
      body = await req.json();
    } catch {
      return json({ ok: false, error: "Invalid JSON body" }, 400);
    }

    const booking_date = (body.booking_date ?? "").trim();
    const guest_name = (body.guest_name ?? "").trim();
    if (!booking_date || !guest_name) {
      return json({ ok: false, error: "booking_date and guest_name are required" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 該当する未キャンセルの体験予約を「キャンセル済み」にする (冪等)
    const { data: updated, error } = await admin
      .from("trial_bookings")
      .update({ status: CANCELLED })
      .eq("booking_date", booking_date)
      .eq("guest_name", guest_name)
      .neq("status", CANCELLED)
      .select("id");

    if (error) {
      return json({ ok: false, error: `update failed: ${error.message}` }, 500);
    }

    console.log(
      `[trial-cancel-from-gymboard] matched=${updated?.length ?? 0} booking_date=${booking_date} guest_name=${guest_name}`,
    );

    return json({
      ok: true,
      action: "cancelled",
      matched: updated?.length ?? 0,
      booking_date,
      guest_name,
    }, 200);
  } catch (e) {
    const err = e as { message?: string };
    return json({ ok: false, error: err.message ?? String(e) }, 500);
  }
});
