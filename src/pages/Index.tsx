import OwlLogo from '@/components/OwlLogo';

export default function Index() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full bg-primary/5 blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 text-center">
        <OwlLogo className="h-28 w-28" />

        <h1 className="font-display text-5xl text-gradient drop-shadow-[0_0_16px_hsl(var(--primary)/0.5)]">
          coogaih
        </h1>

        <p className="text-muted-foreground text-sm tracking-wide">
          Cognitive Guidance AI
        </p>

        <p className="text-foreground/70 text-sm max-w-sm leading-relaxed">
          Your personal learning intelligence — tracking, analyzing, and
          optimizing how you study, one session at a time.
        </p>

        <p className="text-muted-foreground/50 text-xs mt-4 animate-pulse">
          Click the logo to begin
        </p>
      </div>
    </div>
  );
}
