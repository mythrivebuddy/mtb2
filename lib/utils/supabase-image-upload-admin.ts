import { supabaseClient } from "../supabase";
import { supabaseAdmin } from "../supabaseAdmin";

export default async function handleSupabaseImageUpload(
  file: File,
  bucket_name: string,
  folder_name: string
): Promise<string> {
  let imageUrl = "";

  if (!file || file.size === 0) {
    throw new Error("No file provided or file is empty");
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `${folder_name}/${fileName}`;

  // ✅ Convert File → Buffer (VERY IMPORTANT)
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { data, error } = await supabaseAdmin.storage
    .from(bucket_name)
    .upload(filePath, buffer, {
      contentType: file.type,
    });

  if (error) {
    console.error("Supabase upload error:", error);
    throw new Error(`Supabase Upload Error: ${error.message}`);
  }

  console.log("Upload success:", data);

  const { data: publicUrl } = supabaseClient.storage
    .from(bucket_name)
    .getPublicUrl(filePath);

  imageUrl = publicUrl.publicUrl;

  return imageUrl;
}