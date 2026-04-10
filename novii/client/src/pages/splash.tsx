import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";

export default function SplashScreen() {
  const [, setLocation] = useLocation();
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setFading(true);
      await new Promise(r => setTimeout(r, 400));
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setLocation(session ? "/" : "/auth");
      } catch {
        setLocation("/auth");
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [setLocation]);

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{
        backgroundColor: "#000",
        opacity: fading ? 0 : 1,
        transition: "opacity 0.4s ease",
      }}
    >
      <div className="flex-1 flex items-center justify-center">
        <div
          style={{
            width: 90,
            height: 90,
            borderRadius: 22,
            background: "linear-gradient(135deg, #9333ea 0%, #ec4899 50%, #06b6d4 100%)",
            padding: 3,
            boxShadow: "0 0 40px rgba(147,51,234,0.4)",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 19,
              background: "#0a0010",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontSize: 44,
                fontWeight: 900,
                lineHeight: 1,
                background: "linear-gradient(135deg, #c084fc, #f472b6, #67e8f9)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              N
            </span>
          </div>
        </div>
      </div>

      <div className="pb-10 flex flex-col items-center gap-0.5">
        <span style={{ fontSize: 11, color: "#4b5563" }}>from</span>
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: 0.5,
            background: "linear-gradient(135deg, #a855f7, #ec4899, #06b6d4)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Novii
        </span>
      </div>
    </div>
  );
}
