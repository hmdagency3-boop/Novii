import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { Request, Response } from "express";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Use memory storage so we can stream to Cloudinary
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB max
});

// Upload a file buffer to Cloudinary
export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  resourceType: "image" | "video" | "raw" | "auto" = "auto"
): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `novii/${folder}`,
        resource_type: resourceType,
        transformation:
          resourceType === "image"
            ? [{ quality: "auto", fetch_format: "auto" }]
            : undefined,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result!.secure_url);
      }
    );
    stream.end(buffer);
  });
}

// Express handler: POST /api/upload
export async function handleUpload(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    const ALLOWED_FOLDERS = ['avatars', 'posts', 'stories', 'reels', 'messages', 'covers', 'audio', 'misc', 'communities'];
    const rawFolder = (req.body.folder as string) || "misc";
    const folder = ALLOWED_FOLDERS.includes(rawFolder) ? rawFolder : "misc";
    const isVideo = req.file.mimetype.startsWith("video/");
    const isAudio = req.file.mimetype.startsWith("audio/") || folder === "audio";
    // Use "raw" for audio (bypasses Cloudinary format validation); "video" for video; "image" otherwise
    const resourceType: "image" | "video" | "raw" | "auto" = isAudio ? "raw" : isVideo ? "video" : "image";

    const url = await uploadToCloudinary(req.file.buffer, folder, resourceType);
    res.json({ url });
  } catch (err: any) {
    console.error("Cloudinary upload error:", err);
    res.status(500).json({ error: err.message || "Upload failed" });
  }
}
