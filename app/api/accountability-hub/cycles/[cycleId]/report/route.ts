import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: { cycleId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { cycleId } = await params;

    const cycle = await prisma.cycle.findUnique({
      where: { id: cycleId },
      include: {
        group: { include: { members: { include: { user: true } } } },
        goals: {
          include: {
            comments: true,
            member: { include: { user: true } },
          },
        },
      },
    });

    if (!cycle)
      return NextResponse.json({ error: "Cycle not found" }, { status: 404 });

    const members = cycle.group.members.map((m) => ({
      id: m.userId,
      user: { name: m.user.name },
    }));

    // Compute highlights & summary
    const goals = cycle.goals;
    const totalGoals = goals.length;
    const completedGoals = goals.filter((g) => g.isCompleted).length;
    const completionRate = totalGoals ? Math.round((completedGoals / totalGoals) * 100) : 0;

    // Most active (most updates/logs)
    const activityCount: Record<string, number> = {};
    for (const g of goals) {
      activityCount[g.authorId] = (activityCount[g.authorId] || 0) + 1;
    }
    const mostActiveId = Object.entries(activityCount).sort((a, b) => b[1] - a[1])[0]?.[0];
    const mostActive = members.find((m) => m.id === mostActiveId);

    // Most supportive (most comments)
    const commentCount: Record<string, number> = {};
    for (const g of goals) {
      for (const c of g.comments) {
        commentCount[c.authorId] = (commentCount[c.authorId] || 0) + 1;
      }
    }
    const mostSupportiveId = Object.entries(commentCount).sort((a, b) => b[1] - a[1])[0]?.[0];
    const mostSupportive = members.find((m) => m.id === mostSupportiveId);

    // Contribution (for logged-in user)
    const userGoals = goals.filter((g) => g.authorId === session.user.id);
    const userComments = goals.flatMap((g) => g.comments).filter((c) => c.authorId === session.user.id);
    const contribution = {
      goalsCompleted: userGoals.filter((g) => g.isCompleted).length,
      cheersGiven: userComments.length,
      sessionsLogged: userGoals.length,
    };

    const report = {
      cycle,
      members,
      highlights: {
        mostActive: mostActive
          ? { name: mostActive.user.name, updates: activityCount[mostActive.id] }
          : null,
        mostSupportive: mostSupportive
          ? { name: mostSupportive.user.name, comments: commentCount[mostSupportive.id] }
          : null,
      },
      summary: {
        totalGoals,
        completionRate,
      },
      contribution,
    };

    return NextResponse.json(report);
  } catch (err) {
    console.error("REPORT ERROR", err);
    return NextResponse.json({ error: "Failed to load cycle report" }, { status: 500 });
  }
}
