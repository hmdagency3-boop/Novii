import { cn } from "@/lib/utils";

interface SilverMemberBadgeProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  iconOnly?: boolean;
}

export function SilverMemberBadge({ size = "md", className, iconOnly = false }: SilverMemberBadgeProps) {
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
        "text-slate-400",
        sizeClasses[size],
        className
      )}
    >
      Silver
    </span>
  );
}
