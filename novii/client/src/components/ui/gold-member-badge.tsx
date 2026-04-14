import { cn } from "@/lib/utils";
import { useId } from "react";

interface GoldMemberBadgeProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  iconOnly?: boolean;
}

export function GoldMemberBadge({
  size = "md",
  className,
  iconOnly = false,
}: GoldMemberBadgeProps) {
  const uid = useId();
  const bodyId = `gb${uid}`;
  const ribbonId = `gr${uid}`;
  const shineId = `gs${uid}`;

  const sizeClasses = {
    xs: "w-[30px] h-[30px]",
    sm: "w-[40px] h-[40px]",
    md: "w-[50px] h-[50px]",
    lg: "w-[64px] h-[64px]",
  };

  const svgBadge = (
    <div className={cn("inline-flex items-center justify-center shrink-0", sizeClasses[size])} title="Gold Early Member">
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
        <defs>
          <linearGradient id={bodyId} x1="16" y1="8" x2="48" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="30%" stopColor="#fbbf24" />
            <stop offset="70%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <linearGradient id={ribbonId} x1="16" y1="44" x2="48" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#991b1b" />
          </linearGradient>
          <linearGradient id={shineId} x1="20" y1="10" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M20 44l-6 16 8-4 4 6 6-18H20z" fill={`url(#${ribbonId})`} />
        <path d="M44 44l6 16-8-4-4 6-6-18H44z" fill={`url(#${ribbonId})`} />
        <circle cx="32" cy="28" r="20" fill={`url(#${bodyId})`} />
        <circle cx="32" cy="28" r="20" fill={`url(#${shineId})`} />
        <circle cx="32" cy="28" r="17" stroke="#d97706" strokeOpacity="0.5" strokeWidth="1" fill="none" />
        <circle cx="32" cy="28" r="14.5" stroke="#d97706" strokeOpacity="0.3" strokeWidth="0.5" fill="none" />
        <path d="M32 18l3.09 6.26 6.91 1-5 4.88 1.18 6.86L32 33.84l-6.18 3.16 1.18-6.86-5-4.88 6.91-1L32 18z" fill="#d97706" fillOpacity="0.7" />
        <path d="M32 19.5l2.7 5.47 6.04.88-4.37 4.26 1.03 6L32 33l-5.4 2.84 1.03-6-4.37-4.26 6.04-.88L32 19.5z" fill="#fef3c7" />
      </svg>
    </div>
  );

  if (iconOnly) return <div className={className}>{svgBadge}</div>;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {svgBadge}
      <div className="flex flex-col">
        <span className="text-sm font-bold text-yellow-500">Gold</span>
        <span className="text-xs text-muted-foreground">Early Member</span>
      </div>
    </div>
  );
}
