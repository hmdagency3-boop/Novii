import { cn } from "@/lib/utils";

interface BugHunterBadgeProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  iconOnly?: boolean;
}

export function BugHunterBadge({ size = "md", className, iconOnly = false }: BugHunterBadgeProps) {
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
        "text-green-500",
        sizeClasses[size],
        className
      )}
    >
      Bug Hunter
    </span>
  );
}
