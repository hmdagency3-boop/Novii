import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useLanguage } from "@/lib/language-context";
import { X, Camera } from "lucide-react";

interface QRScannerProps {
  onResult: (url: string) => void;
  onClose: () => void;
}

export function QRScanner({ onResult, onClose }: QRScannerProps) {
  const { direction } = useLanguage();
  const isRTL = direction === "rtl";
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = "qr-scanner-container";
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          // Stop scanner then call result
          scanner.stop().catch(() => {});
          onResult(decodedText);
        },
        () => {}
      )
      .then(() => setScanning(true))
      .catch(() => {
        setError(
          isRTL
            ? "تعذّر الوصول إلى الكاميرا. تأكد من منح الإذن."
            : "Cannot access camera. Please allow permission."
        );
      });

    return () => {
      scanner.stop().catch(() => {});
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 px-4 pb-6">
      {/* Header row */}
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

      {/* Scanner viewport */}
      <div className="relative w-full max-w-[280px] aspect-square rounded-2xl overflow-hidden bg-black">
        <div id={containerId} className="w-full h-full" />

        {/* Corner decorations */}
        {scanning && (
          <>
            <div className="absolute top-3 left-3 w-7 h-7 border-t-3 border-l-3 border-primary rounded-tl-lg pointer-events-none" style={{ borderWidth: 3 }} />
            <div className="absolute top-3 right-3 w-7 h-7 border-t-3 border-r-3 border-primary rounded-tr-lg pointer-events-none" style={{ borderWidth: 3 }} />
            <div className="absolute bottom-3 left-3 w-7 h-7 border-b-3 border-l-3 border-primary rounded-bl-lg pointer-events-none" style={{ borderWidth: 3 }} />
            <div className="absolute bottom-3 right-3 w-7 h-7 border-b-3 border-r-3 border-primary rounded-br-lg pointer-events-none" style={{ borderWidth: 3 }} />
            {/* Scanning line animation */}
            <div className="absolute left-0 right-0 h-0.5 bg-primary/70 animate-[scan_2s_ease-in-out_infinite]" style={{ top: "50%" }} />
          </>
        )}

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 p-4">
            <Camera className="w-10 h-10 text-muted-foreground" />
            <p className="text-xs text-center text-muted-foreground">{error}</p>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {isRTL
          ? "يمكنك مسح أي QR Code خاص بملف Novii"
          : "Scan any Novii profile QR Code"}
      </p>
    </div>
  );
}
