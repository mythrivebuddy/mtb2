// import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";
// import { createClient } from "@supabase/supabase-js";

// // ── Service role client — bypasses RLS, safe on server only ──────────────────
// const supabaseAdmin = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY!       // never expose this to client
// );

// const BUCKET      = "mini-mastery-program";
// const MAX_SIZE_MB = 5;
// const ALLOWED     = ["image/jpeg", "image/png", "image/webp"];

// export async function POST(req: NextRequest) {
//   // 1. Auth — only signed-in users can upload
//   const session = await getServerSession(authOptions);
//   if (!session?.user?.id) {
//     return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
//   }

//   // 2. Parse multipart form
//   let formData: FormData;
//   try {
//     formData = await req.formData();
//   } catch {
//     return NextResponse.json({ message: "Invalid form data." }, { status: 400 });
//   }

//   const file   = formData.get("file")   as File   | null;
//   const folder = formData.get("folder") as string | null ?? "thumbnail-image";

//   if (!file) {
//     return NextResponse.json({ message: "No file provided." }, { status: 400 });
//   }

//   // 3. Validate
//   if (!ALLOWED.includes(file.type)) {
//     return NextResponse.json(
//       { message: "Only JPG, PNG, or WebP images are allowed." },
//       { status: 422 }
//     );
//   }
//   if (file.size > MAX_SIZE_MB * 1024 * 1024) {
//     return NextResponse.json(
//       { message: `Image must be under ${MAX_SIZE_MB}MB.` },
//       { status: 422 }
//     );
//   }

//   // 4. Upload to Supabase via admin client (no RLS issue)
//   const ext      = file.name.split(".").pop() ?? "jpg";
//   const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
//   const filePath = `${folder}/${fileName}`;

//   const buffer   = Buffer.from(await file.arrayBuffer());

//   const { error: uploadErr } = await supabaseAdmin.storage
//     .from(BUCKET)
//     .upload(filePath, buffer, { upsert: false, contentType: file.type });

//   if (uploadErr) {
//     console.error("[thumbnail-upload]", uploadErr);
//     return NextResponse.json(
//       { message: uploadErr.message ?? "Supabase upload failed." },
//       { status: 500 }
//     );
//   }

//   // 5. Return public URL
//   const { data: urlData } = supabaseAdmin.storage
//     .from(BUCKET)
//     .getPublicUrl(filePath);

//   return NextResponse.json({ url: urlData.publicUrl }, { status: 201 });
// }
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

// ── Service role client — bypasses RLS, safe on server only ──────────────────
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!       // never expose this to client
);

const BUCKET      = "mini-mastery-program";
const MAX_SIZE_MB = 5;
const ALLOWED     = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: NextRequest) {
  // 1. Auth — only signed-in users can upload
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  // 2. Parse multipart form
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ message: "Invalid form data." }, { status: 400 });
  }

  const file   = formData.get("file")   as File   | null;
  const folder = formData.get("folder") as string | null ?? "thumbnail-image";

  if (!file) {
    return NextResponse.json({ message: "No file provided." }, { status: 400 });
  }

  // 3. Validate
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json(
      { message: "Only JPG, PNG, or WebP images are allowed." },
      { status: 422 }
    );
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return NextResponse.json(
      { message: `Image must be under ${MAX_SIZE_MB}MB.` },
      { status: 422 }
    );
  }

  // 4. Upload to Supabase via admin client (no RLS issue)
  const ext      = file.name.split(".").pop() ?? "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const filePath = `${folder}/${fileName}`;

  const buffer   = Buffer.from(await file.arrayBuffer());

  const { error: uploadErr } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(filePath, buffer, { upsert: false, contentType: file.type });

  if (uploadErr) {
    console.error("[thumbnail-upload]", uploadErr);
    return NextResponse.json(
      { message: uploadErr.message ?? "Supabase upload failed." },
      { status: 500 }
    );
  }

  // 5. Return public URL
  const { data: urlData } = supabaseAdmin.storage
    .from(BUCKET)
    .getPublicUrl(filePath);

  return NextResponse.json({ url: urlData.publicUrl }, { status: 201 });
}

// ─── DELETE /api/upload/thumbnail ─────────────────────────────────────────────
// Deletes a previously uploaded file from the bucket
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  let filePath: string;
  try {
    const body = await req.json() as { filePath?: string };
    if (!body.filePath) throw new Error("missing");
    filePath = body.filePath;
  } catch {
    return NextResponse.json({ message: "filePath is required." }, { status: 400 });
  }

  const { error } = await supabaseAdmin.storage.from(BUCKET).remove([filePath]);
  if (error) {
    // Non-fatal — log but don't block
    console.error("[thumbnail-delete]", error.message);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: filePath }, { status: 200 });
}