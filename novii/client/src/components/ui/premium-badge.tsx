import { cn } from "@/lib/utils";

interface PremiumBadgeProps {
  size?: "xs" | "sm" | "md" | "lg";
  showLabel?: boolean;
  iconOnly?: boolean;
}

export function PremiumBadge({ size = "md" }: PremiumBadgeProps) {
  const sizeClasses = {
    xs: "text-[9px]",
    sm: "text-[10px]",
    md: "text-[11px]",
    lg: "text-xs",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-bold shrink-0 select-none",
        "text-amber-500",
        sizeClasses[size]
      )}
    >
      Premium
    </span>
  );
}
