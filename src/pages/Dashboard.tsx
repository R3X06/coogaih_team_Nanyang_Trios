import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { getLatestSnapshotPerTopic, getLatestSnapshots, getLatestRecommendation, getSessions, getManualLogs, callAdviceGenerate, createRecommendation, getSubjects, getTopicsBySubject } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, AlertTriangle, Lightbulb, RefreshCw, ChevronDown, ChevronUp, Crosshair, PenLine, BookOpen, Plus } from 'lucide-react';
import TrajectoryMap from '@/components/TrajectoryMap';
import SkillRadar from '@/components/SkillRadar';
import RiskMonitor from '@/components/RiskMonitor';
import AttentionAudit from '@/components/AttentionAudit';
import CognitiveSnapshotCard from '@/components/CognitiveSnapshotCard';
import TrajectoryDelta from '@/components/TrajectoryDelta';

export default function Dashboard() {
  const { user, loading: userLoading } = useUser();
  const [snapshots, setSnapshots] = useState<Tables<'state_snapshots'>[]>([]);
  const [allSnapshots, setAllSnapshots] = useState<Tables<'state_snapshots'>[]>([]);
  const [recommendation, setRecommendation] = useState<Tables<'recommendations'> | null>(null);
  const [sessions, setSessions] = useState<Tables<'sessions'>[]>([]);
  const [manualLogs, setManualLogs] = useState<any[]>([]);
  const [appConfig, setAppConfig] = useState<any>(null);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<Tables<'subjects'>[]>([]);
  const [activeSubject, setActiveSubject] = useState<string>('all');
  const [subjectTopicNames, setSubjectTopicNames] = useState<Set<string>>(new Set());

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [snaps, allSnaps, rec, sess, configRes, subjs, logs] = await Promise.all([
        getLatestSnapshotPerTopic(user.id),
        getLatestSnapshots(user.id),
        getLatestRecommendation(user.id),
        getSessions(user.id),
        supabase.from('app_config').select('value').eq('key', 'app_config').single(),
        getSubjects(),
        getManualLogs(user.id),
      ]);
      setSnapshots(snaps);
      setAllSnapshots(allSnaps);
      setRecommendation(rec);
      setSessions(sess);
      setSubjects(subjs);
      setManualLogs(logs);
      if (configRes.data?.value) setAppConfig(configRes.data.value);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { if (user) loadData(); }, [user]);

  // When subject filter changes, load its topic names for filtering
  useEffect(() => {
    if (activeSubject === 'all') {
      setSubjectTopicNames(new Set());
    } else {
      getTopicsBySubject(activeSubject).then(topics => {
        setSubjectTopicNames(new Set(topics.flatMap(t => [t.id, t.name])));
      }).catch(console.error);
    }
  }, [activeSubject]);

  // Filtered data based on active subject
  const filteredSnapshots = activeSubject === 'all' ? snapshots : snapshots.filter(s => subjectTopicNames.has(s.topic_tag));
  const filteredAllSnapshots = activeSubject === 'all' ? allSnapshots : allSnapshots.filter(s => subjectTopicNames.has(s.topic_tag));

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
        <div className="flex items-center gap-4">
          <div>
            <h1 className="font-display text-3xl text-gradient mb-0">hi, {user?.display_name || 'there'}</h1>
          </div>
          {subjects.length > 0 && (
            <Select value={activeSubject} onValueChange={setActiveSubject}>
              <SelectTrigger className="w-44 glass h-9 text-xs">
                <SelectValue placeholder="All subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjects.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRunDebrief} variant="outline" disabled={refreshing} className="border-primary/30">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} /> Run AI Debrief
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Link to="/session/start" className="flex-1">
          <Card className="shadow-card border-border gradient-card hover:border-primary/30 transition-colors cursor-pointer">
            <CardContent className="py-4 flex items-center gap-3">
              <Play className="h-5 w-5 text-primary" />
              <div><p className="text-sm font-semibold text-foreground">Start Session</p><p className="text-[10px] text-muted-foreground">Timer-based study</p></div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/log/manual" className="flex-1">
          <Card className="shadow-card border-border gradient-card hover:border-primary/30 transition-colors cursor-pointer">
            <CardContent className="py-4 flex items-center gap-3">
              <PenLine className="h-5 w-5 text-primary" />
              <div><p className="text-sm font-semibold text-foreground">Manual Log</p><p className="text-[10px] text-muted-foreground">Log without timer</p></div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/manage/subjects" className="flex-1">
          <Card className="shadow-card border-border gradient-card hover:border-primary/30 transition-colors cursor-pointer">
            <CardContent className="py-4 flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <div><p className="text-sm font-semibold text-foreground">Subjects</p><p className="text-[10px] text-muted-foreground">Manage hierarchy</p></div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Empty state CTA */}
      {subjects.length === 0 && sessions.length === 0 && (
        <Card className="shadow-card border-primary/20 gradient-accent">
          <CardContent className="py-8 text-center">
            <Plus className="h-8 w-8 text-primary mx-auto mb-3" />
            <p className="text-foreground font-semibold mb-1">Create your first subject to begin tracking.</p>
            <p className="text-muted-foreground text-sm mb-4">Subjects organize your learning into chapters and topics.</p>
            <Link to="/manage/subjects">
              <Button className="gradient-primary text-primary-foreground font-semibold shadow-glow">
                <Plus className="h-4 w-4 mr-2" /> Add Subject
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-card border-border gradient-card overflow-hidden">
        <CardHeader>
          <CardTitle className="font-display text-lg text-gradient flex items-center gap-2">
            <Crosshair className="h-4 w-4" /> Learning Trajectory
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAllSnapshots.length > 0 ? (
            <TrajectoryMap allSnapshots={filteredAllSnapshots} />
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
            {filteredSnapshots.length > 0 ? (
              <SkillRadar snapshots={filteredSnapshots} />
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
            <RiskMonitor snapshots={filteredSnapshots} recommendation={recommendation} />
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
                  <div key={i} className="p-3 rounded-lg glass border border-border">
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

      {/* Cognitive Snapshot */}
      <CognitiveSnapshotCard />

      {/* Trajectory Delta */}
      <TrajectoryDelta snapshots={filteredAllSnapshots} />

      {/* Recent Activity */}
      {(sessions.length > 0 || manualLogs.length > 0) && (
        <Card className="shadow-card border-border gradient-card">
          <CardHeader>
            <CardTitle className="font-display text-lg text-gradient">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              ...sessions.slice(0, 5).map(s => ({ type: 'session' as const, date: s.start_time, goal: s.goal_type, duration: s.duration_sec, id: s.id })),
              ...manualLogs.slice(0, 5).map((l: any) => ({ type: 'log' as const, date: l.created_at, goal: l.activity_type, duration: l.duration_sec, id: l.id })),
            ]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 5)
              .map(item => (
                <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded bg-accent/20 text-sm">
                  <div className="flex items-center gap-2">
                    {item.type === 'session' ? <Play className="h-3 w-3 text-primary" /> : <PenLine className="h-3 w-3 text-primary" />}
                    <span className="text-foreground capitalize">{item.goal}</span>
                    <span className="text-[10px] text-muted-foreground">{item.type === 'session' ? 'Timer' : 'Manual'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{item.duration ? `${Math.floor(item.duration / 60)}m` : '—'}</span>
                    <span>{new Date(item.date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
