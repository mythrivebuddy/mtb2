import sharp from "sharp";
import { supabaseAdmin } from "../supabaseAdmin";
import { supabaseClient } from "../supabase";

interface UploadOptions {
  fileName?: string; // 🔥 dynamic name (default: cover)
  width?: number;
  height?: number;
  quality?: number;
}

export default async function handleSupabaseImageUploadWithSharp(
  file: File,
  bucket_name: string,
  folder_name: string,
  options?: UploadOptions
): Promise<string> {
  if (!file || file.size === 0) {
    throw new Error("No file provided or file is empty");
  }

  const {
    fileName = "cover", // 🔥 default fallback
    width = 1600,
    height = 900,
    quality = 80,
  } = options || {};

  // 🔥 dynamic filename (always webp)
  const filePath = `${folder_name}/${fileName}.webp`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 🔥 process image
  const webpBuffer = await sharp(buffer)
    .resize(width, height, {
      fit: "cover",
      position: "center",
    })
    .webp({ quality })
    .toBuffer();

  const { error } = await supabaseAdmin.storage
    .from(bucket_name)
    .upload(filePath, webpBuffer, {
      contentType: "image/webp",
      upsert: true, // 🔥 overwrite based on same fileName
      cacheControl: "0",
    });

  if (error) {
    console.error("Supabase upload error:", error);
    throw new Error(`Supabase Upload Error: ${error.message}`);
  }

  const { data } = supabaseClient.storage
    .from(bucket_name)
    .getPublicUrl(filePath);

  return `${data.publicUrl}?v=${Date.now()}`;
}