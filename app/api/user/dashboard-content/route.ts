// /api/user/dashboard-content
import { checkRole } from "@/lib/utils/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const GET = async () => {
  try {
    const session = await checkRole("USER");
    const program = await prisma.program.findFirst({
      where: { slug: "2026-complete-makeover" },
    });
    if (!program) {
      return NextResponse.json(
        { message: "Program not found" },
        { status: 404 },
      );
    }
    const programState = await prisma.userProgramState.findFirst({
      where: {
        userId: session.user.id,
        programId: program?.id,
      },
    });
    const userMakeoverCommitment = await prisma.userMakeoverCommitment.findMany({
        where:{
            userId:session.user.id,
            programId:program.id
        },
        include:{
            area:{
                select:{id:true,name:true}
            }
        }
    })
    return NextResponse.json({ userMakeoverCommitment }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch user details" });
  }
};
