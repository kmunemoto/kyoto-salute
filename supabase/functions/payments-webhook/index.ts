import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, verifyWebhook } from "../_shared/stripe.ts";

const COIN_MAP: Record<string, number> = {
  coin_starter_price: 50,
  coin_value_price: 200,
  coin_premium_price: 500,
};
const AMOUNT_MAP: Record<string, number> = {
  coin_starter_price: 300,
  coin_value_price: 800,
  coin_premium_price: 1800,
};

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
  }
  return _supabase;
}

async function handleCheckoutCompleted(session: any, env: StripeEnv) {
  const userId = session.metadata?.userId;
  const priceId = session.metadata?.priceId;
  if (!userId || !priceId) {
    console.error("Missing metadata in session", session.id);
    return;
  }
  const coins = COIN_MAP[priceId];
  const amount = AMOUNT_MAP[priceId];
  if (!coins) {
    console.error("Unknown priceId", priceId);
    return;
  }

  const supabase = getSupabase();

  // Idempotency: insert purchase record (UNIQUE on stripe_session_id)
  const { error: insertErr } = await supabase.from("coin_purchases").insert({
    user_id: userId,
    stripe_session_id: session.id,
    price_id: priceId,
    coins_added: coins,
    amount_jpy: amount,
    environment: env,
  });
  if (insertErr) {
    if (insertErr.code === "23505") {
      console.log("Already processed session", session.id);
      return;
    }
    throw insertErr;
  }

  // Add coins to user_avatars (upsert)
  const { data: avatar } = await supabase
    .from("user_avatars")
    .select("coins")
    .eq("user_id", userId)
    .maybeSingle();

  const currentCoins = (avatar?.coins as number) || 0;
  if (avatar) {
    await supabase.from("user_avatars").update({ coins: currentCoins + coins }).eq("user_id", userId);
  } else {
    await supabase.from("user_avatars").insert({ user_id: userId, coins, total_exp: 0, level: 1 });
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const rawEnv = new URL(req.url).searchParams.get("env");
  if (rawEnv !== "sandbox" && rawEnv !== "live") {
    return new Response(JSON.stringify({ received: true, ignored: "invalid env" }), { status: 200 });
  }
  const env: StripeEnv = rawEnv;
  try {
    const event = await verifyWebhook(req, env);
    if (event.type === "checkout.session.completed") {
      await handleCheckoutCompleted(event.data.object, env);
    } else {
      console.log("Unhandled event:", event.type);
    }
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});