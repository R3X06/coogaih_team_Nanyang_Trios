import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { getLatestSnapshotPerTopic, getLatestSnapshots, getLatestRecommendation, getSessions, callAdviceGenerate, createRecommendation } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, AlertTriangle, Lightbulb, RefreshCw, ChevronDown, ChevronUp, Crosshair } from 'lucide-react';
import TrajectoryMap from '@/components/TrajectoryMap';
import SkillRadar from '@/components/SkillRadar';
import RiskMonitor from '@/components/RiskMonitor';
import AttentionAudit from '@/components/AttentionAudit';

export default function Dashboard() {
  const { user, loading: userLoading } = useUser();
  const [snapshots, setSnapshots] = useState<Tables<'state_snapshots'>[]>([]);
  const [allSnapshots, setAllSnapshots] = useState<Tables<'state_snapshots'>[]>([]);
  const [recommendation, setRecommendation] = useState<Tables<'recommendations'> | null>(null);
  const [sessions, setSessions] = useState<Tables<'sessions'>[]>([]);
  const [appConfig, setAppConfig] = useState<any>(null);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [snaps, allSnaps, rec, sess, configRes] = await Promise.all([
        getLatestSnapshotPerTopic(user.id),
        getLatestSnapshots(user.id),
        getLatestRecommendation(user.id),
        getSessions(user.id),
        supabase.from('app_config').select('value').eq('key', 'app_config').single(),
      ]);
      setSnapshots(snaps);
      setAllSnapshots(allSnaps);
      setRecommendation(rec);
      setSessions(sess);
      if (configRes.data?.value) setAppConfig(configRes.data.value);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { if (user) loadData(); }, [user]);

  const handleRunDebrief = async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      const snaps = await getLatestSnapshotPerTopic(user.id);
      const latestSession = sessions[0];
      const adviceResult = await callAdviceGenerate({
        user_id: user.id,
        session_id: latestSession?.id || '',
        latest_states: snaps.map(s => ({
          topic_tag: s.topic_tag,
          skill_vector: {
            concept_strength: s.concept_strength || 0,
            stability: s.stability || 0,
            calibration_gap: s.calibration_gap || 0,
            stamina: s.stamina || 0,
            recovery_rate: s.recovery_rate || 0,
          },
          velocity: { velocity_magnitude: s.velocity_magnitude || 0, velocity_direction: s.velocity_direction || 0 },
          risk_score: s.risk_score || 0,
          certainty: s.certainty || 0,
        })),
        historical_intervention_effects: { timed_drills: 0.5, spaced_recall: 0.6, concept_deep_dive: 0.4, short_focus_blocks: 0.5 },
      });
      const rec = await createRecommendation({
        user_id: user.id,
        session_id: latestSession?.id || null,
        learner_profile: adviceResult.learner_profile,
        risk_analysis: adviceResult.risk_analysis,
        primary_action_json: adviceResult.primary_action,
        secondary_actions_json: adviceResult.secondary_actions,
        evidence_json: adviceResult.evidence,
        certainty_statement: adviceResult.certainty_statement,
      });
      setRecommendation(rec);
    } catch (e) { console.error(e); }
    setRefreshing(false);
  };

  const latestSession = sessions[0];
  const primaryAction = recommendation?.primary_action_json as any;
  const secondaryActions = (recommendation?.secondary_actions_json as any[]) || [];
  const evidence = recommendation?.evidence_json as any;

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-gradient mb-0">coogaih</h1>
          <p className="text-muted-foreground text-sm">Cognitive Guidance AI</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRunDebrief} variant="outline" disabled={refreshing} className="border-primary/30">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} /> Run AI Debrief
          </Button>
          <Link to="/session/start">
            <Button className="gradient-primary text-primary-foreground font-semibold shadow-glow">
              <Play className="h-4 w-4 mr-2" /> Start Session
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero: Trajectory Map */}
      <Card className="shadow-card border-border gradient-card overflow-hidden">
        <CardHeader>
          <CardTitle className="font-display text-lg text-gradient flex items-center gap-2">
            <Crosshair className="h-4 w-4" /> Learning Trajectory
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allSnapshots.length > 0 ? (
            <TrajectoryMap allSnapshots={allSnapshots} />
          ) : (
            <p className="text-muted-foreground text-sm text-center py-12">Complete a session to see your learning trajectory.</p>
          )}
        </CardContent>
      </Card>

      {/* Skill Radar + Risk Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card border-border gradient-card">
          <CardHeader>
            <CardTitle className="font-display text-lg text-gradient">Skill Space</CardTitle>
          </CardHeader>
          <CardContent>
            {snapshots.length > 0 ? (
              <SkillRadar snapshots={snapshots} />
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">Complete a session to see skill data.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card border-border gradient-card">
          <CardHeader>
            <CardTitle className="font-display text-lg text-gradient flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Risk Monitor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RiskMonitor snapshots={snapshots} recommendation={recommendation} />
          </CardContent>
        </Card>
      </div>

      {/* Bottom row: Attention Audit + Next Best Action */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card border-border gradient-card">
          <CardHeader>
            <CardTitle className="font-display text-lg text-gradient">Attention Audit</CardTitle>
          </CardHeader>
          <CardContent>
            {latestSession ? (
              <AttentionAudit session={latestSession} />
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">No session data yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card border-border gradient-card">
          <CardHeader>
            <CardTitle className="font-display text-lg text-gradient flex items-center gap-2">
              <Lightbulb className="h-4 w-4" /> Next Best Action
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {primaryAction ? (
              <>
                <div className="p-4 rounded-lg gradient-accent border border-primary/20">
                  <div className="flex items-start gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${primaryAction.urgency === 'high' ? 'bg-destructive/20 text-destructive' : 'bg-warning/20 text-warning'}`}>
                      {primaryAction.urgency}
                    </span>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{primaryAction.action}</p>
                      <p className="text-xs text-muted-foreground mt-1">{primaryAction.reason}</p>
                    </div>
                  </div>
                </div>
                {secondaryActions.map((a: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg bg-accent/30 border border-border">
                    <p className="text-sm font-medium text-foreground">{a.action}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.reason}</p>
                  </div>
                ))}
                {(evidence || appConfig) && (
                  <div>
                    <button
                      onClick={() => setEvidenceOpen(!evidenceOpen)}
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      {evidenceOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      Evidence &amp; Config
                    </button>
                    {evidenceOpen && (
                      <div className="mt-2 space-y-2">
                        {evidence && (
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Evidence</p>
                            <pre className="p-2 rounded bg-muted/50 text-xs text-muted-foreground overflow-auto max-h-24">
                              {JSON.stringify(evidence, null, 2)}
                            </pre>
                          </div>
                        )}
                        {appConfig && (
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Active Config</p>
                            <div className="p-2 rounded bg-muted/50 text-xs text-muted-foreground space-y-1">
                              <p><span className="text-primary">Thresholds:</span> High Risk ≥ {appConfig.thresholds?.high_risk}, Low Certainty ≤ {appConfig.thresholds?.low_certainty}</p>
                              <p><span className="text-primary">Risk Weights:</span> {Object.entries(appConfig.risk_weights || {}).map(([k, v]) => `${k}: ${v}`).join(', ')}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {recommendation?.certainty_statement && (
                  <p className="text-xs text-muted-foreground italic">{recommendation.certainty_statement}</p>
                )}
              </>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-4">Click "Run AI Debrief" to generate recommendations.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
