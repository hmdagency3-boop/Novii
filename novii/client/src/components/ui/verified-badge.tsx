import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface VerifiedBadgeProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
  verifiedAt?: string | null;
}

export function VerifiedBadge({ className, size = "md", verifiedAt }: VerifiedBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);

  const sizeClasses = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const formatVerifiedDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "Verified since March 2013.";
    
    try {
      const date = new Date(dateString);
      return `Verified since ${date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}.`;
    } catch {
      return "Verified since March 2013.";
    }
  };

  return (
    <>
      <BadgeCheck
        onClick={() => setIsOpen(true)}
        className={cn(
          "text-primary fill-primary/20 inline-flex shrink-0 cursor-pointer hover:opacity-80 transition-opacity",
          sizeClasses[size],
          className
        )}
        aria-label="Verified"
      />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="text-center">
            <div className="flex justify-center mb-4">
              <BadgeCheck className="w-12 h-12 text-primary fill-primary/20" />
            </div>
            <DialogTitle className="text-2xl">Verified account</DialogTitle>
            <DialogDescription className="text-base pt-4 space-y-4">
              <p className="text-foreground font-medium">
                This account is verified because it's an official organisation on NOVII.
              </p>
              <a
                href="#"
                className="text-primary hover:underline font-medium"
              >
                Learn more
              </a>
              <p className="text-muted-foreground pt-2">
                {formatVerifiedDate(verifiedAt)}
              </p>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
