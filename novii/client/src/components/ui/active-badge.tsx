import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";

interface ActiveBadgeProps {
  size?: "xs" | "sm" | "md" | "lg";
}

export function ActiveBadge({ size = "md" }: ActiveBadgeProps) {
  const sizeClasses = {
    xs: "w-4 h-4",
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-8 h-8"
  };

  return (
    <div className={cn(
      "flex items-center justify-center rounded-full",
      "bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600",
      "ring-2 ring-green-300/40",
      "shadow-lg shadow-green-500/30",
      "animate-pulse",
      sizeClasses[size]
    )}>
      <Zap className={cn(
        "text-white fill-white",
        size === "xs" ? "w-2 h-2" : size === "sm" ? "w-2.5 h-2.5" : size === "md" ? "w-3 h-3" : "w-4 h-4"
      )} />
    </div>
  );
}
