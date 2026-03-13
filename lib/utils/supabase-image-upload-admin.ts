import { supabaseClient } from "../supabase";
import { supabaseAdmin } from "../supabaseAdmin";

export default async function handleSupabaseImageUpload(
  file: File,
  bucket_name: string,
  folder_name: string
): Promise<string> {
  if (!file || file.size === 0) {
    throw new Error("No file provided or file is empty");
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `${folder_name}/${fileName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabaseAdmin.storage
    .from(bucket_name)
    .upload(filePath, buffer, { contentType: file.type });

  if (error) {
    console.error("Supabase upload error:", error);
    throw new Error(`Supabase Upload Error: ${error.message}`);
  }

  const { data } = supabaseClient.storage
    .from(bucket_name)
    .getPublicUrl(filePath);

  return data.publicUrl;
}