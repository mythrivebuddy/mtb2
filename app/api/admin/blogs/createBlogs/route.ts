import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const title = formData.get("title") as string;
    const excerpt = formData.get("excerpt") as string;
    const content = formData.get("content") as string;
    const readTime = formData.get("readTime") as string;
    const category = (formData.get("category") as string) || "uncategorized";
    const file = formData.get("imageFile") as File | null;

    let imageUrl = "";

    // Upload image to Supabase Storage (if provided)
    if (file) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `blog-images/${fileName}`;

      const { data, error } = await supabase.storage
        .from("blog-images")
        .upload(filePath, file);

      if (error) throw new Error(`Supabase Upload Error: ${error.message}`);
      console.log(data);

      const { data: publicUrl } = supabase.storage
        .from("blog-images")
        .getPublicUrl(filePath);

      imageUrl = publicUrl.publicUrl; // Store this in Prisma
    }

    // Save blog post in Prisma
    const blog = await prisma.blog.create({
      data: {
        title,
        category,
        excerpt,
        content,
        readTime,
        image: imageUrl, // Save the image URL here
      },
    });

    return NextResponse.json(
      { message: "Blog created", blog },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating blog:", error);
    return NextResponse.json(
      { error: "Failed to create blog" },
      { status: 500 }
    );
  }
}
