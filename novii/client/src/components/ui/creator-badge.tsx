import { cn } from "@/lib/utils";
import { useId } from "react";

interface CreatorBadgeProps {
  size?: "xs" | "sm" | "md" | "lg";
  showLabel?: boolean;
  iconOnly?: boolean;
}

export function CreatorBadge({ size = "md", showLabel = false, iconOnly = false }: CreatorBadgeProps) {
  const uid = useId();
  const gradId = `cg${uid}`;
  const shineId = `cs${uid}`;

  const sizeClasses = {
    xs: "w-4 h-4",
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const badge = (
    <div
      className={cn("inline-flex items-center justify-center shrink-0", sizeClasses[size])}
      title="Creator"
    >
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="50%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <linearGradient id={shineId} x1="10" y1="5" x2="30" y2="35" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <circle cx="20" cy="20" r="18" fill={`url(#${gradId})`} />
        <circle cx="20" cy="20" r="18" fill={`url(#${shineId})`} />
        <circle cx="20" cy="20" r="16" stroke="white" strokeOpacity="0.25" strokeWidth="0.8" fill="none" />
        <path d="M20 10l2.94 5.96 6.58.96-4.76 4.64 1.12 6.56L20 24.84l-5.88 3.28 1.12-6.56-4.76-4.64 6.58-.96L20 10z" fill="white" />
      </svg>
    </div>
  );

  if (iconOnly || !showLabel) return badge;

  return (
    <div className="inline-flex items-center gap-1.5">
      {badge}
      <span className="text-xs font-semibold bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent">
        Creator
      </span>
    </div>
  );
}
