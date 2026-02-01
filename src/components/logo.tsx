import { useId } from "react";
import { cn } from "@/lib/utils";

interface LogoIconProps {
  className?: string;
}

export function LogoIcon({ className }: LogoIconProps) {
  const gradientId = useId();

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="none"
      className={cn("h-8 w-8", className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="50%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>

      {/* Background rounded square */}
      <rect x="2" y="2" width="28" height="28" rx="6" fill={`url(#${gradientId})`} />

      {/* Hub dots around center */}
      <circle cx="16" cy="6" r="2" fill="white" opacity="0.8" />
      <circle cx="24" cy="12" r="1.5" fill="white" opacity="0.7" />
      <circle cx="24" cy="20" r="1.5" fill="white" opacity="0.7" />
      <circle cx="16" cy="26" r="2" fill="white" opacity="0.8" />
      <circle cx="8" cy="20" r="1.5" fill="white" opacity="0.7" />
      <circle cx="8" cy="12" r="1.5" fill="white" opacity="0.7" />

      {/* Central hub with W */}
      <rect x="10" y="10" width="12" height="12" rx="3" fill="white" />
      <path
        d="M12.5 13 L14 19 L16 15 L18 19 L19.5 13"
        stroke={`url(#${gradientId})`}
        strokeWidth="1.5"
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
