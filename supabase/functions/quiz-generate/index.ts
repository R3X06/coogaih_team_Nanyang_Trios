import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SYSTEM_PROMPT = `You generate 3–5 recall questions grounded ONLY in the provided debrief_key_points and topic context.

Rules:
- Short answer or MCQ.
- Answerable in <90 seconds each.
- No external facts beyond what is provided.
- Provide answer_criteria and include a source_excerpt per question.
- MCQ questions must have an "options" array of 4 strings and a "correct" index (0-based).
- Short answer questions must have clear answer_criteria.

OUTPUT JSON ONLY:
{
  "questions":[{"question_id":"Q1","type":"short_answer|mcq","question":"","answer_criteria":"","difficulty":"easy|medium|hard","options":[],"correct":0}],
  "source_references":[{"question_id":"Q1","source_excerpt":""}]
}

INPUT:
{topic_tags, debrief_key_points, notes_text_optional}`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic_tags, debrief_key_points, notes_text_optional, retrieval_namespace } = await req.json();

    const userMessage = JSON.stringify({
      topic_tags: topic_tags || [],
      debrief_key_points: debrief_key_points || [],
      notes_text_optional: notes_text_optional || '',
    });

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) throw new Error('LOVABLE_API_KEY is not configured');

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.4,
        response_format: { type: 'json_object' },
      }),
    });

    if (!aiRes.ok) {
      const status = aiRes.status;
      const errText = await aiRes.text();
      if (status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded, please try again later.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required, please add credits.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI gateway error: ${status} ${errText}`);
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
