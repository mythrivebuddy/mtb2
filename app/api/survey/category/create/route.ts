// /app/api/survey/category/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { uploadImage } from "@/lib/upload"; 

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const name = formData.get("name") as string;
  const image = formData.get("image") as File;

  let imageUrl = "";

  if (image && image.size > 0) {
    imageUrl = await uploadImage(image); // <-- your image uploader function
  }

  const category = await prisma.category.create({
    data: { id: uuidv4(), name, image: imageUrl },
  });

  return NextResponse.json(category);
}
