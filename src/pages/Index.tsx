import { Link } from 'react-router-dom';
import OwlLogo from '@/components/OwlLogo';

export default function Index() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 max-w-2xl text-center">
        {/* Clickable logo → login */}
        <Link to="/login" className="group flex flex-col items-center gap-4 transition-transform hover:scale-105">
          <OwlLogo className="h-24 w-24 transition-all duration-300 group-hover:drop-shadow-[0_0_24px_hsl(var(--primary)/0.6)]" />
          <h1 className="font-display text-5xl text-gradient drop-shadow-[0_0_16px_hsl(var(--primary)/0.5)] transition-all duration-300 group-hover:drop-shadow-[0_0_28px_hsl(var(--primary)/0.85)]">
            coogaih
          </h1>
        </Link>

        {/* About section */}
        <div className="space-y-4 mt-4">
          <p className="text-lg text-foreground/90 leading-relaxed">
            Cognitive Guidance AI — your personal learning intelligence system that tracks, analyzes, and optimizes how you study.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            <div className="glass glass-hover rounded-lg p-5 space-y-2">
              <p className="text-primary font-semibold text-sm">Adaptive Analysis</p>
              <p className="text-xs text-muted-foreground">AI-driven skill vectors, risk scoring, and cognitive pattern detection across every session.</p>
            </div>
            <div className="glass glass-hover rounded-lg p-5 space-y-2">
              <p className="text-primary font-semibold text-sm">Precision Tracking</p>
              <p className="text-xs text-muted-foreground">Subject → chapter → topic hierarchy with attention audits, gap radar, and trajectory mapping.</p>
            </div>
            <div className="glass glass-hover rounded-lg p-5 space-y-2">
              <p className="text-primary font-semibold text-sm">Actionable Guidance</p>
              <p className="text-xs text-muted-foreground">Personalized next-best-action recommendations calibrated to your learning profile.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
