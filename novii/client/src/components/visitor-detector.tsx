import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { collectClientFingerprint } from "@/lib/api";

export function VisitorDetector() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (user || checked) return;

    const publicPaths = ["/auth", "/reset-password", "/explore", "/reels", "/privacy", "/terms", "/help", "/about", "/features"];
    const isPublicPath = publicPaths.some(p => location === p || location.startsWith("/reel/"));
    if (isPublicPath) {
      setChecked(true);
      return;
    }

    const checkVisitor = async () => {
      try {
        const clientFingerprint = collectClientFingerprint();

        const response = await fetch("/api/devices/check-visitor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientFingerprint }),
        });

        const data = await response.json();

        if (data?.isReturningVisitor) {
          setLocation("/auth");
        }
      } catch (error) {
        console.error("VisitorDetector error:", error);
      } finally {
        setChecked(true);
      }
    };

    const timer = setTimeout(checkVisitor, 500);
    return () => clearTimeout(timer);
  }, [user, location, checked, setLocation]);

  return null;
}
