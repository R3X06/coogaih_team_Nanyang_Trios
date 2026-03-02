import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `You are the Cognitive Snapshot Engine for Coogaih.

You must output STRICT JSON only (no markdown), following this schema:

{
  "confidence_level": "low|medium|high",
  "overall_state": "string",
  "learner_profile": "Stable Improver|High Volatility Performer|Calibration Mismatch|Fatigue Sensitive|Fragmented Attention|Plateaued|Insufficient Data",
  "pattern_signals": [
    { "signal": "string", "evidence": "string", "severity": "low|medium|high" }
  ],
  "risk_factors": ["string"],
  "stability_assessment": "string",
  "attention_profile": "string",
  "calibration_note": "string"
}

Rules:
- Use ONLY the provided structured metrics. No speculation.
- Be concise, analytical, precise. No motivational tone.
- If fewer than 2 total study entries (sessions + manual logs), set confidence_level="low" and learner_profile="Insufficient Data".`;

async function callAzureOpenAI(inputMetrics: any) {
  const endpoint = Deno.env.get("AZURE_OPENAI_ENDPOINT")!;
  const deployment = Deno.env.get("AZURE_OPENAI_DEPLOYMENT")!;
  const apiKey = Deno.env.get("AZURE_OPENAI_KEY")!;
  const apiVersion = Deno.env.get("AZURE_OPENAI_API_VERSION") || "2024-02-15-preview";

  const url =
    `${endpoint.replace(/\/$/, "")}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(inputMetrics) },
      ],
      temperature: 0.15,
      max_tokens: 450,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Azure OpenAI error: ${res.status} ${err}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "{}";
  return JSON.parse(content);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // IMPORTANT: Use caller JWT (RLS safe). Do NOT use service role.
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user_id = userData.user.id;

    // Gather metrics in parallel
    const [sessionsRes, snapshotsRes, recsRes, logsRes] = await Promise.all([
      supabase.from("sessions").select("*").eq("user_id", user_id).order("start_time", { ascending: false }).limit(10),
      supabase.from("state_snapshots").select("*").eq("user_id", user_id).order("timestamp", { ascending: false }).limit(50),
      supabase.from("recommendations").select("*").eq("user_id", user_id).order("created_at", { ascending: false }).limit(3),
      supabase.from("manual_logs").select("*").eq("user_id", user_id).order("created_at", { ascending: false }).limit(10),
    ]);

    const sessions = sessionsRes.data || [];
    const snapshots = snapshotsRes.data || [];
    const recommendations = recsRes.data || [];
    const manualLogs = logsRes.data || [];

    const sessionCount = sessions.length + manualLogs.length;

    const inputMetrics = {
      session_count: sessionCount,
      recent_sessions: sessions.map((s: any) => ({
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
        start_time: s.start_time,
      })),
      state_vectors: snapshots.slice(0, 20).map((s: any) => ({
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
      recent_manual_logs: manualLogs.slice(0, 5).map((l: any) => ({
        activity_type: l.activity_type,
        duration_sec: l.duration_sec,
        confidence_post: l.confidence_post,
        difficulty_post: l.difficulty_post,
        issues_faced: l.issues_faced,
      })),
      latest_recommendation: recommendations[0]
        ? { learner_profile: recommendations[0].learner_profile, risk_analysis: recommendations[0].risk_analysis }
        : null,
    };

    const summary = await callAzureOpenAI(inputMetrics);

    // Return in the shape your UI expects: { snapshot: ... }
    return new Response(JSON.stringify({ snapshot: summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("cognitive-snapshot error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
