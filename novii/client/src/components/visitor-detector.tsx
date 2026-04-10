import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";

/**
 * VisitorDetector Component
 * 
 * Detects if a visitor's device is already registered in the system
 * If returning visitor → redirects to /auth
 * If new visitor → allows normal flow
 * 
 * Strategy:
 * User visits → Browser detects device → Backend records signature → 
 * Return user = "already registered" → Redirect to auth page
 */
export function VisitorDetector() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Only check if user is not logged in and we haven't checked yet
    if (user || checked) return;

    // Skip check on already specific routes (auth and reset-password)
    if (location === "/auth" || location === "/reset-password") {
      setChecked(true);
      return;
    }

    const checkVisitor = async () => {
      try {
        console.log("🔍 VisitorDetector: Checking if device is registered...");
        
        const response = await fetch("/api/devices/check-visitor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        
        const data = await response.json();
        
        if (data?.isReturningVisitor) {
          console.log("✅ VisitorDetector: Returning visitor detected!");
          console.log("📍 Redirecting to auth page...");
          // Redirect to auth page for returning visitors
          setLocation("/auth");
        } else {
          console.log("🆕 VisitorDetector: New visitor - allowing normal flow");
        }
      } catch (error) {
        console.error("❌ VisitorDetector: Error checking device:", error);
        // On error, allow normal flow
      } finally {
        setChecked(true);
      }
    };

    // Check device after a small delay to ensure page is loaded
    const timer = setTimeout(checkVisitor, 500);
    return () => clearTimeout(timer);
  }, [user, location, checked, setLocation]);

  // Component doesn't render anything, it's just for side effects
  return null;
}
