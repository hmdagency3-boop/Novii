import type { Area } from "react-easy-crop";

export interface AspectRatioOption {
  id: string;
  label: string;
  labelAr: string;
  ratio: number;
  icon: string;
  outputWidth: number;
  outputHeight: number;
}

export const POST_ASPECT_RATIOS: AspectRatioOption[] = [
  { id: "1:1", label: "Square", labelAr: "مربع", ratio: 1, icon: "⬜", outputWidth: 1080, outputHeight: 1080 },
  { id: "4:5", label: "Portrait", labelAr: "عمودي", ratio: 4 / 5, icon: "📱", outputWidth: 1080, outputHeight: 1350 },
  { id: "16:9", label: "Landscape", labelAr: "أفقي", ratio: 16 / 9, icon: "🖥️", outputWidth: 1080, outputHeight: 608 },
];

export const AVATAR_ASPECT_RATIO: AspectRatioOption = {
  id: "avatar", label: "Profile", labelAr: "بروفايل", ratio: 1, icon: "👤", outputWidth: 500, outputHeight: 500,
};

export const REEL_ASPECT_RATIO: AspectRatioOption = {
  id: "9:16", label: "Reel", labelAr: "ريلز", ratio: 9 / 16, icon: "📹", outputWidth: 1080, outputHeight: 1920,
};

export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  outputWidth: number,
  outputHeight: number,
  filter?: string
): Promise<File> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2d context");

  canvas.width = outputWidth;
  canvas.height = outputHeight;

  if (filter) {
    ctx.filter = cssFilterToCanvasFilter(filter);
  }

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputWidth,
    outputHeight
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        const file = new File([blob], "cropped.jpg", { type: "image/jpeg" });
        resolve(file);
      },
      "image/jpeg",
      0.92
    );
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}

export async function resizeImageBeforeUpload(
  file: File,
  maxDimension: number = 1080
): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  const url = URL.createObjectURL(file);
  try {
    const img = await createImage(url);
    const { width, height } = img;

    if (width <= maxDimension && height <= maxDimension) return file;

    const scale = maxDimension / Math.max(width, height);
    const newW = Math.round(width * scale);
    const newH = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = newW;
    canvas.height = newH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(img, 0, 0, newW, newH);

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          resolve(new File([blob], file.name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        0.92
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function cssFilterToCanvasFilter(filterId: string): string {
  const map: Record<string, string> = {
    none: "none",
    clarendon: "brightness(1.1) contrast(1.1)",
    gingham: "hue-rotate(15deg)",
    moon: "grayscale(1) brightness(1.1) contrast(1.1)",
    lark: "contrast(0.9)",
    reyes: "sepia(0.2) brightness(1.1) contrast(0.75) saturate(0.75)",
    juno: "sepia(0.2) brightness(1.1) contrast(1.1) saturate(1.25)",
    slumber: "saturate(0.75) brightness(1.1)",
  };
  return map[filterId] || "none";
}
