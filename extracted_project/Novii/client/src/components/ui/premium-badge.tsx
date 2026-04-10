import { cn } from "@/lib/utils";
import { Crown } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

interface PremiumBadgeProps {
  size?: "xs" | "sm" | "md" | "lg";
  showLabel?: boolean;
  iconOnly?: boolean;
}

export function PremiumBadge({ size = "md", showLabel = false, iconOnly = false }: PremiumBadgeProps) {
  const { language } = useLanguage();
  const isRTL = language.code === 'ar';
  
  const sizeClasses = {
    xs: "w-4 h-4",
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-8 h-8"
  };

  const labelSizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5"
  };

  const iconSizeClasses = {
    xs: "w-2 h-2",
    sm: "w-2.5 h-2.5",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4"
  };

  if (iconOnly) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center rounded-full",
          "bg-gradient-to-br from-yellow-200 via-yellow-400 to-amber-600",
          "ring-2 ring-yellow-300/60 backdrop-blur-sm",
          "shadow-lg shadow-yellow-500/50",
          "hover:shadow-2xl hover:shadow-yellow-500/70",
          "hover:scale-110 transition-all duration-300",
          "relative overflow-hidden",
          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-yellow-400 before:to-amber-300 before:opacity-0 before:hover:opacity-30 before:transition-opacity before:duration-300",
          sizeClasses[size]
        )}
        title={language.code === 'ar' ? 'بريميوم' : 'Premium'}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 hover:opacity-30 transition-opacity duration-300 animate-pulse" />
        <Crown className={cn(
          "text-white fill-white relative z-10",
          "drop-shadow-lg",
          iconSizeClasses[size]
        )} />
      </div>
    );
  }

  if (showLabel) {
    return (
      <div className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full",
        "bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-600",
        "text-white font-bold text-xs shadow-lg shadow-yellow-500/40",
        "ring-1 ring-white/20 backdrop-blur-sm",
        "hover:shadow-xl hover:shadow-yellow-500/60 transition-all duration-300",
        "hover:scale-105 cursor-default"
      )}>
        <div className={cn(
          "relative flex items-center justify-center rounded-full",
          "bg-white/20 backdrop-blur",
          sizeClasses[size]
        )}>
          <Crown className={cn(
            "text-white fill-white",
            iconSizeClasses[size]
          )} />
        </div>
        <span className={isRTL ? "font-arabic" : ""}>
          {language.code === 'ar' ? 'بريميوم' : 'Premium'}
        </span>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "flex items-center justify-center rounded-full",
        "bg-gradient-to-br from-yellow-200 via-yellow-400 to-amber-600",
        "ring-2 ring-yellow-300/60 backdrop-blur-sm",
        "shadow-lg shadow-yellow-500/50",
        "hover:shadow-2xl hover:shadow-yellow-500/70",
        "hover:scale-110 transition-all duration-300",
        "relative overflow-hidden",
        "before:absolute before:inset-0 before:bg-gradient-to-r before:from-yellow-400 before:to-amber-300 before:opacity-0 before:hover:opacity-30 before:transition-opacity before:duration-300",
        sizeClasses[size]
      )}
      title={language.code === 'ar' ? 'بريميوم' : 'Premium'}
    >
      {/* Animated shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 hover:opacity-30 transition-opacity duration-300 animate-pulse" />
      
      {/* Icon */}
      <Crown className={cn(
        "text-white fill-white relative z-10",
        "drop-shadow-lg",
        iconSizeClasses[size]
      )} />
    </div>
  );
}
