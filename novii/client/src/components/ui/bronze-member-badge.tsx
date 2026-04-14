import { cn } from "@/lib/utils";
import { useId } from "react";

interface BronzeMemberBadgeProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  iconOnly?: boolean;
}

export function BronzeMemberBadge({
  size = "md",
  className,
  iconOnly = false,
}: BronzeMemberBadgeProps) {
  const uid = useId();
  const bodyId = `bb${uid}`;
  const ribbonId = `br${uid}`;
  const shineId = `bs${uid}`;

  const sizeClasses = {
    xs: "w-[30px] h-[30px]",
    sm: "w-[40px] h-[40px]",
    md: "w-[50px] h-[50px]",
    lg: "w-[64px] h-[64px]",
  };

  const svgBadge = (
    <div className={cn("inline-flex items-center justify-center shrink-0", sizeClasses[size])} title="Bronze Early Member">
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
        <defs>
          <linearGradient id={bodyId} x1="16" y1="8" x2="48" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fdba74" />
            <stop offset="30%" stopColor="#f97316" />
            <stop offset="70%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#c2410c" />
          </linearGradient>
          <linearGradient id={ribbonId} x1="16" y1="44" x2="48" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#16a34a" />
            <stop offset="100%" stopColor="#15803d" />
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
        <circle cx="32" cy="28" r="17" stroke="#c2410c" strokeOpacity="0.4" strokeWidth="1" fill="none" />
        <circle cx="32" cy="28" r="14.5" stroke="#c2410c" strokeOpacity="0.25" strokeWidth="0.5" fill="none" />
        <path d="M32 18l3.09 6.26 6.91 1-5 4.88 1.18 6.86L32 33.84l-6.18 3.16 1.18-6.86-5-4.88 6.91-1L32 18z" fill="#c2410c" fillOpacity="0.55" />
        <path d="M32 19.5l2.7 5.47 6.04.88-4.37 4.26 1.03 6L32 33l-5.4 2.84 1.03-6-4.37-4.26 6.04-.88L32 19.5z" fill="#fed7aa" />
      </svg>
    </div>
  );

  if (iconOnly) return <div className={className}>{svgBadge}</div>;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {svgBadge}
      <div className="flex flex-col">
        <span className="text-sm font-bold text-orange-500">Bronze</span>
        <span className="text-xs text-muted-foreground">Early Member</span>
      </div>
    </div>
  );
}
