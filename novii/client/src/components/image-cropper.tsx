import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import { cn } from "@/lib/utils";
import type { AspectRatioOption } from "@/lib/crop-utils";

interface ImageCropperProps {
  imageSrc: string;
  aspectRatio: number;
  aspectRatioOptions?: AspectRatioOption[];
  onAspectRatioChange?: (option: AspectRatioOption) => void;
  selectedAspectId?: string;
  onCropComplete: (croppedArea: Area, croppedAreaPixels: Area) => void;
  cropShape?: "rect" | "round";
  isRTL?: boolean;
  filterClass?: string;
}

export function ImageCropper({
  imageSrc,
  aspectRatio,
  aspectRatioOptions,
  onAspectRatioChange,
  selectedAspectId,
  onCropComplete,
  cropShape = "rect",
  isRTL = false,
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const handleCropComplete = useCallback(
    (_: Area, croppedAreaPixels: Area) => {
      onCropComplete(_, croppedAreaPixels);
    },
    [onCropComplete]
  );

  return (
    <div className="absolute inset-0 flex flex-col">
      <div className="relative flex-1 min-h-0">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspectRatio}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={handleCropComplete}
          cropShape={cropShape}
          showGrid={true}
          objectFit="contain"
        />
      </div>

      {aspectRatioOptions && aspectRatioOptions.length > 1 && (
        <div className="flex items-center justify-center gap-1 py-2.5 px-3 bg-black/90 border-t border-white/10 flex-shrink-0">
          {aspectRatioOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => onAspectRatioChange?.(option)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                selectedAspectId === option.id
                  ? "bg-white text-black"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              )}
            >
              <span>{option.icon}</span>
              <span>{isRTL ? option.labelAr : option.label}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 px-4 py-2 bg-black/90 border-t border-white/10 flex-shrink-0">
        <span className="text-white/50 text-xs">-</span>
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="flex-1 h-1 accent-white appearance-none bg-white/20 rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer"
        />
        <span className="text-white/50 text-xs">+</span>
      </div>
    </div>
  );
}
