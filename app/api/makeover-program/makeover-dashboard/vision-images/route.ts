// file: /api/makeover-program/makeover-dashboard/vision-images
import {prisma} from "@/lib/prisma";
import { NextResponse } from "next/server"
import { checkRole } from "@/lib/utils/auth";

export const GET = async() => {
  try {
    const session = await checkRole("USER");
    const visionImage = await prisma.userVisionImage.findFirst({
        where:{userId:session.user.id}
    });
    if (!visionImage) {
        return NextResponse.json({message:"No vision image found!"}, {status:404});
    }
    return NextResponse.json({visionImage:visionImage.imageUrl},{status:200});
  } catch (error) {
    console.error(error);
    NextResponse.json({error:"Failed to fetch vision image."}, {status:500});
  }
}
