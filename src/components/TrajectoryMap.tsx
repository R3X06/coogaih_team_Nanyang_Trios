import { useMemo } from 'react';
import type { Tables } from '@/integrations/supabase/types';

interface Props {
  /** All snapshots for the user, ordered newest-first */
  allSnapshots: Tables<'state_snapshots'>[];
}

export default function TrajectoryMap({ allSnapshots }: Props) {
  const W = 520;
  const H = 360;
  const PAD = 48;

  // Build per-topic current + previous points
  const topics = useMemo(() => {
    const map = new Map<string, Tables<'state_snapshots'>[]>();
    for (const s of allSnapshots) {
      const arr = map.get(s.topic_tag) || [];
      arr.push(s);
      map.set(s.topic_tag, arr);
    }
    return Array.from(map.entries()).map(([tag, snaps]) => ({
      tag,
      current: snaps[0],
      previous: snaps.length > 1 ? snaps[1] : null,
    }));
  }, [allSnapshots]);

  const toX = (v: number) => PAD + v * (W - PAD * 2);
  const toY = (v: number) => H - PAD - v * (H - PAD * 2);

  // Mastery zone: top-right quadrant (concept_strength >= 0.7, stability >= 0.7)
  const mzX = toX(0.7);
  const mzY = toY(1);
  const mzW = toX(1) - mzX;
  const mzH = toY(0.7) - mzY;

  const palette = [
    'hsl(160 70% 45%)',   // primary teal
    'hsl(210 100% 60%)', // info blue
    'hsl(142 71% 45%)',  // success green
    'hsl(340 80% 55%)',  // pink
    'hsl(45 95% 58%)',   // gold
  ];

  return (
    <div className="w-full flex flex-col items-center">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full max-w-[560px]"
        style={{ filter: 'drop-shadow(0 0 24px hsl(160 70% 45% / 0.08))' }}
      >
        <defs>
          <radialGradient id="mastery-glow" cx="0.85" cy="0.15">
            <stop offset="0%" stopColor="hsl(142 71% 45%)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="hsl(142 71% 45%)" stopOpacity="0.02" />
          </radialGradient>
          <marker id="arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill="hsl(var(--foreground))" opacity="0.6" />
          </marker>
          <filter id="risk-glow">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(v => (
          <g key={v}>
            <line x1={toX(v)} y1={toY(0)} x2={toX(v)} y2={toY(1)} stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.4" />
            <line x1={toX(0)} y1={toY(v)} x2={toX(1)} y2={toY(v)} stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.4" />
            <text x={toX(v)} y={H - 8} textAnchor="middle" className="fill-muted-foreground" fontSize="9">{v}</text>
            <text x={8} y={toY(v) + 3} textAnchor="start" className="fill-muted-foreground" fontSize="9">{v}</text>
          </g>
        ))}

        {/* Mastery Zone */}
        <rect x={mzX} y={mzY} width={mzW} height={mzH} fill="url(#mastery-glow)" rx="4" />
        <rect x={mzX} y={mzY} width={mzW} height={mzH} fill="none" stroke="hsl(var(--success))" strokeWidth="1" strokeDasharray="4 3" opacity="0.4" rx="4" />
        <text x={mzX + mzW / 2} y={mzY + 14} textAnchor="middle" fontSize="9" className="fill-success" opacity="0.7" fontWeight="600">
          Mastery Zone
        </text>

        {/* Axis labels */}
        <text x={W / 2} y={H - 0} textAnchor="middle" fontSize="10" className="fill-muted-foreground" fontWeight="500">
          Concept Strength
        </text>
        <text x={4} y={H / 2} textAnchor="middle" fontSize="10" className="fill-muted-foreground" fontWeight="500" transform={`rotate(-90, 4, ${H / 2})`}>
          Stability
        </text>

        {/* Per-topic trajectories */}
        {topics.map(({ tag, current, previous }, idx) => {
          const color = palette[idx % palette.length];
          const cx_cur = toX(current.concept_strength ?? 0);
          const cy_cur = toY(current.stability ?? 0);
          const risk = current.risk_score ?? 0;
          const certainty = current.certainty ?? 1;
          const uncertaintyWidth = Math.max(1.5, (1 - certainty) * 6);
          const riskRadius = 8 + risk * 18;

          return (
            <g key={tag}>
              {/* Previous point + arrow */}
              {previous && (
                <>
                  <circle
                    cx={toX(previous.concept_strength ?? 0)}
                    cy={toY(previous.stability ?? 0)}
                    r="4"
                    fill={color}
                    opacity="0.25"
                  />
                  <line
                    x1={toX(previous.concept_strength ?? 0)}
                    y1={toY(previous.stability ?? 0)}
                    x2={cx_cur}
                    y2={cy_cur}
                    stroke={color}
                    strokeWidth="1.5"
                    opacity="0.5"
                    markerEnd="url(#arrow)"
                  />
                </>
              )}

              {/* Risk glow halo */}
              {risk > 0.1 && (
                <circle
                  cx={cx_cur}
                  cy={cy_cur}
                  r={riskRadius}
                  fill="none"
                  stroke="hsl(var(--warning))"
                  strokeWidth="1.5"
                  opacity={Math.min(0.7, risk)}
                  filter="url(#risk-glow)"
                />
              )}

              {/* Uncertainty ring */}
              <circle
                cx={cx_cur}
                cy={cy_cur}
                r="8"
                fill="none"
                stroke={color}
                strokeWidth={uncertaintyWidth}
                opacity="0.35"
                strokeDasharray={certainty < 0.5 ? '3 2' : 'none'}
              />

              {/* Current dot */}
              <circle cx={cx_cur} cy={cy_cur} r="5" fill={color} stroke="hsl(var(--background))" strokeWidth="1.5" />

              {/* Label */}
              <text x={cx_cur} y={cy_cur - 14} textAnchor="middle" fontSize="9" fill={color} fontWeight="600">
                {tag}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3 justify-center">
        <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="inline-block w-2 h-2 rounded-full bg-success opacity-50" /> Mastery Zone
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="inline-block w-3 h-3 rounded-full border-2 border-warning opacity-60" /> Risk Glow
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="inline-block w-3 h-3 rounded-full border-[3px] border-primary opacity-40" /> Uncertainty
        </span>
      </div>
    </div>
  );
}
