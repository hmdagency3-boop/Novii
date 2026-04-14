import { cn } from "@/lib/utils";

interface GoldMemberBadgeProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  iconOnly?: boolean;
}

export function GoldMemberBadge({ size = "md", className, iconOnly = false }: GoldMemberBadgeProps) {
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
        "bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 text-amber-900",
        sizeClasses[size],
        className
      )}
    >
      Gold
    </span>
  );
}
