import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/language-context";

interface QRSuccessAnimationProps {
  onDone: () => void;
}

const PARTICLES = [
  { angle: 0,   color: "#a855f7", size: 10 },
  { angle: 45,  color: "#ec4899", size: 7  },
  { angle: 90,  color: "#8b5cf6", size: 12 },
  { angle: 135, color: "#f472b6", size: 8  },
  { angle: 180, color: "#7c3aed", size: 10 },
  { angle: 225, color: "#db2777", size: 6  },
  { angle: 270, color: "#9333ea", size: 11 },
  { angle: 315, color: "#e879f9", size: 8  },
  { angle: 22,  color: "#c084fc", size: 6  },
  { angle: 67,  color: "#f9a8d4", size: 9  },
  { angle: 112, color: "#a21caf", size: 7  },
  { angle: 157, color: "#be185d", size: 8  },
];

export function QRSuccessAnimation({ onDone }: QRSuccessAnimationProps) {
  const { direction } = useLanguage();
  const isRTL = direction === "rtl";
  const [phase, setPhase] = useState<"in" | "out">("in");

  useEffect(() => {
    // After 1.8s start fade out, then call onDone
    const t1 = setTimeout(() => setPhase("out"), 1800);
    const t2 = setTimeout(() => onDone(), 2300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      style={{
        background: "radial-gradient(ellipse at center, #1a0533 0%, #0a0015 100%)",
        animation: phase === "out"
          ? "qr-overlay-out 0.5s ease-in forwards"
          : undefined,
      }}
    >
      {/* Background flash burst */}
      <div
        className="absolute w-48 h-48 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(168,85,247,0.6) 0%, transparent 70%)",
          animation: "qr-flash 0.6s ease-out forwards",
        }}
      />

      {/* Expanding rings */}
      {[0, 150, 300].map((delay, i) => (
        <div
          key={i}
          className="absolute w-32 h-32 rounded-full border-2"
          style={{
            borderColor: i === 0 ? "#a855f7" : i === 1 ? "#ec4899" : "#8b5cf6",
            animation: `qr-ring 1.2s ease-out ${delay}ms forwards`,
            opacity: 0,
          }}
        />
      ))}

      {/* Particles */}
      {PARTICLES.map((p, i) => {
        const rad = (p.angle * Math.PI) / 180;
        const dist = 90 + Math.random() * 40;
        const tx = Math.cos(rad) * dist;
        const ty = Math.sin(rad) * dist;
        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              background: p.color,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
              animation: `qr-particle 1s ease-out ${80 + i * 30}ms forwards`,
              ["--tx" as string]: `translate(${tx}px, ${ty}px)`,
            }}
          />
        );
      })}

      {/* Checkmark circle */}
      <div
        className="relative z-10 flex items-center justify-center"
        style={{
          animation: "qr-check-circle 0.6s cubic-bezier(0.34,1.56,0.64,1) 200ms both",
        }}
      >
        <div
          className="w-28 h-28 rounded-full flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #ec4899)",
            boxShadow: "0 0 60px rgba(168,85,247,0.8), 0 0 120px rgba(236,72,153,0.4)",
          }}
        >
          <svg
            viewBox="0 0 52 52"
            className="w-14 h-14"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline
              points="14 27 22 35 38 18"
              stroke="white"
              strokeWidth="4.5"
              strokeDasharray="100"
              style={{
                animation: "qr-check 0.5s ease-out 400ms both",
              }}
            />
          </svg>
        </div>
      </div>

      {/* Success text */}
      <div
        className="absolute bottom-1/3 text-center px-8"
        style={{
          animation: "qr-text 0.5s ease-out 700ms both",
        }}
      >
        <p
          className="text-white text-2xl font-bold mb-1"
          style={{ textShadow: "0 0 30px rgba(168,85,247,0.9)" }}
        >
          {isRTL ? "تم المسح بنجاح! 🎉" : "Scanned! 🎉"}
        </p>
        <p className="text-purple-300 text-sm">
          {isRTL ? "جارٍ الانتقال للملف الشخصي..." : "Opening profile..."}
        </p>
      </div>
    </div>
  );
}
