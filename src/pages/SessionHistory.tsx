import { useStudySessions } from '@/hooks/useStudyData';
import { Link, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, Brain, Target, CheckCircle } from 'lucide-react';

export default function SessionHistory() {
  const { sessionId } = useParams();
  const { sessions, getSession } = useStudySessions();

  // Detail view
  if (sessionId) {
    const session = getSession(sessionId);
    if (!session) {
      return (
        <div className="text-center py-16">
          <p className="text-muted-foreground">Session not found.</p>
          <Link to="/history"><Button variant="outline" className="mt-4">Back to History</Button></Link>
        </div>
      );
    }

    const duration = session.duration ? `${Math.floor(session.duration / 60)}m ${session.duration % 60}s` : '—';
    const avgFocus = session.telemetry.length > 0
      ? (session.telemetry.reduce((a, t) => a + t.focusLevel, 0) / session.telemetry.length).toFixed(1)
      : '—';

    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Link to="/history">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="font-display text-2xl text-primary">Session Detail</h1>
            <p className="text-muted-foreground text-sm">{new Date(session.startTime).toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Card className="shadow-card border-border">
            <CardContent className="p-4 text-center">
              <Clock className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="font-bold text-foreground">{duration}</p>
            </CardContent>
          </Card>
          <Card className="shadow-card border-border">
            <CardContent className="p-4 text-center">
              <Brain className="h-4 w-4 text-info mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Avg Focus</p>
              <p className="font-bold text-info">{avgFocus}</p>
            </CardContent>
          </Card>
          <Card className="shadow-card border-border">
            <CardContent className="p-4 text-center">
              <Target className="h-4 w-4 text-primary mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Quiz Score</p>
              <p className="font-bold text-primary">{session.quiz?.score != null ? `${session.quiz.score}%` : '—'}</p>
            </CardContent>
          </Card>
        </div>

        {session.debrief && (
          <Card className="shadow-card border-border">
            <CardHeader>
              <CardTitle className="text-sm">Debrief</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {session.debrief.topics.length > 0 && (
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Topics</p>
                  <div className="flex flex-wrap gap-1">
                    {session.debrief.topics.map((t, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs">{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {session.debrief.keyPoints.length > 0 && (
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Key Points</p>
                  <ul className="space-y-1">
                    {session.debrief.keyPoints.map((k, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="h-3 w-3 text-success mt-0.5 shrink-0" />
                        <span className="text-foreground">{k}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {session.debrief.confusionAreas.length > 0 && (
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Confusion Areas</p>
                  <ul className="space-y-1">
                    {session.debrief.confusionAreas.map((c, i) => (
                      <li key={i} className="text-warning text-sm">• {c}</li>
                    ))}
                  </ul>
                </div>
              )}
              {session.debrief.notes && (
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Notes</p>
                  <p className="text-foreground">{session.debrief.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Focus Timeline */}
        {session.telemetry.length > 0 && (
          <Card className="shadow-card border-border">
            <CardHeader>
              <CardTitle className="text-sm">Focus Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-1 h-20">
                {session.telemetry.map((t, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-t ${t.distractionFlag ? 'bg-destructive/60' : 'bg-primary/60'}`}
                    style={{ height: `${(t.focusLevel / 10) * 100}%` }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // List view
  const completedSessions = sessions.filter(s => s.status === 'completed');

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <h1 className="font-display text-3xl text-primary">Session History</h1>

      {completedSessions.length === 0 ? (
        <Card className="shadow-card border-border">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No sessions yet.</p>
            <Link to="/session/start">
              <Button className="mt-4 gradient-primary text-primary-foreground shadow-glow">Start Your First Session</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {completedSessions.map(session => {
            const duration = session.duration ? `${Math.floor(session.duration / 60)}m` : '—';
            return (
              <Link key={session.id} to={`/history/${session.id}`}>
                <Card className="shadow-card border-border hover:border-primary/30 transition-colors cursor-pointer mb-3">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        {session.debrief?.topics.join(', ') || 'Study Session'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(session.startTime).toLocaleDateString()} · {duration}
                      </p>
                    </div>
                    <div className="text-right">
                      {session.quiz?.score != null && (
                        <span className={`text-sm font-bold ${session.quiz.score >= 80 ? 'text-success' : session.quiz.score >= 60 ? 'text-warning' : 'text-destructive'}`}>
                          {session.quiz.score}%
                        </span>
                      )}
                    </div>
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
