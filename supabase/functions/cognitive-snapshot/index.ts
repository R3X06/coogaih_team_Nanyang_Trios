import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SYSTEM_PROMPT = `You are the Cognitive Snapshot Engine for Coogaih.

Your role: Generate a concise, metric-grounded intelligence summary of the learner's current cognitive state.

Rules:
- Use ONLY the provided structured metrics. No speculation.
- Detect patterns across recent sessions: stability shifts, calibration mismatches, attention drift, emerging risk.
- Avoid motivational tone. Be analytical and precise.
- If fewer than 2 sessions are provided, set confidence_level to "low" and note insufficient data.

OUTPUT STRUCTURED JSON using the tool provided.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();
    if (!user_id) throw new Error('user_id is required');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Gather all metrics in parallel
    const [sessionsRes, snapshotsRes, recsRes, logsRes] = await Promise.all([
      supabase.from('sessions').select('*').eq('user_id', user_id).order('start_time', { ascending: false }).limit(10),
      supabase.from('state_snapshots').select('*').eq('user_id', user_id).order('timestamp', { ascending: false }).limit(50),
      supabase.from('recommendations').select('*').eq('user_id', user_id).order('created_at', { ascending: false }).limit(3),
      supabase.from('manual_logs').select('*').eq('user_id', user_id).order('created_at', { ascending: false }).limit(10),
    ]);

    const sessions = sessionsRes.data || [];
    const snapshots = snapshotsRes.data || [];
    const recommendations = recsRes.data || [];
    const manualLogs = logsRes.data || [];

    const sessionCount = sessions.length + manualLogs.length;

    // Build input metrics payload for the AI
    const inputMetrics = {
      session_count: sessionCount,
      recent_sessions: sessions.map(s => ({
        goal_type: s.goal_type,
        duration_sec: s.duration_sec,
        confidence_post: s.confidence_post,
        difficulty_post: s.difficulty_post,
        distraction_ratio: s.distraction_ratio,
        fragmentation: s.fragmentation,
        switching_rate: s.switching_rate,
        research_ratio: s.research_ratio,
        notes_ratio: s.notes_ratio,
        practice_ratio: s.practice_ratio,
        issues_faced: s.issues_faced,
        start_time: s.start_time,
      })),
      state_vectors: snapshots.slice(0, 20).map(s => ({
        topic_tag: s.topic_tag,
        concept_strength: s.concept_strength,
        stability: s.stability,
        calibration_gap: s.calibration_gap,
        stamina: s.stamina,
        recovery_rate: s.recovery_rate,
        risk_score: s.risk_score,
        certainty: s.certainty,
        velocity_magnitude: s.velocity_magnitude,
        velocity_direction: s.velocity_direction,
        timestamp: s.timestamp,
      })),
      recent_manual_logs: manualLogs.slice(0, 5).map(l => ({
        activity_type: l.activity_type,
        duration_sec: l.duration_sec,
        confidence_post: l.confidence_post,
        difficulty_post: l.difficulty_post,
        issues_faced: l.issues_faced,
      })),
      latest_recommendation: recommendations[0] ? {
        learner_profile: recommendations[0].learner_profile,
        risk_analysis: recommendations[0].risk_analysis,
      } : null,
    };

    // Call AI
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
          { role: 'user', content: JSON.stringify(inputMetrics) },
        ],
        temperature: 0.15,
        tools: [{
          type: 'function',
          function: {
            name: 'cognitive_snapshot',
            description: 'Output a structured cognitive snapshot of the learner.',
            parameters: {
              type: 'object',
              properties: {
                confidence_level: { type: 'string', enum: ['low', 'moderate', 'high'], description: 'Confidence in this assessment based on data volume.' },
                overall_state: { type: 'string', description: 'One-line analytical summary of the learner\'s cognitive state.' },
                learner_profile: { type: 'string', enum: ['Stable Improver', 'High Volatility Performer', 'Calibration Mismatch', 'Fatigue Sensitive', 'Fragmented Attention', 'Plateaued', 'Insufficient Data'] },
                pattern_signals: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      signal: { type: 'string', description: 'The detected pattern or shift.' },
                      evidence: { type: 'string', description: 'Metric-based evidence for this signal.' },
                      severity: { type: 'string', enum: ['info', 'warning', 'critical'] },
                    },
                    required: ['signal', 'evidence', 'severity'],
                    additionalProperties: false,
                  },
                },
                risk_factors: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'List of active risk factors.',
                },
                stability_assessment: { type: 'string', description: 'Assessment of knowledge stability across topics.' },
                attention_profile: { type: 'string', description: 'Summary of attention/focus patterns.' },
                calibration_note: { type: 'string', description: 'Assessment of confidence-vs-performance calibration.' },
              },
              required: ['confidence_level', 'overall_state', 'learner_profile', 'pattern_signals', 'risk_factors', 'stability_assessment', 'attention_profile', 'calibration_note'],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'cognitive_snapshot' } },
      }),
    });

    if (!aiRes.ok) {
      const status = aiRes.status;
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
      const errText = await aiRes.text();
      throw new Error(`AI gateway error: ${status} ${errText}`);
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let summary: any;
    
    if (toolCall?.function?.arguments) {
      summary = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try parsing message content
      const raw = aiData.choices?.[0]?.message?.content || '{}';
      summary = JSON.parse(raw);
    }

    // Persist to DB
    const { data: snapshot, error: insertErr } = await supabase
      .from('cognitive_snapshots')
      .insert({
        user_id,
        confidence_level: summary.confidence_level || 'low',
        summary,
        input_metrics: inputMetrics,
        session_count: sessionCount,
      })
      .select()
      .single();

    if (insertErr) {
      console.error('Failed to persist snapshot:', insertErr);
    }

    return new Response(JSON.stringify({ snapshot: summary, id: snapshot?.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('cognitive-snapshot error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
