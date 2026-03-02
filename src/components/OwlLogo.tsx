interface Props {
  className?: string;
}

export default function OwlLogo({ className = "h-8 w-8" }: Props) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Body */}
      <ellipse cx="32" cy="38" rx="18" ry="20" fill="hsl(var(--primary) / 0.15)" stroke="hsl(var(--primary))" strokeWidth="2" />
      {/* Ears */}
      <path d="M16 22L22 30L14 28Z" fill="hsl(var(--primary))" opacity="0.8" />
      <path d="M48 22L42 30L50 28Z" fill="hsl(var(--primary))" opacity="0.8" />
      {/* Left eye */}
      <circle cx="24" cy="32" r="7" fill="hsl(var(--background))" stroke="hsl(var(--primary))" strokeWidth="2" />
      <circle cx="24" cy="32" r="3" fill="hsl(var(--primary))" />
      {/* Right eye */}
      <circle cx="40" cy="32" r="7" fill="hsl(var(--background))" stroke="hsl(var(--primary))" strokeWidth="2" />
      <circle cx="40" cy="32" r="3" fill="hsl(var(--primary))" />
      {/* Beak */}
      <path d="M29 40L32 46L35 40" fill="hsl(var(--primary))" opacity="0.9" />
      {/* Chest detail */}
      <path d="M26 48Q32 56 38 48" stroke="hsl(var(--primary))" strokeWidth="1.5" fill="none" opacity="0.4" />
    </svg>
  );
}
