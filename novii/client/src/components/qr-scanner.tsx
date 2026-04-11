import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { useLanguage } from "@/lib/language-context";
import { Camera, X } from "lucide-react";

interface QRScannerProps {
  onResult: (url: string) => void;
  onClose: () => void;
}

export function QRScanner({ onResult, onClose }: QRScannerProps) {
  const { direction } = useLanguage();
  const isRTL = direction === "rtl";
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const doneRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    doneRef.current = false;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().then(() => setReady(true));
        }
      })
      .catch(() => {
        setError(
          isRTL
            ? "تعذّر الوصول إلى الكاميرا. تأكد من منح الإذن."
            : "Camera access denied. Please allow permission."
        );
      });

    return () => {
      doneRef.current = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Start scanning frames once video is ready
  useEffect(() => {
    if (!ready) return;

    const tick = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || doneRef.current) return;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });
        if (code) {
          doneRef.current = true;
          streamRef.current?.getTracks().forEach((t) => t.stop());
          onResult(code.data);
          return;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [ready, onResult]);

  return (
    <div className="flex flex-col items-center gap-4 px-4 pb-6">
      {/* Header */}
      <div className="w-full flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isRTL ? "وجّه الكاميرا نحو الـ QR Code" : "Point camera at QR Code"}
        </p>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Viewport */}
      <div className="relative w-full max-w-[280px] aspect-square rounded-2xl overflow-hidden bg-black flex items-center justify-center">
        {/* Live video */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
        />

        {/* Hidden canvas for frame processing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Corner guides */}
        {ready && !error && (
          <>
            <div className="absolute top-4 left-4 w-8 h-8 border-t-[3px] border-l-[3px] border-primary rounded-tl-lg pointer-events-none" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-[3px] border-r-[3px] border-primary rounded-tr-lg pointer-events-none" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-[3px] border-l-[3px] border-primary rounded-bl-lg pointer-events-none" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-[3px] border-r-[3px] border-primary rounded-br-lg pointer-events-none" />
            {/* Scan line */}
            <div
              className="absolute left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent pointer-events-none"
              style={{ animation: "scan 2s ease-in-out infinite" }}
            />
          </>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/85 p-5 text-center">
            <Camera className="w-10 h-10 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
        )}

        {/* Loading */}
        {!ready && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {isRTL
          ? "يمكنك مسح أي QR Code خاص بـ Novii"
          : "Scan any Novii profile QR Code"}
      </p>
    </div>
  );
}
