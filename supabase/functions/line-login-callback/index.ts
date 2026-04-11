import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

Deno.serve(async (req) => {
  const url = new URL(req.url);

  // Handle GET (OAuth callback redirect from LINE)
  if (req.method === "GET") {
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state"); // state = app user_id
    const error = url.searchParams.get("error");

    if (error || !code || !state) {
      return new Response(redirectHtml(state, false, "LINEログインがキャンセルされました"), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    try {
      const channelId = Deno.env.get("LINE_LOGIN_CHANNEL_ID")!;
      const channelSecret = Deno.env.get("LINE_CHANNEL_SECRET")!;
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

      // Exchange code for token
      const tokenRes = await fetch("https://api.line.me/oauth2/v2.1/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: `${supabaseUrl}/functions/v1/line-login-callback`,
          client_id: channelId,
          client_secret: channelSecret,
        }),
      });

      if (!tokenRes.ok) {
        const err = await tokenRes.text();
        console.error("LINE token error:", err);
        return new Response(redirectHtml(state, false, "LINEトークン取得に失敗しました"), {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }

      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;

      // Get LINE profile
      const profileRes = await fetch("https://api.line.me/v2/profile", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!profileRes.ok) {
        return new Response(redirectHtml(state, false, "LINEプロフィール取得に失敗しました"), {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }

      const lineProfile = await profileRes.json();
      const lineUserId = lineProfile.userId;

      // Save to profiles
      const supabase = createClient(supabaseUrl, serviceRoleKey);
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ line_user_id: lineUserId })
        .eq("user_id", state);

      if (updateError) {
        console.error("Profile update error:", updateError);
        return new Response(redirectHtml(state, false, "プロフィール更新に失敗しました"), {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }

      return new Response(redirectHtml(state, true), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    } catch (e) {
      console.error("line-login-callback error:", e);
      return new Response(redirectHtml(state, false, e.message), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
  }

  return new Response("Method not allowed", { status: 405 });
});

function redirectHtml(state: string | null, success: boolean, errorMsg?: string): string {
  const msg = success ? "LINE連携が完了しました！" : (errorMsg || "LINE連携に失敗しました");
  // Redirect back to the app
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>LINE連携</title></head>
<body>
<p>${msg}</p>
<script>
  if (window.opener) {
    window.opener.postMessage({ type: "line-link-result", success: ${success} }, "*");
    window.close();
  } else {
    // Fallback: redirect to app
    setTimeout(() => { window.location.href = "/"; }, 2000);
  }
</script>
</body>
</html>`;
}
