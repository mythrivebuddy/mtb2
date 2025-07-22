import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  console.log("\n--- [BACKGROUND JOB] Starting... ---");
  try {
    const { enrollmentId } = await request.json();
    console.log(`[BACKGROUND JOB] Received enrollmentId: ${enrollmentId}`);

    if (!enrollmentId) {
      throw new Error("FATAL: Enrollment ID was not received.");
    }

    const enrollment = await prisma.challengeEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        challenge: {
          include: { templateTasks: true },
        },
      },
    });

    if (!enrollment) {
      throw new Error(`FATAL: Could not find enrollment with ID ${enrollmentId} in the database.`);
    }
    
    console.log(`[BACKGROUND JOB] Found ${enrollment.challenge.templateTasks.length} tasks to create.`);

    // This is most likely where the error is happening
    await prisma.userChallengeTask.createMany({
      data: enrollment.challenge.templateTasks.map((task) => ({
        description: task.description,
        templateTaskId: task.id,
        enrollmentId: enrollment.id,
      })),
    });

    console.log("[BACKGROUND JOB] Succeeded: Created all tasks.");

    // This part is not being reached
    await prisma.challengeEnrollment.update({
      where: { id: enrollmentId },
      data: {
        // In a future step, you might re-introduce a flag here if needed
      },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    // THIS WILL SHOW US THE PROBLEM
    console.error("❌❌❌ [BACKGROUND JOB] CRASHED! HERE IS THE ERROR: ❌❌❌");
    console.error(error);
    console.error("❌❌❌ END OF ERROR ❌❌❌");
    
    return NextResponse.json({ error: "Background processing failed" }, { status: 500 });
  }
}