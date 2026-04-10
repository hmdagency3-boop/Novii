import { cn } from "@/lib/utils";

interface BetaTesterBadgeProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  iconOnly?: boolean;
}

export function BetaTesterBadge({ 
  size = "md",
  className,
  iconOnly = false
}: BetaTesterBadgeProps) {
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
        src="/medals/beta.png"
        alt="Beta Tester"
        width={width}
        height={width}
        className={cn("inline-block", className)}
        title="Beta Tester"
        style={{ objectFit: "contain" }}
      />
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <img
        src="/medals/beta.png"
        alt="Beta Tester"
        width={width}
        height={width}
        className="inline-block"
        title="Beta Tester"
        style={{ objectFit: "contain" }}
      />
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-bold text-foreground">Beta</span>
        <span className="text-xs text-muted-foreground">Tester</span>
      </div>
    </div>
  );
}
