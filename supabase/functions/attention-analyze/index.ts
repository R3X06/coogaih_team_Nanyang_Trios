import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SYSTEM_PROMPT = `You analyze attention telemetry for a completed study session.

You must:
- Identify intent-behavior mismatch using the session_goal and ratios.
- Identify fragmentation risk using fragmentation, switching_rate, avg_focus_block_minutes.
- Provide 1–3 specific adjustments for next session.

Do NOT moralize. Do NOT add data. Use only given inputs.

OUTPUT JSON ONLY:
{
  "session_quality_score": 0.0,
  "attention_issues": [],
  "behavior_mismatch": "",
  "recommended_adjustment": ""
}`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_goal, attention_vector } = await req.json();

    const userMessage = JSON.stringify({ session_goal, attention_vector });

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    });

    if (!aiRes.ok) {
      const err = await aiRes.text();
      throw new Error(`AI gateway error: ${aiRes.status} ${err}`);
    }

    const aiData = await aiRes.json();
    const raw = aiData.choices?.[0]?.message?.content || '{}';
    const result = JSON.parse(raw);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
