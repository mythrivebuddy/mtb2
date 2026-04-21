// /dashboard/mini-mastery-programs/[id]/students
import MMPEnrolledStudentsPageComponent from "@/components/mini-mastery-program/MMPEnrolledStudentsPageComponent";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export default async function MMPEnrolledStudentsPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = session?.user.id;
  if (!userId) {
    redirect("/signin");
  }
  const { id: programId } = await params;
  const program = await prisma.program.findUnique({
    where: { id: programId, createdBy: userId },
  });
  if (!program) {
    redirect(`/dashboard/mini-mastery-programs/${programId}`);
  }

  return <MMPEnrolledStudentsPageComponent programId={programId}/>;
}
