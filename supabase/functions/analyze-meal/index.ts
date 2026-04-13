import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { mealId, imageUrl } = await req.json();
    if (!mealId || !imageUrl) {
      return new Response(JSON.stringify({ error: "mealId and imageUrl required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Resolve storage path to a signed URL so the AI can access the image
    let resolvedImageUrl = imageUrl;
    if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
      const { data: signedData, error: signError } = await supabase.storage
        .from("meal-photos")
        .createSignedUrl(imageUrl, 600);
      if (signError || !signedData?.signedUrl) {
        console.error("Failed to create signed URL:", signError);
        throw new Error("Could not access uploaded image");
      }
      resolvedImageUrl = signedData.signedUrl;
    }

    // Call Gemini via Lovable AI Gateway with image
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `あなたは管理栄養士の資格を持つ食事分析の専門家です。写真に映っている食事を正確に分析してください。

【分析手順】
Step 1: 写真に映っている料理を一品ずつすべて特定してください。
Step 2: 各料理の量を、器のサイズや一般的な一人前の量を基準に推定してください（グラム単位）。
Step 3: 各料理の主な食材を特定し、それぞれの栄養素を日本食品標準成分表（八訂）に基づいて計算してください。
Step 4: 全料理の合計を算出してください。

【重要な推定ルール】
- 白米1膳 = 約150g（252kcal, P3.8g, F0.5g, C55.7g）
- 味噌汁1杯 = 約200ml（40kcal前後、具材により変動）
- 揚げ物は吸油率を考慮すること（とんかつ: 衣が油を10-15%吸収）
- 調味料（醤油・砂糖・みりん・油）の栄養素も必ず加算すること
- ポーションサイズは器との比率から慎重に推定すること

【回答形式】
以下のJSON形式のみで回答してください。それ以外のテキストは不要です。
{
  "dishes": [
    {
      "name": "料理名",
      "estimated_weight_g": 推定グラム数(整数),
      "calories": カロリー(整数),
      "protein": タンパク質(小数点1桁),
      "fat": 脂質(小数点1桁),
      "carbs": 炭水化物(小数点1桁),
      "fiber": 食物繊維(小数点1桁)
    }
  ],
  "total": {
    "meal_type": "朝食 or 昼食 or 夕食 or 間食",
    "calories": 合計カロリー(整数),
    "protein": 合計タンパク質(小数点1桁),
    "fat": 合計脂質(小数点1桁),
    "carbs": 合計炭水化物(小数点1桁),
    "fiber": 合計食物繊維(小数点1桁)
  },
  "feedback": "アドバイス（下記ルール参照）"
}

【アドバイスのルール（250文字以内）】
- 良い点と改善点を必ず両方含めること
- 改善点には具体的な代替食材・料理を提示すること（例：「フランクフルトの代わりに鶏むね肉のグリルにすると脂質を抑えられます」）
- PFCバランス（理想: P15-20%, F20-25%, C50-60%）について一言コメントすること
- 日本の一般的な食事を前提とすること
- 簡潔に3〜4文でまとめること`
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: resolvedImageUrl }
              },
              {
                type: "text",
                text: "この食事の写真を一品ずつ分析し、合計の栄養素を算出してください。"
              }
            ]
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "レート制限に達しました。しばらく待ってから再試行してください。" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "クレジットが不足しています。" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: `AI分析でエラーが発生しました (${aiResponse.status})`, fallback: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from AI response
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      console.error("Failed to parse AI response:", content);
      analysis = null;
    }

    if (!analysis) {
      return new Response(JSON.stringify({ error: "AI分析に失敗しました。もう一度お試しください。" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract totals - support both new (dishes+total) and legacy flat format
    const total = analysis.total || analysis;
    const dishes = analysis.dishes || null;

    // Update the meal record in DB
    const { error: updateError } = await supabase
      .from("meals")
      .update({
        meal_type: total.meal_type || "食事",
        calories: total.calories || 0,
        protein: total.protein || 0,
        fat: total.fat || 0,
        carbs: total.carbs || 0,
        fiber: total.fiber || 0,
        feedback: analysis.feedback || "",
        dishes: dishes,
        analyzed: true,
      })
      .eq("id", mealId);

    if (updateError) {
      console.error("DB update error:", updateError);
      throw new Error("Database update failed");
    }

    return new Response(JSON.stringify({ success: true, analysis: { ...total, dishes, feedback: analysis.feedback } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-meal error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
