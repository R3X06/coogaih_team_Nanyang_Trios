import type { SkillVector } from '@/types/session';

interface Props {
  skills: SkillVector[];
}

export default function RadarChart({ skills }: Props) {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = 110;
  const levels = 4;
  const n = skills.length;

  const angleSlice = (2 * Math.PI) / n;

  const getPoint = (i: number, value: number) => {
    const angle = angleSlice * i - Math.PI / 2;
    const r = (value / 100) * maxRadius;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  const gridLines = Array.from({ length: levels }, (_, l) => {
    const r = ((l + 1) / levels) * maxRadius;
    const pts = Array.from({ length: n }, (_, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    }).join(' ');
    return pts;
  });

  const dataPoints = skills.map((s, i) => getPoint(i, s.mastery));
  const dataPath = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="flex justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid */}
        {gridLines.map((pts, i) => (
          <polygon
            key={i}
            points={pts}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="1"
            opacity={0.5}
          />
        ))}

        {/* Axes */}
        {skills.map((_, i) => {
          const p = getPoint(i, 100);
          return (
            <line
              key={i}
              x1={cx} y1={cy}
              x2={p.x} y2={p.y}
              stroke="hsl(var(--border))"
              strokeWidth="1"
              opacity={0.3}
            />
          );
        })}

        {/* Data polygon */}
        <polygon
          points={dataPath}
          fill="hsl(var(--primary) / 0.2)"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
        />

        {/* Data points */}
        {dataPoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x} cy={p.y}
            r="4"
            fill="hsl(var(--primary))"
          />
        ))}

        {/* Labels */}
        {skills.map((s, i) => {
          const p = getPoint(i, 120);
          return (
            <text
              key={i}
              x={p.x} y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-muted-foreground text-[10px]"
            >
              {s.topic}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
