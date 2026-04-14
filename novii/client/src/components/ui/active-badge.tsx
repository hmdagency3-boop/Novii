import { cn } from "@/lib/utils";
import { useId } from "react";

interface ActiveBadgeProps {
  size?: "xs" | "sm" | "md" | "lg";
}

export function ActiveBadge({ size = "md" }: ActiveBadgeProps) {
  const uid = useId();
  const gradId = `ag${uid}`;
  const shineId = `as${uid}`;

  const sizeClasses = {
    xs: "w-4 h-4",
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div
      className={cn("inline-flex items-center justify-center shrink-0", sizeClasses[size])}
      title="Active"
    >
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id={shineId} x1="8" y1="4" x2="32" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <circle cx="20" cy="20" r="18" fill={`url(#${gradId})`} />
        <circle cx="20" cy="20" r="18" fill={`url(#${shineId})`} />
        <circle cx="20" cy="20" r="16" stroke="white" strokeOpacity="0.25" strokeWidth="0.8" fill="none" />
        <path d="M22.5 10L15 22h5.5l-3 8L25 18h-5.5l3-8z" fill="white" />
      </svg>
    </div>
  );
}
