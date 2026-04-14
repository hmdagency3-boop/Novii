import { cn } from "@/lib/utils";
import { useId } from "react";

interface BetaTesterBadgeProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  iconOnly?: boolean;
}

export function BetaTesterBadge({
  size = "md",
  className,
  iconOnly = false,
}: BetaTesterBadgeProps) {
  const uid = useId();
  const bodyId = `btb${uid}`;
  const ribbonId = `btr${uid}`;
  const shineId = `bts${uid}`;

  const sizeClasses = {
    xs: "w-[30px] h-[30px]",
    sm: "w-[40px] h-[40px]",
    md: "w-[50px] h-[50px]",
    lg: "w-[64px] h-[64px]",
  };

  const svgBadge = (
    <div className={cn("inline-flex items-center justify-center shrink-0", sizeClasses[size])} title="Beta Tester">
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
        <defs>
          <linearGradient id={bodyId} x1="16" y1="8" x2="48" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#c4b5fd" />
            <stop offset="30%" stopColor="#a78bfa" />
            <stop offset="70%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
          <linearGradient id={ribbonId} x1="16" y1="44" x2="48" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#0891b2" />
          </linearGradient>
          <linearGradient id={shineId} x1="20" y1="10" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M20 44l-6 16 8-4 4 6 6-18H20z" fill={`url(#${ribbonId})`} />
        <path d="M44 44l6 16-8-4-4 6-6-18H44z" fill={`url(#${ribbonId})`} />
        <circle cx="32" cy="28" r="20" fill={`url(#${bodyId})`} />
        <circle cx="32" cy="28" r="20" fill={`url(#${shineId})`} />
        <circle cx="32" cy="28" r="17" stroke="#7c3aed" strokeOpacity="0.4" strokeWidth="1" fill="none" />
        <circle cx="32" cy="28" r="14.5" stroke="#7c3aed" strokeOpacity="0.25" strokeWidth="0.5" fill="none" />
        <text x="32" y="33" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="system-ui, sans-serif">β</text>
      </svg>
    </div>
  );

  if (iconOnly) return <div className={className}>{svgBadge}</div>;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {svgBadge}
      <div className="flex flex-col">
        <span className="text-sm font-bold text-violet-500">Beta</span>
        <span className="text-xs text-muted-foreground">Tester</span>
      </div>
    </div>
  );
}
