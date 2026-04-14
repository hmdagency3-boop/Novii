import { cn } from "@/lib/utils";

interface PopularBadgeProps {
  size?: "xs" | "sm" | "md" | "lg";
  showLabel?: boolean;
  iconOnly?: boolean;
}

export function PopularBadge({ size = "md" }: PopularBadgeProps) {
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
        "text-rose-500",
        sizeClasses[size]
      )}
    >
      Popular
    </span>
  );
}
