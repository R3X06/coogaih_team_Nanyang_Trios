import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

interface TrajectoryDeltaProps {
  snapshots: Tables<'state_snapshots'>[];
}

interface MetricDelta {
  label: string;
  current: number;
  delta: number;
  invertColor: boolean; // true = positive is bad (risk, calibration gap)
}

function DeltaArrow({ delta, invertColor }: { delta: number; invertColor: boolean }) {
  const isNearZero = Math.abs(delta) < 0.01;
  if (isNearZero) {
    return <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />;
  }
  const isPositive = delta > 0;
  const isGood = invertColor ? !isPositive : isPositive;

  if (isPositive) {
    return <TrendingUp className={`h-3.5 w-3.5 ${isGood ? 'text-emerald-400' : 'text-orange-400'}`} />;
  }
  return <TrendingDown className={`h-3.5 w-3.5 ${isGood ? 'text-emerald-400' : 'text-orange-400'}`} />;
}

export default function TrajectoryDelta({ snapshots }: TrajectoryDeltaProps) {
  const metrics = useMemo<MetricDelta[] | null>(() => {
    if (snapshots.length < 2) return null;

    // Sort descending by timestamp
    const sorted = [...snapshots].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const latest = sorted[0];
    const prev = sorted[1];

    const safe = (v: number | null) => v ?? 0;

    return [
      { label: 'Strength', current: safe(latest.concept_strength), delta: safe(latest.concept_strength) - safe(prev.concept_strength), invertColor: false },
      { label: 'Stability', current: safe(latest.stability), delta: safe(latest.stability) - safe(prev.stability), invertColor: false },
      { label: 'Stamina', current: safe(latest.stamina), delta: safe(latest.stamina) - safe(prev.stamina), invertColor: false },
      { label: 'Risk', current: safe(latest.risk_score), delta: safe(latest.risk_score) - safe(prev.risk_score), invertColor: true },
      { label: 'Cal. Gap', current: safe(latest.calibration_gap), delta: safe(latest.calibration_gap) - safe(prev.calibration_gap), invertColor: true },
    ];
  }, [snapshots]);

  return (
    <Card className="shadow-card border-border gradient-card">
      <CardHeader>
        <CardTitle className="font-display text-lg text-gradient flex items-center gap-2">
          <TrendingUp className="h-4 w-4" /> Trajectory Delta
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!metrics ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            Complete two study sessions to compute trajectory changes.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {metrics.map((m) => {
              const isNearZero = Math.abs(m.delta) < 0.01;
              const isPositive = m.delta > 0;
              const isGood = m.invertColor ? !isPositive : isPositive;
              const deltaColor = isNearZero
                ? 'text-muted-foreground'
                : isGood
                  ? 'text-emerald-400'
                  : 'text-orange-400';

              return (
                <div key={m.label} className="flex flex-col items-center gap-1 p-3 rounded-lg glass border border-border">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{m.label}</span>
                  <span className="text-lg font-bold text-foreground">{(m.current * 100).toFixed(0)}%</span>
                  <div className={`flex items-center gap-1 text-xs font-medium ${deltaColor}`}>
                    <DeltaArrow delta={m.delta} invertColor={m.invertColor} />
                    <span>{isNearZero ? '0' : `${m.delta > 0 ? '+' : ''}${(m.delta * 100).toFixed(1)}`}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
