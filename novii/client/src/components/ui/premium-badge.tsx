import { cn } from "@/lib/utils";

interface PremiumBadgeProps {
  size?: "xs" | "sm" | "md" | "lg";
  showLabel?: boolean;
  iconOnly?: boolean;
}

export function PremiumBadge({ size = "md" }: PremiumBadgeProps) {
  const sizeClasses = {
    xs: "text-[9px] px-1.5 py-[1px]",
    sm: "text-[10px] px-2 py-0.5",
    md: "text-[11px] px-2.5 py-0.5",
    lg: "text-xs px-3 py-1",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-bold rounded-full shrink-0 select-none",
        "bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 text-white",
        sizeClasses[size]
      )}
    >
      Premium
    </span>
  );
}
