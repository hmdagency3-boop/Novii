import { useEffect, useRef } from "react";
import QRCodeStyling from "qr-code-styling";

interface NoviiQRCodeProps {
  value: string;
  size?: number;
}

function buildQR(value: string, size: number) {
  return new QRCodeStyling({
    width: size,
    height: size,
    type: "svg",
    data: value,
    image: "/assets/novii_logo_new.png",
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
      imageSize: 0.22,
    },
    qrOptions: {
      errorCorrectionLevel: "H",
    },
  });
}

export function NoviiQRCode({ value, size = 200 }: NoviiQRCodeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<QRCodeStyling | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";
    const qr = buildQR(value, size);
    qrRef.current = qr;
    qr.append(containerRef.current);
  }, [value, size]);

  return (
    <div
      ref={containerRef}
      style={{ width: size, height: size }}
      className="rounded-2xl overflow-hidden"
    />
  );
}

export async function downloadNoviiQR(value: string, username: string) {
  const qr = buildQR(value, 300);
  await qr.download({ name: `novii-${username}-qr`, extension: "png" });
}
