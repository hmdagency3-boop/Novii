import { cn } from "@/lib/utils";

interface BronzeMemberBadgeProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  iconOnly?: boolean;
}

export function BronzeMemberBadge({ size = "md", className, iconOnly = false }: BronzeMemberBadgeProps) {
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
        "text-orange-500",
        sizeClasses[size],
        className
      )}
    >
      Bronze
    </span>
  );
}
