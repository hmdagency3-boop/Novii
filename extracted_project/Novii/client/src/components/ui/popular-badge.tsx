import { cn } from "@/lib/utils";
import { Flame } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

interface PopularBadgeProps {
  size?: "xs" | "sm" | "md" | "lg";
  showLabel?: boolean;
  iconOnly?: boolean;
}

export function PopularBadge({ size = "md", showLabel = false, iconOnly = false }: PopularBadgeProps) {
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
    md: "w-3 h-3",
    lg: "w-4 h-4"
  };

  if (iconOnly) {
    return (
      <div 
        className={cn(
          "flex items-center justify-center rounded-full",
          "bg-gradient-to-br from-red-400 via-orange-500 to-red-600",
          "ring-2 ring-red-300/50 backdrop-blur-sm",
          "shadow-lg shadow-red-500/40",
          "hover:shadow-2xl hover:shadow-red-500/60",
          "hover:scale-110 transition-all duration-300",
          "relative overflow-hidden",
          sizeClasses[size]
        )}
        title={language.code === 'ar' ? 'مشهور' : 'Popular'}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-red-600 to-transparent opacity-0 hover:opacity-40 transition-opacity duration-300 animate-pulse" />
        <div className="absolute inset-0 rounded-full border border-red-300/30 animate-pulse" />
        <Flame className={cn(
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
        "bg-gradient-to-r from-red-500 via-orange-500 to-red-600",
        "text-white font-bold text-xs shadow-lg shadow-red-500/40",
        "ring-1 ring-white/20 backdrop-blur-sm",
        "hover:shadow-xl hover:shadow-red-500/60 transition-all duration-300",
        "hover:scale-105 cursor-default"
      )}>
        <div className={cn(
          "relative flex items-center justify-center rounded-full",
          "bg-white/20 backdrop-blur",
          sizeClasses[size]
        )}>
          <Flame className={cn(
            "text-white fill-white animate-bounce",
            iconSizeClasses[size]
          )} />
        </div>
        <span className={isRTL ? "font-arabic" : ""}>
          {language.code === 'ar' ? 'مشهور' : 'Popular'}
        </span>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "flex items-center justify-center rounded-full",
        "bg-gradient-to-br from-red-400 via-orange-500 to-red-600",
        "ring-2 ring-red-300/50 backdrop-blur-sm",
        "shadow-lg shadow-red-500/40",
        "hover:shadow-2xl hover:shadow-red-500/60",
        "hover:scale-110 transition-all duration-300",
        "relative overflow-hidden",
        sizeClasses[size]
      )}
      title={language.code === 'ar' ? 'مشهور' : 'Popular'}
    >
      {/* Animated fire effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-red-600 to-transparent opacity-0 hover:opacity-40 transition-opacity duration-300 animate-pulse" />
      
      {/* Outer glow ring */}
      <div className="absolute inset-0 rounded-full border border-red-300/30 animate-pulse" />
      
      {/* Icon */}
      <Flame className={cn(
        "text-white fill-white relative z-10",
        "drop-shadow-lg",
        iconSizeClasses[size]
      )} />
    </div>
  );
}
