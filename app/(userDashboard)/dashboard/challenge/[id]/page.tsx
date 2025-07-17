// This is a Server Component, responsible for fetching data from the server.
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/utils/auth";
import { notFound } from "next/navigation";
import { TaskItem } from "./TaskItem";

// This function fetches the core challenge details and its task templates
async function getChallengeDetails(id: string) {
  const challenge = await prisma.challenge.findUnique({
    where: { id },
    include: {
      templateTasks: true,
      _count: {
        select: { enrollments: true },
      },
    },
  });
  return challenge;
}

// This function fetches the user's specific enrollment and THEIR individual tasks
async function getUserEnrollment(challengeId: string, userId: string) {
  const enrollment = await prisma.challengeEnrollment.findUnique({
    where: {
      userId_challengeId: {
        userId,
        challengeId,
      },
    },
    include: {
      userTasks: true,
    },
  });
  return enrollment;
}

// The main page component
export default async function ChallengeDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const challenge = await getChallengeDetails(params.id);
  if (!challenge) {
    notFound();
  }

  const session = await checkRole("USER");
  const userId = session?.user?.id;

  const enrollment = userId
    ? await getUserEnrollment(challenge.id, userId)
    : null;

  // ✅ THE FIX: NORMALIZE THE DATA
  // We create a new array `normalizedTasks` that has a consistent object shape,
  // regardless of whether the user is enrolled or not.
  const normalizedTasks = (
    enrollment ? enrollment.userTasks : challenge.templateTasks
  ).map((task) => ({
    id: task.id,
    description: task.description,
    // The 'isCompleted' property will exist on UserChallengeTask, otherwise it's false.
    isCompleted: "isCompleted" in task ? task.isCompleted : false,
  }));

  const statusColors = {
    ACTIVE: "bg-blue-100 text-blue-800",
    UPCOMING: "bg-yellow-100 text-yellow-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="min-h-screen w-full ">
      <div className="w-full max-w-3xl mx-auto py-12 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg">
          {/* Header and Description sections */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-slate-800">
                {challenge.title}
              </h1>
              {/* ... other header elements */}
            </div>
          </div>
          <p className="text-slate-600 text-lg my-6">
            {challenge.description}
          </p>

          {/* --- Tasks Section --- */}
          <div className="border-t border-slate-200 pt-6">
            <h2 className="text-2xl font-semibold text-slate-700 mb-4">
              Tasks
            </h2>
            <ul className="space-y-3">
              {normalizedTasks.length > 0 ? (
                // We now map over the clean, normalized array. No more type errors!
                normalizedTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task} // Pass the simplified task object
                    isEnrolled={!!enrollment}
                  />
                ))
              ) : (
                <li className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-slate-500">
                  No tasks have been added to this challenge yet.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
