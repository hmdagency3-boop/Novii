import { cn } from "@/lib/utils";

interface BronzeMemberBadgeProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  iconOnly?: boolean;
}

export function BronzeMemberBadge({ 
  size = "md",
  className,
  iconOnly = false
}: BronzeMemberBadgeProps) {
  const sizeMap = {
    xs: 30,
    sm: 50,
    md: 65,
    lg: 80
  };

  const width = sizeMap[size];

  if (iconOnly) {
    return (
      <img
        src="/medals/bronze.png"
        alt="Bronze Early Member"
        width={width}
        height={width}
        className={cn("inline-block", className)}
        title="Bronze Early Member"
        style={{ objectFit: "contain" }}
      />
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <img
        src="/medals/bronze.png"
        alt="Bronze Early Member"
        width={width}
        height={width}
        className="inline-block"
        title="Bronze Early Member"
        style={{ objectFit: "contain" }}
      />
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-bold text-foreground">Bronze</span>
        <span className="text-xs text-muted-foreground">Early Member</span>
      </div>
    </div>
  );
}
