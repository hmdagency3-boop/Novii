import { useEffect, useRef } from "react";
import QRCodeStyling from "qr-code-styling";

interface NoviiQRCodeProps {
  value: string;
  size?: number;
  avatarUrl?: string;
}

function buildQR(value: string, size: number, avatarUrl?: string) {
  return new QRCodeStyling({
    width: size,
    height: size,
    type: "svg",
    data: value,
    image: avatarUrl || "/assets/novii_logo_new.png",
    dotsOptions: {
      type: "extra-rounded",
      gradient: {
        type: "linear",
        rotation: 45,
        colorStops: [
          { offset: 0, color: "#7c3aed" },
          { offset: 1, color: "#ec4899" },
        ],
      },
    },
    cornersSquareOptions: {
      type: "extra-rounded",
      gradient: {
        type: "linear",
        rotation: 45,
        colorStops: [
          { offset: 0, color: "#6d28d9" },
          { offset: 1, color: "#db2777" },
        ],
      },
    },
    cornersDotOptions: {
      type: "dot",
      color: "#7c3aed",
    },
    backgroundOptions: {
      color: "#ffffff",
    },
    imageOptions: {
      crossOrigin: "anonymous",
      margin: 4,
      imageSize: avatarUrl ? 0.28 : 0.22,
    },
    qrOptions: {
      errorCorrectionLevel: "H",
    },
  });
}

export function NoviiQRCode({ value, size = 200, avatarUrl }: NoviiQRCodeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<QRCodeStyling | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";
    const qr = buildQR(value, size, avatarUrl);
    qrRef.current = qr;
    qr.append(containerRef.current);
  }, [value, size, avatarUrl]);

  return (
    <div
      ref={containerRef}
      style={{ width: size, height: size }}
      className="rounded-2xl overflow-hidden"
    />
  );
}

export async function downloadNoviiQR(
  value: string,
  username: string,
  avatarUrl?: string
) {
  const qr = buildQR(value, 300, avatarUrl);
  await qr.download({ name: `novii-${username}-qr`, extension: "png" });
}
