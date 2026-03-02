import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, RefreshCw, AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

interface PatternSignal {
  signal: string;
  evidence: string;
  severity: 'low' | 'medium' | 'high';
}

interface CognitiveSnapshot {
  confidence_level: 'low' | 'medium' | 'high';
  overall_state: string;
  learner_profile: string;
  pattern_signals: PatternSignal[];
  risk_factors: string[];
  stability_assessment: string;
  attention_profile: string;
  calibration_note: string;
}

export default function CognitiveSnapshotCard() {
  const { user } = useUser();
  const [snapshot, setSnapshot] = useState<CognitiveSnapshot | null>(null);
  const [loading, setLoading] = useState(false);

  const generateSnapshot = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // IMPORTANT: no user_id; backend derives user from JWT
      const { data, error } = await supabase.functions.invoke('cognitive-snapshot', { body: {} });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSnapshot(data.snapshot);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Failed to generate cognitive snapshot');
    }
    setLoading(false);
  };

  // Auto-generate once on dashboard load
  useEffect(() => {
    if (user && !snapshot) generateSnapshot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const severityIcon = (s: string) => {
    if (s === 'high') return <ShieldAlert className="h-3.5 w-3.5 text-destructive shrink-0" />;
    if (s === 'medium') return <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" />;
    return <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0" />;
  };

  const severityColor = (s: string) => {
    if (s === 'high') return 'border-destructive/30 bg-destructive/5';
    if (s === 'medium') return 'border-warning/30 bg-warning/5';
    return 'border-border bg-accent/10';
  };

  const confidenceBadge = (level: string) => {
    const colors: Record<string, string> = {
      high: 'bg-success/20 text-success border-success/30',
      medium: 'bg-warning/20 text-warning border-warning/30',
      low: 'bg-muted text-muted-foreground border-border',
    };
    return colors[level] || colors.low;
  };

  return (
    <Card className="shadow-card border-border gradient-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="font-display text-lg text-gradient flex items-center gap-2">
          <Brain className="h-4 w-4" /> Cognitive Snapshot
        </CardTitle>
        <Button
          onClick={generateSnapshot}
          variant="outline"
          size="sm"
          disabled={loading}
          className="border-primary/30 h-8 text-xs"
        >
          <RefreshCw className={`h-3 w-3 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          {snapshot ? 'Refresh' : 'Generate'}
        </Button>
      </CardHeader>

      <CardContent>
        {!snapshot && !loading && (
          <p className="text-muted-foreground text-sm text-center py-6">
            Generating a metric-grounded cognitive snapshot from your recent sessions.
          </p>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8 gap-3">
            <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">Analyzing cognitive state…</span>
          </div>
        )}

        {snapshot && !loading && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {snapshot.learner_profile}
                  </Badge>
                  <Badge variant="outline" className={`text-[10px] ${confidenceBadge(snapshot.confidence_level)}`}>
                    {snapshot.confidence_level} confidence
                  </Badge>
                </div>
                <p className="text-sm text-foreground leading-relaxed mt-2">{snapshot.overall_state}</p>
              </div>
            </div>

            {snapshot.pattern_signals?.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Detected Patterns</p>
                {snapshot.pattern_signals.map((sig, i) => (
                  <div key={i} className={`flex items-start gap-2 p-2.5 rounded-md border ${severityColor(sig.severity)}`}>
                    {severityIcon(sig.severity)}
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground">{sig.signal}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{sig.evidence}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {snapshot.risk_factors?.length > 0 && (
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Risk Factors</p>
                <div className="flex flex-wrap gap-1.5">
                  {snapshot.risk_factors.map((r, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-2 pt-1">
              <div className="p-2.5 rounded-md bg-accent/10 border border-border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Stability</p>
                <p className="text-xs text-foreground">{snapshot.stability_assessment}</p>
              </div>
              <div className="p-2.5 rounded-md bg-accent/10 border border-border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Attention</p>
                <p className="text-xs text-foreground">{snapshot.attention_profile}</p>
              </div>
              <div className="p-2.5 rounded-md bg-accent/10 border border-border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Calibration</p>
                <p className="text-xs text-foreground">{snapshot.calibration_note}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
