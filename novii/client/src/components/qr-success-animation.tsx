import { useEffect, useRef } from "react";
import { useLanguage } from "@/lib/language-context";

interface QRSuccessAnimationProps {
  onDone: () => void;
}

export function QRSuccessAnimation({ onDone }: QRSuccessAnimationProps) {
  const { direction } = useLanguage();
  const isRTL = direction === "rtl";
  const doneRef = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!doneRef.current) {
        doneRef.current = true;
        onDone();
      }
    }, 1600);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        background: "rgba(0,0,0,0.82)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        animation: "qrFadeIn 0.25s ease-out both",
      }}
    >
      <style>{`
        @keyframes qrFadeIn {
          from { opacity: 0 }
          to   { opacity: 1 }
        }
        @keyframes qrCirclePop {
          0%   { transform: scale(0);    opacity: 0 }
          55%  { transform: scale(1.12); opacity: 1 }
          75%  { transform: scale(0.95) }
          100% { transform: scale(1);    opacity: 1 }
        }
        @keyframes qrCheckDraw {
          from { stroke-dashoffset: 56 }
          to   { stroke-dashoffset: 0  }
        }
        @keyframes qrPulse {
          0%   { transform: scale(1);   opacity: 0.5 }
          100% { transform: scale(2.2); opacity: 0   }
        }
        @keyframes qrTextUp {
          from { opacity: 0; transform: translateY(8px) }
          to   { opacity: 1; transform: translateY(0)   }
        }
        @keyframes qrFadeOut {
          from { opacity: 1 }
          to   { opacity: 0 }
        }
      `}</style>

      {/* Pulse ring behind circle */}
      <div style={{ position: "relative", width: 110, height: 110 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "2px solid rgba(168,85,247,0.6)",
            animation: "qrPulse 1s ease-out 0.4s both",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "2px solid rgba(236,72,153,0.4)",
            animation: "qrPulse 1s ease-out 0.65s both",
          }}
        />

        {/* Main circle */}
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)",
            boxShadow: "0 0 0 0 rgba(168,85,247,0.5), 0 8px 40px rgba(124,58,237,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "qrCirclePop 0.55s cubic-bezier(0.34,1.56,0.64,1) 0.1s both",
          }}
        >
          {/* Checkmark SVG */}
          <svg
            viewBox="0 0 52 52"
            width="52"
            height="52"
            fill="none"
            style={{ overflow: "visible" }}
          >
            <polyline
              points="13,27 22,36 39,17"
              stroke="white"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="56"
              style={{
                animation: "qrCheckDraw 0.4s ease-out 0.5s both",
              }}
            />
          </svg>
        </div>
      </div>

      {/* Text */}
      <div
        style={{
          textAlign: "center",
          animation: "qrTextUp 0.4s ease-out 0.75s both",
        }}
      >
        <p
          style={{
            color: "#fff",
            fontSize: 20,
            fontWeight: 700,
            margin: 0,
            letterSpacing: "-0.3px",
          }}
        >
          {isRTL ? "تم المسح بنجاح" : "QR Scanned!"}
        </p>
        <p
          style={{
            color: "rgba(200,180,255,0.8)",
            fontSize: 13,
            marginTop: 4,
          }}
        >
          {isRTL ? "جارٍ فتح الملف الشخصي…" : "Opening profile…"}
        </p>
      </div>
    </div>
  );
}
