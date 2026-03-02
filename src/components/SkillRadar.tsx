import type { Tables } from '@/integrations/supabase/types';

interface Props {
  snapshots: Tables<'state_snapshots'>[];
}

export default function SkillRadar({ snapshots }: Props) {
  const size = 300;
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = 120;

  // Aggregate across all topic snapshots
  const axes = [
    { key: 'concept_strength', label: 'Strength' },
    { key: 'stability', label: 'Stability' },
    { key: 'calibration_gap', label: 'Calibration' },
    { key: 'stamina', label: 'Stamina' },
    { key: 'recovery_rate', label: 'Recovery' },
  ] as const;

  const n = axes.length;
  const angleSlice = (2 * Math.PI) / n;

  const avgValues = axes.map(axis => {
    const vals = snapshots.map(s => (s[axis.key] as number) || 0).filter(v => v > 0);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  });

  const getPoint = (i: number, value: number) => {
    const angle = angleSlice * i - Math.PI / 2;
    const r = value * maxRadius;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  const levels = 4;
  const gridLines = Array.from({ length: levels }, (_, l) => {
    const r = ((l + 1) / levels) * maxRadius;
    return Array.from({ length: n }, (_, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    }).join(' ');
  });

  const dataPoints = avgValues.map((v, i) => getPoint(i, v));
  const dataPath = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {gridLines.map((pts, i) => (
          <polygon key={i} points={pts} fill="none" stroke="hsl(var(--border))" strokeWidth="1" opacity={0.4} />
        ))}
        {axes.map((_, i) => {
          const p = getPoint(i, 1);
          return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="hsl(var(--border))" strokeWidth="1" opacity={0.25} />;
        })}
        {avgValues.some(v => v > 0) && (
          <>
            <polygon points={dataPath} fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary))" strokeWidth="2" />
            {dataPoints.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="4" fill="hsl(var(--primary))" />
            ))}
          </>
        )}
        {axes.map((axis, i) => {
          const p = getPoint(i, 1.22);
          return (
            <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-[10px]">
              {axis.label}
            </text>
          );
        })}
      </svg>
      {/* Per-topic breakdown */}
      <div className="flex flex-wrap justify-center gap-2">
        {snapshots.map(s => (
          <span key={s.id} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {s.topic_tag}: {((s.concept_strength || 0) * 100).toFixed(0)}%
          </span>
        ))}
      </div>
    </div>
  );
}
