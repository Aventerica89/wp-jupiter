import { cn } from "@/lib/utils";

interface LogoIconProps {
  className?: string;
}

export function LogoIcon({ className }: LogoIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="none"
      className={cn("h-8 w-8", className)}
    >
      <defs>
        <linearGradient id="logoIconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      {/* Background rounded square */}
      <rect x="2" y="2" width="28" height="28" rx="6" fill="url(#logoIconGradient)" />
      {/* W letter */}
      <path
        d="M8 10 L11 22 L14 14 L17 22 L20 10"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* P letter arc */}
      <path
        d="M22 10 L22 16 Q22 22 28 19"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

interface LogoProps {
  className?: string;
  showText?: boolean;
  textClassName?: string;
}

export function Logo({ className, showText = true, textClassName }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <LogoIcon />
      {showText && (
        <span className={cn("text-lg font-semibold text-white", textClassName)}>
          WP Manager
        </span>
      )}
    </div>
  );
}
