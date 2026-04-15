import { useState, useRef, useCallback, useEffect } from "react";
import { ScanFace, RotateCcw, Check, X, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FaceScannerProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
  isRTL?: boolean;
}

function detectBrightness(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext("2d");
  if (!ctx) return 128;
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  let sum = 0;
  let count = 0;
  const step = 8;
  for (let i = 0; i < data.length; i += 4 * step) {
    sum += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    count++;
  }
  return count > 0 ? sum / count : 128;
}

function detectSharpness(canvas: HTMLCanvasElement): number {
  const ctx = canvas.getContext("2d");
  if (!ctx) return 0;
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  let sum = 0;
  let count = 0;
  const step = 4;
  for (let y = 1; y < height - 1; y += step) {
    for (let x = 1; x < width - 1; x += step) {
      const idx = (y * width + x) * 4;
      const idxL = (y * width + (x - 1)) * 4;
      const idxR = (y * width + (x + 1)) * 4;
      const idxU = ((y - 1) * width + x) * 4;
      const idxD = ((y + 1) * width + x) * 4;
      const g = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
      const gL = data[idxL] * 0.299 + data[idxL + 1] * 0.587 + data[idxL + 2] * 0.114;
      const gR = data[idxR] * 0.299 + data[idxR + 1] * 0.587 + data[idxR + 2] * 0.114;
      const gU = data[idxU] * 0.299 + data[idxU + 1] * 0.587 + data[idxU + 2] * 0.114;
      const gD = data[idxD] * 0.299 + data[idxD + 1] * 0.587 + data[idxD + 2] * 0.114;
      sum += Math.abs(gL + gR + gU + gD - 4 * g);
      count++;
    }
  }
  return count > 0 ? sum / count : 0;
}

function hasSkinTones(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;
  const { width, height } = canvas;
  const cx = width / 2;
  const cy = height / 2;
  const rx = width * 0.3;
  const ry = height * 0.4;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  let skinPixels = 0;
  let totalChecked = 0;
  const step = 6;
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy > 1) continue;
      totalChecked++;
      const idx = (y * width + x) * 4;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      if (r > 60 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 10 && r - b > 15) {
        skinPixels++;
      }
    }
  }
  return totalChecked > 0 && (skinPixels / totalChecked) > 0.15;
}

export function FaceScanner({ onCapture, onCancel, isRTL = false }: FaceScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [faceDetected, setFaceDetected] = useState(true);
  const [brightnessOk, setBrightnessOk] = useState(true);
  const [isSharp, setIsSharp] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 1280 },
        }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraReady(true);
        };
      }
    } catch {
      setError(isRTL ? "لا يمكن الوصول للكاميرا الأمامية." : "Cannot access front camera.");
    }
  }, [isRTL]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    setChecking(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const size = Math.min(video.videoWidth, video.videoHeight);
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;

    canvas.width = 800;
    canvas.height = 800;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, size, size, 0, 0, 800, 800);
    ctx.restore();

    const sharpness = detectSharpness(canvas);
    const brightness = detectBrightness(canvas);
    const hasFace = hasSkinTones(canvas);

    setIsSharp(sharpness > 2.5);
    setBrightnessOk(brightness > 50 && brightness < 220);
    setFaceDetected(hasFace);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
      setCapturedFile(file);
      setCapturedImage(URL.createObjectURL(blob));
      setChecking(false);
    }, "image/jpeg", 0.92);
  }, []);

  const retake = useCallback(() => {
    if (capturedImage) URL.revokeObjectURL(capturedImage);
    setCapturedImage(null);
    setCapturedFile(null);
    setFaceDetected(true);
    setIsSharp(true);
    setBrightnessOk(true);
    startCamera();
  }, [capturedImage, startCamera]);

  const acceptPhoto = useCallback(() => {
    if (capturedFile) {
      stopCamera();
      onCapture(capturedFile);
    }
  }, [capturedFile, stopCamera, onCapture]);

  const isAcceptable = faceDetected && isSharp && brightnessOk;

  return (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <ScanFace className="w-10 h-10 text-primary mx-auto mb-2" />
        <h3 className="font-bold text-lg">{isRTL ? "مسح الوجه" : "Face Scan"}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {isRTL ? "ضع وجهك داخل الإطار البيضاوي" : "Place your face inside the oval frame"}
        </p>
      </div>

      {error ? (
        <div className="text-center py-8 space-y-4">
          <p className="text-red-500 text-sm">{error}</p>
          <Button variant="outline" onClick={startCamera}>{isRTL ? "حاول مرة أخرى" : "Try Again"}</Button>
        </div>
      ) : capturedImage ? (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden border-2 border-border bg-black mx-auto w-64 h-64">
            <img src={capturedImage} alt="Selfie" className="w-full h-full object-cover" />
          </div>

          <div className="space-y-2">
            {checking ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {isRTL ? "جاري فحص الصورة..." : "Checking photo..."}
              </div>
            ) : (
              <>
                <div className={cn(
                  "flex items-center gap-2 text-sm px-3 py-2 rounded-lg",
                  faceDetected ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                )}>
                  {faceDetected ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  {faceDetected
                    ? (isRTL ? "تم اكتشاف الوجه" : "Face detected")
                    : (isRTL ? "لم يتم اكتشاف وجه - أعد التصوير" : "No face detected - retake")}
                </div>
                <div className={cn(
                  "flex items-center gap-2 text-sm px-3 py-2 rounded-lg",
                  isSharp ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                )}>
                  {isSharp ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  {isSharp
                    ? (isRTL ? "الصورة واضحة" : "Image is clear")
                    : (isRTL ? "الصورة غير واضحة" : "Image is blurry")}
                </div>
                <div className={cn(
                  "flex items-center gap-2 text-sm px-3 py-2 rounded-lg",
                  brightnessOk ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"
                )}>
                  {brightnessOk ? <Check className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                  {brightnessOk
                    ? (isRTL ? "الإضاءة مناسبة" : "Lighting is good")
                    : (isRTL ? "الإضاءة غير مناسبة" : "Lighting needs adjustment")}
                </div>
              </>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={retake} className="flex-1">
              <RotateCcw className="w-4 h-4 mr-2" />
              {isRTL ? "إعادة التصوير" : "Retake"}
            </Button>
            <Button
              onClick={acceptPhoto}
              disabled={!isAcceptable || checking}
              className={cn("flex-1", isAcceptable ? "bg-green-600 hover:bg-green-700" : "")}
            >
              <Check className="w-4 h-4 mr-2" />
              {isRTL ? "قبول" : "Accept"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden bg-black aspect-square mx-auto w-72">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
            {cameraReady && (
              <div className="absolute inset-0 pointer-events-none">
                <svg className="w-full h-full" viewBox="0 0 300 300" preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <mask id="faceMask">
                      <rect width="300" height="300" fill="white" />
                      <ellipse cx="150" cy="140" rx="85" ry="110" fill="black" />
                    </mask>
                  </defs>
                  <rect width="300" height="300" fill="rgba(0,0,0,0.5)" mask="url(#faceMask)" />
                  <ellipse cx="150" cy="140" rx="85" ry="110" fill="none" stroke="white" strokeWidth="2.5" strokeDasharray="10 5" className="animate-pulse" />
                </svg>
              </div>
            )}
            {!cameraReady && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </div>

          <p className="text-xs text-center text-muted-foreground">
            {isRTL ? "انظر مباشرة للكاميرا واضغط التقاط" : "Look directly at the camera and press capture"}
          </p>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              {isRTL ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={capturePhoto} disabled={!cameraReady} className="flex-1">
              <ScanFace className="w-4 h-4 mr-2" />
              {isRTL ? "التقاط" : "Capture"}
            </Button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
