import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/utils/requireAdminFromSession";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) 
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const fileType = form.get("type") as string | null; // "og" or "editor"

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const ext = file.name.split(".").pop();
  const fileName = `${fileType || "editor"}-${Date.now()}.${ext}`;

  const folder =
    fileType === "og"
      ? "og-images"
      : "pages";

  const filePath = `${folder}/${fileName}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabaseAdmin.storage
    .from("cms-assets")
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from("cms-assets").getPublicUrl(filePath);

  return NextResponse.json({ url: publicUrl });
}
