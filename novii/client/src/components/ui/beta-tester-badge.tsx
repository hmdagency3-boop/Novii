import { cn } from "@/lib/utils";

interface BetaTesterBadgeProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  iconOnly?: boolean;
}

export function BetaTesterBadge({ size = "md", className, iconOnly = false }: BetaTesterBadgeProps) {
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
        "bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 text-white",
        sizeClasses[size],
        className
      )}
    >
      Beta
    </span>
  );
}
