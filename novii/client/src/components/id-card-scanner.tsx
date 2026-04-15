import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, RotateCcw, Check, X, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface IdCardScannerProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
  isRTL?: boolean;
}

function detectBlurriness(canvas: HTMLCanvasElement): number {
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
      const idxLeft = (y * width + (x - 1)) * 4;
      const idxRight = (y * width + (x + 1)) * 4;
      const idxUp = ((y - 1) * width + x) * 4;
      const idxDown = ((y + 1) * width + x) * 4;
      const gray = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
      const grayL = data[idxLeft] * 0.299 + data[idxLeft + 1] * 0.587 + data[idxLeft + 2] * 0.114;
      const grayR = data[idxRight] * 0.299 + data[idxRight + 1] * 0.587 + data[idxRight + 2] * 0.114;
      const grayU = data[idxUp] * 0.299 + data[idxUp + 1] * 0.587 + data[idxUp + 2] * 0.114;
      const grayD = data[idxDown] * 0.299 + data[idxDown + 1] * 0.587 + data[idxDown + 2] * 0.114;
      const laplacian = Math.abs(grayL + grayR + grayU + grayD - 4 * gray);
      sum += laplacian;
      count++;
    }
  }
  return count > 0 ? sum / count : 0;
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

export function IdCardScanner({ onCapture, onCancel, isRTL = false }: IdCardScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [qualityScore, setQualityScore] = useState<number | null>(null);
  const [brightnessOk, setBrightnessOk] = useState(true);
  const [isSharp, setIsSharp] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
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
    } catch (err: any) {
      setError(isRTL ? "لا يمكن الوصول للكاميرا. يرجى السماح بالوصول." : "Cannot access camera. Please allow camera access.");
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
    const vw = video.videoWidth;
    const vh = video.videoHeight;

    const cardW = vw * 0.85;
    const cardH = cardW / 1.586;
    const cardX = (vw - cardW) / 2;
    const cardY = (vh - cardH) / 2;

    canvas.width = Math.round(cardW);
    canvas.height = Math.round(cardH);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, cardX, cardY, cardW, cardH, 0, 0, canvas.width, canvas.height);

    const sharpness = detectBlurriness(canvas);
    const brightness = detectBrightness(canvas);

    const sharp = sharpness > 3;
    const brightOk = brightness > 40 && brightness < 230;
    const score = Math.min(100, Math.round((sharpness / 15) * 100));

    setIsSharp(sharp);
    setBrightnessOk(brightOk);
    setQualityScore(Math.min(score, 100));

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "id_card.jpg", { type: "image/jpeg" });
      setCapturedFile(file);
      setCapturedImage(URL.createObjectURL(blob));
      setChecking(false);
    }, "image/jpeg", 0.92);
  }, []);

  const retake = useCallback(() => {
    if (capturedImage) URL.revokeObjectURL(capturedImage);
    setCapturedImage(null);
    setCapturedFile(null);
    setQualityScore(null);
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

  const isAcceptable = isSharp && brightnessOk && (qualityScore !== null && qualityScore >= 30);

  return (
    <div className="space-y-4">
      <div className="text-center mb-2">
        <Camera className="w-10 h-10 text-primary mx-auto mb-2" />
        <h3 className="font-bold text-lg">{isRTL ? "مسح البطاقة الشخصية" : "Scan ID Card"}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {isRTL ? "وجّه الكاميرا نحو بطاقة الهوية داخل الإطار" : "Point your camera at your ID card within the frame"}
        </p>
      </div>

      {error ? (
        <div className="text-center py-8 space-y-4">
          <p className="text-red-500 text-sm">{error}</p>
          <Button variant="outline" onClick={startCamera}>{isRTL ? "حاول مرة أخرى" : "Try Again"}</Button>
          <p className="text-xs text-muted-foreground">{isRTL ? "أو ارفع صورة من الجهاز" : "Or upload from device"}</p>
        </div>
      ) : capturedImage ? (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden border-2 border-border bg-black">
            <img src={capturedImage} alt="Captured ID" className="w-full h-auto" />
          </div>

          <div className="space-y-2">
            {checking ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {isRTL ? "جاري فحص الجودة..." : "Checking quality..."}
              </div>
            ) : (
              <>
                <div className={cn(
                  "flex items-center gap-2 text-sm px-3 py-2 rounded-lg",
                  isSharp ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                )}>
                  {isSharp ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  {isSharp
                    ? (isRTL ? "الصورة واضحة" : "Image is clear")
                    : (isRTL ? "الصورة غير واضحة - أعد التصوير" : "Image is blurry - retake")}
                </div>
                <div className={cn(
                  "flex items-center gap-2 text-sm px-3 py-2 rounded-lg",
                  brightnessOk ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"
                )}>
                  {brightnessOk ? <Check className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                  {brightnessOk
                    ? (isRTL ? "الإضاءة مناسبة" : "Lighting is good")
                    : (isRTL ? "الإضاءة ضعيفة أو قوية جداً" : "Lighting is too dark or too bright")}
                </div>
                {qualityScore !== null && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground px-3">
                    {isRTL ? "جودة الصورة:" : "Image quality:"} {qualityScore}%
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", qualityScore >= 60 ? "bg-green-500" : qualityScore >= 30 ? "bg-yellow-500" : "bg-red-500")}
                        style={{ width: `${qualityScore}%` }}
                      />
                    </div>
                  </div>
                )}
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
          <div className="relative rounded-xl overflow-hidden bg-black aspect-[16/10]">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {cameraReady && (
              <div className="absolute inset-0 pointer-events-none">
                <svg className="w-full h-full" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <mask id="cardMask">
                      <rect width="400" height="250" fill="white" />
                      <rect x="30" y="25" width="340" height="200" rx="12" fill="black" />
                    </mask>
                  </defs>
                  <rect width="400" height="250" fill="rgba(0,0,0,0.5)" mask="url(#cardMask)" />
                  <rect x="30" y="25" width="340" height="200" rx="12" fill="none" stroke="white" strokeWidth="2" strokeDasharray="12 6" className="animate-pulse" />
                  <line x1="45" y1="75" x2="140" y2="75" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                  <line x1="45" y1="95" x2="180" y2="95" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                  <line x1="45" y1="115" x2="160" y2="115" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                  <rect x="280" y="55" width="70" height="85" rx="4" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
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
            {isRTL ? "ضع البطاقة داخل الإطار واضغط زر التصوير" : "Place the card inside the frame and press capture"}
          </p>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              {isRTL ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={capturePhoto} disabled={!cameraReady} className="flex-1">
              <Camera className="w-4 h-4 mr-2" />
              {isRTL ? "التقاط" : "Capture"}
            </Button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
