import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { getSessions, getSession, getQuizBySession, getQuizAttempts, getLatestRecommendation } from '@/services/api';
import type { Tables } from '@/integrations/supabase/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, Target, Activity, Brain, ChevronRight } from 'lucide-react';
import AttentionAudit from '@/components/AttentionAudit';

export default function SessionHistory() {
  const { sessionId } = useParams();
  const { user } = useUser();

  // Detail view
  if (sessionId) return <SessionDetail sessionId={sessionId} />;

  // List view
  return <SessionList userId={user?.id} />;
}

function SessionList({ userId }: { userId?: string }) {
  const [sessions, setSessions] = useState<Tables<'sessions'>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      getSessions(userId).then(s => { setSessions(s); setLoading(false); });
    }
  }, [userId]);

  if (loading) return <div className="flex justify-center py-16"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <h1 className="font-display text-3xl text-gradient">Session History</h1>

      {sessions.length === 0 ? (
        <Card className="shadow-card border-border gradient-card">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No sessions yet.</p>
            <Link to="/session/start">
              <Button className="mt-4 gradient-primary text-primary-foreground shadow-glow">Start Your First Session</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sessions.map(session => {
            const duration = session.duration_sec ? `${Math.floor(session.duration_sec / 60)}m` : '—';
            const topics = session.topic_tags?.join(', ') || 'No topics';
            return (
              <Link key={session.id} to={`/history/${session.id}`}>
                <Card className="shadow-card border-border hover:border-primary/30 transition-colors cursor-pointer mb-2 gradient-card">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-foreground text-sm">{topics}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span>{new Date(session.start_time).toLocaleDateString()}</span>
                        <span>·</span>
                        <span>{duration}</span>
                        <span>·</span>
                        <span className="capitalize">{session.goal_type}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SessionDetail({ sessionId }: { sessionId: string }) {
  const [session, setSession] = useState<Tables<'sessions'> | null>(null);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [recommendation, setRecommendation] = useState<Tables<'recommendations'> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const sess = await getSession(sessionId);
      setSession(sess);

      const quiz = await getQuizBySession(sessionId);
      if (quiz) {
        const attempts = await getQuizAttempts(quiz.id);
        if (attempts[0]) setQuizScore(attempts[0].overall_score);
      }

      if (sess) {
        const rec = await getLatestRecommendation(sess.user_id);
        setRecommendation(rec);
      }
      setLoading(false);
    };
    load();
  }, [sessionId]);

  if (loading) return <div className="flex justify-center py-16"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!session) return <div className="text-center py-16"><p className="text-muted-foreground">Session not found.</p></div>;

  const duration = session.duration_sec ? `${Math.floor(session.duration_sec / 60)}m ${session.duration_sec % 60}s` : '—';

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link to="/history"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="font-display text-2xl text-gradient">Session Detail</h1>
          <p className="text-muted-foreground text-sm">{new Date(session.start_time).toLocaleString()} · {session.goal_type}</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="shadow-card border-border gradient-card">
          <CardContent className="p-4 text-center">
            <Clock className="h-4 w-4 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Duration</p>
            <p className="font-bold text-foreground">{duration}</p>
          </CardContent>
        </Card>
        <Card className="shadow-card border-border gradient-card">
          <CardContent className="p-4 text-center">
            <Activity className="h-4 w-4 text-info mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Confidence</p>
            <p className="font-bold text-info">{session.confidence_post || '—'}/5</p>
          </CardContent>
        </Card>
        <Card className="shadow-card border-border gradient-card">
          <CardContent className="p-4 text-center">
            <Target className="h-4 w-4 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Quiz Score</p>
            <p className="font-bold text-primary">{quizScore != null ? `${(quizScore * 100).toFixed(0)}%` : '—'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Attention Audit */}
      <Card className="shadow-card border-border gradient-card">
        <CardHeader><CardTitle className="text-sm">Attention Audit</CardTitle></CardHeader>
        <CardContent>
          <AttentionAudit session={session} />
        </CardContent>
      </Card>

      {/* Debrief */}
      {(session.topic_tags?.length || session.debrief_key_points?.length) && (
        <Card className="shadow-card border-border gradient-card">
          <CardHeader><CardTitle className="text-sm">Debrief</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {session.topic_tags && session.topic_tags.length > 0 && (
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Topics</p>
                <div className="flex flex-wrap gap-1">
                  {session.topic_tags.map((t, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">{t}</span>
                  ))}
                </div>
              </div>
            )}
            {session.debrief_key_points && session.debrief_key_points.length > 0 && (
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Key Points</p>
                <ul className="space-y-1">
                  {session.debrief_key_points.map((k, i) => (
                    <li key={i} className="flex items-start gap-2"><span className="text-success">•</span>{k}</li>
                  ))}
                </ul>
              </div>
            )}
            {session.debrief_confusion && (
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Confusion</p>
                <p className="text-warning">{session.debrief_confusion}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recommendation */}
      {recommendation && (
        <Card className="shadow-card border-border gradient-card">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Brain className="h-4 w-4 text-primary" /> Recommendation</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-foreground">{recommendation.learner_profile}</p>
            <p className="text-muted-foreground italic">{recommendation.risk_analysis}</p>
            <p className="text-xs text-muted-foreground">{recommendation.certainty_statement}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
