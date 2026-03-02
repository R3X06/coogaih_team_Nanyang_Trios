import type { Tables } from '@/integrations/supabase/types';

interface Props {
  snapshots: Tables<'state_snapshots'>[];
  recommendation: Tables<'recommendations'> | null;
}

export default function RiskMonitor({ snapshots, recommendation }: Props) {
  const avgRisk = snapshots.length > 0
    ? snapshots.reduce((a, s) => a + (s.risk_score || 0), 0) / snapshots.length
    : 0;

  const riskPct = (avgRisk * 100).toFixed(0);
  const riskColor = avgRisk > 0.6 ? 'text-destructive' : avgRisk > 0.3 ? 'text-warning' : 'text-success';
  const riskBg = avgRisk > 0.6 ? 'bg-destructive/10' : avgRisk > 0.3 ? 'bg-warning/10' : 'bg-success/10';

  // Sparkline from snapshots sorted by timestamp
  const sorted = [...snapshots].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const riskValues = sorted.map(s => s.risk_score || 0);

  // Risk drivers
  const drivers: string[] = [];
  const weakSnapshots = snapshots.filter(s => (s.concept_strength || 0) < 0.4);
  if (weakSnapshots.length > 0) drivers.push(`Low concept strength in: ${weakSnapshots.map(s => s.topic_tag).join(', ')}`);
  const unstable = snapshots.filter(s => (s.stability || 0) < 0.4);
  if (unstable.length > 0) drivers.push(`Unstable knowledge in: ${unstable.map(s => s.topic_tag).join(', ')}`);
  const miscalibrated = snapshots.filter(s => (s.calibration_gap || 0) > 0.5);
  if (miscalibrated.length > 0) drivers.push(`Calibration gap in: ${miscalibrated.map(s => s.topic_tag).join(', ')}`);
  if (drivers.length === 0 && snapshots.length > 0) drivers.push('No major risk drivers detected');

  return (
    <div className="space-y-4">
      {/* Big risk score */}
      <div className="flex items-center gap-4">
        <div className={`${riskBg} rounded-xl p-4 flex-shrink-0`}>
          <p className={`text-4xl font-bold ${riskColor}`}>{riskPct}%</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Risk</p>
        </div>

        {/* Sparkline */}
        {riskValues.length > 1 && (
          <div className="flex-1">
            <svg width="100%" height="48" viewBox={`0 0 ${riskValues.length * 12} 48`} preserveAspectRatio="none">
              <polyline
                points={riskValues.map((v, i) => `${i * 12},${48 - v * 48}`).join(' ')}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
            <p className="text-[10px] text-muted-foreground">Risk trend</p>
          </div>
        )}
      </div>

      {/* Risk drivers */}
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Risk Drivers</p>
        <ul className="space-y-1">
          {drivers.map((d, i) => (
            <li key={i} className="text-sm text-foreground flex items-start gap-2">
              <span className="text-primary mt-1">•</span> {d}
            </li>
          ))}
        </ul>
      </div>

      {recommendation?.risk_analysis && (
        <p className="text-xs text-muted-foreground italic border-t border-border pt-2">{recommendation.risk_analysis}</p>
      )}
    </div>
  );
}
