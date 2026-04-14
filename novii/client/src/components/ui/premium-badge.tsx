import { cn } from "@/lib/utils";
import { useId } from "react";

interface PremiumBadgeProps {
  size?: "xs" | "sm" | "md" | "lg";
  showLabel?: boolean;
  iconOnly?: boolean;
}

export function PremiumBadge({ size = "md", showLabel = false, iconOnly = false }: PremiumBadgeProps) {
  const uid = useId();
  const gradId = `pg${uid}`;
  const shineId = `ps${uid}`;

  const sizeClasses = {
    xs: "w-4 h-4",
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const badge = (
    <div
      className={cn("inline-flex items-center justify-center shrink-0", sizeClasses[size])}
      title="Premium"
    >
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <linearGradient id={shineId} x1="8" y1="4" x2="32" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <circle cx="20" cy="20" r="18" fill={`url(#${gradId})`} />
        <circle cx="20" cy="20" r="18" fill={`url(#${shineId})`} />
        <circle cx="20" cy="20" r="16" stroke="white" strokeOpacity="0.3" strokeWidth="0.8" fill="none" />
        <path d="M12 26V16l4 4 4-6 4 6 4-4v10H12z" fill="white" />
      </svg>
    </div>
  );

  if (iconOnly || !showLabel) return badge;

  return (
    <div className="inline-flex items-center gap-1.5">
      {badge}
      <span className="text-xs font-semibold bg-gradient-to-r from-yellow-500 to-amber-600 bg-clip-text text-transparent">
        Premium
      </span>
    </div>
  );
}
