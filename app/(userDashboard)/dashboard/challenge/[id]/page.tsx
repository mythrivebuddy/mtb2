// This is a Server Component, it can fetch data directly
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CheckCircle } from "lucide-react"; // Import CheckCircle

// This function fetches data on the server for a specific challenge
async function getChallengeDetails(id: string) {
  const challenge = await prisma.challenge.findUnique({
    where: { id },
    include: {
      tasks: true, // Include the related tasks
      _count: {
        select: { enrollments: true }, // Get participant count
      },
    },
  });
  return challenge;
}

// The page receives `params` which contains the dynamic parts of the URL (the ID)
export default async function ChallengeDetailPage({ params }: { params: { id: string } }) {
  const challenge = await getChallengeDetails(params.id);

  // If no challenge is found for the ID, show a 404 page
  if (!challenge) {
    notFound();
  }
  
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
          {/* --- Header Section --- */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-slate-800">{challenge.title}</h1>
              <div className="flex items-center gap-x-3 my-4">
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusColors[challenge.status] || 'bg-gray-100'}`}>
                  {challenge.status}
                </span>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${challenge.mode === 'PUBLIC' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-800'}`}>
                  {challenge.mode}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-purple-600">{challenge.reward} JP</div>
              <div className="text-sm text-slate-500">Reward</div>
            </div>
          </div>
          
          {/* --- Description --- */}
          <p className="text-slate-600 text-lg my-6">{challenge.description}</p>

          {/* --- Tasks Section --- */}
          <div className="border-t border-slate-200 pt-6">
            <h2 className="text-2xl font-semibold text-slate-700 mb-4">Tasks to Complete</h2>
            <ul className="space-y-3">
              {challenge.tasks.length > 0 ? (
                challenge.tasks.map((task) => (
                  <li key={task.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <p className="text-slate-800">{task.description}</p>
                  </li>
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