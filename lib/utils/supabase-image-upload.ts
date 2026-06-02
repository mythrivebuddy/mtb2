// import { supabaseClient } from "../supabase";
import { supabaseAdmin } from "../supabaseAdmin";

export default async function handleSupabaseImageUpload(file: File, bucket_name: string, folder_name: string): Promise<string> {
    let imageUrl = "";

    // Upload image to Supabase Storage (if provided)
    if (file) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${folder_name}/${fileName}`;

      const { data, error } = await supabaseAdmin.storage
        .from(bucket_name)
        .upload(filePath, file);

      if (error) throw new Error(`Supabase Upload Error: ${error.message}`);
      console.log(data);

      const { data: publicUrl } = supabaseAdmin.storage
        .from(bucket_name)
        .getPublicUrl(filePath);

      imageUrl = publicUrl.publicUrl; // Store this in Prisma
    }
    return imageUrl;
}

type ExtractOptions = {
  bucket?: string;
};

 function extractPathFromUrl(
  url: string,
  options?: ExtractOptions
): string | null {
  try {
    const parsed = new URL(url);

    // Example pathname:
    // /storage/v1/object/public/events/eventId/file.pdf
    const parts = parsed.pathname.split("/");

    const publicIndex = parts.findIndex((p) => p === "public");

    if (publicIndex === -1 || publicIndex + 2 >= parts.length) {
      return null;
    }

    const bucketName = parts[publicIndex + 1];

    // Optional bucket validation
    if (options?.bucket && options.bucket !== bucketName) {
      return null;
    }

    // Everything after bucket = actual file path
    const filePath = parts.slice(publicIndex + 2).join("/");

    return filePath || null;
  } catch {
    return null;
  }
}
type UploadOptions = {
  file: File;
  bucket: string;
  folder: string;
  oldUrl?: string;
  fileName?: string; // optional override
  upsert?: boolean; // overwrite same file if true
};

export async function handleSupabaseFileReplace({
  file,
  bucket,
  folder,
  oldUrl,
  fileName,
  upsert = false,
}: UploadOptions): Promise<string> {
  // 1. Delete old file (if exists and not using upsert)
  if (oldUrl && !upsert) {
    const oldPath = extractPathFromUrl(oldUrl, { bucket });

    if (oldPath) {
      await supabaseAdmin.storage.from(bucket).remove([oldPath]);
    }
  }

  // 2. Generate filename
  const ext = file.name.split(".").pop();

  const finalName =
    fileName ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const filePath = `${folder}/${finalName}`;

  // 3. Upload file
  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(filePath, file, {
      upsert, // 👈 important for overwrite mode
    });

  if (error) {
    throw new Error(`Supabase Upload Error: ${error.message}`);
  }

  // 4. Get public URL
  const { data } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return data.publicUrl;
}