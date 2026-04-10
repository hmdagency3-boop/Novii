import { cn } from "@/lib/utils";
import { Crown } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/lib/language-context";
import { getTranslation } from "@/lib/translations";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import "./official-badge.css";

interface OfficialBadgeProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
  showText?: boolean;
}

export function OfficialBadge({ className, size = "md", showText = false }: OfficialBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { language } = useLanguage();
  const t = getTranslation(language.code);

  const sizeClasses = {
    xs: "w-4 h-4",
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const textSizeClasses = {
    xs: "text-xs",
    sm: "text-xs",
    md: "text-xs",
    lg: "text-sm",
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "official-badge inline-flex items-center cursor-pointer hover:scale-110 transition-transform",
            className
          )}>
            {/* Premium Badge Image */}
            <div 
              className={cn(
                "official-badge-image",
                sizeClasses[size]
              )}
              style={{
                backgroundImage: "url('/official-badge.png')"
              }}
              aria-label="Official Novii Account"
              onClick={() => setIsOpen(true)}
            />

            {/* Text with Indicator */}
            {showText && (
              <div className="flex items-center gap-1">
                <span className={cn(
                  "official-badge-text",
                  textSizeClasses[size]
                )}>
                  NOVII
                </span>
                {size === "lg" && (
                  <div className="official-badge-indicator" />
                )}
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent className="official-badge-tooltip" sideOffset={10}>
          <div className="flex items-center gap-2 px-1">
            <div className="official-badge-indicator" />
            <span>حساب رسمي من نوفي</span>
          </div>
        </TooltipContent>
      </Tooltip>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div 
                className="w-16 h-16 bg-cover"
                style={{
                  backgroundImage: "url('/official-badge.png')"
                }}
              />
            </div>
            <DialogTitle className="text-xl">{t.badges.official_title}</DialogTitle>
            <DialogDescription className="text-sm pt-4 space-y-2">
              <p className="text-foreground font-medium">
                {t.badges.official_desc_main}
              </p>
              <p className="text-muted-foreground text-xs">
                {t.badges.official_desc_detail}
              </p>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
