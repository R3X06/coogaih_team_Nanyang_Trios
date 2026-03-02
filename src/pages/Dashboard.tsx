import { useLearningState, useStudySessions } from '@/hooks/useStudyData';
import { Link } from 'react-router-dom';
import { Play, AlertTriangle, TrendingUp, Eye, Lightbulb, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import RadarChart from '@/components/RadarChart';

export default function Dashboard() {
  const { learningState } = useLearningState();
  const { sessions } = useStudySessions();
  const completedSessions = sessions.filter(s => s.status === 'completed');

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-gradient mb-1">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            {completedSessions.length} sessions completed · Last updated {new Date(learningState.lastUpdated).toLocaleDateString()}
          </p>
        </div>
        <Link to="/session/start">
          <Button className="gradient-primary text-primary-foreground font-semibold shadow-glow">
            <Play className="h-4 w-4 mr-2" /> Start Session
          </Button>
        </Link>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Risk Score"
          value={`${learningState.riskScore}%`}
          color={learningState.riskScore > 60 ? 'text-destructive' : learningState.riskScore > 30 ? 'text-warning' : 'text-success'}
        />
        <MetricCard
          icon={<Eye className="h-5 w-5" />}
          label="Avg Attention"
          value={`${learningState.attentionAvg}/10`}
          color="text-info"
        />
        <MetricCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Sessions"
          value={`${completedSessions.length}`}
          color="text-primary"
        />
      </div>

      {/* Skill Space + Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar */}
        <Card className="shadow-card border-border">
          <CardHeader>
            <CardTitle className="font-display text-xl text-gradient">Skill Space</CardTitle>
          </CardHeader>
          <CardContent>
            <RadarChart skills={learningState.skills} />
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="shadow-card border-border">
          <CardHeader>
            <CardTitle className="font-display text-xl text-gradient flex items-center gap-2">
              <Lightbulb className="h-5 w-5" /> Next Best Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {learningState.recommendations.map(rec => (
              <div key={rec.id} className="p-3 rounded-lg bg-accent/50 border border-border">
                <div className="flex items-start gap-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    rec.priority === 'high' ? 'bg-destructive/20 text-destructive' :
                    rec.priority === 'medium' ? 'bg-warning/20 text-warning' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {rec.priority}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{rec.action}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{rec.reason}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Skill bars */}
      <Card className="shadow-card border-border">
        <CardHeader>
          <CardTitle className="font-display text-xl text-gradient">Mastery Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {learningState.skills.map(skill => (
            <div key={skill.topic} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-foreground font-medium">{skill.topic}</span>
                <span className={`text-xs ${
                  skill.recentTrend === 'improving' ? 'text-success' :
                  skill.recentTrend === 'declining' ? 'text-destructive' :
                  'text-muted-foreground'
                }`}>
                  {skill.mastery}% · {skill.recentTrend}
                </span>
              </div>
              <Progress value={skill.mastery} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent sessions */}
      {completedSessions.length > 0 && (
        <Card className="shadow-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display text-xl text-gradient">Recent Sessions</CardTitle>
            <Link to="/history" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {completedSessions.slice(0, 3).map(session => (
                <Link
                  key={session.id}
                  to={`/history/${session.id}`}
                  className="block p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors border border-border"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{session.debrief?.topics.join(', ') || 'Study Session'}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(session.startTime).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <Card className="shadow-card border-border">
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`${color}`}>{icon}</div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
