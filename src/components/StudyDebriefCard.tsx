import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { MessageSquareText, RefreshCw } from 'lucide-react';

interface DebriefResult {
  summary: string;
  key_risk: string;
  recommended_focus: string;
  reflection_question: string;
}

interface Props {
  latestSession: Tables<'sessions'> | null;
  latestSnapshot: Tables<'state_snapshots'> | null;
  learnerProfile: string | null;
}

export default function StudyDebriefCard({ latestSession, latestSnapshot, learnerProfile }: Props) {
  const [result, setResult] = useState<DebriefResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasData = !!latestSession;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('study-debrief', {
        body: {
          session_metrics: latestSession ? {
            duration_sec: latestSession.duration_sec,
            distraction_ratio: latestSession.distraction_ratio,
            switching_rate: latestSession.switching_rate,
          } : null,
          state_snapshot: latestSnapshot ? {
            risk_score: latestSnapshot.risk_score,
            stability: latestSnapshot.stability,
            calibration_gap: latestSnapshot.calibration_gap,
            concept_strength: latestSnapshot.concept_strength,
          } : null,
          learner_profile: learnerProfile,
        },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      setResult(data.debrief);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Failed to generate debrief.');
    }
    setLoading(false);
  };

  return (
    <Card className="shadow-card border-border gradient-card">
      <CardHeader>
        <CardTitle className="font-display text-lg text-gradient flex items-center gap-2">
          <MessageSquareText className="h-4 w-4" /> AI Study Debrief
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="text-muted-foreground text-sm text-center py-6">
            Complete a study session to generate debrief.
          </p>
        ) : !result ? (
          <div className="flex flex-col items-center gap-3 py-4">
            {error && <p className="text-destructive text-xs text-center">{error}</p>}
            <Button onClick={handleGenerate} disabled={loading} variant="outline" className="border-primary/30">
              {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <MessageSquareText className="h-4 w-4 mr-2" />}
              Generate Debrief
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-foreground leading-relaxed">{result.summary}</p>

            <div className="p-3 rounded-lg glass border border-border space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-warning shrink-0 mt-0.5">Key Risk</span>
                <p className="text-sm text-warning">{result.key_risk}</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 shrink-0 mt-0.5">Focus</span>
                <p className="text-sm text-emerald-400">{result.recommended_focus}</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground italic">&ldquo;{result.reflection_question}&rdquo;</p>

            <Button onClick={handleGenerate} disabled={loading} variant="ghost" size="sm" className="text-xs">
              {loading ? <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />}
              Regenerate
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
