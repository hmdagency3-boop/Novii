import { cn } from "@/lib/utils";
import { useId } from "react";

interface PopularBadgeProps {
  size?: "xs" | "sm" | "md" | "lg";
  showLabel?: boolean;
  iconOnly?: boolean;
}

export function PopularBadge({ size = "md", showLabel = false, iconOnly = false }: PopularBadgeProps) {
  const uid = useId();
  const gradId = `ppg${uid}`;
  const shineId = `pps${uid}`;

  const sizeClasses = {
    xs: "w-4 h-4",
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const badge = (
    <div
      className={cn("inline-flex items-center justify-center shrink-0", sizeClasses[size])}
      title="Popular"
    >
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="50%" stopColor="#e11d48" />
            <stop offset="100%" stopColor="#be123c" />
          </linearGradient>
          <linearGradient id={shineId} x1="8" y1="4" x2="32" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <circle cx="20" cy="20" r="18" fill={`url(#${gradId})`} />
        <circle cx="20" cy="20" r="18" fill={`url(#${shineId})`} />
        <circle cx="20" cy="20" r="16" stroke="white" strokeOpacity="0.25" strokeWidth="0.8" fill="none" />
        <path d="M20 9c-5 6-8 10-8 14a8 8 0 0016 0c0-4-3-8-8-14z" fill="white" />
        <path d="M20 14c0 0-2 3-2 5.5c0 1.1.9 2 2 2s2-.9 2-2C22 17 20 14 20 14z" fill={`url(#${gradId})`} fillOpacity="0.6" />
      </svg>
    </div>
  );

  if (iconOnly || !showLabel) return badge;

  return (
    <div className="inline-flex items-center gap-1.5">
      {badge}
      <span className="text-xs font-semibold bg-gradient-to-r from-rose-500 to-red-600 bg-clip-text text-transparent">
        Popular
      </span>
    </div>
  );
}
