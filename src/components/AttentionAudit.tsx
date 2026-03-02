import type { Tables } from '@/integrations/supabase/types';

interface Props {
  session: Tables<'sessions'>;
}

export default function AttentionAudit({ session }: Props) {
  const segments = [
    { key: 'research_ratio', label: 'Research', color: 'hsl(var(--info))' },
    { key: 'notes_ratio', label: 'Notes', color: 'hsl(var(--success))' },
    { key: 'practice_ratio', label: 'Practice', color: 'hsl(var(--primary))' },
    { key: 'distraction_ratio', label: 'Distraction', color: 'hsl(var(--destructive))' },
  ] as const;

  const values = segments.map(s => (session[s.key] as number) || 0);
  const total = values.reduce((a, b) => a + b, 0) || 1;

  // Build pie chart as SVG arcs
  const size = 160;
  const r = 60;
  const cx = size / 2;
  const cy = size / 2;

  let cumAngle = -Math.PI / 2;
  const arcs = segments.map((seg, i) => {
    const fraction = values[i] / total;
    const angle = fraction * 2 * Math.PI;
    const startX = cx + r * Math.cos(cumAngle);
    const startY = cy + r * Math.sin(cumAngle);
    cumAngle += angle;
    const endX = cx + r * Math.cos(cumAngle);
    const endY = cy + r * Math.sin(cumAngle);
    const large = angle > Math.PI ? 1 : 0;
    const path = fraction > 0.001
      ? `M ${cx} ${cy} L ${startX} ${startY} A ${r} ${r} 0 ${large} 1 ${endX} ${endY} Z`
      : '';
    return { ...seg, path, value: values[i], fraction };
  });

  const fragmentation = session.fragmentation;
  const focusBlockMin = session.avg_focus_block_minutes;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-6">
        {/* Pie */}
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
          {arcs.map((arc, i) => (
            arc.path && <path key={i} d={arc.path} fill={arc.color} opacity={0.8} />
          ))}
          <circle cx={cx} cy={cy} r={30} fill="hsl(var(--card))" />
        </svg>

        {/* Legend */}
        <div className="space-y-2 flex-1">
          {arcs.map((arc, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: arc.color }} />
              <span className="text-foreground">{arc.label}</span>
              <span className="text-muted-foreground ml-auto">{(arc.fraction * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      <div className="flex gap-3">
        {fragmentation != null && (
          <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
            fragmentation > 0.6 ? 'bg-destructive/15 text-destructive' : fragmentation > 0.3 ? 'bg-warning/15 text-warning' : 'bg-success/15 text-success'
          }`}>
            Fragmentation: {(fragmentation * 100).toFixed(0)}%
          </div>
        )}
        {focusBlockMin != null && (
          <div className="px-3 py-1.5 rounded-lg text-xs font-medium bg-info/15 text-info">
            Avg Focus Block: {Number(focusBlockMin).toFixed(0)} min
          </div>
        )}
      </div>
    </div>
  );
}
