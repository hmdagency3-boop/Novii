import { cn } from "@/lib/utils";

interface BetaTesterBadgeProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  iconOnly?: boolean;
}

export function BetaTesterBadge({ size = "md", className, iconOnly = false }: BetaTesterBadgeProps) {
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
        "text-purple-500",
        sizeClasses[size],
        className
      )}
    >
      Beta
    </span>
  );
}
