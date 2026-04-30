import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ExerciseInput {
  name: string;
  weight: number;
  reps: number;
}

interface Payload {
  exercises: ExerciseInput[];
  date: string;
  duration: number;
  theme: "dark" | "light" | "transparent";
}

const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as Payload;
    const { exercises = [], date = "", duration = 60, theme = "dark" } = body;

    const bgColor =
      theme === "light" ? "#FAF9F6" : theme === "dark" ? "#0F0F0F" : "none";
    const textColor = theme === "light" ? "#111111" : "#FFFFFF";
    const subColor = theme === "light" ? "#999999" : "#888888";
    const accentColor = "#0ABAB5";

    const visible = exercises.slice(0, 6);
    const hiddenCount = exercises.length - visible.length;

    let exerciseSvg = "";
    let y = 600;
    for (const ex of visible) {
      exerciseSvg += `<text x="540" y="${y}" font-family="'Noto Sans JP', -apple-system, sans-serif" font-size="40" font-weight="500" fill="${textColor}" text-anchor="middle">${escapeXml(ex.name)}</text>`;
      y += 56;
      exerciseSvg += `<text x="540" y="${y}" font-family="'Noto Sans JP', -apple-system, sans-serif" font-size="32" font-weight="400" fill="${subColor}" text-anchor="middle">${ex.weight}kg × ${ex.reps}</text>`;
      y += 80;
    }
    if (hiddenCount > 0) {
      exerciseSvg += `<text x="540" y="${y}" font-family="'Noto Sans JP', sans-serif" font-size="26" font-weight="300" fill="${subColor}" text-anchor="middle">+${hiddenCount} more</text>`;
      y += 60;
    }

    const dateY = y + 50;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  ${bgColor !== "none" ? `<rect width="1080" height="1920" fill="${bgColor}"/>` : ""}
  <text x="540" y="380" font-family="'Noto Sans JP', sans-serif" font-size="28" font-weight="300" fill="${subColor}" text-anchor="middle" letter-spacing="6">トレーニング時間</text>
  <text x="540" y="490" font-family="'Noto Sans JP', sans-serif" font-size="84" font-weight="500" fill="${textColor}" text-anchor="middle">${duration}<tspan font-size="40" font-weight="300" fill="${subColor}" dx="10">分</tspan></text>
  ${exerciseSvg}
  <text x="540" y="${dateY}" font-family="'Noto Sans JP', sans-serif" font-size="28" font-weight="300" fill="${subColor}" text-anchor="middle" letter-spacing="6">${escapeXml(date)}</text>
  <text x="540" y="1780" font-family="'Noto Sans JP', sans-serif" font-size="40" font-weight="700" fill="${accentColor}" text-anchor="middle">Salute <tspan fill="${textColor}">御所南</tspan></text>
  <text x="540" y="1820" font-family="'Noto Sans JP', sans-serif" font-size="22" font-weight="300" fill="${subColor}" text-anchor="middle" letter-spacing="8">PERSONAL GYM</text>
</svg>`;

    return new Response(svg, {
      headers: {
        ...corsHeaders,
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});