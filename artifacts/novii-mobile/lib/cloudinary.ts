import { supabase } from "./supabase";

const API_URL = process.env.EXPO_PUBLIC_NOVII_API_URL ?? "";

export async function uploadToCloudinary(
  uri: string,
  folder: string,
  type: "image" | "video" = "image",
): Promise<string> {
  if (!API_URL) {
    throw new Error("EXPO_PUBLIC_NOVII_API_URL is not configured");
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) {
    throw new Error("Not authenticated");
  }

  const form = new FormData();
  const ext = uri.split(".").pop()?.toLowerCase() || (type === "video" ? "mp4" : "jpg");
  const mime = type === "video" ? `video/${ext}` : `image/${ext === "jpg" ? "jpeg" : ext}`;
  form.append("file", {
    uri,
    name: `upload-${Date.now()}.${ext}`,
    type: mime,
  } as unknown as Blob);
  form.append("folder", folder);

  const res = await fetch(`${API_URL}/api/upload`, {
    method: "POST",
    body: form,
    headers: { "x-user-token": token },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Upload failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.url || data.secure_url;
}
