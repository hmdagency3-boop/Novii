import { cn } from "@/lib/utils";

interface ActiveBadgeProps {
  size?: "xs" | "sm" | "md" | "lg";
}

export function ActiveBadge({ size = "md" }: ActiveBadgeProps) {
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
        "text-emerald-500",
        sizeClasses[size]
      )}
    >
      Active
    </span>
  );
}
