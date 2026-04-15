import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

function buildHtml(success: boolean, appUrl: string, errorMsg?: string): string {
  const msg = success
    ? "LINE連携が完了しました。画面を閉じてアプリにお戻りください。"
    : (errorMsg || "LINE連携に失敗しました");
  return `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="utf-8"><title>LINE連携</title></head>
<body>
<p style="text-align:center;margin-top:40px;font-family:sans-serif;">${msg}</p>
<script>
  setTimeout(function() {
    window.location.href = "${appUrl}";
  }, 3000);
</script>
</body>
</html>`;
}

function respondHtml(html: string): Response {
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

Deno.serve(async (req) => {
  const url = new URL(req.url);

  if (req.method === "GET") {
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    // App URL for redirect
    const appUrl = Deno.env.get("APP_URL") || "https://kyoto-salute.lovable.app";

    if (error || !code || !state) {
      return respondHtml(buildHtml(false, appUrl, "LINEログインがキャンセルされました"));
    }

    try {
      const channelId = Deno.env.get("LINE_LOGIN_CHANNEL_ID")!;
      const channelSecret = Deno.env.get("LINE_CHANNEL_SECRET")!;
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
        return respondHtml(buildHtml(false, appUrl, "LINEトークン取得に失敗しました"));
      }

      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;

      const profileRes = await fetch("https://api.line.me/v2/profile", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!profileRes.ok) {
        return respondHtml(buildHtml(false, appUrl, "LINEプロフィール取得に失敗しました"));
      }

      const lineProfile = await profileRes.json();
      const lineUserId = lineProfile.userId;

      const supabase = createClient(supabaseUrl, serviceRoleKey);
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ line_user_id: lineUserId })
        .eq("user_id", state);

      if (updateError) {
        console.error("Profile update error:", updateError);
        return respondHtml(buildHtml(false, appUrl, "プロフィール更新に失敗しました"));
      }

      return respondHtml(buildHtml(true, appUrl));
    } catch (e) {
      console.error("line-login-callback error:", e);
      return respondHtml(buildHtml(false, appUrl, (e as Error).message));
    }
  }

  return new Response("Method not allowed", { status: 405 });
});
